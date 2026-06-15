import Dexie, { type EntityTable } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// 1. Типы данных (Интерфейсы)
export interface Account {
  id: string;
  name: string;
  type: 'debit' | 'credit' | 'cash' | 'installment';
  balance: number;
  limit?: number;
  updatedAt: number;
  synced: boolean;
}

export interface Debt {
  id: string;
  name: string;
  type: 'bank_loan' | 'person' | 'installment';
  totalAmount: number;
  currentAmount: number;
  interestRate?: number;
  updatedAt: number;
  synced: boolean;
}

export interface Transaction {
  id: string;
  accountId?: string;
  debtId?: string;
  amount: number;
  category?: string;
  description?: string;
  date: number; // Timestamp
  type: 'income' | 'expense' | 'transfer' | 'debt_payment';
  createdAt: number;
  synced: boolean;
}

// 2. Инициализация базы данных
export class FinanceDB extends Dexie {
  accounts!: EntityTable<Account, 'id'>;
  debts!: EntityTable<Debt, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;

  constructor() {
    super('FinanceTrackerDB');
    
    // Определяем таблицы и индексы
    this.version(1).stores({
      accounts: 'id, type, synced, updatedAt',
      debts: 'id, type, synced, updatedAt',
      transactions: 'id, accountId, debtId, date, type, synced, createdAt'
    });
  }
}

// Экспортируем инстанс базы
export const db = new FinanceDB();

// 3. Вспомогательные функции для быстрого создания записей
export function createAccount(data: Omit<Account, 'id' | 'updatedAt' | 'synced'>) {
  return db.accounts.add({
    ...data,
    id: uuidv4(),
    updatedAt: Date.now(),
    synced: false,
  });
}

export function createDebt(data: Omit<Debt, 'id' | 'updatedAt' | 'synced'>) {
  return db.debts.add({
    ...data,
    id: uuidv4(),
    updatedAt: Date.now(),
    synced: false,
  });
}

export function createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'synced'>) {
  return db.transactions.add({
    ...data,
    id: uuidv4(),
    createdAt: Date.now(),
    synced: false,
  });
}