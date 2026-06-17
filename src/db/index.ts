import { v4 as uuidv4 } from 'uuid';
import { getDatabase, Account, Debt, Transaction, BankType, TransactionType } from '@/lib/database';

// Реэкспортируем типы для обратной совместимости
export type { Account, Debt, Transaction, BankType, TransactionType };

// Экспортируем singleton базы данных
export const db = getDatabase();

// ==========================================
// БАЗОВЫЕ ФУНКЦИИ СОЗДАНИЯ
// ==========================================

export async function createAccount(data: Omit<Account, 'id' | 'updatedAt' | 'synced'>): Promise<string> {
  const id = uuidv4();
  const now = Date.now();
  
  await db.addAccount({
    ...data,
    id,
    updatedAt: now,
    synced: false,
  });
  
  return id;
}

export async function createDebt(data: Omit<Debt, 'id' | 'updatedAt' | 'synced'>): Promise<string> {
  const id = uuidv4();
  const now = Date.now();
  
  await db.addDebt({
    ...data,
    id,
    updatedAt: now,
    synced: false,
  });
  
  return id;
}

// ==========================================
// КРЕДИТНАЯ КАРТА (с текущим балансом)
// ==========================================

export async function createCreditCard(params: {
  name: string;
  limit: number;
  currentBalance?: number;
  bank: BankType;
  openedAt: number;
}): Promise<{ accountId: string; debtId: string }> {
  const accountId = uuidv4();
  const debtId = uuidv4();
  const now = Date.now();
  
  // Рассчитываем долг как разницу между лимитом и текущим балансом
  const currentBalance = params.currentBalance ?? params.limit;
  const debtAmount = Math.max(0, params.limit - currentBalance);

  // Создаём долг
  await db.addDebt({
    id: debtId,
    name: params.name,
    type: 'credit_card',
    totalAmount: debtAmount,
    currentAmount: debtAmount,
    linkedAccountId: accountId,
    bank: params.bank,
    startDate: params.openedAt,
    updatedAt: now,
    synced: false,
  });

  // Создаём счёт с текущим балансом (НЕ с лимитом!)
  await db.addAccount({
    id: accountId,
    name: params.name,
    type: 'credit',
    balance: currentBalance,
    limit: params.limit,
    debtId: debtId,
    bank: params.bank,
    openedAt: params.openedAt,
    updatedAt: now,
    synced: false,
  });

  return { accountId, debtId };
}

// ==========================================
// РАССРОЧКА (новый тип счёта)
// ==========================================

export async function createInstallment(params: {
  name: string;
  limit: number;
  currentBalance?: number;
  bank: BankType;
  openedAt: number;
}): Promise<{ accountId: string; debtId: string }> {
  const accountId = uuidv4();
  const debtId = uuidv4();
  const now = Date.now();
  
  // Рассчитываем долг как разницу между лимитом и текущим балансом
  const currentBalance = params.currentBalance ?? params.limit;
  const debtAmount = Math.max(0, params.limit - currentBalance);

  // Создаём долг типа installment
  await db.addDebt({
    id: debtId,
    name: params.name,
    type: 'installment',
    totalAmount: debtAmount,
    currentAmount: debtAmount,
    linkedAccountId: accountId,
    bank: params.bank,
    startDate: params.openedAt,
    updatedAt: now,
    synced: false,
  });

  // Создаём счёт типа installment
  await db.addAccount({
    id: accountId,
    name: params.name,
    type: 'installment',
    balance: currentBalance,
    limit: params.limit,
    debtId: debtId,
    bank: params.bank,
    openedAt: params.openedAt,
    updatedAt: now,
    synced: false,
  });

  return { accountId, debtId };
}

// ==========================================
// ПРИМЕНЕНИЕ И ОТМЕНА ЭФФЕКТОВ
// ==========================================

