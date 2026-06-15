"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function Home() {
  const isOnline = useOnlineStatus();

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Шапка */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Finance Tracker</h1>
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
      </header>

      {/* Быстрая статистика */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-muted-foreground">Общий долг</p>
          <p className="text-2xl font-bold text-destructive mt-1">₽ 0.00</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">Свободные средства</p>
          <p className="text-2xl font-bold text-accent mt-1">₽ 0.00</p>
        </div>
      </div>

      {/* Список счетов/долгов */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Счета и обязательства</h2>
        <div className="space-y-3">
          <div className="card flex justify-between items-center">
            <div>
              <p className="font-medium">Кошелёк</p>
              <p className="text-xs text-muted-foreground">Наличные</p>
            </div>
            <p className="font-mono text-lg">₽ 0.00</p>
          </div>
          
          {/* Заглушка для примера */}
          <div className="card flex justify-between items-center opacity-60">
            <div>
              <p className="font-medium">Кредитка Сбер</p>
              <p className="text-xs text-muted-foreground">Лимит: ₽ 60 000</p>
            </div>
            <p className="font-mono text-lg text-destructive">- ₽ 60 000</p>
          </div>
        </div>
      </section>

      {/* Кнопка действия */}
      <button className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base font-semibold mt-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Добавить операцию
      </button>
    </div>
  );
}