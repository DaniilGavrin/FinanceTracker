import { Account } from "@/db";

interface Props {
  account: Account;
  onDelete: (id: string, name: string) => void;
}

export function AccountItem({ account, onDelete }: Props) {
  const bankLabel = account.bank === 'sber' ? 'Сбер' : account.bank === 'tbank' ? 'Т-Банк' : account.bank === 'other' ? 'Другой' : '';
  const dateLabel = account.openedAt ? new Date(account.openedAt).toLocaleDateString('ru-RU') : '';

  return (
    <div className="card flex justify-between items-center group">
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
        <button
          onClick={() => onDelete(account.id, account.name)}
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