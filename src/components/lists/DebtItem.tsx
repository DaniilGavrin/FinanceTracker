import { Debt } from "@/db";

interface Props {
  debt: Debt;
  onDelete: (id: string, name: string) => void;
}

export function DebtItem({ debt, onDelete }: Props) {
  const bankLabel = debt.bank === 'sber' ? 'Сбер' : debt.bank === 'tbank' ? 'Т-Банк' : debt.bank === 'person' ? 'Физлицо' : debt.bank === 'other' ? 'Другой' : '';
  const dateLabel = debt.startDate ? new Date(debt.startDate).toLocaleDateString('ru-RU') : '';

  return (
    <div className="card flex justify-between items-center group">
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
        <button
          onClick={() => onDelete(debt.id, debt.name)}
          className="text-destructive hover:text-destructive/80 transition-opacity md:opacity-0 md:group-hover:opacity-100"
          title="Удалить"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}