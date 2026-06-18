import { Debt } from "@/db";
import { calculateTotalPayments } from "@/db";

interface Props {
  debt: Debt;
  onSelect: (id: string) => void;
}

export function DebtItem({ debt, onSelect }: Props) {
  const bankLabel = debt.bank === 'sber' ? 'Сбер' : debt.bank === 'tbank' ? 'Т-Банк' : debt.bank === 'person' ? 'Физлицо' : debt.bank === 'other' ? 'Другой' : '';
  const dateLabel = debt.startDate ? new Date(debt.startDate).toLocaleDateString('ru-RU') : '';
  
  // Для кредитов показываем общую сумму выплат, для остальных — текущий остаток
  const displayAmount = debt.type === 'bank_loan' ? calculateTotalPayments(debt) : debt.currentAmount;
  
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
        <div className="text-right">
          <p className="font-mono text-lg text-destructive">
            - ₽ {displayAmount.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
          </p>
          {debt.type === 'bank_loan' && debt.totalAmount !== debt.currentAmount && debt.currentAmount > 0 && (
            <p className="text-[10px] text-muted-foreground font-mono">
              остаток: ₽ {debt.currentAmount.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
            </p>
          )}
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    </button>
  );
}