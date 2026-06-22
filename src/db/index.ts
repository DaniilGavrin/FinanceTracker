import { v4 as uuidv4 } from 'uuid';
import { getDatabase, Account, Debt, Transaction, BankType, TransactionType } from '@/lib/database';

export type { Account, Debt, Transaction, BankType, TransactionType };
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
  
  let finalData = { ...data };
  
  if (data.type === 'bank_loan' && data.interestRate && data.termMonths && data.totalAmount > 0) {
    const isDiff = data.paymentType === 'differentiated';
    const annualRate = data.interestRate / 100;
    const months = data.termMonths;
    const principal = data.totalAmount;

    if (!isDiff) {
      const monthlyRate = annualRate / 12;
      const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
      finalData = { ...data, monthlyPayment: Math.round(monthlyPayment * 100) / 100 };
    } else {
      finalData = { ...data, monthlyPayment: undefined };
    }
  }
  
  await db.addDebt({
    ...finalData,
    id,
    updatedAt: now,
    synced: false,
  });
  
  return id;
}

// ==========================================
// КРЕДИТНАЯ КАРТА
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
  
  const currentBalance = params.currentBalance ?? params.limit;
  const debtAmount = Math.max(0, params.limit - currentBalance);
  
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
// РАССРОЧКА
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
  
  const currentBalance = params.currentBalance ?? params.limit;
  const debtAmount = Math.max(0, params.limit - currentBalance);
  
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
        if (acc) await db.updateAccount(acc.id, { balance: acc.balance + tx.amount });
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
          await db.updateDebt(debt.id, { currentAmount: Math.max(0, debt.currentAmount - tx.amount) });
          if (debt.linkedAccountId) {
            const acc = await db.getAccountById(debt.linkedAccountId);
            if (acc) {
              await db.updateAccount(acc.id, { balance: Math.min(acc.limit || 0, acc.balance + tx.amount) });
            }
          }
        }
      }
      if (tx.fromAccountId) {
        const acc = await db.getAccountById(tx.fromAccountId);
        if (acc) await db.updateAccount(acc.id, { balance: acc.balance - tx.amount });
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
              await db.updateAccount(acc.id, { balance: Math.max(-(acc.limit || 0), acc.balance - tx.amount) });
            }
          }
        }
      }
      if (tx.toAccountId) {
        const acc = await db.getAccountById(tx.toAccountId);
        if (acc) await db.updateAccount(acc.id, { balance: acc.balance + tx.amount });
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
          if ((acc.type === 'credit' || acc.type === 'installment') && acc.debtId) {
            const debt = await db.getDebtById(acc.debtId);
            if (debt) await db.updateDebt(debt.id, { currentAmount: Math.max(0, debt.currentAmount - tx.amount) });
          }
        }
      }
      break;
    }
    case 'income': {
      if (tx.toAccountId) {
        const acc = await db.getAccountById(tx.toAccountId);
        if (acc) await db.updateAccount(acc.id, { balance: acc.balance - tx.amount });
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
          await db.updateDebt(debt.id, { currentAmount: debt.currentAmount + tx.amount });
          if (debt.linkedAccountId) {
            const acc = await db.getAccountById(debt.linkedAccountId);
            if (acc) await db.updateAccount(acc.id, { balance: Math.max(-(acc.limit || 0), acc.balance - tx.amount) });
          }
        }
      }
      if (tx.fromAccountId) {
        const acc = await db.getAccountById(tx.fromAccountId);
        if (acc) await db.updateAccount(acc.id, { balance: acc.balance + tx.amount });
      }
      break;
    }
    case 'debt_borrow': {
      if (tx.debtId) {
        const debt = await db.getDebtById(tx.debtId);
        if (debt) {
          await db.updateDebt(debt.id, { currentAmount: Math.max(0, debt.currentAmount - tx.amount) });
          if (debt.linkedAccountId) {
            const acc = await db.getAccountById(debt.linkedAccountId);
            if (acc) await db.updateAccount(acc.id, { balance: Math.min(acc.limit || 0, acc.balance + tx.amount) });
          }
        }
      }
      if (tx.toAccountId) {
        const acc = await db.getAccountById(tx.toAccountId);
        if (acc) await db.updateAccount(acc.id, { balance: acc.balance - tx.amount });
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
    if ((acc.type === 'credit' || acc.type === 'installment') && acc.debtId) {
      const transactions = await db.getTransactions();
      for (const tx of transactions) if (tx.debtId === acc.debtId) await db.deleteTransaction(tx.id);
      await db.deleteDebt(acc.debtId);
    }
    const transactions = await db.getTransactions();
    for (const tx of transactions) if (tx.fromAccountId === id || tx.toAccountId === id) await db.deleteTransaction(tx.id);
    await db.deleteAccount(id);
  }
}

