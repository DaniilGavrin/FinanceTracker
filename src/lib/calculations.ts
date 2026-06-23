import { Debt } from '@/lib/database';

// ==========================================
// УТИЛИТЫ ДЛЯ РАБОТЫ С ДАТАМИ
// ==========================================

/**
 * Возвращает дату платежа, корректно обрабатывая месяцы с разным количеством дней.
 * Например, 31 февраля → 28 (или 29).
 */
export function getPaymentDate(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const actualDay = Math.min(day, lastDay);
  return new Date(year, month, actualDay);
}

// ==========================================
// ТИПЫ
// ==========================================

export interface PaymentRow {
  month: number;
  date: string;
  payment: number;
  interest: number;
  principal: number;
  remainingBalance: number;
}

export interface PaymentCalculation {
  /** Ежемесячный платёж (аннуитет — постоянный, дифф — первый/максимальный) */
  monthlyPayment: number | null;
  /** Сумма всех выплат за весь срок */
  totalPayments: number;
  /** Сумма всех процентов (переплата) */
  totalInterest: number;
  /** Основной долг (должен равняться totalAmount) */
  totalPrincipal: number;
  /** Детальный график по месяцам */
  schedule: PaymentRow[];
}

// ==========================================
// ГЛАВНАЯ ФУНКЦИЯ РАСЧЁТА ГРАФИКА ПЛАТЕЖЕЙ
// ==========================================

/**
 * Рассчитывает полный график платежей по кредиту.
 * Поддерживает аннуитетный и дифференцированный типы.
 * Учитывает неполный первый период и финальный платёж.
 */
