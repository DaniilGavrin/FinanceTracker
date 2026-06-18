import { CapacitorSQLite, SQLiteDBConnection, SQLiteConnection } from '@capacitor-community/sqlite';

// Интерфейс, который будет работать везде (Capacitor, Tauri, Web)
export interface Database {
  init(): Promise<void>;
  close(): Promise<void>;
  
  // Accounts
  getAccounts(): Promise<Account[]>;
  getAccountById(id: string): Promise<Account | undefined>;
  addAccount(account: Account): Promise<void>;
  updateAccount(id: string, data: Partial<Omit<Account, 'id' | 'updatedAt' | 'synced'>>): Promise<void>;
  deleteAccount(id: string): Promise<void>;
  
  // Debts
  getDebts(): Promise<Debt[]>;
  getDebtById(id: string): Promise<Debt | undefined>;
  addDebt(debt: Debt): Promise<void>;
  updateDebt(id: string, data: Partial<Omit<Debt, 'id' | 'updatedAt' | 'synced'>>): Promise<void>;
  deleteDebt(id: string): Promise<void>;
  
  // Transactions
  getTransactions(): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
  addTransaction(transaction: Transaction): Promise<void>;
  updateTransaction(id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'synced'>>): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  
  // Bulk operations
  exportData(): Promise<string>;
  importData(json: string): Promise<void>;
}

// Типы данных (те же, что были в db/index.ts)
export type BankType = 'sber' | 'tbank' | 'other' | 'person';

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

  // === ОБЩИЕ ПОЛЯ ===
  nextPaymentDate?: number;      // Дата следующего платежа (timestamp)
  monthlyPayment?: number;       // Ежемесячный платёж (введённый вручную)
  
  // === ДЛЯ КРЕДИТОВ (bank_loan) ===
  paymentType?: 'annuity' | 'differentiated'; // Тип платежа
  
  // === ДЛЯ РАССРОЧЕК (installment) ===
  store?: string;                // Магазин/сервис
  purchaseDescription?: string;  // Что куплено
  installmentsCount?: number;    // Общее количество платежей
  paidInstallments?: number;     // Сколько уже оплачено
  
  // === ДЛЯ КРЕДИТНЫХ КАРТ (credit_card) ===
  gracePeriodEnd?: number;       // Конец льготного периода
  paymentDay?: number;           // День платежа (1-31)
  minPayment?: number;           // Минимальный платёж
  
  // === ДЛЯ ДОЛГОВ ФИЗЛИЦАМ (person) ===
  contactInfo?: string;          // Контакты должника
  repaymentTerms?: string;       // Условия возврата
}

export type TransactionType = 'income' | 'expense' | 'transfer' | 'debt_payment' | 'debt_borrow';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fromAccountId?: string;
  toAccountId?: string;
  debtId?: string;
  categoryId?: string;
  description?: string;
  date: number;
  createdAt: number;
  updatedAt: number;
  synced: boolean;
}

