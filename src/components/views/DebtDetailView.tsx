"use client";

import { useState, useMemo } from "react";
import { Debt, Transaction, deleteDebt, deleteTransaction } from "@/db";
import { TransactionItem } from "@/components/lists/TransactionItem";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Account } from "@/db";

interface Props {
  debt: Debt;
  transactions: Transaction[] | undefined;
  allAccounts: Account[] | undefined;
  onBack: () => void;
  onDataChanged: () => void;
  onShowSchedule: () => void;
}

export function DebtDetailView({ debt, transactions, allAccounts, onBack, onDataChanged, onShowSchedule }: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTxTarget, setDeleteTxTarget] = useState<{ id: string; name: string } | null>(null);
  
  const monthlyPayment = useMemo(() => {
    if (debt.type !== 'bank_loan' || !debt.termMonths || !debt.interestRate || debt.totalAmount <= 0) return null;
    
    const principal = debt.totalAmount;
    const monthlyRate = debt.interestRate / 100 / 12;
    const months = debt.termMonths;
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(payment * 100) / 100;
  }, [debt]);
  
  const debtTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(tx => tx.debtId === debt.id).sort((a, b) => b.date - a.date);
  }, [transactions, debt.id]);
  
  const bankLabel = debt.bank === 'sber' ? 'Сбер' : debt.bank === 'tbank' ? 'Т-Банк' : debt.bank === 'person' ? 'Физлицо' : debt.bank === 'other' ? 'Другой' : '';
  const typeLabel = debt.type === 'bank_loan' ? 'Кредит' : debt.type === 'person' ? 'Долг физлицу' : debt.type === 'installment' ? 'Рассрочка' : 'Кредитка';
  const dateLabel = debt.startDate ? new Date(debt.startDate).toLocaleDateString('ru-RU') : '';
  
  const handleDeleteDebt = async () => {
    try {
      await deleteDebt(debt.id);
      onDataChanged();
      onBack();
    } catch (error) {
      console.error("Ошибка удаления долга:", error);
      alert("Не удалось удалить долг");
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
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button onClick={onBack} className="flex items-center gap-1 text-primary hover:opacity-80 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span className="text-sm font-medium">Назад</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => alert("Редактирование будет добавлено позже")} className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors" title="Редактировать">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
            <button onClick={() => setShowDeleteDialog(true)} className="w-9 h-9 flex items-center justify-center rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors" title="Удалить">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl pb-8">
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-1">{typeLabel}</p>
          <h1 className="text-2xl font-bold tracking-tight">{debt.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {bankLabel && <span>{bankLabel}</span>}
            {bankLabel && dateLabel && <span>•</span>}
            {dateLabel && <span>{dateLabel}</span>}
          </div>
        </div>
        
        <div className="card mb-4">
          <p className="text-sm text-muted-foreground mb-1">Остаток долга</p>
          <p className="text-3xl font-bold font-mono text-destructive">- ₽ {debt.currentAmount.toLocaleString('ru-RU')}</p>
          {debt.totalAmount !== debt.currentAmount && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">Взято: ₽ {debt.totalAmount.toLocaleString('ru-RU')}</p>
          )}
        </div>
        
        {debt.type === 'bank_loan' && debt.interestRate && debt.termMonths && (
          <button onClick={onShowSchedule} className="card mb-4 w-full text-left hover:bg-secondary/30 active:scale-[0.99] transition-all">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Параметры кредита</h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ставка</span>
                <span className="font-mono text-sm">{debt.interestRate}% годовых</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Срок</span>
                <span className="text-sm">{debt.termMonths} мес.</span>
              </div>
              {debt.paymentType && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Тип платежа</span>
                  <span className="text-sm">{debt.paymentType === 'annuity' ? 'Аннуитетный' : 'Дифференцированный'}</span>
                </div>
              )}
              {(debt.monthlyPayment || monthlyPayment) && (
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm font-medium">Ежемесячный платёж</span>
                  <span className="font-mono text-lg font-bold text-primary">≈ ₽ {(debt.monthlyPayment || monthlyPayment || 0).toLocaleString('ru-RU')}</span>
                </div>
              )}
              {debt.nextPaymentDate && (
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Следующий платёж</span>
                  <span className={`text-sm font-medium ${debt.nextPaymentDate < Date.now() + 7 * 24 * 60 * 60 * 1000 ? 'text-destructive' : debt.nextPaymentDate < Date.now() + 30 * 24 * 60 * 60 * 1000 ? 'text-yellow-500' : 'text-foreground'}`}>
                    {new Date(debt.nextPaymentDate).toLocaleDateString('ru-RU')}
                    {debt.nextPaymentDate < Date.now() && ' ⚠️ ПРОСРОЧЕНО'}
                  </span>
                </div>
              )}
            </div>
          </button>
        )}
        
        {debt.type !== 'bank_loan' && (
          <div className="card mb-4">
            <h3 className="font-semibold text-sm mb-3">Параметры</h3>
            <div className="space-y-2">
              {debt.interestRate !== undefined && <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Ставка</span><span className="font-mono text-sm">{debt.interestRate}%</span></div>}
              {debt.termMonths && <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Срок</span><span className="text-sm">{debt.termMonths} мес.</span></div>}
            </div>
          </div>
        )}
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">История операций ({debtTransactions.length})</h3>
          </div>
          {debtTransactions.length > 0 ? (
            <div className="space-y-3">
              {debtTransactions.map(tx => (
                <TransactionItem key={tx.id} tx={tx} accounts={allAccounts} debts={undefined} onDelete={(id, name) => setDeleteTxTarget({ id, name })} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-8"><p className="text-muted-foreground text-sm">Операций по этому долгу пока нет</p></div>
          )}
        </div>
      </main>
      
      {showDeleteDialog && (<ConfirmDialog title="Удалить долг?" message={`Долг "${debt.name}" и все связанные операции будут удалены безвозвратно.`} onConfirm={handleDeleteDebt} onCancel={() => setShowDeleteDialog(false)} />)}
      {deleteTxTarget && (<ConfirmDialog title="Удалить операцию?" message={`Операция "${deleteTxTarget.name}" будет удалена, а долг пересчитан.`} onConfirm={handleDeleteTx} onCancel={() => setDeleteTxTarget(null)} />)}
    </div>
  );
}