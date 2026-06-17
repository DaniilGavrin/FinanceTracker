import Dexie from 'dexie';
import { getDatabase } from './database';

// Старая схема Dexie (для чтения данных)
class OldFinanceDB extends Dexie {
  accounts: Dexie.Table<any, string>;
  debts: Dexie.Table<any, string>;
  transactions: Dexie.Table<any, string>;

  constructor() {
    super('FinanceTrackerDB');
    this.version(4).stores({
      accounts: 'id, type, synced, updatedAt, debtId, bank',
      debts: 'id, type, synced, updatedAt, linkedAccountId, bank, startDate',
      transactions: 'id, fromAccountId, toAccountId, debtId, categoryId, date, type, synced, createdAt'
    });
    
    this.accounts = this.table('accounts');
    this.debts = this.table('debts');
    this.transactions = this.table('transactions');
  }
}

export async function migrateFromIndexedDB(): Promise<boolean> {
  try {
    // Проверяем, есть ли данные в IndexedDB
    const oldDb = new OldFinanceDB();
    
    const accounts = await oldDb.accounts.toArray();
    const debts = await oldDb.debts.toArray();
    const transactions = await oldDb.transactions.toArray();
    
    // Если данных нет, миграция не нужна
    if (accounts.length === 0 && debts.length === 0 && transactions.length === 0) {
      console.log('Нет данных для миграции');
      return false;
    }
    
    console.log(`Найдено данных для миграции: ${accounts.length} счетов, ${debts.length} долгов, ${transactions.length} транзакций`);
    
    // Инициализируем новую БД
    const newDb = getDatabase();
    await newDb.init();
    
    // Проверяем, есть ли уже данные в SQLite (чтобы не дублировать)
    const existingAccounts = await newDb.getAccounts();
    if (existingAccounts.length > 0) {
      console.log('Данные уже есть в SQLite, миграция пропущена');
      return false;
    }
    
    // Переносим данные
    for (const account of accounts) {
      await newDb.addAccount(account);
    }
    
    for (const debt of debts) {
      await newDb.addDebt(debt);
    }
    
    for (const transaction of transactions) {
      await newDb.addTransaction(transaction);
    }
    
    console.log('Миграция завершена успешно');
    
    // Очищаем старую БД
    await oldDb.delete();
    console.log('Старая IndexedDB удалена');
    
    return true;
  } catch (error) {
    console.error('Ошибка миграции:', error);
    return false;
  }
}