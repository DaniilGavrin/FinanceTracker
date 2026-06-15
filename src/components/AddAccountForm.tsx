"use client";

import { useState } from "react";
import { createAccount } from "@/db";

export function AddAccountForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"debit" | "cash">("debit");
  const [balance, setBalance] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createAccount({
      name,
      type,
      balance: parseFloat(balance) || 0,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Добавить счёт</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Кошелёк"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Тип</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "debit" | "cash")}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="debit">Дебетовая карта</option>
              <option value="cash">Наличные</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Баланс</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
              step="0.01"
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
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