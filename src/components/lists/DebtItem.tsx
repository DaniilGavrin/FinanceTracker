import { Debt } from "@/db";

interface Props {
  debt: Debt;
  onSelect: (id: string) => void;
}

export function DebtItem({ debt, onSelect }: Props) {
  const bankLabel = debt.bank === 'sber' ? 'Сбер' : debt.bank === 'tbank' ? 'Т-Банк' : debt.bank === 'person' ? 'Физлицо' : debt.bank === 'other' ? 'Другой' : '';
  const dateLabel = debt.startDate ? new Date(debt.startDate).toLocaleDateString('ru-RU') : '';

  return (
    <button
      onClick={() => onSelect(debt.id)}
      className="card flex justify-between items-center text-left w-full hover:bg-secondary/30 active:scale-[0.99] transition-all"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{debt.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {debt.type === 'bank_loan' ? 'Кредит' : debt.type === 'person' ? 'Долг физлицу' : debt.type === 'installment' ? 'Рассрочка' : 'Кредитка'}
          {bankLabel && ` • ${bankLabel}`}
          {dateLabel && ` • ${dateLabel}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="font-mono text-lg text-destructive">
          - ₽ {debt.currentAmount.toLocaleString('ru-RU')}
        </p>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    </button>
  );
}