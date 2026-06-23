"use client";

import { useMemo } from "react";
import { Debt } from "@/db";
import { useModalBackHandler } from "@/hooks/useModalBackHandler";
import { calculatePaymentSchedule, PaymentRow } from "@/lib/calculations";

interface Props {
  debt: Debt;
  onBack: () => void;
}

export function PaymentScheduleView({ debt, onBack }: Props) {
  useModalBackHandler(onBack);
  
  const { schedule, totalInterest, totalPrincipal, totalPayments } = useMemo(() => {
    return calculatePaymentSchedule(debt);
  }, [debt]);
  
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