import Dexie, { type EntityTable } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// 1. Типы данных
export interface Account {
  id: string;
  name: string;
  type: 'debit' | 'credit' | 'cash' | 'installment';
  balance: number;
  limit?: number;
  debtId?: string; // Связь с долгом (для кредиток)
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
  linkedAccountId?: string; // Связь со счётом (для кредиток)
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
  fromAccountId?: string;  // Откуда (expense, transfer, debt_payment)
  toAccountId?: string;    // Куда (income, transfer, debt_borrow)
  debtId?: string;         // Какой долг (debt_payment, debt_borrow)
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
    
    this.version(2).stores({
      accounts: 'id, type, synced, updatedAt, debtId',
      debts: 'id, type, synced, updatedAt, linkedAccountId',
      transactions: 'id, fromAccountId, toAccountId, debtId, date, type, synced, createdAt'
    }).upgrade(tx => {
      // Миграция с v1 на v2 — добавляем новые поля
      return tx.table('accounts').toCollection().modify(acc => {
        acc.debtId = acc.debtId || undefined;
      });
    });
  }
}

export const db = new FinanceDB();

// 3. Простые функции создания (для счетов и долгов)
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

// 4. ГЛАВНАЯ ФУНКЦИЯ — создание транзакции с эффектами
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

  // Атомарная транзакция Dexie — всё или ничего
  await db.transaction('rw', db.accounts, db.debts, db.transactions, async () => {
    // 1. Сохраняем саму транзакцию
    await db.transactions.add(transaction);

    // 2. Применяем эффекты в зависимости от типа
    switch (txData.type) {
      case 'expense': {
        if (txData.fromAccountId) {
          const acc = await db.accounts.get(txData.fromAccountId);
          if (acc) {
            acc.balance -= txData.amount;
            acc.updatedAt = now;
            await db.accounts.put(acc);
            
            // Если это кредитка — увеличиваем связанный долг
            if (acc.type === 'credit' && acc.debtId) {
              const debt = await db.debts.get(acc.debtId);
              if (debt) {
                debt.currentAmount += txData.amount;
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
            
            // Если долг связан со счётом (кредитка) — обновляем и счёт
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
        // Опционально списываем со счёта
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
            
            // Если долг связан со счётом — обновляем и счёт
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
        // Опционально зачисляем на счёт
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

// 5. Вспомогательная функция для связи кредитки с долгом
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