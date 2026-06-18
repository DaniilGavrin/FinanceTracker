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

// Вспомогательная функция: получить корректную дату платежа
// Если в месяце нет нужного дня — возвращает последний день месяца
function getPaymentDate(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const actualDay = Math.min(day, lastDay);
  return new Date(year, month, actualDay);
}

export function PaymentScheduleView({ debt, onBack }: Props) {
  useModalBackHandler(onBack);
  
  const schedule = useMemo(() => {
    if (!debt.interestRate || !debt.termMonths || !debt.startDate) return [];
    
    const annualRate = debt.interestRate / 100;
    const months = debt.termMonths;
    const principal = debt.totalAmount;
    const monthlyRate = annualRate / 12;
    
    // Аннуитетный платёж
    const annuityPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    
    const rows: PaymentRow[] = [];
    let balance = principal;
    const startDate = new Date(debt.startDate);
    
    // Платёжный день: из поля paymentDay или из дня месяца даты открытия
    const paymentDay = debt.paymentDay || startDate.getDate();
    
    // 1. Первый платёж — конец месяца открытия (как в Сбере)
    // Если дата открытия, например, 2 июня → первый платёж 30 июня (последний день месяца)
    const firstPaymentDate = getPaymentDate(
      startDate.getFullYear(),
      startDate.getMonth(),
      31 // Последний день месяца (31 или меньше)
    );
    
    // Если первый платёж получился раньше даты открытия — сдвигаем на следующий месяц
    if (firstPaymentDate.getTime() <= startDate.getTime()) {
      const nextMonth = new Date(startDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      firstPaymentDate.setTime(
        getPaymentDate(nextMonth.getFullYear(), nextMonth.getMonth(), paymentDay).getTime()
      );
    }
    
    // Проценты за неполный период (с даты открытия до первого платежа)
    const daysInFirstPeriod = Math.ceil(
      (firstPaymentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const firstInterest = principal * annualRate * daysInFirstPeriod / 365;
    
    rows.push({
      month: 1,
      date: firstPaymentDate.toLocaleDateString('ru-RU'),
      payment: Math.round(firstInterest * 100) / 100,
      interest: Math.round(firstInterest * 100) / 100,
      principal: 0,
      remainingBalance: Math.round(balance * 100) / 100,
    });
    
    // 2. Последующие платежи — каждый месяц на paymentDay (с корректировкой)
    for (let month = 2; month <= months; month++) {
      const baseDate = new Date(startDate);
      baseDate.setMonth(baseDate.getMonth() + month - 1);
      
      const paymentDate = getPaymentDate(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        paymentDay
      );
      
      // Количество дней в этом расчётном периоде (от предыдущего платежа до текущего)
      const prevDate = rows[rows.length - 1] ? new Date(rows[rows.length - 1].date.split('.').reverse().join('-')) : startDate;
      const daysInPeriod = Math.ceil(
        (paymentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Проценты считаем по дням (как в Сбере)
      const interest = balance * annualRate * daysInPeriod / 365;
      
      let principalPart = annuityPayment - interest;
      let payment = annuityPayment;
      
      // Последний платёж — гасим остаток полностью
      if (month === months) {
        principalPart = balance;
        payment = principalPart + interest;
      }
      
      balance -= principalPart;
      if (balance < 0) balance = 0;
      
      rows.push({
        month,
        date: paymentDate.toLocaleDateString('ru-RU'),
        payment: Math.round(payment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        principal: Math.round(principalPart * 100) / 100,
        remainingBalance: Math.round(balance * 100) / 100,
      });
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
            <p className="text-lg font-bold font-mono text-accent">₽ {totalPrincipal.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-muted-foreground">Переплата</p>
            <p className="text-lg font-bold font-mono text-destructive">₽ {totalInterest.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="card p-3">
            <p className="text-xs text-muted-foreground">Итого выплат</p>
            <p className="text-lg font-bold font-mono">₽ {totalPayments.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}</p>
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