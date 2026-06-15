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
  debtId?: string;
  bank?: BankType;
  openedAt?: number;
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
  linkedAccountId?: string;
  bank?: BankType;
  startDate?: number;
  termMonths?: number;
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
    
    this.version(3).stores({
      accounts: 'id, type, synced, updatedAt, debtId, bank',
      debts: 'id, type, synced, updatedAt, linkedAccountId, bank, startDate',
      transactions: 'id, fromAccountId, toAccountId, debtId, date, type, synced, createdAt'
    }).upgrade(tx => {
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

// ==========================================
// БАЗОВЫЕ ФУНКЦИИ СОЗДАНИЯ
// ==========================================

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

    await db.accounts.add({
      id: accountId,
      name: params.name,
      type: 'credit',
      balance: params.limit,
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

// ==========================================
// ПРИМЕНЕНИЕ И ОТМЕНА ЭФФЕКТОВ (ОДНА ФУНКЦИЯ ДЛЯ ВСЕХ)
// ==========================================

// Применяет эффекты транзакции к балансам
async function applyTransactionEffects(tx: Transaction) {
  const now = Date.now();
  
  switch (tx.type) {
    case 'expense': {
      if (tx.fromAccountId) {
        const acc = await db.accounts.get(tx.fromAccountId);
        if (acc) {
          acc.balance -= tx.amount;
          acc.updatedAt = now;
          await db.accounts.put(acc);
          
          if (acc.type === 'credit' && acc.debtId) {
            const debt = await db.debts.get(acc.debtId);
            if (debt) {
              debt.currentAmount += tx.amount;
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
      if (tx.toAccountId) {
        const acc = await db.accounts.get(tx.toAccountId);
        if (acc) {
          acc.balance += tx.amount;
          acc.updatedAt = now;
          await db.accounts.put(acc);
        }
      }
      break;
    }
    case 'transfer': {
      if (tx.fromAccountId && tx.toAccountId) {
        const fromAcc = await db.accounts.get(tx.fromAccountId);
        const toAcc = await db.accounts.get(tx.toAccountId);
        
        if (fromAcc && toAcc) {
          fromAcc.balance -= tx.amount;
          fromAcc.updatedAt = now;
          await db.accounts.put(fromAcc);
          
          toAcc.balance += tx.amount;
          toAcc.updatedAt = now;
          await db.accounts.put(toAcc);
        }
      }
      break;
    }
    case 'debt_payment': {
      if (tx.debtId) {
        const debt = await db.debts.get(tx.debtId);
        if (debt) {
          debt.currentAmount = Math.max(0, debt.currentAmount - tx.amount);
          debt.updatedAt = now;
          await db.debts.put(debt);
          
          if (debt.linkedAccountId) {
            const acc = await db.accounts.get(debt.linkedAccountId);
            if (acc) {
              acc.balance = Math.min(acc.limit || 0, acc.balance + tx.amount);
              acc.updatedAt = now;
              await db.accounts.put(acc);
            }
          }
        }
      }
      if (tx.fromAccountId) {
        const acc = await db.accounts.get(tx.fromAccountId);
        if (acc) {
          acc.balance -= tx.amount;
          acc.updatedAt = now;
          await db.accounts.put(acc);
        }
      }
      break;
    }
    case 'debt_borrow': {
      if (tx.debtId) {
        const debt = await db.debts.get(tx.debtId);
        if (debt) {
          debt.currentAmount += tx.amount;
          debt.totalAmount = Math.max(debt.totalAmount, debt.currentAmount);
          debt.updatedAt = now;
          await db.debts.put(debt);
          
          if (debt.linkedAccountId) {
            const acc = await db.accounts.get(debt.linkedAccountId);
            if (acc) {
              acc.balance = Math.max(-(acc.limit || 0), acc.balance - tx.amount);
              acc.updatedAt = now;
              await db.accounts.put(acc);
            }
          }
        }
      }
      if (tx.toAccountId) {
        const acc = await db.accounts.get(tx.toAccountId);
        if (acc) {
          acc.balance += tx.amount;
          acc.updatedAt = now;
          await db.accounts.put(acc);
        }
      }
      break;
    }
  }
}

// Отменяет эффекты транзакции (обратная операция)
async function reverseTransactionEffects(tx: Transaction) {
  const now = Date.now();
  
  switch (tx.type) {
    case 'expense': {
      if (tx.fromAccountId) {
        const acc = await db.accounts.get(tx.fromAccountId);
        if (acc) {
          acc.balance += tx.amount; // Возвращаем
          acc.updatedAt = now;
          await db.accounts.put(acc);
          
          if (acc.type === 'credit' && acc.debtId) {
            const debt = await db.debts.get(acc.debtId);
            if (debt) {
              debt.currentAmount = Math.max(0, debt.currentAmount - tx.amount);
              debt.updatedAt = now;
              await db.debts.put(debt);
            }
          }
        }
      }
      break;
    }
    case 'income': {
      if (tx.toAccountId) {
        const acc = await db.accounts.get(tx.toAccountId);
        if (acc) {
          acc.balance -= tx.amount; // Забираем
          acc.updatedAt = now;
          await db.accounts.put(acc);
        }
      }
      break;
    }
    case 'transfer': {
      if (tx.fromAccountId && tx.toAccountId) {
        const fromAcc = await db.accounts.get(tx.fromAccountId);
        const toAcc = await db.accounts.get(tx.toAccountId);
        
        if (fromAcc && toAcc) {
          fromAcc.balance += tx.amount;
          fromAcc.updatedAt = now;
          await db.accounts.put(fromAcc);
          
          toAcc.balance -= tx.amount;
          toAcc.updatedAt = now;
          await db.accounts.put(toAcc);
        }
      }
      break;
    }
    case 'debt_payment': {
      if (tx.debtId) {
        const debt = await db.debts.get(tx.debtId);
        if (debt) {
          debt.currentAmount += tx.amount; // Возвращаем долг
          debt.updatedAt = now;
          await db.debts.put(debt);
          
          if (debt.linkedAccountId) {
            const acc = await db.accounts.get(debt.linkedAccountId);
            if (acc) {
              acc.balance = Math.max(-(acc.limit || 0), acc.balance - tx.amount);
              acc.updatedAt = now;
              await db.accounts.put(acc);
            }
          }
        }
      }
      if (tx.fromAccountId) {
        const acc = await db.accounts.get(tx.fromAccountId);
        if (acc) {
          acc.balance += tx.amount;
          acc.updatedAt = now;
          await db.accounts.put(acc);
        }
      }
      break;
    }
    case 'debt_borrow': {
      if (tx.debtId) {
        const debt = await db.debts.get(tx.debtId);
        if (debt) {
          debt.currentAmount = Math.max(0, debt.currentAmount - tx.amount);
          debt.updatedAt = now;
          await db.debts.put(debt);
          
          if (debt.linkedAccountId) {
            const acc = await db.accounts.get(debt.linkedAccountId);
            if (acc) {
              acc.balance = Math.min(acc.limit || 0, acc.balance + tx.amount);
              acc.updatedAt = now;
              await db.accounts.put(acc);
            }
          }
        }
      }
      if (tx.toAccountId) {
        const acc = await db.accounts.get(tx.toAccountId);
        if (acc) {
          acc.balance -= tx.amount;
          acc.updatedAt = now;
          await db.accounts.put(acc);
        }
      }
      break;
    }
  }
}

// ==========================================
// СОЗДАНИЕ ТРАНЗАКЦИИ С ЭФФЕКТАМИ
// ==========================================

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
    await applyTransactionEffects(transaction); // Используем общую функцию
  });

  return txId;
}

// ==========================================
// РЕДАКТИРОВАНИЕ И УДАЛЕНИЕ
// ==========================================

export async function updateAccount(id: string, data: Partial<Omit<Account, 'id' | 'updatedAt' | 'synced'>>) {
  await db.accounts.update(id, {
    ...data,
    updatedAt: Date.now(),
    synced: false,
  });
}

export async function deleteAccount(id: string) {
  await db.transaction('rw', db.accounts, db.transactions, async () => {
    await db.transactions.where('fromAccountId').equals(id).delete();
    await db.transactions.where('toAccountId').equals(id).delete();
    await db.accounts.delete(id);
  });
}

export async function updateDebt(id: string, data: Partial<Omit<Debt, 'id' | 'updatedAt' | 'synced'>>) {
  await db.debts.update(id, {
    ...data,
    updatedAt: Date.now(),
    synced: false,
  });
}

export async function deleteDebt(id: string) {
  await db.transaction('rw', db.debts, db.transactions, db.accounts, async () => {
    await db.transactions.where('debtId').equals(id).delete();
    
    const debt = await db.debts.get(id);
    if (debt?.linkedAccountId) {
      const acc = await db.accounts.get(debt.linkedAccountId);
      if (acc) {
        acc.debtId = undefined;
        await db.accounts.put(acc);
      }
    }
    
    await db.debts.delete(id);
  });
}

export async function updateTransaction(id: string, newData: Partial<Omit<Transaction, 'id' | 'createdAt' | 'synced'>>) {
  const oldTx = await db.transactions.get(id);
  if (!oldTx) return;

  await db.transaction('rw', db.accounts, db.debts, db.transactions, async () => {
    // 1. Отменяем эффекты старой транзакции
    await reverseTransactionEffects(oldTx);
    
    // 2. Обновляем саму транзакцию
    const updatedTx: Transaction = { 
      ...oldTx, 
      ...newData, 
      synced: false 
    };
    await db.transactions.put(updatedTx);
    
    // 3. Применяем эффекты новой транзакции
    await applyTransactionEffects(updatedTx);
  });
}

export async function deleteTransaction(id: string) {
  const tx = await db.transactions.get(id);
  if (!tx) return;

  await db.transaction('rw', db.accounts, db.debts, db.transactions, async () => {
    await reverseTransactionEffects(tx);
    await db.transactions.delete(id);
  });
}

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