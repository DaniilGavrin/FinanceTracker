"use client";

import { useState, useEffect, useRef } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Как добавить счёт?",
    answer: "Нажмите «+ Добавить» рядом с разделом «Счета». Выберите тип (Дебетовая карта или Наличные), введите название и текущий баланс. Например: «Т-Банк Черная» с балансом 15 000 ₽."
  },
  {
    question: "В чём разница между типами счетов?",
    answer: "Дебетовая карта — обычная карта, где лежат ваши деньги. Наличные — деньги в кошельке/кармане. Кредитная карта и Рассрочка добавляются через раздел «Обязательства», так как это ваши долги."
  },
  {
    question: "Как добавить долг (кредит, рассрочку, долг человеку)?",
    answer: "Нажмите «+ Добавить» в разделе «Обязательства». Укажите название, тип и суммы. Для кредита: «Общая сумма» — сколько вы взяли изначально, «Текущий остаток» — сколько осталось выплатить сейчас."
  },
  {
    question: "Что такое «Общая сумма» и «Текущий остаток»?",
    answer: "Общая сумма — это изначальная сумма долга (например, вы взяли кредит на 100 000 ₽). Текущий остаток — сколько вы должны прямо сейчас (например, уже выплатили 30 000, значит остаток 70 000 ₽). Если вы только взяли долг — оба значения одинаковые."
  },
  {
    question: "Как добавить расход или доход?",
    answer: "Нажмите «+ Операция» в шапке. Выберите тип (Расход/Доход), введите сумму, выберите счёт (откуда ушли деньги или куда пришли) и добавьте комментарий. Например: «Продукты» — 2 500 ₽ с карты «Т-Банк»."
  },
  {
    question: "Что такое «Платёж по долгу»?",
    answer: "Это операция, когда вы гасите часть долга. Выберите тип «Платёж по долгу», укажите сумму и какой именно долг вы гасите. Баланс долга автоматически уменьшится. Например: выплатили 10 000 ₽ по кредиту Сбера."
  },
  {
    question: "Работает ли приложение без интернета?",
    answer: "Да! Все данные хранятся локально на вашем устройстве. Вы можете добавлять операции, счета и долги даже в самолёте. Когда появится интернет — данные синхронизируются с сервером (если вы вошли в аккаунт)."
  },
  {
    question: "Безопасны ли мои данные?",
    answer: "Да. Данные хранятся в зашифрованном виде в вашем браузере. Мы не передаём информацию третьим лицам. Синхронизация с сервером происходит только если вы сами этого хотите."
  },
  {
    question: "Как удалить счёт или долг?",
    answer: "Сейчас функция удаления в разработке. Если нужно исправить ошибку — напишите нам, мы поможем. В следующей версии добавим возможность редактирования и удаления."
  },
  {
    question: "Почему суммы считаются приблизительно?",
    answer: "Банки используют сложные формулы с округлениями, которые не публикуют. Наш трекер даёт оценку с точностью до рублей. Для точных данных смотрите выписку в приложении банка."
  }
];

export function FAQModal({ onClose }: { onClose: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Закрытие по клику на оверлей (но не на саму модалку)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-card z-10 pb-2">
          <h2 className="text-xl font-bold">Частые вопросы</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
            title="Закрыть"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {faqData.map((item, index) => (
            <div key={index} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-secondary/50 transition-colors"
              >
                <span className="font-medium text-sm">{item.question}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-4 pb-3 text-sm text-muted-foreground">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Остались вопросы? Напишите нам: <a href="mailto:support@bytewizard.ru" className="text-primary hover:underline">support@bytewizard.ru</a>
          </p>
        </div>
      </div>
    </div>
  );
}