"use client";

import { useState } from "react";
import { useDatabase } from "@/hooks/useDatabase";
import { createTransactionWithEffects, TransactionType } from "@/db";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { PickerModal, PickerOption } from "@/components/PickerModal";
import { useModalBackHandler } from "@/hooks/useModalBackHandler";

type PickerTarget = "fromAccount" | "toAccount" | "debt" | null;

export function AddTransactionForm({ onClose }: { onClose: () => void }) {
  useModalBackHandler(onClose);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [debtId, setDebtId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const { accounts, debts } = useDatabase();
  const allAccounts = accounts || [];

  const isTransferValid = type !== "transfer" || (fromAccountId && toAccountId && fromAccountId !== toAccountId);

  // Формируем опции для пикера счетов
  const getAccountOptions = (excludeId?: string): PickerOption[] => {
    return allAccounts
      .filter((acc) => acc.id !== excludeId)
      .map((acc) => ({
        id: acc.id,
        label: acc.name,
        subtitle: `${acc.type === "debit" ? "Дебетовая" : acc.type === "credit" ? "Кредитная" : acc.type === "installment" ? "Рассрочка" : "Наличные"} • ₽ ${acc.balance.toLocaleString("ru-RU")}`,
        icon: acc.type === "cash" ? "💵" : acc.type === "credit" ? "💳" : acc.type === "installment" ? "📦" : "🏦",
      }));
  };

  // Формируем опции для пикера долгов
  const getDebtOptions = (): PickerOption[] => {
    return (debts || []).map((debt) => ({
      id: debt.id,
      label: debt.name,
      subtitle: `Остаток: ₽ ${debt.currentAmount.toLocaleString("ru-RU")}`,
      icon: debt.type === "bank_loan" ? "🏦" : debt.type === "person" ? "👤" : debt.type === "installment" ? "📦" : "💳",
      badge: `₽ ${debt.currentAmount.toLocaleString("ru-RU")}`,
      badgeColor: "destructive" as const,
    }));
  };

  // Получаем название выбранного элемента
  const getSelectedLabel = (id: string, type: "account" | "debt"): string => {
    if (type === "account") {
      const acc = allAccounts.find((a) => a.id === id);
      return acc ? acc.name : "";
    }
    const debt = (debts || []).find((d) => d.id === id);
    return debt ? debt.name : "";
  };

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

  // Универсальный компонент выбора (заменяет <select>)
  const SelectButton = ({
    label,
    selectedId,
    type,
    onClick,
    placeholder,
    hint,
  }: {
    label: string;
    selectedId: string;
    type: "account" | "debt";
    onClick: () => void;
    placeholder: string;
    hint?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <button
        type="button"
        onClick={onClick}
        className={`w-full px-3 py-2.5 bg-secondary border rounded-lg text-left transition-all flex items-center justify-between ${
          selectedId
            ? "border-primary/50 text-foreground"
            : "border-border text-muted-foreground"
        }`}
      >
        <span className="truncate">
          {selectedId ? getSelectedLabel(selectedId, type) : placeholder}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 ml-2 text-muted-foreground">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );

  return (
    <>
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
                  { value: "debt_borrow", label: "Взять в долг", icon: "🤝" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setType(opt.value as TransactionType);
                      // Сбрасываем выбранные счета/долги при смене типа
                      setFromAccountId("");
                      setToAccountId("");
                      setDebtId("");
                    }}
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

            {/* Категория */}
            {(type === "expense" || type === "income") && (
              <div>
                <label className="block text-sm font-medium mb-2">Категория</label>
                <div className="grid grid-cols-4 gap-2">
                  {DEFAULT_CATEGORIES.filter((c) => c.type === type).map((cat) => (
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

            {/* Расход — откуда списать */}
            {type === "expense" && (
              <SelectButton
                label="Откуда списать"
                selectedId={fromAccountId}
                type="account"
                onClick={() => setPickerTarget("fromAccount")}
                placeholder="Выберите счёт"
                hint="Можно выбрать кредитку — долг увеличится автоматически"
              />
            )}

            {/* Доход — куда зачислить */}
            {type === "income" && (
              <SelectButton
                label="Куда зачислить"
                selectedId={toAccountId}
                type="account"
                onClick={() => setPickerTarget("toAccount")}
                placeholder="Выберите счёт"
              />
            )}

            {/* Перевод */}
            {type === "transfer" && (
              <>
                <SelectButton
                  label="Откуда"
                  selectedId={fromAccountId}
                  type="account"
                  onClick={() => setPickerTarget("fromAccount")}
                  placeholder="Выберите счёт"
                />
                <SelectButton
                  label="Куда"
                  selectedId={toAccountId}
                  type="account"
                  onClick={() => setPickerTarget("toAccount")}
                  placeholder="Выберите счёт"
                />
                {fromAccountId && toAccountId && fromAccountId === toAccountId && (
                  <p className="text-xs text-destructive">Нельзя выбрать один и тот же счёт</p>
                )}
              </>
            )}

            {/* Гашение долга */}
            {type === "debt_payment" && (
              <>
                <SelectButton
                  label="Какой долг гасим"
                  selectedId={debtId}
                  type="debt"
                  onClick={() => setPickerTarget("debt")}
                  placeholder="Выберите долг"
                />
                <SelectButton
                  label="Списать со счёта (необязательно)"
                  selectedId={fromAccountId}
                  type="account"
                  onClick={() => setPickerTarget("fromAccount")}
                  placeholder="Только уменьшить долг"
                />
              </>
            )}

            {/* Взять в долг */}
            {type === "debt_borrow" && (
              <>
                <SelectButton
                  label="По какому долгу"
                  selectedId={debtId}
                  type="debt"
                  onClick={() => setPickerTarget("debt")}
                  placeholder="Выберите долг"
                />
                <SelectButton
                  label="Зачислить на счёт (необязательно)"
                  selectedId={toAccountId}
                  type="account"
                  onClick={() => setPickerTarget("toAccount")}
                  placeholder="Только увеличить долг"
                />
              </>
            )}

            {/* Комментарий */}
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

      {/* Picker модалка */}
      {pickerTarget === "fromAccount" && (
        <PickerModal
          title="Выберите счёт"
          options={getAccountOptions(type === "transfer" ? toAccountId : undefined)}
          selectedId={fromAccountId}
          onSelect={(id) => setFromAccountId(id)}
          onClose={() => setPickerTarget(null)}
          searchPlaceholder="Поиск счёта..."
          emptyText="Счетов не найдено"
        />
      )}
      {pickerTarget === "toAccount" && (
        <PickerModal
          title="Выберите счёт"
          options={getAccountOptions(type === "transfer" ? fromAccountId : undefined)}
          selectedId={toAccountId}
          onSelect={(id) => setToAccountId(id)}
          onClose={() => setPickerTarget(null)}
          searchPlaceholder="Поиск счёта..."
          emptyText="Счетов не найдено"
        />
      )}
      {pickerTarget === "debt" && (
        <PickerModal
          title="Выберите долг"
          options={getDebtOptions()}
          selectedId={debtId}
          onSelect={(id) => setDebtId(id)}
          onClose={() => setPickerTarget(null)}
          searchPlaceholder="Поиск долга..."
          emptyText="Долгов не найдено"
        />
      )}
    </>
  );
}