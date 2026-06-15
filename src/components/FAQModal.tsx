"use client";

import { useState, useEffect, useRef } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Как добавить счёт?",
    answer: "Перейдите на вкладку «Счета» и нажмите «+ Добавить». Выберите тип (Дебетовая карта, Наличные или Кредитная карта), укажите банк, дату открытия и баланс. Для кредитки укажите лимит — долг создастся автоматически."
  },
  {
    question: "Как добавить долг или кредит?",
    answer: "Перейдите на вкладку «Счета» и нажмите «+ Добавить» в разделе «Обязательства». Укажите тип (Кредит, Долг физлицу или Рассрочка), банк, дату, сумму и ставку."
  },
  {
    question: "Как добавить расход, доход или перевод?",
    answer: "Нажмите «+ Операция» в шапке. Выберите тип операции, введите сумму, выберите счёт и добавьте комментарий. Для перевода укажите оба счёта."
  },
  {
    question: "Как погасить долг или рассрочку?",
    answer: "Нажмите «+ Операция», выберите «Гашение долга», укажите сумму и какой долг гасите. Опционально можно указать счёт, с которого списываются деньги."
  },
  {
    question: "Как редактировать или удалить запись?",
    answer: "Наведите курсор на счёт, долг или операцию (на десктопе) или просто посмотрите на правую часть карточки (на мобильном). Нажмите на иконку корзины и подтвердите удаление. Редактирование будет добавлено в следующей версии."
  },
  {
    question: "Работает ли приложение без интернета?",
    answer: "Да! Все данные хранятся локально в вашем браузере. Вы можете добавлять операции, счета и долги даже в самолёте. Когда появится интернет — данные синхронизируются с сервером."
  },
  {
    question: "Безопасны ли мои данные?",
    answer: "Да. Данные хранятся локально в зашифрованном виде. Мы не передаём информацию третьим лицам. Синхронизация с сервером происходит только если вы сами этого хотите."
  },
  {
    question: "Как очистить данные или кэш?",
    answer: "Перейдите на вкладку «Настройки». Там вы увидите информацию о хранилище, кнопку очистки кэша PWA и кнопку полной очистки всех данных."
  },
  {
    question: "Почему суммы считаются приблизительно?",
    answer: "Банки используют сложные формулы с округлениями, которые не публикуют. Наш трекер даёт оценку с точностью до рублей. Для точных данных смотрите выписку в приложении банка."
  },
  {
    question: "Как связаться с поддержкой?",
    answer: "Напишите нам на почту support@bytewizard.ru или через форму обратной связи на сайте bytewizard.ru."
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