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
  payment: number;
  interest: number;
  principal: number;
  remainingBalance: number;
}

export function PaymentScheduleView({ debt, onBack }: Props) {
  useModalBackHandler(onBack);
  
  const schedule = useMemo(() => {
    if (!debt.interestRate || !debt.termMonths) {
      return [];
    }
    
    const monthlyRate = debt.interestRate / 100 / 12;
    const months = debt.termMonths;
    
    // Вычисляем monthlyPayment
    let monthlyPayment = debt.monthlyPayment;
    if (!monthlyPayment) {
      // Вычисляем principal из totalAmount
      const r = monthlyRate;
      const n = months;
      const principal = debt.totalAmount / (1 + r * n); // упрощённо
      monthlyPayment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    
    // Вычисляем principal (основную сумму) из monthlyPayment
    const r = monthlyRate;
    const n = months;
    const principal = monthlyPayment * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
    
    const rows: PaymentRow[] = [];
    let balance = principal;
    
    for (let month = 1; month <= months; month++) {
      const interest = balance * monthlyRate;
      const principalPart = monthlyPayment - interest;
      balance -= principalPart;
      
      rows.push({
        month,
        payment: Math.round(monthlyPayment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        principal: Math.round(principalPart * 100) / 100,
        remainingBalance: Math.max(0, Math.round(balance * 100) / 100),
      });
    }
    
    return rows;
  }, [debt]);
  
  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
  const totalPrincipal = schedule.reduce((sum, row) => sum + row.principal, 0);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-primary hover:opacity-80 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span className="text-sm font-medium">Назад</span>
          </button>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl pb-8">
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-1">График платежей</p>
          <h1 className="text-2xl font-bold tracking-tight">{debt.name}</h1>
        </div>
        
        {/* Сводка */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card">
            <p className="text-xs text-muted-foreground">Основной долг</p>
            <p className="text-lg font-bold font-mono text-accent">
              ₽ {Math.round(totalPrincipal).toLocaleString('ru-RU')}
            </p>
          </div>
          <div className="card">
            <p className="text-xs text-muted-foreground">Переплата</p>
            <p className="text-lg font-bold font-mono text-destructive">
              ₽ {Math.round(totalInterest).toLocaleString('ru-RU')}
            </p>
          </div>
          <div className="card">
            <p className="text-xs text-muted-foreground">Итого выплат</p>
            <p className="text-lg font-bold font-mono">
              ₽ {Math.round(totalPrincipal + totalInterest).toLocaleString('ru-RU')}
            </p>
          </div>
        </div>
        
        {/* Таблица платежей */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Месяц</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Платёж</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Проценты</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Основной долг</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Остаток</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.month} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{row.month}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      ₽ {row.payment.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-destructive">
                      ₽ {row.interest.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-accent">
                      ₽ {row.principal.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      ₽ {row.remainingBalance.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
                    </td>
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