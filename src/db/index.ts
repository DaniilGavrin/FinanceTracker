import Dexie, { type EntityTable } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// Типы банков
export type BankType = 'sber' | 'tbank' | 'other' | 'person';

// 1. Типы данных
export interface Account {
  id: string;
  name: string;
  type: 'debit' | 'credit' | 'cash' | 'installment';
  balance: number;
  limit?: number;
  debtId?: string; // Связь с долгом (для кредиток)
  bank?: BankType; // Банк (для кредиток)
  openedAt?: number; // Дата открытия
  updatedAt: number;
  synced: boolean;
}

export interface Debt {
  id: string;
  name: string;
  type: 'bank_loan' | 'person' | 'installment' | 'credit_card';
  totalAmount: number;
  currentAmount: number;
  interestRate?: number;
  linkedAccountId?: string; // Связь со счётом (для кредиток)
  bank?: BankType; // Банк
  startDate?: number; // Дата взятия кредита/открытия кредитки
  termMonths?: number; // Срок в месяцах
  updatedAt: number;
  synced: boolean;
}

export type TransactionType = 
  | 'income' 
  | 'expense' 
  | 'transfer' 
  | 'debt_payment' 
  | 'debt_borrow';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fromAccountId?: string;
  toAccountId?: string;
  debtId?: string;
  category?: string;
  description?: string;
  date: number;
  createdAt: number;
  synced: boolean;
}

// 2. Инициализация базы
export class FinanceDB extends Dexie {
  accounts!: EntityTable<Account, 'id'>;
  debts!: EntityTable<Debt, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;

  constructor() {
    super('FinanceTrackerDB');
    
    // Версия 3 с новыми полями
    this.version(3).stores({
      accounts: 'id, type, synced, updatedAt, debtId, bank',
      debts: 'id, type, synced, updatedAt, linkedAccountId, bank, startDate',
      transactions: 'id, fromAccountId, toAccountId, debtId, date, type, synced, createdAt'
    }).upgrade(tx => {
      // Миграция с v2 на v3
      return tx.table('accounts').toCollection().modify(acc => {
        acc.bank = acc.bank || undefined;
        acc.openedAt = acc.openedAt || undefined;
      }).then(() => {
        return tx.table('debts').toCollection().modify(debt => {
          debt.bank = debt.bank || undefined;
          debt.startDate = debt.startDate || undefined;
          debt.termMonths = debt.termMonths || undefined;
        });
      });
    });
  }
}

export const db = new FinanceDB();

// 3. Создание счёта (обычного)
export function createAccount(data: Omit<Account, 'id' | 'updatedAt' | 'synced'>) {
  return db.accounts.add({
    ...data,
    id: uuidv4(),
    updatedAt: Date.now(),
    synced: false,
  });
}

// 4. Создание долга (обычного)
export function createDebt(data: Omit<Debt, 'id' | 'updatedAt' | 'synced'>) {
  return db.debts.add({
    ...data,
    id: uuidv4(),
    updatedAt: Date.now(),
    synced: false,
  });
}

// 5. СОЗДАНИЕ КРЕДИТНОЙ КАРТЫ (счёт + долг автоматически)
export async function createCreditCard(params: {
  name: string;
  limit: number;
  bank: BankType;
  openedAt: number;
}): Promise<{ accountId: string; debtId: string }> {
  const accountId = uuidv4();
  const debtId = uuidv4();
  const now = Date.now();

  await db.transaction('rw', db.accounts, db.debts, async () => {
    // Создаём долг (изначально 0)
    await db.debts.add({
      id: debtId,
      name: params.name,
      type: 'credit_card',
      totalAmount: 0,
      currentAmount: 0,
      linkedAccountId: accountId,
      bank: params.bank,
      startDate: params.openedAt,
      updatedAt: now,
      synced: false,
    });

    // Создаём счёт с лимитом
    await db.accounts.add({
      id: accountId,
      name: params.name,
      type: 'credit',
      balance: params.limit, // Доступный лимит
      limit: params.limit,
      debtId: debtId,
      bank: params.bank,
      openedAt: params.openedAt,
      updatedAt: now,
      synced: false,
    });
  });

  return { accountId, debtId };
}

