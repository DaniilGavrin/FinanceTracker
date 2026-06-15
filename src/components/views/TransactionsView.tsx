"use client";
import { useState } from "react";
import { Transaction, Account, Debt } from "@/db";
import { TransactionItem } from "@/components/lists/TransactionItem";

interface Props {
  transactions: Transaction[] | undefined;
  accounts: Account[] | undefined;
  debts: Debt[] | undefined;
  onDelete: (id: string, name: string) => void;
}

const PAGE_SIZE = 20;

export function TransactionsView({ transactions, accounts, debts, onDelete }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visibleTransactions = transactions?.slice(0, visibleCount) || [];
  const hasMore = transactions && transactions.length > visibleCount;

  return (
    <div className="space-y-3 pb-20">
      {transactions && transactions.length > 0 ? (
        <>
          {visibleTransactions.map(tx => (
            <TransactionItem 
              key={tx.id} 
              tx={tx} 
              accounts={accounts} 
              debts={debts} 
              onDelete={onDelete} 
            />
          ))}
          {hasMore && (
            <button
              onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
              className="w-full py-3 text-sm text-primary hover:underline font-medium"
            >
              Показать ещё ({transactions.length - visibleCount} осталось)
            </button>
          )}
        </>
      ) : (
        <p className="text-muted-foreground text-sm text-center py-8 card">Операций пока нет</p>
      )}
    </div>
  );
}