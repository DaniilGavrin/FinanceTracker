"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, deleteAccount, deleteDebt, deleteTransaction } from "@/db";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { AddAccountForm } from "@/components/AddAccountForm";
import { AddDebtForm } from "@/components/AddDebtForm";
import { AddTransactionForm } from "@/components/AddTransactionForm";
import { FAQModal } from "@/components/FAQModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function Home() {
  const isOnline = useOnlineStatus();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'account' | 'debt' | 'transaction';
    id: string;
    name: string;
  } | null>(null);

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const debts = useLiveQuery(() => db.debts.toArray(), []);
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().limit(5).toArray(), []);

  // Правильный расчет метрик
  const debitAccounts = accounts?.filter(a => a.type === 'debit' || a.type === 'cash') || [];
  const creditAccounts = accounts?.filter(a => a.type === 'credit') || [];
    
  const totalBalance = debitAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalCreditLimit = creditAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalDebt = debts?.reduce((sum, d) => sum + d.currentAmount, 0) || 0;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      switch (deleteTarget.type) {
        case 'account':
          await deleteAccount(deleteTarget.id);
          break;
        case 'debt':
          await deleteDebt(deleteTarget.id);
          break;
        case 'transaction':
          await deleteTransaction(deleteTarget.id);
          break;
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
    
    setDeleteTarget(null);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Шапка */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Finance Tracker</h1>
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => setShowFAQ(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            title="Помощь"
          >
            <span className="text-sm font-bold">?</span>
          </button>
          <button
            onClick={() => setShowAddTransaction(true)}
            className="btn-primary px-3 py-1 text-sm"
          >
            + Операция
          </button>
        </div>
      </header>

      {/* Быстрая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-muted-foreground">Свободные средства</p>
          <p className="text-2xl font-bold text-accent mt-1">
            ₽ {totalBalance.toLocaleString('ru-RU')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Дебетовые карты и наличные
          </p>
        </div>
        
        <div className="card">
          <p className="text-sm text-muted-foreground">Доступный лимит</p>
          <p className="text-2xl font-bold text-primary mt-1">
            ₽ {totalCreditLimit.toLocaleString('ru-RU')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Кредитные карты (деньги банка)
          </p>
        </div>
        
        <div className="card">
          <p className="text-sm text-muted-foreground">Общий долг</p>
          <p className="text-2xl font-bold text-destructive mt-1">
            ₽ {totalDebt.toLocaleString('ru-RU')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Все обязательства
          </p>
        </div>
      </div>

      {/* Список счетов */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Счета ({accounts?.length || 0})</h2>
          <button
            onClick={() => setShowAddAccount(true)}
            className="text-sm text-primary hover:underline"
          >
            + Добавить
          </button>
        </div>
        <div className="space-y-3">
          {accounts && accounts.length > 0 ? (
            accounts.map((acc) => {
              const bankLabel = acc.bank === 'sber' ? 'Сбер' : acc.bank === 'tbank' ? 'Т-Банк' : acc.bank === 'other' ? 'Другой' : '';
              const dateLabel = acc.openedAt ? new Date(acc.openedAt).toLocaleDateString('ru-RU') : '';
              
              return (
                <div key={acc.id} className="card flex justify-between items-center group">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{acc.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {acc.type === 'debit' ? 'Дебетовая' : acc.type === 'credit' ? 'Кредитная' : acc.type === 'cash' ? 'Наличные' : acc.type}
                      {bankLabel && ` • ${bankLabel}`}
                      {dateLabel && ` • ${dateLabel}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-lg">₽ {acc.balance.toLocaleString('ru-RU')}</p>
                    <button
                      onClick={() => setDeleteTarget({ type: 'account', id: acc.id, name: acc.name })}
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
            })
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">Нет счетов. Добавь первый!</p>
          )}
        </div>
      </section>

      {/* Список долгов */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Обязательства ({debts?.length || 0})</h2>
          <button
            onClick={() => setShowAddDebt(true)}
            className="text-sm text-primary hover:underline"
          >
            + Добавить
          </button>
        </div>
        <div className="space-y-3">
          {debts && debts.length > 0 ? (
            debts.map((debt) => {
              const bankLabel = debt.bank === 'sber' ? 'Сбер' : debt.bank === 'tbank' ? 'Т-Банк' : debt.bank === 'person' ? 'Физлицо' : debt.bank === 'other' ? 'Другой' : '';
              const dateLabel = debt.startDate ? new Date(debt.startDate).toLocaleDateString('ru-RU') : '';
              
              return (
                <div key={debt.id} className="card flex justify-between items-center group">
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
                      onClick={() => setDeleteTarget({ type: 'debt', id: debt.id, name: debt.name })}
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
            })
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">Долгов нет. Так держать!</p>
          )}
        </div>
      </section>

      {/* Последние транзакции */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Последние операции</h2>
        <div className="space-y-3">
          {transactions && transactions.length > 0 ? (
            transactions.map((tx) => {
              const fromAcc = accounts?.find(a => a.id === tx.fromAccountId);
              const toAcc = accounts?.find(a => a.id === tx.toAccountId);
              const debt = debts?.find(d => d.id === tx.debtId);

              let title = tx.description || 'Без описания';
              let subtitle = '';
              let amountPrefix = '';
              let amountColor = '';

              switch (tx.type) {
                case 'expense':
                  amountPrefix = '-';
                  amountColor = 'text-destructive';
                  subtitle = fromAcc ? `с ${fromAcc.name}` : 'Расход';
                  break;
                case 'income':
                  amountPrefix = '+';
                  amountColor = 'text-accent';
                  subtitle = toAcc ? `на ${toAcc.name}` : 'Доход';
                  break;
                case 'transfer':
                  amountPrefix = '↔';
                  amountColor = 'text-primary';
                  subtitle = fromAcc && toAcc ? `${fromAcc.name} → ${toAcc.name}` : 'Перевод';
                  break;
                case 'debt_payment':
                  amountPrefix = '-';
                  amountColor = 'text-accent';
                  subtitle = debt ? `гашение: ${debt.name}` : 'Платёж по долгу';
                  break;
                case 'debt_borrow':
                  amountPrefix = '+';
                  amountColor = 'text-destructive';
                  subtitle = debt ? `заём: ${debt.name}` : 'Новый долг';
                  break;
              }

              return (
                <div key={tx.id} className="card flex justify-between items-center group">
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
                      onClick={() => setDeleteTarget({ 
                        type: 'transaction', 
                        id: tx.id, 
                        name: title 
                      })}
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
            })
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">Операций пока нет</p>
          )}
        </div>
      </section>

      {/* Модальные окна */}
      {showAddAccount && <AddAccountForm onClose={() => setShowAddAccount(false)} />}
      {showAddDebt && <AddDebtForm onClose={() => setShowAddDebt(false)} />}
      {showAddTransaction && <AddTransactionForm onClose={() => setShowAddTransaction(false)} />}
      {showFAQ && <FAQModal onClose={() => setShowFAQ(false)} />}
      {deleteTarget && (
        <ConfirmDialog
          title="Удалить запись?"
          message={`Вы уверены, что хотите удалить "${deleteTarget.name}"? Это действие нельзя отменить.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}