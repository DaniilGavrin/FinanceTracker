"use client";

import { useState, useEffect, useCallback } from "react";
import { getDatabase, Account, Debt, Transaction } from "@/lib/database";

export function useDatabase() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const db = getDatabase();

  // Загрузка всех данных
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [accs, dts, txs] = await Promise.all([
        db.getAccounts(),
        db.getDebts(),
        db.getTransactions(),
      ]);
      setAccounts(accs);
      setDebts(dts);
      setTransactions(txs);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Инициализация при монтировании
  useEffect(() => {
    const init = async () => {
      try {
        await db.init();
        await refresh();
        setIsReady(true);
      } catch (error) {
        console.error("Ошибка инициализации БД:", error);
        setIsReady(true); // Всё равно показываем UI, чтобы видеть ошибки
      }
    };
    init();
  }, []);

  return {
    accounts,
    debts,
    transactions,
    isReady,
    isLoading,
    refresh,
  };
}