export async function updateDebt(id: string, data: Partial<Omit<Debt, 'id' | 'updatedAt' | 'synced'>>): Promise<void> {
  await db.updateDebt(id, data);
}

export async function deleteDebt(id: string): Promise<void> {
  const debt = await db.getDebtById(id);
  if (debt) {
    if ((debt.type === 'credit_card' || debt.type === 'installment') && debt.linkedAccountId) {
      const transactions = await db.getTransactions();
      for (const tx of transactions) if (tx.fromAccountId === debt.linkedAccountId || tx.toAccountId === debt.linkedAccountId) await db.deleteTransaction(tx.id);
      await db.deleteAccount(debt.linkedAccountId);
    }
    const transactions = await db.getTransactions();
    for (const tx of transactions) if (tx.debtId === id) await db.deleteTransaction(tx.id);
    await db.deleteDebt(id);
  }
}

export async function updateTransaction(id: string, newData: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'synced'>>): Promise<void> {
  const oldTx = await db.getTransactionById(id);
  if (!oldTx) return;
  
  await reverseTransactionEffects(oldTx);
  await db.updateTransaction(id, newData);
  
  const updatedTx = await db.getTransactionById(id);
  if (updatedTx) await applyTransactionEffects(updatedTx);
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
// РАСЧЁТ ОБЩЕЙ СУММЫ ВЫПЛАТ ПО КРЕДИТУ
// ==========================================
export function calculateTotalPayments(debt: Debt): number {
  // Для не-кредитов или кредитов без параметров — возвращаем текущий остаток
  if (debt.type !== 'bank_loan' || !debt.interestRate || !debt.termMonths || !debt.startDate) {
    return debt.currentAmount;
  }
  
  const annualRate = debt.interestRate / 100;
  const monthlyRate = annualRate / 12;
  const months = debt.termMonths;
  const principal = debt.totalAmount;
  
  // Аннуитетный платёж
  const annuityPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  
  let balance = principal;
  let totalInterest = 0;
  const startDate = new Date(debt.startDate);
  const paymentDay = debt.paymentDay || startDate.getDate();
  
  // Первый платёж (из nextPaymentDate или конец месяца открытия)
  let firstPaymentDate: Date;
  if (debt.nextPaymentDate) {
    firstPaymentDate = new Date(debt.nextPaymentDate);
    firstPaymentDate.setHours(0, 0, 0, 0);
    if (firstPaymentDate.getTime() < startDate.getTime()) {
      firstPaymentDate = new Date(startDate);
    }
  } else {
    const lastDay = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    firstPaymentDate = new Date(startDate.getFullYear(), startDate.getMonth(), Math.min(31, lastDay));
    if (firstPaymentDate.getTime() <= startDate.getTime()) {
      const nextMonth = new Date(startDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextLastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
      firstPaymentDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(paymentDay, nextLastDay));
    }
  }
  
  // Проценты за первый неполный период
  const daysInFirstPeriod = Math.ceil(
    (firstPaymentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  totalInterest += principal * annualRate * daysInFirstPeriod / 365;
  
  // Полные месяцы (2..termMonths)
  let prevDate = firstPaymentDate;
  for (let month = 2; month <= months; month++) {
    const baseDate = new Date(startDate);
    baseDate.setMonth(baseDate.getMonth() + month - 1);
    const lastDay = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
    const paymentDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), Math.min(paymentDay, lastDay));
    
    const daysInPeriod = Math.ceil(
      (paymentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const interest = balance * annualRate * daysInPeriod / 365;
    totalInterest += interest;
    
    balance -= (annuityPayment - interest);
    if (balance < 0) balance = 0;
    prevDate = paymentDate;
  }
  
  // Финальный платёж на дату закрытия
  const closingDate = new Date(startDate);
  closingDate.setMonth(closingDate.getMonth() + months);
  const closingLastDay = new Date(closingDate.getFullYear(), closingDate.getMonth() + 1, 0).getDate();
  const finalDate = new Date(closingDate.getFullYear(), closingDate.getMonth(), Math.min(startDate.getDate(), closingLastDay));
  
  const daysInFinalPeriod = Math.ceil(
    (finalDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  totalInterest += balance * annualRate * daysInFinalPeriod / 365;
  
  return Math.round((principal + totalInterest) * 100) / 100;
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