// Реализация для Capacitor (Android/iOS)
export class CapacitorDatabase implements Database {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private dbName = 'finance';

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async init(): Promise<void> {
    try {
      // Проверяем, существует ли уже соединение
      const ret = await this.sqlite.checkConnectionsConsistency();
      const isConn = (await this.sqlite.isConnection(this.dbName, false)).result;
      
      if (ret.result && isConn) {
        // Соединение уже существует
        this.db = await this.sqlite.retrieveConnection(this.dbName, false);
      } else {
        // Создаём новое соединение
        this.db = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
      }
      
      await this.db.open();
      
      // Создаём таблицы
      await this.createTables();
      await this.migrateDebtsTable();
    } catch (error) {
      console.error('Ошибка инициализации БД:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL NOT NULL,
        "limit" REAL,
        debtId TEXT,
        bank TEXT,
        openedAt INTEGER,
        updatedAt INTEGER NOT NULL,
        synced INTEGER NOT NULL
      )
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS debts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        currentAmount REAL NOT NULL,
        interestRate REAL,
        linkedAccountId TEXT,
        bank TEXT,
        startDate INTEGER,
        termMonths INTEGER,
        updatedAt INTEGER NOT NULL,
        synced INTEGER NOT NULL,
        nextPaymentDate INTEGER,
        monthlyPayment REAL,
        paymentType TEXT,
        store TEXT,
        purchaseDescription TEXT,
        installmentsCount INTEGER,
        paidInstallments INTEGER,
        gracePeriodEnd INTEGER,
        paymentDay INTEGER,
        minPayment REAL,
        contactInfo TEXT,
        repaymentTerms TEXT
      )
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        fromAccountId TEXT,
        toAccountId TEXT,
        debtId TEXT,
        categoryId TEXT,
        description TEXT,
        date INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        synced INTEGER NOT NULL
      )
    `);

    // Создаём индексы для ускорения запросов
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type)`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_accounts_debtId ON accounts(debtId)`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_debts_type ON debts(type)`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_debts_linkedAccountId ON debts(linkedAccountId)`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_fromAccountId ON transactions(fromAccountId)`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_toAccountId ON transactions(toAccountId)`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_debtId ON transactions(debtId)`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_categoryId ON transactions(categoryId)`);
  }


  private async migrateDebtsTable(): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');
    
    // Новые колонки, которые могли отсутствовать в старых версиях
    const newColumns = [
      { name: 'nextPaymentDate', type: 'INTEGER' },
      { name: 'monthlyPayment', type: 'REAL' },
      { name: 'paymentType', type: 'TEXT' },
      { name: 'store', type: 'TEXT' },
      { name: 'purchaseDescription', type: 'TEXT' },
      { name: 'installmentsCount', type: 'INTEGER' },
      { name: 'paidInstallments', type: 'INTEGER' },
      { name: 'gracePeriodEnd', type: 'INTEGER' },
      { name: 'paymentDay', type: 'INTEGER' },
      { name: 'minPayment', type: 'REAL' },
      { name: 'contactInfo', type: 'TEXT' },
      { name: 'repaymentTerms', type: 'TEXT' },
    ];
    
    // Получаем существующие колонки
    const tableInfo = await this.db.query('PRAGMA table_info(debts)');
    const existingColumns = new Set(
      (tableInfo.values || []).map((col: any) => col.name)
    );
    
    // Добавляем только отсутствующие колонки
    for (const col of newColumns) {
      if (!existingColumns.has(col.name)) {
        try {
          await this.db.execute(`ALTER TABLE debts ADD COLUMN "${col.name}" ${col.type}`);
          console.log(`Добавлена колонка: ${col.name}`);
        } catch (e) {
          console.warn(`Не удалось добавить колонку ${col.name}:`, e);
        }
      }
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  // ========== ACCOUNTS ==========

  async getAccounts(): Promise<Account[]> {
    if (!this.db) throw new Error('База данных не инициализирована');
    
    const result = await this.db.query('SELECT * FROM accounts ORDER BY updatedAt DESC');
    return (result.values || []).map(this.mapAccountFromDB);
  }

  async getAccountById(id: string): Promise<Account | undefined> {
    if (!this.db) throw new Error('База данных не инициализирована');
    
    const result = await this.db.query('SELECT * FROM accounts WHERE id = ?', [id]);
    return result.values && result.values.length > 0 ? this.mapAccountFromDB(result.values[0]) : undefined;
  }

  async addAccount(account: Account): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');
    
    await this.db.run(
      `INSERT INTO accounts (id, name, type, balance, "limit", debtId, bank, openedAt, updatedAt, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        account.id,
        account.name,
        account.type,
        account.balance,
        account.limit || null,
        account.debtId || null,
        account.bank || null,
        account.openedAt || null,
        account.updatedAt,
        account.synced ? 1 : 0
      ]
    );
  }

  async updateAccount(id: string, data: Partial<Omit<Account, 'id' | 'updatedAt' | 'synced'>>): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.type !== undefined) {
      updates.push('type = ?');
      values.push(data.type);
    }
    if (data.balance !== undefined) {
      updates.push('balance = ?');
      values.push(data.balance);
    }
    if (data.limit !== undefined) {
      updates.push('"limit" = ?');
      values.push(data.limit);
    }
    if (data.debtId !== undefined) {
      updates.push('debtId = ?');
      values.push(data.debtId);
    }
    if (data.bank !== undefined) {
      updates.push('bank = ?');
      values.push(data.bank);
    }
    if (data.openedAt !== undefined) {
      updates.push('openedAt = ?');
      values.push(data.openedAt);
    }
    
    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(Date.now());
      
      values.push(id);
      
      await this.db.run(`UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`, values);
    }
  }

  async deleteAccount(id: string): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');
    await this.db.run('DELETE FROM accounts WHERE id = ?', [id]);
  }

  private mapAccountFromDB(row: any): Account {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      balance: row.balance,
      limit: row.limit || row["limit"] || undefined,
      debtId: row.debtId || undefined,
      bank: row.bank || undefined,
      openedAt: row.openedAt || undefined,
      updatedAt: row.updatedAt,
      synced: row.synced === 1
    };
  }

  // ========== DEBTS ==========

  async getDebts(): Promise<Debt[]> {
    if (!this.db) throw new Error('База данных не инициализирована');
    
    const result = await this.db.query('SELECT * FROM debts ORDER BY updatedAt DESC');
    return (result.values || []).map(this.mapDebtFromDB);
  }

  async getDebtById(id: string): Promise<Debt | undefined> {
    if (!this.db) throw new Error('База данных не инициализирована');
    
    const result = await this.db.query('SELECT * FROM debts WHERE id = ?', [id]);
    return result.values && result.values.length > 0 ? this.mapDebtFromDB(result.values[0]) : undefined;
  }

  async addDebt(debt: Debt): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');
    await this.db.run(
      `INSERT INTO debts (id, name, type, totalAmount, currentAmount, interestRate, linkedAccountId, bank, startDate, termMonths, updatedAt, synced, nextPaymentDate, monthlyPayment, paymentType, store, purchaseDescription, installmentsCount, paidInstallments, gracePeriodEnd, paymentDay, minPayment, contactInfo, repaymentTerms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        debt.id,
        debt.name,
        debt.type,
        debt.totalAmount,
        debt.currentAmount,
        debt.interestRate || null,
        debt.linkedAccountId || null,
        debt.bank || null,
        debt.startDate || null,
        debt.termMonths || null,
        debt.updatedAt,
        debt.synced ? 1 : 0,
        debt.nextPaymentDate || null,
        debt.monthlyPayment || null,
        debt.paymentType || null,
        debt.store || null,
        debt.purchaseDescription || null,
        debt.installmentsCount || null,
        debt.paidInstallments || null,
        debt.gracePeriodEnd || null,
        debt.paymentDay || null,
        debt.minPayment || null,
        debt.contactInfo || null,
        debt.repaymentTerms || null,
      ]
    );
  }

  async updateDebt(id: string, data: Partial<Omit<Debt, 'id' | 'updatedAt' | 'synced'>>): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');
    
    const updates: string[] = [];
    const values: any[] = [];
    
    const fieldMap: Record<string, string> = {
      name: 'name',
      type: 'type',
      totalAmount: 'totalAmount',
      currentAmount: 'currentAmount',
      interestRate: 'interestRate',
      linkedAccountId: 'linkedAccountId',
      bank: 'bank',
      startDate: 'startDate',
      termMonths: 'termMonths',
      nextPaymentDate: 'nextPaymentDate',
      monthlyPayment: 'monthlyPayment',
      paymentType: 'paymentType',
      store: 'store',
      purchaseDescription: 'purchaseDescription',
      installmentsCount: 'installmentsCount',
      paidInstallments: 'paidInstallments',
      gracePeriodEnd: 'gracePeriodEnd',
      paymentDay: 'paymentDay',
      minPayment: 'minPayment',
      contactInfo: 'contactInfo',
      repaymentTerms: 'repaymentTerms',
    };
    
    for (const [key, col] of Object.entries(fieldMap)) {
      if ((data as any)[key] !== undefined) {
        updates.push(`${col} = ?`);
        values.push((data as any)[key] ?? null);
      }
    }
    
    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(Date.now());
      values.push(id);
      await this.db.run(`UPDATE debts SET ${updates.join(', ')} WHERE id = ?`, values);
    }
  }

  async deleteDebt(id: string): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');
    await this.db.run('DELETE FROM debts WHERE id = ?', [id]);
  }

  private mapDebtFromDB(row: any): Debt {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      totalAmount: row.totalAmount,
      currentAmount: row.currentAmount,
      interestRate: row.interestRate || undefined,
      linkedAccountId: row.linkedAccountId || undefined,
      bank: row.bank || undefined,
      startDate: row.startDate || undefined,
      termMonths: row.termMonths || undefined,
      updatedAt: row.updatedAt,
      synced: row.synced === 1,
      nextPaymentDate: row.nextPaymentDate || undefined,
      monthlyPayment: row.monthlyPayment || undefined,
      paymentType: row.paymentType || undefined,
      store: row.store || undefined,
      purchaseDescription: row.purchaseDescription || undefined,
      installmentsCount: row.installmentsCount || undefined,
      paidInstallments: row.paidInstallments || undefined,
      gracePeriodEnd: row.gracePeriodEnd || undefined,
      paymentDay: row.paymentDay || undefined,
      minPayment: row.minPayment || undefined,
      contactInfo: row.contactInfo || undefined,
      repaymentTerms: row.repaymentTerms || undefined,
    };
  }

  // ========== TRANSACTIONS ==========

  async getTransactions(): Promise<Transaction[]> {
    if (!this.db) throw new Error('База данных не инициализирована');
    
    const result = await this.db.query('SELECT * FROM transactions ORDER BY date DESC');
    return (result.values || []).map(this.mapTransactionFromDB);
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    if (!this.db) throw new Error('База данных не инициализирована');
    
    const result = await this.db.query('SELECT * FROM transactions WHERE id = ?', [id]);
    return result.values && result.values.length > 0 ? this.mapTransactionFromDB(result.values[0]) : undefined;
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');
    
    await this.db.run(
      `INSERT INTO transactions (id, type, amount, fromAccountId, toAccountId, debtId, categoryId, description, date, createdAt, updatedAt, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.type,
        transaction.amount,
        transaction.fromAccountId || null,
        transaction.toAccountId || null,
        transaction.debtId || null,
        transaction.categoryId || null,
        transaction.description || null,
        transaction.date,
        transaction.createdAt,
        transaction.updatedAt,
        transaction.synced ? 1 : 0
      ]
    );
  }

  async updateTransaction(id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'synced'>>): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.type !== undefined) {
      updates.push('type = ?');
      values.push(data.type);
    }
    if (data.amount !== undefined) {
      updates.push('amount = ?');
      values.push(data.amount);
    }
    if (data.fromAccountId !== undefined) {
      updates.push('fromAccountId = ?');
      values.push(data.fromAccountId);
    }
    if (data.toAccountId !== undefined) {
      updates.push('toAccountId = ?');
      values.push(data.toAccountId);
    }
    if (data.debtId !== undefined) {
      updates.push('debtId = ?');
      values.push(data.debtId);
    }
    if (data.categoryId !== undefined) {
      updates.push('categoryId = ?');
      values.push(data.categoryId);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.date !== undefined) {
      updates.push('date = ?');
      values.push(data.date);
    }
    
    if (updates.length > 0) {
      updates.push('updatedAt = ?');
      values.push(Date.now());
      
      values.push(id);
      
      await this.db.run(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`, values);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');
    await this.db.run('DELETE FROM transactions WHERE id = ?', [id]);
  }

  private mapTransactionFromDB(row: any): Transaction {
    return {
      id: row.id,
      type: row.type,
      amount: row.amount,
      fromAccountId: row.fromAccountId || undefined,
      toAccountId: row.toAccountId || undefined,
      debtId: row.debtId || undefined,
      categoryId: row.categoryId || undefined,
      description: row.description || undefined,
      date: row.date,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      synced: row.synced === 1
    };
  }

  // ========== EXPORT/IMPORT ==========

  async exportData(): Promise<string> {
    const accounts = await this.getAccounts();
    const debts = await this.getDebts();
    const transactions = await this.getTransactions();
    
    return JSON.stringify({ accounts, debts, transactions, exportedAt: Date.now() });
  }

  async importData(json: string): Promise<void> {
    if (!this.db) throw new Error('База данных не инициализирована');
    
    const data = JSON.parse(json);
    
    await this.db.execute('BEGIN TRANSACTION');
    
    try {
      await this.db.execute('DELETE FROM transactions');
      await this.db.execute('DELETE FROM debts');
      await this.db.execute('DELETE FROM accounts');
      
      for (const account of data.accounts) {
        await this.addAccount(account);
      }
      
      for (const debt of data.debts) {
        await this.addDebt(debt);
      }
      
      for (const transaction of data.transactions) {
        await this.addTransaction(transaction);
      }
      
      await this.db.execute('COMMIT');
    } catch (error) {
      await this.db.execute('ROLLBACK');
      throw error;
    }
  }
}

// Фабрика: создаём нужную реализацию в зависимости от платформы
export function createDatabase(): Database {
  // Пока только Capacitor, потом добавим Tauri
  return new CapacitorDatabase();
}

// Экспортируем singleton
let dbInstance: Database | null = null;

export function getDatabase(): Database {
  if (!dbInstance) {
    dbInstance = createDatabase();
  }
  return dbInstance;
}