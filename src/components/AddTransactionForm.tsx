"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, TransactionType } from "@/db";
import { createTransactionWithEffects } from "@/db";
import { DEFAULT_CATEGORIES, Category } from "@/lib/categories";

export function AddTransactionForm({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [debtId, setDebtId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryId, setCategoryId] = useState("");

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const debts = useLiveQuery(() => db.debts.toArray(), []);

  const allAccounts = accounts || [];

  // Валидация для перевода
  const isTransferValid = type !== "transfer" || (fromAccountId && toAccountId && fromAccountId !== toAccountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert("Сумма должна быть больше нуля");
      return;
    }

    if (type === "transfer" && fromAccountId === toAccountId) {
      alert("Нельзя перевести деньги на тот же счёт");
      return;
    }

    setIsSubmitting(true);

    try {
      await createTransactionWithEffects({
        type,
        amount: parsedAmount,
        description: description || undefined,
        fromAccountId: fromAccountId || undefined,
        toAccountId: toAccountId || undefined,
        categoryId: categoryId || undefined,
        debtId: debtId || undefined,
        date: Date.now(),
      });
      onClose();
    } catch (error) {
      console.error("Ошибка создания транзакции:", error);
      alert("Не удалось сохранить операцию. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-bold mb-4">Новая операция</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Выбор категории */}
          {(type === "expense" || type === "income") && (
            <div>
              <label className="block text-sm font-medium mb-2">Категория</label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_CATEGORIES.filter(c => c.type === type).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                      categoryId === cat.id
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-secondary border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span className="text-[10px] text-center leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
                {fromAccountId && toAccountId && fromAccountId === toAccountId && (
                  <p className="text-xs text-destructive mt-1">Нельзя выбрать один и тот же счёт</p>
                )}
              </div>
            </>
          )}

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
              </div>
            </>
          )}

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
              </div>
            </>
          )}

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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary flex-1"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isTransferValid}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Сохранение..." : "Добавить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}