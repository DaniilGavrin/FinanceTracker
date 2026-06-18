import { Account, Debt } from "@/db";

export function useFinanceMetrics(accounts: Account[] | undefined, debts: Debt[] | undefined) {
  const debitAccounts = accounts?.filter(a => a.type === 'debit' || a.type === 'cash') || [];
  const creditAccounts = accounts?.filter(a => a.type === 'credit' || a.type === 'installment') || [];
  
  const totalBalance = debitAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalCreditLimit = creditAccounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0);
  const totalDebt = debts?.reduce((sum, d) => sum + d.currentAmount, 0) || 0;

  return { totalBalance, totalCreditLimit, totalDebt };
}