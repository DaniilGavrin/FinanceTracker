import { Transaction, Account, Debt } from "@/db";
import { getCategoryById } from "@/lib/categories";

interface Props {
  tx: Transaction;
  accounts: Account[] | undefined;
  debts: Debt[] | undefined;
  onDelete: (id: string, name: string) => void;
}

export function TransactionItem({ tx, accounts, debts, onDelete }: Props) {
  const fromAcc = accounts?.find(a => a.id === tx.fromAccountId);
  const toAcc = accounts?.find(a => a.id === tx.toAccountId);
  const debt = debts?.find(d => d.id === tx.debtId);
  const category = tx.categoryId ? getCategoryById(tx.categoryId) : null;

  let title = tx.description || category?.name || 'Без описания';
  let subtitle = '';
  let amountPrefix = '';
  let amountColor = '';

  switch (tx.type) {
    case 'expense':
      amountPrefix = '-'; amountColor = 'text-destructive';
      subtitle = fromAcc ? `с ${fromAcc.name}` : 'Расход';
      break;
    case 'income':
      amountPrefix = '+'; amountColor = 'text-accent';
      subtitle = toAcc ? `на ${toAcc.name}` : 'Доход';
      break;
    case 'transfer':
      amountPrefix = '↔'; amountColor = 'text-primary';
      subtitle = fromAcc && toAcc ? `${fromAcc.name} → ${toAcc.name}` : 'Перевод';
      break;
    case 'debt_payment':
      amountPrefix = '-'; amountColor = 'text-accent';
      subtitle = debt ? `гашение: ${debt.name}` : 'Платёж по долгу';
      break;
    case 'debt_borrow':
      amountPrefix = '+'; amountColor = 'text-destructive';
      subtitle = debt ? `заём: ${debt.name}` : 'Новый долг';
      break;
  }

  return (
    <div className="card flex justify-between items-center group">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl shrink-0">
          {category ? category.icon : '📄'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {subtitle} • {new Date(tx.date).toLocaleDateString('ru-RU')}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className={`font-mono text-lg ${amountColor}`}>
          {amountPrefix} {tx.amount.toLocaleString('ru-RU')} ₽
        </p>
        <button
          onClick={() => onDelete(tx.id, title)}
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