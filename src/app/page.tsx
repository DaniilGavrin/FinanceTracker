"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { AddAccountForm } from "@/components/AddAccountForm";
import { AddDebtForm } from "@/components/AddDebtForm";
import { AddTransactionForm } from "@/components/AddTransactionForm";
import { FAQModal } from "@/components/FAQModal";

export default function Home() {
  const isOnline = useOnlineStatus();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const debts = useLiveQuery(() => db.debts.toArray(), []);
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().limit(5).toArray(), []);

  const totalDebt = debts?.reduce((sum, d) => sum + d.currentAmount, 0) || 0;
  const totalBalance = accounts?.reduce((sum, a) => sum + a.balance, 0) || 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Шапка */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Finance Tracker</h1>
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => setShowFAQ(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            title="Помощь"
          >
            <span className="text-sm font-bold">?</span>
          </button>
          <button
            onClick={() => setShowAddTransaction(true)}
            className="btn-primary px-3 py-1 text-sm"
          >
            + Операция
          </button>
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Счета ({accounts?.length || 0})</h2>
          <button
            onClick={() => setShowAddAccount(true)}
            className="text-sm text-primary hover:underline"
          >
            + Добавить
          </button>
        </div>
        <div className="space-y-3">
          {accounts && accounts.length > 0 ? (
            accounts.map((acc) => (
              <div key={acc.id} className="card flex justify-between items-center">
                <div>
                  <p className="font-medium">{acc.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {acc.type === 'debit' ? 'Дебетовая' : acc.type === 'credit' ? 'Кредитная' : acc.type === 'cash' ? 'Наличные' : acc.type}
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Обязательства ({debts?.length || 0})</h2>
          <button
            onClick={() => setShowAddDebt(true)}
            className="text-sm text-primary hover:underline"
          >
            + Добавить
          </button>
        </div>
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

      {/* Последние транзакции */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Последние операции</h2>
        <div className="space-y-3">
          {transactions && transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx.id} className="card flex justify-between items-center">
                <div>
                  <p className="font-medium">{tx.description || tx.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <p className={`font-mono text-lg ${tx.type === 'expense' || tx.type === 'debt_payment' ? 'text-destructive' : 'text-accent'}`}>
                  {tx.type === 'expense' || tx.type === 'debt_payment' ? '-' : '+'} ₽ {tx.amount.toLocaleString('ru-RU')}
                </p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">Операций пока нет</p>
          )}
        </div>
      </section>

      {/* Модальные окна */}
      {showAddAccount && <AddAccountForm onClose={() => setShowAddAccount(false)} />}
      {showAddDebt && <AddDebtForm onClose={() => setShowAddDebt(false)} />}
      {showAddTransaction && <AddTransactionForm onClose={() => setShowAddTransaction(false)} />}
      {showFAQ && <FAQModal onClose={() => setShowFAQ(false)} />}
    </div>
  );
}