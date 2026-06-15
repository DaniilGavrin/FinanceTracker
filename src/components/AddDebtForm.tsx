"use client";

import { useState } from "react";
import { createDebt } from "@/db";

export function AddDebtForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"bank_loan" | "person" | "installment">("bank_loan");
  const [totalAmount, setTotalAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");

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
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Добавить долг</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Кредит Сбер"
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

          <div>
            <label className="block text-sm font-medium mb-1">Общая сумма</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="50000"
              step="0.01"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Текущий остаток</label>
            <input
              type="number"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder="Оставьте пустым, если равно общей сумме"
              step="0.01"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Годовая ставка (%)</label>
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="Необязательно"
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