export function calculatePaymentSchedule(debt: Debt): PaymentCalculation {
  // Для не-кредитов или кредитов без параметров — возвращаем пустой результат
  if (
    debt.type !== 'bank_loan' ||
    !debt.termMonths ||
    !debt.interestRate ||
    !debt.startDate ||
    debt.totalAmount <= 0
  ) {
    return {
      monthlyPayment: null,
      totalPayments: debt.currentAmount,
      totalInterest: 0,
      totalPrincipal: debt.totalAmount,
      schedule: [],
    };
  }

  const isDiff = debt.paymentType === 'differentiated';
  const annualRate = debt.interestRate / 100;
  const months = debt.termMonths;
  const principal = debt.totalAmount;
  const startDate = new Date(debt.startDate);
  const paymentDay = debt.paymentDay || startDate.getDate();

  // === ОПРЕДЕЛЯЕМ ДАТУ ПЕРВОГО ПЛАТЕЖА ===
  let firstPaymentDate: Date;
  if (debt.nextPaymentDate) {
    firstPaymentDate = new Date(debt.nextPaymentDate);
    firstPaymentDate.setHours(0, 0, 0, 0);
    if (firstPaymentDate.getTime() < startDate.getTime()) {
      firstPaymentDate = new Date(startDate);
    }
  } else {
    firstPaymentDate = getPaymentDate(startDate.getFullYear(), startDate.getMonth(), 31);
    if (firstPaymentDate.getTime() <= startDate.getTime()) {
      const nextMonth = new Date(startDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      firstPaymentDate = getPaymentDate(nextMonth.getFullYear(), nextMonth.getMonth(), paymentDay);
    }
  }

  const rows: PaymentRow[] = [];
  let balance = principal;
  let totalInterest = 0;
  let prevDate = new Date(debt.startDate);

  if (isDiff) {
    // ==========================================
    // 🟢 ДИФФЕРЕНЦИРОВАННЫЙ ПЛАТЁЖ
    // ==========================================
    const fixedPrincipal = principal / months;

    // 1. Первый платёж (неполный период)
    const daysFirst = Math.ceil((firstPaymentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    const intFirst = balance * annualRate * daysFirst / 365;
    const payFirst = fixedPrincipal + intFirst;
    balance -= fixedPrincipal;
    totalInterest += intFirst;
    rows.push({
      month: 1,
      date: firstPaymentDate.toLocaleDateString('ru-RU'),
      payment: Math.round(payFirst * 100) / 100,
      interest: Math.round(intFirst * 100) / 100,
      principal: Math.round(fixedPrincipal * 100) / 100,
      remainingBalance: Math.round(balance * 100) / 100,
    });
    prevDate = firstPaymentDate;

    // 2. Остальные месяцы
    for (let m = 2; m <= months; m++) {
      const base = new Date(firstPaymentDate);
      base.setMonth(base.getMonth() + (m - 1));
      const payDate = getPaymentDate(base.getFullYear(), base.getMonth(), paymentDay);
      const days = Math.ceil((payDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      const interest = balance * annualRate * days / 365;
      let principalPart = fixedPrincipal;
      if (m === months) principalPart = balance;
      const payment = principalPart + interest;
      balance -= principalPart;
      totalInterest += interest;
      rows.push({
        month: m,
        date: payDate.toLocaleDateString('ru-RU'),
        payment: Math.round(payment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        principal: Math.round(principalPart * 100) / 100,
        remainingBalance: Math.round(balance * 100) / 100,
      });
      prevDate = payDate;
    }
  } else {
    // 🔵 АННУИТЕТНЫЙ ПЛАТЁЖ
    const monthlyRate = annualRate / 12;
    const annuityPayment =
        principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);

    // Первый платёж (неполный период — только проценты)
    const daysFirst = Math.ceil((firstPaymentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    const intFirst = balance * annualRate * daysFirst / 365;
    balance += intFirst;
    rows.push({
        month: 1,
        date: firstPaymentDate.toLocaleDateString('ru-RU'),
        payment: Math.round(intFirst * 100) / 100,
        interest: Math.round(intFirst * 100) / 100,
        principal: 0,
        remainingBalance: Math.round(balance * 100) / 100,
    });
    prevDate = firstPaymentDate;

    // Полные месяцы (со 2-го по (months-1)-й)
    // ← ИСПРАВЛЕНО: было m <= months, стало m < months
    for (let m = 2; m < months; m++) {
        const base = new Date(firstPaymentDate);
        base.setMonth(base.getMonth() + (m - 1));
        const payDate = getPaymentDate(base.getFullYear(), base.getMonth(), paymentDay);
        const days = Math.ceil((payDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        const interest = balance * annualRate * days / 365;
        let principalPart = annuityPayment - interest;
        const payment = annuityPayment;
        balance -= principalPart;
        if (balance < 0) balance = 0;
        rows.push({
        month: m,
        date: payDate.toLocaleDateString('ru-RU'),
        payment: Math.round(payment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        principal: Math.round(principalPart * 100) / 100,
        remainingBalance: Math.round(balance * 100) / 100,
        });
        prevDate = payDate;
    }

    // Финальный платёж (закрытие кредита) — единственный с month = months
    const closingDate = new Date(debt.startDate);
    closingDate.setMonth(closingDate.getMonth() + months);
    const finalDate = getPaymentDate(closingDate.getFullYear(), closingDate.getMonth(), startDate.getDate());
    const daysFinal = Math.ceil((finalDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    const intFinal = balance * annualRate * daysFinal / 365;
    const payFinal = balance + intFinal;
    rows.push({
        month: months,
        date: finalDate.toLocaleDateString('ru-RU'),
        payment: Math.round(payFinal * 100) / 100,
        interest: Math.round(intFinal * 100) / 100,
        principal: Math.round(balance * 100) / 100,
        remainingBalance: 0,
    });
    }

  // === ИТОГИ ===
  const totalPayments = rows.reduce((sum, row) => sum + row.payment, 0);
  const totalPrincipal = rows.reduce((sum, row) => sum + row.principal, 0);

  // Для аннуитета monthlyPayment = постоянный платёж
  // Для диффа monthlyPayment = первый (максимальный) платёж
  const monthlyRate = annualRate / 12;
  const annuityPayment = isDiff
    ? rows[0].payment
    : principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

  return {
    monthlyPayment: Math.round(annuityPayment * 100) / 100,
    totalPayments: Math.round(totalPayments * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPrincipal: Math.round(totalPrincipal * 100) / 100,
    schedule: rows,
  };
}

// ==========================================
// ОБЁРТКА — ТОЛЬКО СУММА ВЫПЛАТ
// ==========================================

/**
 * Возвращает общую сумму выплат по кредиту (основной долг + все проценты).
 * Используется в списках и метриках для отображения "полной стоимости кредита".
 */
export function calculateTotalPayments(debt: Debt): number {
  if (
    debt.type !== 'bank_loan' ||
    !debt.interestRate ||
    !debt.termMonths ||
    !debt.startDate
  ) {
    return debt.currentAmount;
  }
  return calculatePaymentSchedule(debt).totalPayments;
}