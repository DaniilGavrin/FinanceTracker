"use client";

import { useState } from "react";
import { createAccount, createCreditCard, createInstallment, BankType } from "@/db";
import { useModalBackHandler } from "@/hooks/useModalBackHandler";

export function AddAccountForm({ onClose }: { onClose: () => void }) {
  useModalBackHandler(onClose);
  const [name, setName] = useState("");
  const [type, setType] = useState<"debit" | "cash" | "credit" | "installment">("debit");
  const [balance, setBalance] = useState("");
  const [limit, setLimit] = useState("");
  const [bank, setBank] = useState<BankType>("sber");
  const [openedAt, setOpenedAt] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === "credit") {
      await createCreditCard({
        name,
        limit: parseFloat(limit) || 0,
        currentBalance: parseFloat(balance) || parseFloat(limit) || 0,
        bank,
        openedAt: new Date(openedAt).getTime(),
      });
    } else if (type === "installment") {
      await createInstallment({
        name,
        limit: parseFloat(limit) || 0,
        currentBalance: parseFloat(balance) || parseFloat(limit) || 0,
        bank,
        openedAt: new Date(openedAt).getTime(),
      });
    } else {
      await createAccount({
        name,
        type,
        balance: parseFloat(balance) || 0,
        bank: type === "debit" ? bank : undefined,
        openedAt: new Date(openedAt).getTime(),
      });
    }

    onClose();
  };

  // Показываем лимит и баланс для кредиток и рассрочек
  const showLimitAndBalance = type === "credit" || type === "installment";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-bold mb-4">Добавить счёт</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                type === "installment" ? "Например: Ozon Рассрочка" : 
                type === "credit" ? "Например: Т-Банк Black" :
                "Например: Т-Банк Черная"
              }
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
              <option value="debit">Дебетовая карта</option>
              <option value="cash">Наличные</option>
              <option value="credit">Кредитная карта</option>
              <option value="installment">Рассрочка</option>
            </select>
          </div>

          {/* Банк (для всех типов) */}
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

          {/* Дата открытия */}
          <div>
            <label className="block text-sm font-medium mb-1">Дата открытия</label>
            <input
              type="date"
              value={openedAt}
              onChange={(e) => setOpenedAt(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Баланс (для дебетовых и наличных) */}
          {!showLimitAndBalance && (
            <div>
              <label className="block text-sm font-medium mb-1">Баланс (₽)</label>
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
          )}

          {/* Лимит и баланс (для кредиток и рассрочек) */}
          {showLimitAndBalance && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {type === "installment" ? "Лимит рассрочки" : "Кредитный лимит"} (₽)
                </label>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder={type === "installment" ? "6000" : "60000"}
                  step="0.01"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Текущий баланс (₽)</label>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="Оставьте пустым, если новое"
                  step="0.01"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {type === "installment" 
                    ? "Разница между лимитом и балансом станет долгом по рассрочке"
                    : "Разница между лимитом и балансом станет долгом по кредитке"}
                </p>
              </div>
            </>
          )}

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