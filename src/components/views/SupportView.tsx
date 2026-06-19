"use client";
import { useState } from "react";
import { useModalBackHandler } from "@/hooks/useModalBackHandler";

// 👇 ВПИШИ СЮДА СВОЙ РЕАЛЬНЫЙ USDT TRC-20 АДРЕС
const USDT_TRC20_ADDRESS = "TQ3pKUs7Wox8yyeSdTvjw4pfEBVCU57Bm6";

interface Props {
  onBack: () => void;
}

export function SupportView({ onBack }: Props) {
  useModalBackHandler(onBack);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(USDT_TRC20_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // Фоллбэк для старых браузеров
      const textarea = document.createElement("textarea");
      textarea.value = USDT_TRC20_ADDRESS;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        alert("Не удалось скопировать. Адрес: " + USDT_TRC20_ADDRESS);
      }
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-primary hover:opacity-80 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span className="text-sm font-medium">Назад</span>
          </button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl pb-8 space-y-5">
        {/* Заголовок */}
        <div className="text-center pt-4">
          <div className="text-5xl mb-3">☕</div>
          <h1 className="text-2xl font-bold tracking-tight">Поддержать разработку</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Finance Tracker — бесплатный проект без рекламы. Ваша поддержка помогает оплачивать хостинг, разрабатывать новые функции и делать приложение лучше.
          </p>
        </div>

        {/* USDT TRC-20 */}
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-xl">
              💵
            </div>
            <div>
              <h3 className="font-semibold text-sm">USDT (TRC-20)</h3>
              <p className="text-xs text-muted-foreground">Сеть Tron • низкая комиссия</p>
            </div>
          </div>

          <div className="bg-secondary/50 border border-border rounded-lg p-3 mb-3 break-all font-mono text-xs text-foreground select-all">
            {USDT_TRC20_ADDRESS}
          </div>

          <button
            onClick={handleCopy}
            className={`w-full py-3 rounded-lg font-medium transition-all active:scale-[0.98] ${
              copied
                ? "bg-accent text-white"
                : "btn-primary"
            }`}
          >
            {copied ? "✓ Адрес скопирован" : "Скопировать адрес"}
          </button>

          <p className="text-[11px] text-muted-foreground text-center mt-3 leading-relaxed">
            ⚠️ Отправляйте только <b>USDT в сети TRC-20 (Tron)</b>.<br />
            Отправка в другой сети может привести к безвозвратной потере средств.
          </p>
        </div>

        {/* Благодарность */}
        <div className="card bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 text-center py-5">
          <p className="text-2xl mb-2">💙</p>
          <p className="text-sm font-medium">Спасибо, что вы с нами!</p>
          <p className="text-xs text-muted-foreground mt-1">
            Каждая поддержка мотивирует делать приложение лучше
          </p>
        </div>
      </main>
    </div>
  );
}