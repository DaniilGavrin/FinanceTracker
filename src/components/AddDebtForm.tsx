"use client";

import { useState } from "react";
import { createDebt, BankType } from "@/db";
import { useModalBackHandler } from "@/hooks/useModalBackHandler";

export function AddDebtForm({ onClose }: { onClose: () => void }) {
  useModalBackHandler(onClose);
  
  const [name, setName] = useState("");
  const [type, setType] = useState<"bank_loan" | "person" | "installment">("bank_loan");
  const [totalAmount, setTotalAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [bank, setBank] = useState<BankType>("sber");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [termMonths, setTermMonths] = useState("");
  
  // Новые поля
  const [nextPaymentDate, setNextPaymentDate] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [paymentType, setPaymentType] = useState<"annuity" | "differentiated">("annuity");
  
  // Для рассрочек
  const [store, setStore] = useState("");
  const [purchaseDescription, setPurchaseDescription] = useState("");
  const [installmentsCount, setInstallmentsCount] = useState("");
  
  // Для кредитных карт (создаются через AddAccountForm, но долг может редактироваться)
  
  // Для физлиц
  const [contactInfo, setContactInfo] = useState("");
  const [repaymentTerms, setRepaymentTerms] = useState("");

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
      nextPaymentDate: nextPaymentDate ? new Date(nextPaymentDate).getTime() : undefined,
      monthlyPayment: monthlyPayment ? parseFloat(monthlyPayment) : undefined,
      paymentType: type === "bank_loan" ? paymentType : undefined,
      store: type === "installment" ? store || undefined : undefined,
      purchaseDescription: type === "installment" ? purchaseDescription || undefined : undefined,
      installmentsCount: type === "installment" && installmentsCount ? parseInt(installmentsCount) : undefined,
      paidInstallments: type === "installment" ? 0 : undefined,
      contactInfo: type === "person" ? contactInfo || undefined : undefined,
      repaymentTerms: type === "person" ? repaymentTerms || undefined : undefined,
    });

    onClose();
  };

  // Общий input-блок
  const InputField = ({ label, value, onChange, type = "text", placeholder, hint, required, step, min }: any) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        min={min}
        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        required={required}
      />
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-bold mb-4">Добавить обязательство</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Тип */}
          <div>
            <label className="block text-sm font-medium mb-2">Тип обязательства</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "bank_loan", label: "Кредит", icon: "🏦" },
                { value: "person", label: "Физлицо", icon: "👤" },
                { value: "installment", label: "Рассрочка", icon: "📦" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value as any)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                    type === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-lg mb-1">{opt.icon}</div>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Название */}
          <InputField
            label="Название"
            value={name}
            onChange={setName}
            placeholder={
              type === "installment" ? "Ozon Рассрочка" :
              type === "person" ? "Долг Ивану" :
              "Потребительский кредит"
            }
            required
          />

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

          {/* Дата начала */}
          <InputField
            label={type === "person" ? "Дата займа" : "Дата открытия"}
            value={startDate}
            onChange={setStartDate}
            type="date"
            required
          />

          {/* Общая сумма */}
          <InputField
            label={type === "person" ? "Сумма долга (₽)" : "Общая сумма (₽)"}
            value={totalAmount}
            onChange={setTotalAmount}
            type="number"
            placeholder="100000"
            step="0.01"
            required
          />

          {/* Текущий остаток */}
          <InputField
            label="Текущий остаток (₽)"
            value={currentAmount}
            onChange={setCurrentAmount}
            type="number"
            placeholder="Оставьте пустым, если равно общей сумме"
            step="0.01"
            hint="Если только взяли — оставьте пустым"
          />

          {/* === СПЕЦИФИЧНЫЕ ПОЛЯ ПО ТИПАМ === */}
          
          {/* КРЕДИТ */}
          {type === "bank_loan" && (
            <>
              <InputField
                label="Годовая ставка (%)"
                value={interestRate}
                onChange={setInterestRate}
                type="number"
                placeholder="19.9"
                step="0.1"
              />
              <InputField
                label="Срок (месяцев)"
                value={termMonths}
                onChange={setTermMonths}
                type="number"
                placeholder="24"
                min="1"
              />
              <div>
                <label className="block text-sm font-medium mb-1">Тип платежа</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="annuity">Аннуитетный</option>
                  <option value="differentiated">Дифференцированный</option>
                </select>
              </div>
              <InputField
                label="Ежемесячный платёж (₽)"
                value={monthlyPayment}
                onChange={setMonthlyPayment}
                type="number"
                placeholder="Рассчитается автоматически или введите вручную"
                step="0.01"
              />
              <InputField
                label="Дата следующего платежа"
                value={nextPaymentDate}
                onChange={setNextPaymentDate}
                type="date"
              />
            </>
          )}

          {/* РАССРОЧКА */}
          {type === "installment" && (
            <>
              <InputField
                label="Магазин / Сервис"
                value={store}
                onChange={setStore}
                placeholder="Ozon, Яндекс Маркет, DNS..."
              />
              <InputField
                label="Что куплено"
                value={purchaseDescription}
                onChange={setPurchaseDescription}
                placeholder="iPhone 15, Ноутбук..."
              />
              <InputField
                label="Количество платежей"
                value={installmentsCount}
                onChange={setInstallmentsCount}
                type="number"
                placeholder="4"
                min="1"
              />
              <InputField
                label="Ежемесячный платёж (₽)"
                value={monthlyPayment}
                onChange={setMonthlyPayment}
                type="number"
                placeholder="Рассчитается автоматически"
                step="0.01"
              />
              <InputField
                label="Дата следующего платежа"
                value={nextPaymentDate}
                onChange={setNextPaymentDate}
                type="date"
              />
            </>
          )}

          {/* ФИЗЛИЦО */}
          {type === "person" && (
            <>
              <InputField
                label="Контакты должника"
                value={contactInfo}
                onChange={setContactInfo}
                placeholder="Телефон, Telegram..."
              />
              <div>
                <label className="block text-sm font-medium mb-1">Условия возврата</label>
                <textarea
                  value={repaymentTerms}
                  onChange={(e) => setRepaymentTerms(e.target.value)}
                  placeholder="До 1 января 2027, частями по 10000₽..."
                  rows={3}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <InputField
                label="Дата возврата"
                value={nextPaymentDate}
                onChange={setNextPaymentDate}
                type="date"
              />
            </>
          )}

          {/* Кнопки */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Отмена
            </button>
            <button type="submit" className="btn-primary flex-1">
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}