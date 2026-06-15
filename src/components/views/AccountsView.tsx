"use client";
import { useState } from "react";
import { Account, Debt } from "@/db";
import { AccountItem } from "@/components/lists/AccountItem";
import { DebtItem } from "@/components/lists/DebtItem";

interface Props {
  accounts: Account[] | undefined;
  debts: Debt[] | undefined;
  onAddAccount: () => void;
  onAddDebt: () => void;
  onDelete: (type: 'account' | 'debt', id: string, name: string) => void;
}

export function AccountsView({ accounts, debts, onAddAccount, onAddDebt, onDelete }: Props) {
  return (
    <div className="space-y-6 pb-20">
      {/* Счета */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Счета ({accounts?.length || 0})</h2>
          <button onClick={onAddAccount} className="text-sm text-primary hover:underline">+ Добавить</button>
        </div>
        <div className="space-y-3">
          {accounts && accounts.length > 0 ? (
            accounts.map(acc => <AccountItem key={acc.id} account={acc} onDelete={(id, name) => onDelete('account', id, name)} />)
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4 card">Нет счетов. Добавь первый!</p>
          )}
        </div>
      </section>

      {/* Долги */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Обязательства ({debts?.length || 0})</h2>
          <button onClick={onAddDebt} className="text-sm text-primary hover:underline">+ Добавить</button>
        </div>
        <div className="space-y-3">
          {debts && debts.length > 0 ? (
            debts.map(debt => <DebtItem key={debt.id} debt={debt} onDelete={(id, name) => onDelete('debt', id, name)} />)
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4 card">Долгов нет. Так держать!</p>
          )}
        </div>
      </section>
    </div>
  );
}