async function applyTransactionEffects(tx: Transaction): Promise<void> {
  switch (tx.type) {
    case 'expense': {
      if (tx.fromAccountId) {
        const acc = await db.getAccountById(tx.fromAccountId);
        if (acc) {
          await db.updateAccount(acc.id, { balance: acc.balance - tx.amount });
          
          if ((acc.type === 'credit' || acc.type === 'installment') && acc.debtId) {
            const debt = await db.getDebtById(acc.debtId);
            if (debt) {
              await db.updateDebt(debt.id, {
                currentAmount: debt.currentAmount + tx.amount,
                totalAmount: Math.max(debt.totalAmount, debt.currentAmount + tx.amount)
              });
            }
          }
        }
      }
      break;
    }
    case 'income': {
      if (tx.toAccountId) {
        const acc = await db.getAccountById(tx.toAccountId);
        if (acc) {
          await db.updateAccount(acc.id, { balance: acc.balance + tx.amount });
        }
      }
      break;
    }
    case 'transfer': {
      if (tx.fromAccountId && tx.toAccountId) {
        const fromAcc = await db.getAccountById(tx.fromAccountId);
        const toAcc = await db.getAccountById(tx.toAccountId);
        
        if (fromAcc && toAcc) {
          await db.updateAccount(fromAcc.id, { balance: fromAcc.balance - tx.amount });
          await db.updateAccount(toAcc.id, { balance: toAcc.balance + tx.amount });
        }
      }
      break;
    }
    case 'debt_payment': {
      if (tx.debtId) {
        const debt = await db.getDebtById(tx.debtId);
        if (debt) {
          await db.updateDebt(debt.id, {
            currentAmount: Math.max(0, debt.currentAmount - tx.amount)
          });
          
          if (debt.linkedAccountId) {
            const acc = await db.getAccountById(debt.linkedAccountId);
            if (acc) {
              await db.updateAccount(acc.id, {
                balance: Math.min(acc.limit || 0, acc.balance + tx.amount)
              });
            }
          }
        }
      }
      if (tx.fromAccountId) {
        const acc = await db.getAccountById(tx.fromAccountId);
        if (acc) {
          await db.updateAccount(acc.id, { balance: acc.balance - tx.amount });
        }
      }
      break;
    }
    case 'debt_borrow': {
      if (tx.debtId) {
        const debt = await db.getDebtById(tx.debtId);
        if (debt) {
          await db.updateDebt(debt.id, {
            currentAmount: debt.currentAmount + tx.amount,
            totalAmount: Math.max(debt.totalAmount, debt.currentAmount + tx.amount)
          });
          
          if (debt.linkedAccountId) {
            const acc = await db.getAccountById(debt.linkedAccountId);
            if (acc) {
              await db.updateAccount(acc.id, {
                balance: Math.max(-(acc.limit || 0), acc.balance - tx.amount)
              });
            }
          }
        }
      }
      if (tx.toAccountId) {
        const acc = await db.getAccountById(tx.toAccountId);
        if (acc) {
          await db.updateAccount(acc.id, { balance: acc.balance + tx.amount });
        }
      }
      break;
    }
  }
}

