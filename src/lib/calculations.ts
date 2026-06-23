import { Debt } from '@/lib/database';

export function getPaymentDate(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const actualDay = Math.min(day, lastDay);
  return new Date(year, month, actualDay);
}

export interface PaymentRow {
  month: number;
  date: string;
  payment: number;
  interest: number;
  principal: number;
  remainingBalance: number;
}

export interface PaymentCalculation {
  monthlyPayment: number | null;
  totalPayments: number;
  totalInterest: number;
  totalPrincipal: number;
  schedule: PaymentRow[];
}

// Хелпер для округления до копеек
function roundToKopecks(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculatePaymentSchedule(debt: Debt): PaymentCalculation {
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
  const monthlyRate = annualRate / 12;
  const startDate = new Date(debt.startDate);
  const paymentDay = debt.paymentDay || startDate.getDate();

  const annuityPayment = isDiff ? 0 : roundToKopecks(
    principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
  );

  const fixedPrincipal = isDiff ? roundToKopecks(principal / months) : 0;

  const rows: PaymentRow[] = [];
  let balance = principal;
  let totalInterest = 0;

  // ========== 1. ПЕРВЫЙ ПЛАТЁЖ (неполный период) ==========
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

  const daysInFirstPeriod = Math.ceil((firstPaymentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const firstInterest = principal * annualRate * daysInFirstPeriod / 365;

  if (isDiff) {
    // Дифференцированный: первый платёж = фикс. тело + проценты
    const firstPayment = fixedPrincipal + firstInterest;
    balance = roundToKopecks(balance - fixedPrincipal);

    rows.push({
      month: 1,
      date: firstPaymentDate.toLocaleDateString('ru-RU'),
      payment: roundToKopecks(firstPayment),
      interest: roundToKopecks(firstInterest),
      principal: roundToKopecks(fixedPrincipal),
      remainingBalance: roundToKopecks(balance),
    });
  } else {
    // Аннуитетный: первый платёж = только проценты, тело не меняется
    totalInterest += firstInterest;
    rows.push({
      month: 1,
      date: firstPaymentDate.toLocaleDateString('ru-RU'),
      payment: roundToKopecks(firstInterest),
      interest: roundToKopecks(firstInterest),
      principal: 0,
      remainingBalance: roundToKopecks(balance),
    });
  }

  // ========== 2. ПОЛНЫЕ МЕСЯЦЫ (2..months) ==========
  for (let month = 2; month <= months; month++) {
    const baseDate = new Date(startDate);
    baseDate.setMonth(baseDate.getMonth() + month - 1);
    const paymentDate = getPaymentDate(baseDate.getFullYear(), baseDate.getMonth(), paymentDay);

    const prevDateStr = rows[rows.length - 1].date;
    const [d, m, y] = prevDateStr.split('.').map(Number);
    const prevDate = new Date(y, m - 1, d);
    const daysInPeriod = Math.ceil((paymentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    const interest = balance * annualRate * daysInPeriod / 365;

    if (isDiff) {
      const payment = fixedPrincipal + interest;
      balance = roundToKopecks(balance - fixedPrincipal);
      if (balance < 0) balance = 0;

      totalInterest += interest;

      rows.push({
        month,
        date: paymentDate.toLocaleDateString('ru-RU'),
        payment: roundToKopecks(payment),
        interest: roundToKopecks(interest),
        principal: roundToKopecks(fixedPrincipal),
        remainingBalance: roundToKopecks(balance),
      });
    } else {

      const principalPart = roundToKopecks(annuityPayment - interest);
      const payment = annuityPayment;
      balance = roundToKopecks(balance - principalPart);
      if (balance < 0) balance = 0;

      totalInterest += interest;

      rows.push({
        month,
        date: paymentDate.toLocaleDateString('ru-RU'),
        payment: roundToKopecks(payment),
        interest: roundToKopecks(interest),
        principal: roundToKopecks(principalPart),
        remainingBalance: roundToKopecks(balance),
      });
    }
  }

  // ========== 3. ФИНАЛЬНЫЙ ПЛАТЁЖ (дата закрытия = дата открытия + termMonths) ==========
  const closingDate = new Date(startDate);
  closingDate.setMonth(closingDate.getMonth() + months);
  const finalDate = getPaymentDate(closingDate.getFullYear(), closingDate.getMonth(), startDate.getDate());

  const lastRowDateStr = rows[rows.length - 1].date;
  const [ld, lm, ly] = lastRowDateStr.split('.').map(Number);
  const lastDate = new Date(ly, lm - 1, ld);
  const daysInFinalPeriod = Math.ceil((finalDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  const finalInterest = balance * annualRate * daysInFinalPeriod / 365;
  const finalPrincipal = balance;
  const finalPayment = finalPrincipal + finalInterest;

  totalInterest += finalInterest;

  rows.push({
    month: months + 1,
    date: finalDate.toLocaleDateString('ru-RU'),
    payment: roundToKopecks(finalPayment),
    interest: roundToKopecks(finalInterest),
    principal: roundToKopecks(finalPrincipal),
    remainingBalance: 0,
  });

  const totalPayments = rows.reduce((sum, row) => sum + row.payment, 0);
  const totalPrincipal = rows.reduce((sum, row) => sum + row.principal, 0);

  const calculatedAnnuity = isDiff ? (rows[0]?.payment || 0) : annuityPayment;

  return {
    monthlyPayment: roundToKopecks(calculatedAnnuity),
    totalPayments: roundToKopecks(totalPayments),
    totalInterest: roundToKopecks(totalInterest),
    totalPrincipal: roundToKopecks(totalPrincipal),
    schedule: rows,
  };
}

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