// 6. Создание транзакции с эффектами (без изменений)
export async function createTransactionWithEffects(
  txData: Omit<Transaction, 'id' | 'createdAt' | 'synced'>
): Promise<string> {
  const txId = uuidv4();
  const now = Date.now();

  const transaction: Transaction = {
    ...txData,
    id: txId,
    createdAt: now,
    synced: false,
  };

  await db.transaction('rw', db.accounts, db.debts, db.transactions, async () => {
    await db.transactions.add(transaction);

    switch (txData.type) {
      case 'expense': {
        if (txData.fromAccountId) {
          const acc = await db.accounts.get(txData.fromAccountId);
          if (acc) {
            acc.balance -= txData.amount;
            acc.updatedAt = now;
            await db.accounts.put(acc);
            
            if (acc.type === 'credit' && acc.debtId) {
              const debt = await db.debts.get(acc.debtId);
              if (debt) {
                debt.currentAmount += txData.amount;
                debt.totalAmount = Math.max(debt.totalAmount, debt.currentAmount);
                debt.updatedAt = now;
                await db.debts.put(debt);
              }
            }
          }
        }
        break;
      }

      case 'income': {
        if (txData.toAccountId) {
          const acc = await db.accounts.get(txData.toAccountId);
          if (acc) {
            acc.balance += txData.amount;
            acc.updatedAt = now;
            await db.accounts.put(acc);
          }
        }
        break;
      }

      case 'transfer': {
        if (txData.fromAccountId && txData.toAccountId) {
          const fromAcc = await db.accounts.get(txData.fromAccountId);
          const toAcc = await db.accounts.get(txData.toAccountId);
          
          if (fromAcc && toAcc) {
            fromAcc.balance -= txData.amount;
            fromAcc.updatedAt = now;
            await db.accounts.put(fromAcc);
            
            toAcc.balance += txData.amount;
            toAcc.updatedAt = now;
            await db.accounts.put(toAcc);
          }
        }
        break;
      }

      case 'debt_payment': {
        if (txData.debtId) {
          const debt = await db.debts.get(txData.debtId);
          if (debt) {
            debt.currentAmount = Math.max(0, debt.currentAmount - txData.amount);
            debt.updatedAt = now;
            await db.debts.put(debt);
            
            if (debt.linkedAccountId) {
              const acc = await db.accounts.get(debt.linkedAccountId);
              if (acc) {
                acc.balance = Math.min(acc.limit || 0, acc.balance + txData.amount);
                acc.updatedAt = now;
                await db.accounts.put(acc);
              }
            }
          }
        }
        if (txData.fromAccountId) {
          const acc = await db.accounts.get(txData.fromAccountId);
          if (acc) {
            acc.balance -= txData.amount;
            acc.updatedAt = now;
            await db.accounts.put(acc);
          }
        }
        break;
      }

      case 'debt_borrow': {
        if (txData.debtId) {
          const debt = await db.debts.get(txData.debtId);
          if (debt) {
            debt.currentAmount += txData.amount;
            debt.totalAmount = Math.max(debt.totalAmount, debt.currentAmount);
            debt.updatedAt = now;
            await db.debts.put(debt);
            
            if (debt.linkedAccountId) {
              const acc = await db.accounts.get(debt.linkedAccountId);
              if (acc) {
                acc.balance = Math.max(-(acc.limit || 0), acc.balance - txData.amount);
                acc.updatedAt = now;
                await db.accounts.put(acc);
              }
            }
          }
        }
        if (txData.toAccountId) {
          const acc = await db.accounts.get(txData.toAccountId);
          if (acc) {
            acc.balance += txData.amount;
            acc.updatedAt = now;
            await db.accounts.put(acc);
          }
        }
        break;
      }
    }
  });

  return txId;
}

// 7. Связь кредитки с долгом (если нужно вручную)
export async function linkCreditCardToDebt(accountId: string, debtId: string) {
  await db.transaction('rw', db.accounts, db.debts, async () => {
    const acc = await db.accounts.get(accountId);
    const debt = await db.debts.get(debtId);
    
    if (acc && debt) {
      acc.debtId = debtId;
      debt.linkedAccountId = accountId;
      await db.accounts.put(acc);
      await db.debts.put(debt);
    }
  });
}