async function reverseTransactionEffects(tx: Transaction): Promise<void> {
  switch (tx.type) {
    case 'expense': {
      if (tx.fromAccountId) {
        const acc = await db.getAccountById(tx.fromAccountId);
        if (acc) {
          await db.updateAccount(acc.id, { balance: acc.balance + tx.amount });
          
          if (acc.type === 'credit' && acc.debtId) {
            const debt = await db.getDebtById(acc.debtId);
            if (debt) {
              await db.updateDebt(debt.id, {
                currentAmount: Math.max(0, debt.currentAmount - tx.amount)
              });
            }
          }
        }
      }
      break;
    }
    case 'income': {
      if (tx.toAccountId) {
        const acc = await db.getAccountById(tx.toAccountId);
        if (acc) {
          await db.updateAccount(acc.id, { balance: acc.balance - tx.amount });
        }
      }
      break;
    }
    case 'transfer': {
      if (tx.fromAccountId && tx.toAccountId) {
        const fromAcc = await db.getAccountById(tx.fromAccountId);
        const toAcc = await db.getAccountById(tx.toAccountId);
        
        if (fromAcc && toAcc) {
          await db.updateAccount(fromAcc.id, { balance: fromAcc.balance + tx.amount });
          await db.updateAccount(toAcc.id, { balance: toAcc.balance - tx.amount });
        }
      }
      break;
    }
    case 'debt_payment': {
      if (tx.debtId) {
        const debt = await db.getDebtById(tx.debtId);
        if (debt) {
          await db.updateDebt(debt.id, {
            currentAmount: debt.currentAmount + tx.amount
          });
          
          if (debt.linkedAccountId) {
            const acc = await db.getAccountById(debt.linkedAccountId);
            if (acc) {
              await db.updateAccount(acc.id, {
                balance: Math.max(-(acc.limit || 0), acc.balance - tx.amount)
              });
            }
          }
        }
      }
      if (tx.fromAccountId) {
        const acc = await db.getAccountById(tx.fromAccountId);
        if (acc) {
          await db.updateAccount(acc.id, { balance: acc.balance + tx.amount });
        }
      }
      break;
    }
    case 'debt_borrow': {
      if (tx.debtId) {
        const debt = await db.getDebtById(tx.debtId);
        if (debt) {
          await db.updateDebt(debt.id, {
            currentAmount: Math.max(0, debt.currentAmount - tx.amount)
          });
          
          if (debt.linkedAccountId) {
            const acc = await db.getAccountById(debt.linkedAccountId);
            if (acc) {
              await db.updateAccount(acc.id, {
                balance: Math.min(acc.limit || 0, acc.balance + tx.amount)
              });
            }
          }
        }
      }
      if (tx.toAccountId) {
        const acc = await db.getAccountById(tx.toAccountId);
        if (acc) {
          await db.updateAccount(acc.id, { balance: acc.balance - tx.amount });
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
  txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'synced'>
): Promise<string> {
  const txId = uuidv4();
  const now = Date.now();

  const transaction: Transaction = {
    ...txData,
    id: txId,
    createdAt: now,
    updatedAt: now,
    synced: false,
  };

  await db.addTransaction(transaction);
  await applyTransactionEffects(transaction);

  return txId;
}

// ==========================================
// РЕДАКТИРОВАНИЕ И УДАЛЕНИЕ
// ==========================================

export async function updateAccount(id: string, data: Partial<Omit<Account, 'id' | 'updatedAt' | 'synced'>>): Promise<void> {
  await db.updateAccount(id, data);
}

export async function deleteAccount(id: string): Promise<void> {
  const acc = await db.getAccountById(id);
  if (acc) {
    // Если это кредитка/рассрочка — удаляем связанный долг
    if ((acc.type === 'credit' || acc.type === 'installment') && acc.debtId) {
      const transactions = await db.getTransactions();
      for (const tx of transactions) {
        if (tx.debtId === acc.debtId) {
          await db.deleteTransaction(tx.id);
        }
      }
      await db.deleteDebt(acc.debtId);
    }
    
    const transactions = await db.getTransactions();
    for (const tx of transactions) {
      if (tx.fromAccountId === id || tx.toAccountId === id) {
        await db.deleteTransaction(tx.id);
      }
    }
    
    await db.deleteAccount(id);
  }
}

export async function updateDebt(id: string, data: Partial<Omit<Debt, 'id' | 'updatedAt' | 'synced'>>): Promise<void> {
  await db.updateDebt(id, data);
}

export async function deleteDebt(id: string): Promise<void> {
  const debt = await db.getDebtById(id);
  if (debt) {
    // Если это долг кредитки/рассрочки — удаляем связанный счёт
    if ((debt.type === 'credit_card' || debt.type === 'installment') && debt.linkedAccountId) {
      const transactions = await db.getTransactions();
      for (const tx of transactions) {
        if (tx.fromAccountId === debt.linkedAccountId || tx.toAccountId === debt.linkedAccountId) {
          await db.deleteTransaction(tx.id);
        }
      }
      await db.deleteAccount(debt.linkedAccountId);
    }
    
    const transactions = await db.getTransactions();
    for (const tx of transactions) {
      if (tx.debtId === id) {
        await db.deleteTransaction(tx.id);
      }
    }
    
    await db.deleteDebt(id);
  }
}

export async function updateTransaction(id: string, newData: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'synced'>>): Promise<void> {
  const oldTx = await db.getTransactionById(id);
  if (!oldTx) return;

  await reverseTransactionEffects(oldTx);
  await db.updateTransaction(id, newData);
  
  const updatedTx = await db.getTransactionById(id);
  if (updatedTx) {
    await applyTransactionEffects(updatedTx);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const tx = await db.getTransactionById(id);
  if (!tx) return;

  await reverseTransactionEffects(tx);
  await db.deleteTransaction(id);
}

export async function linkCreditCardToDebt(accountId: string, debtId: string): Promise<void> {
  const acc = await db.getAccountById(accountId);
  const debt = await db.getDebtById(debtId);
  
  if (acc && debt) {
    await db.updateAccount(accountId, { debtId });
    await db.updateDebt(debtId, { linkedAccountId: accountId });
  }
}

// ==========================================
// ЭКСПОРТ/ИМПОРТ
// ==========================================

export async function exportData(): Promise<string> {
  return await db.exportData();
}

export async function importData(json: string): Promise<void> {
  await db.importData(json);
}