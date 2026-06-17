import { Account } from "@/db";

interface Props {
  account: Account;
  onSelect: (id: string) => void;
}

export function AccountItem({ account, onSelect }: Props) {
  const bankLabel = account.bank === 'sber' ? 'Сбер' : account.bank === 'tbank' ? 'Т-Банк' : account.bank === 'other' ? 'Другой' : '';
  const dateLabel = account.openedAt ? new Date(account.openedAt).toLocaleDateString('ru-RU') : '';

  return (
    <button
      onClick={() => onSelect(account.id)}
      className="card flex justify-between items-center text-left w-full hover:bg-secondary/30 active:scale-[0.99] transition-all"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{account.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {account.type === 'debit' ? 'Дебетовая' : 
           account.type === 'credit' ? 'Кредитная' : 
           account.type === 'installment' ? 'Рассрочка' : 
           account.type === 'cash' ? 'Наличные' : account.type}
          {bankLabel && ` • ${bankLabel}`}
          {dateLabel && ` • ${dateLabel}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-mono text-lg">₽ {account.balance.toLocaleString('ru-RU')}</p>
          {account.limit !== undefined && (
            <p className="text-[10px] text-muted-foreground font-mono">
              из ₽ {account.limit.toLocaleString('ru-RU')}
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