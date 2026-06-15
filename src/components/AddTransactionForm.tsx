"use client";

import { useState, useEffect } from "react";
import { createTransaction } from "@/db";
import { db, Account, Debt } from "@/db";
import { useLiveQuery } from "dexie-react-hooks";

export function AddTransactionForm({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<"expense" | "income" | "debt_payment">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [debtId, setDebtId] = useState("");

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const debts = useLiveQuery(() => db.debts.toArray(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createTransaction({
      type,
      amount: parseFloat(amount) || 0,
      description,
      accountId: type !== "debt_payment" ? accountId : undefined,
      debtId: type === "debt_payment" ? debtId : undefined,
      date: Date.now(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Добавить операцию</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Тип операции</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="expense">Расход</option>
              <option value="income">Доход</option>
              <option value="debt_payment">Платеж по долгу</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Сумма (₽)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              step="0.01"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Выбор счета (для расходов и доходов) */}
          {type !== "debt_payment" && accounts && accounts.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Счет</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Выберите счет</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.balance} ₽)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Выбор долга (для платежей по долгам) */}
          {type === "debt_payment" && debts && debts.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Какой долг гасим?</label>
              <select
                value={debtId}
                onChange={(e) => setDebtId(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Выберите долг</option>
                {debts.map((debt) => (
                  <option key={debt.id} value={debt.id}>
                    {debt.name} (остаток: {debt.currentAmount} ₽)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Комментарий (необязательно)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Например: Продукты, Зарплата"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}