"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, TransactionType } from "@/db";
import { createTransactionWithEffects } from "@/db";

export function AddTransactionForm({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [debtId, setDebtId] = useState("");

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const debts = useLiveQuery(() => db.debts.toArray(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    await createTransactionWithEffects({
      type,
      amount: parsedAmount,
      description: description || undefined,
      category: category || undefined,
      fromAccountId: fromAccountId || undefined,
      toAccountId: toAccountId || undefined,
      debtId: debtId || undefined,
      date: Date.now(),
    });

    onClose();
  };

  // Фильтруем счета по типу
  const debitAccounts = accounts?.filter(a => a.type === 'debit' || a.type === 'cash') || [];
  const allAccounts = accounts || [];
  const creditAccounts = accounts?.filter(a => a.type === 'credit') || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-bold mb-4">Новая операция</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Тип операции */}
          <div>
            <label className="block text-sm font-medium mb-2">Тип операции</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "expense", label: "Расход", icon: "📉" },
                { value: "income", label: "Доход", icon: "📈" },
                { value: "transfer", label: "Перевод", icon: "🔄" },
                { value: "debt_payment", label: "Гашение долга", icon: "💳" },
                { value: "debt_borrow", label: "Взять в долг", icon: "" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value as TransactionType)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    type === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary border-border hover:border-primary/50"
                  }`}
                >
                  <span className="mr-1">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Сумма */}
          <div>
            <label className="block text-sm font-medium mb-1">Сумма (₽)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              step="0.01"
              min="0.01"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg font-mono"
              required
            />
          </div>

          {/* Поля в зависимости от типа */}
          
          {/* РАСХОД: откуда */}
          {type === "expense" && (
            <div>
              <label className="block text-sm font-medium mb-1">Откуда списать</label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Выберите счёт</option>
                {allAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.balance.toLocaleString('ru-RU')} ₽)
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Можно выбрать кредитку — долг увеличится автоматически
              </p>
            </div>
          )}

          {/* ДОХОД: куда */}
          {type === "income" && (
            <div>
              <label className="block text-sm font-medium mb-1">Куда зачислить</label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Выберите счёт</option>
                {allAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.balance.toLocaleString('ru-RU')} ₽)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ПЕРЕВОД: откуда и куда */}
          {type === "transfer" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Откуда</label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Выберите счёт</option>
                  {allAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.balance.toLocaleString('ru-RU')} ₽)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Куда</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Выберите счёт</option>
                  {allAccounts.filter(acc => acc.id !== fromAccountId).map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.balance.toLocaleString('ru-RU')} ₽)
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* ГАШЕНИЕ ДОЛГА: какой долг + откуда (опционально) */}
          {type === "debt_payment" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Какой долг гасим</label>
                <select
                  value={debtId}
                  onChange={(e) => setDebtId(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Выберите долг</option>
                  {debts?.map(debt => (
                    <option key={debt.id} value={debt.id}>
                      {debt.name} (остаток: {debt.currentAmount.toLocaleString('ru-RU')} ₽)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Списать со счёта <span className="text-xs text-muted-foreground">(необязательно)</span>
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Только уменьшить долг</option>
                  {allAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.balance.toLocaleString('ru-RU')} ₽)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Если не выбран — долг уменьшится, но баланс счёта не изменится
                </p>
              </div>
            </>
          )}

          {/* ВЗЯТЬ В ДОЛГ: какой долг + куда (опционально) */}
          {type === "debt_borrow" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">По какому долгу</label>
                <select
                  value={debtId}
                  onChange={(e) => setDebtId(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Выберите долг</option>
                  {debts?.map(debt => (
                    <option key={debt.id} value={debt.id}>
                      {debt.name} (остаток: {debt.currentAmount.toLocaleString('ru-RU')} ₽)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Или создайте новый долг в разделе «Обязательства»
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Зачислить на счёт <span className="text-xs text-muted-foreground">(необязательно)</span>
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Только увеличить долг</option>
                  {allAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.balance.toLocaleString('ru-RU')} ₽)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Например, взял у друга 5000₽ и сразу положил на карту
                </p>
              </div>
            </>
          )}

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium mb-1">Комментарий</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Например: Продукты, Зарплата"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Кнопки */}
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