"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, Account, Debt } from "@/db";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function Home() {
  const isOnline = useOnlineStatus();

  // Подписываемся на изменения в базе данных в реальном времени
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const debts = useLiveQuery(() => db.debts.toArray(), []);

  // Считаем общие суммы
  const totalDebt = debts?.reduce((sum, d) => sum + d.currentAmount, 0) || 0;
  const totalBalance = accounts?.reduce((sum, a) => sum + a.balance, 0) || 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Шапка */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Finance Tracker</h1>
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
            isOnline
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full animate-pulse ${
              isOnline ? "bg-green-400" : "bg-red-400"
            }`}
          ></span>
          {isOnline ? "В сети" : "Оффлайн"}
        </div>
      </header>

      {/* Быстрая статистика */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-muted-foreground">Общий долг</p>
          <p className="text-2xl font-bold text-destructive mt-1">
            ₽ {totalDebt.toLocaleString('ru-RU')}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">Свободные средства</p>
          <p className="text-2xl font-bold text-accent mt-1">
            ₽ {totalBalance.toLocaleString('ru-RU')}
          </p>
        </div>
      </div>

      {/* Список счетов */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Счета ({accounts?.length || 0})</h2>
        <div className="space-y-3">
          {accounts && accounts.length > 0 ? (
            accounts.map((acc) => (
              <div key={acc.id} className="card flex justify-between items-center">
                <div>
                  <p className="font-medium">{acc.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {acc.type === 'debit' ? 'Дебетовая' : acc.type === 'credit' ? 'Кредитная' : acc.type}
                  </p>
                </div>
                <p className="font-mono text-lg">₽ {acc.balance.toLocaleString('ru-RU')}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">Нет счетов. Добавь первый!</p>
          )}
        </div>
      </section>

      {/* Список долгов */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Обязательства ({debts?.length || 0})</h2>
        <div className="space-y-3">
          {debts && debts.length > 0 ? (
            debts.map((debt) => (
              <div key={debt.id} className="card flex justify-between items-center">
                <div>
                  <p className="font-medium">{debt.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {debt.type === 'bank_loan' ? 'Кредит' : debt.type === 'person' ? 'Долг физлицу' : 'Рассрочка'}
                  </p>
                </div>
                <p className="font-mono text-lg text-destructive">
                  - ₽ {debt.currentAmount.toLocaleString('ru-RU')}
                </p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">Долгов нет. Так держать!</p>
          )}
        </div>
      </section>
    </div>
  );
}