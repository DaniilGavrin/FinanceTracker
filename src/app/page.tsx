"use client";

import { useEffect, useState } from "react";
import { useDatabase } from "@/hooks/useDatabase";
import { deleteAccount, deleteDebt, deleteTransaction } from "@/db";
import { migrateFromIndexedDB } from "@/lib/migration";

import { AddAccountForm } from "@/components/AddAccountForm";
import { AddDebtForm } from "@/components/AddDebtForm";
import { AddTransactionForm } from "@/components/AddTransactionForm";
import { FAQModal } from "@/components/FAQModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BottomNav } from "@/components/layout/BottomNav";

import { HomeView } from "@/components/views/HomeView";
import { AccountsView } from "@/components/views/AccountsView";
import { TransactionsView } from "@/components/views/TransactionsView";
import { SettingsView } from "@/components/views/SettingsView";

type Tab = "home" | "accounts" | "transactions" | "settings";

export default function Home() {
  const { accounts, debts, transactions, isReady, refresh } = useDatabase();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [migrationDone, setMigrationDone] = useState(false);
  
  // Модалки
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'account' | 'debt' | 'transaction'; id: string; name: string } | null>(null);

  // Миграция из IndexedDB (один раз)
  useEffect(() => {
    if (!migrationDone) {
      migrateFromIndexedDB().then((migrated) => {
        if (migrated) {
          refresh();
          alert('Данные успешно перенесены из старой версии приложения');
        }
        setMigrationDone(true);
      }).catch((error) => {
        console.error('Ошибка миграции:', error);
        setMigrationDone(true);
      });
    }
  }, [migrationDone, refresh]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'account') await deleteAccount(deleteTarget.id);
      if (deleteTarget.type === 'debt') await deleteDebt(deleteTarget.id);
      if (deleteTarget.type === 'transaction') await deleteTransaction(deleteTarget.id);
      await refresh(); // Обновляем данные после удаления
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
    setDeleteTarget(null);
  };

  const handleDeleteRequest = (type: 'account' | 'debt' | 'transaction', id: string, name: string) => {
    setDeleteTarget({ type, id, name });
  };

  // Обёртка для обновления данных после добавления
  const handleDataChanged = () => {
    refresh();
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">Инициализация базы данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Глобальная шапка */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Finance Tracker</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFAQ(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors" title="Помощь">
              <span className="text-sm font-bold">?</span>
            </button>
            <button onClick={() => setShowAddTransaction(true)} className="btn-primary px-3 py-1.5 text-xs font-semibold">+ Операция</button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        {activeTab === "home" && <HomeView accounts={accounts} debts={debts} transactions={transactions} />}
        {activeTab === "accounts" && (
          <AccountsView 
            accounts={accounts} 
            debts={debts} 
            onAddAccount={() => setShowAddAccount(true)} 
            onAddDebt={() => setShowAddDebt(true)}
            onDelete={handleDeleteRequest}
          />
        )}
        {activeTab === "transactions" && (
          <TransactionsView 
            transactions={transactions} 
            accounts={accounts} 
            debts={debts} 
            onDelete={(id, name) => handleDeleteRequest('transaction', id, name)} 
          />
        )}
        {activeTab === "settings" && <SettingsView />}
      </main>

      {/* Нижняя навигация */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Глобальные модалки — передаём onDataChanged для обновления */}
      {showAddAccount && <AddAccountForm onClose={() => { setShowAddAccount(false); handleDataChanged(); }} />}
      {showAddDebt && <AddDebtForm onClose={() => { setShowAddDebt(false); handleDataChanged(); }} />}
      {showAddTransaction && <AddTransactionForm onClose={() => { setShowAddTransaction(false); handleDataChanged(); }} />}
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