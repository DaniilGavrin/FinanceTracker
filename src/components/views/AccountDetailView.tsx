"use client";

import { useState, useMemo } from "react";
import { Account, Debt, Transaction, deleteAccount, deleteTransaction } from "@/db";
import { TransactionItem } from "@/components/lists/TransactionItem";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Props {
  account: Account;
  debts: Debt[] | undefined;
  transactions: Transaction[] | undefined;
  allAccounts: Account[] | undefined;
  onBack: () => void;
  onDataChanged: () => void;
}

export function AccountDetailView({
  account,
  debts,
  transactions,
  allAccounts,
  onBack,
  onDataChanged,
}: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTxTarget, setDeleteTxTarget] = useState<{ id: string; name: string } | null>(null);

  // Находим связанный долг (для кредиток и рассрочек)
  const linkedDebt = useMemo(() => {
    if (!account.debtId || !debts) return null;
    return debts.find(d => d.id === account.debtId) || null;
  }, [account.debtId, debts]);

  // Все транзакции по этому счёту
  const accountTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions
      .filter(tx => tx.fromAccountId === account.id || tx.toAccountId === account.id)
      .sort((a, b) => b.date - a.date);
  }, [transactions, account.id]);

  const bankLabel = account.bank === 'sber' ? 'Сбер' : account.bank === 'tbank' ? 'Т-Банк' : account.bank === 'other' ? 'Другой' : '';
  const typeLabel = account.type === 'debit' ? 'Дебетовая карта' :
                    account.type === 'credit' ? 'Кредитная карта' :
                    account.type === 'installment' ? 'Рассрочка' :
                    account.type === 'cash' ? 'Наличные' : account.type;
  const dateLabel = account.openedAt ? new Date(account.openedAt).toLocaleDateString('ru-RU') : '';

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount(account.id);
      onDataChanged();
      onBack();
    } catch (error) {
      console.error("Ошибка удаления счёта:", error);
      alert("Не удалось удалить счёт");
    }
    setShowDeleteDialog(false);
  };

  const handleDeleteTx = async () => {
    if (!deleteTxTarget) return;
    try {
      await deleteTransaction(deleteTxTarget.id);
      onDataChanged();
    } catch (error) {
      console.error("Ошибка удаления транзакции:", error);
    }
    setDeleteTxTarget(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Кастомный header для экрана деталей */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-primary hover:opacity-80 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span className="text-sm font-medium">Назад</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert("Редактирование будет добавлено в следующей версии")}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              title="Редактировать"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
              title="Удалить"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl pb-8">
        {/* Заголовок счёта */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-1">{typeLabel}</p>
          <h1 className="text-2xl font-bold tracking-tight">{account.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {bankLabel && <span>{bankLabel}</span>}
            {bankLabel && dateLabel && <span>•</span>}
            {dateLabel && <span>{dateLabel}</span>}
          </div>
        </div>

        {/* Карточка баланса */}
        <div className="card mb-4">
          <p className="text-sm text-muted-foreground mb-1">
            {account.type === 'credit' || account.type === 'installment' ? 'Доступно' : 'Баланс'}
          </p>
          <p className="text-3xl font-bold font-mono">
            ₽ {account.balance.toLocaleString('ru-RU')}
          </p>
          {account.limit !== undefined && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Лимит: ₽ {account.limit.toLocaleString('ru-RU')}
            </p>
          )}
        </div>

        {/* Связанный долг (для кредиток и рассрочек) */}
        {linkedDebt && (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Задолженность</h3>
              <span className="text-xs text-muted-foreground">
                {linkedDebt.type === 'credit_card' ? 'Кредитная карта' : 'Рассрочка'}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Текущий долг</span>
                <span className="font-mono text-lg text-destructive">
                  - ₽ {linkedDebt.currentAmount.toLocaleString('ru-RU')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Общая сумма</span>
                <span className="font-mono text-sm text-muted-foreground">
                  ₽ {linkedDebt.totalAmount.toLocaleString('ru-RU')}
                </span>
              </div>
              {linkedDebt.interestRate !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ставка</span>
                  <span className="font-mono text-sm">
                    {linkedDebt.interestRate}% годовых
                  </span>
                </div>
              )}
              {linkedDebt.startDate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Дата открытия</span>
                  <span className="text-sm">
                    {new Date(linkedDebt.startDate).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* История операций */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">
              История операций ({accountTransactions.length})
            </h3>
          </div>
          
          {accountTransactions.length > 0 ? (
            <div className="space-y-3">
              {accountTransactions.map(tx => (
                <TransactionItem
                  key={tx.id}
                  tx={tx}
                  accounts={allAccounts}
                  debts={debts}
                  onDelete={(id, name) => setDeleteTxTarget({ id, name })}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center py-8">
              <p className="text-muted-foreground text-sm">Операций по этому счёту пока нет</p>
            </div>
          )}
        </div>
      </main>

      {/* Модалка подтверждения удаления счёта */}
      {showDeleteDialog && (
        <ConfirmDialog
          title="Удалить счёт?"
          message={`Счёт "${account.name}" и все связанные операции будут удалены безвозвратно. Это действие нельзя отменить.`}
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}

      {/* Модалка подтверждения удаления транзакции */}
      {deleteTxTarget && (
        <ConfirmDialog
          title="Удалить операцию?"
          message={`Операция "${deleteTxTarget.name}" будет удалена, а балансы счетов пересчитаны. Это действие нельзя отменить.`}
          onConfirm={handleDeleteTx}
          onCancel={() => setDeleteTxTarget(null)}
        />
      )}
    </div>
  );
}