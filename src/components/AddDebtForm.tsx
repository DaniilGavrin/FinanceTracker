"use client";

import { useState } from "react";
import { createDebt, BankType } from "@/db";

export function AddDebtForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"bank_loan" | "person" | "installment">("bank_loan");
  const [totalAmount, setTotalAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [bank, setBank] = useState<BankType>("sber");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [termMonths, setTermMonths] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const total = parseFloat(totalAmount) || 0;
    const current = parseFloat(currentAmount) || total;

    await createDebt({
      name,
      type,
      totalAmount: total,
      currentAmount: current,
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      bank: type !== "person" ? bank : "person",
      startDate: new Date(startDate).getTime(),
      termMonths: termMonths ? parseInt(termMonths) : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-bold mb-4">Добавить долг</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Потребительский кредит"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Тип</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="bank_loan">Кредит</option>
              <option value="person">Долг физлицу</option>
              <option value="installment">Рассрочка</option>
            </select>
          </div>

          {/* Банк (не для физлиц) */}
          {type !== "person" && (
            <div>
              <label className="block text-sm font-medium mb-1">Банк</label>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value as BankType)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="sber">Сбер</option>
                <option value="tbank">Т-Банк</option>
                <option value="other">Другой</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Дата взятия</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Срок (для кредитов) */}
          {type === "bank_loan" && (
            <div>
              <label className="block text-sm font-medium mb-1">Срок (месяцев)</label>
              <input
                type="number"
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                placeholder="24"
                min="1"
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Общая сумма
              <span className="ml-1 text-xs text-muted-foreground">(сколько взяли изначально)</span>
            </label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="100000"
              step="0.01"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Текущий остаток
              <span className="ml-1 text-xs text-muted-foreground">(сколько должны сейчас)</span>
            </label>
            <input
              type="number"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder="Оставьте пустым, если равно общей сумме"
              step="0.01"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Если вы только взяли долг — оставьте пустым.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Годовая ставка (%)
              <span className="ml-1 text-xs text-muted-foreground">(необязательно)</span>
            </label>
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="19.9"
              step="0.1"
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