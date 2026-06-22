"use client";

import { useMemo } from "react";
import { Debt } from "@/db";
import { useModalBackHandler } from "@/hooks/useModalBackHandler";

interface Props {
  debt: Debt;
  onBack: () => void;
}

interface PaymentRow {
  month: number;
  date: string;
  payment: number;
  interest: number;
  principal: number;
  remainingBalance: number;
}

function getPaymentDate(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const actualDay = Math.min(day, lastDay);
  return new Date(year, month, actualDay);
}

export function PaymentScheduleView({ debt, onBack }: Props) {
  useModalBackHandler(onBack);
  
  const schedule = useMemo(() => {
    // ✅ ИСПРАВЛЕНО: добавлена проверка interestRate
    if (!debt.termMonths || !debt.startDate || !debt.interestRate || debt.totalAmount <= 0) return [];
    
    const isDiff = debt.paymentType === 'differentiated';
    const annualRate = debt.interestRate / 100;
    const months = debt.termMonths;
    const principal = debt.totalAmount;
    const startDate = new Date(debt.startDate);
    const paymentDay = debt.paymentDay || startDate.getDate();

    // === ДАТЫ (ОБЩИЕ ДЛЯ ОБОИХ ТИПОВ) ===
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
      // 🟢 ДИФФЕРЕНЦИРОВАННЫЙ ПЛАТЁЖ
      const fixedPrincipal = principal / months;

      // 1. Первый платёж (неполный период)
      const daysFirst = Math.ceil((firstPaymentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      const intFirst = balance * annualRate * daysFirst / 365;
      const payFirst = fixedPrincipal + intFirst;
      balance -= fixedPrincipal;
      totalInterest += intFirst;
      rows.push({ month: 1, date: firstPaymentDate.toLocaleDateString('ru-RU'), payment: Math.round(payFirst * 100) / 100, interest: Math.round(intFirst * 100) / 100, principal: Math.round(fixedPrincipal * 100) / 100, remainingBalance: Math.round(balance * 100) / 100 });
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
        rows.push({ month: m, date: payDate.toLocaleDateString('ru-RU'), payment: Math.round(payment * 100) / 100, interest: Math.round(interest * 100) / 100, principal: Math.round(principalPart * 100) / 100, remainingBalance: Math.round(balance * 100) / 100 });
        prevDate = payDate;
      }
    } else {
      const monthlyRate = annualRate / 12;
      const annuityPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

      // Первый платёж
      const daysFirst = Math.ceil((firstPaymentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      const intFirst = balance * annualRate * daysFirst / 365;
      balance += intFirst;
      rows.push({ month: 1, date: firstPaymentDate.toLocaleDateString('ru-RU'), payment: Math.round(intFirst * 100) / 100, interest: Math.round(intFirst * 100) / 100, principal: 0, remainingBalance: Math.round(balance * 100) / 100 });
      prevDate = firstPaymentDate;

      // Полные месяцы
      for (let m = 2; m <= months; m++) {
        const base = new Date(firstPaymentDate);
        base.setMonth(base.getMonth() + (m - 1));
        const payDate = getPaymentDate(base.getFullYear(), base.getMonth(), paymentDay);
        const days = Math.ceil((payDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        const interest = balance * annualRate * days / 365;
        let principalPart = annuityPayment - interest;
        let payment = annuityPayment;
        balance -= principalPart;
        if (balance < 0) balance = 0;
        rows.push({ month: m, date: payDate.toLocaleDateString('ru-RU'), payment: Math.round(payment * 100) / 100, interest: Math.round(interest * 100) / 100, principal: Math.round(principalPart * 100) / 100, remainingBalance: Math.round(balance * 100) / 100 });
        prevDate = payDate;
      }

      // Финальный платёж
      const closingDate = new Date(debt.startDate);
      closingDate.setMonth(closingDate.getMonth() + months);
      const finalDate = getPaymentDate(closingDate.getFullYear(), closingDate.getMonth(), startDate.getDate());
      const daysFinal = Math.ceil((finalDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      const intFinal = balance * annualRate * daysFinal / 365;
      const payFinal = balance + intFinal;
      rows.push({ month: months, date: finalDate.toLocaleDateString('ru-RU'), payment: Math.round(payFinal * 100) / 100, interest: Math.round(intFinal * 100) / 100, principal: Math.round(balance * 100) / 100, remainingBalance: 0 });
    }

    return rows;
  }, [debt]);
  
  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
  const totalPrincipal = schedule.reduce((sum, row) => sum + row.principal, 0);
  const totalPayments = schedule.reduce((sum, row) => sum + row.payment, 0);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button onClick={onBack} className="flex items-center gap-1 text-primary hover:opacity-80 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span className="text-sm font-medium">Назад</span>
          </button>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl pb-8">
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-1">График платежей</p>
          <h1 className="text-2xl font-bold tracking-tight">{debt.name}</h1>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="card p-3">
                <p className="text-xs text-muted-foreground">Основной долг</p>
                <p className="text-lg font-bold font-mono text-accent">₽ {totalPrincipal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="card p-3">
                <p className="text-xs text-muted-foreground">Переплата</p>
                <p className="text-lg font-bold font-mono text-destructive">₽ {totalInterest.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="card p-3">
                <p className="text-xs text-muted-foreground">Итого выплат</p>
                <p className="text-lg font-bold font-mono">₽ {totalPayments.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
        </div>
        
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">№</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Дата</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Платёж</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Проценты</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Основной</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Остаток</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.month} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{row.month}</td>
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2 text-right font-mono">₽ {row.payment.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right font-mono text-destructive">₽ {row.interest.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right font-mono text-accent">₽ {row.principal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right font-mono">₽ {row.remainingBalance.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}