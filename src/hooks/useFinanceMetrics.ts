import { Account, Debt } from "@/db";
import { calculateTotalPayments } from "@/db";

export function useFinanceMetrics(accounts: Account[] | undefined, debts: Debt[] | undefined) {
  const debitAccounts = accounts?.filter(a => a.type === 'debit' || a.type === 'cash') || [];
  const creditAccounts = accounts?.filter(a => a.type === 'credit' || a.type === 'installment') || [];
  
  const totalBalance = debitAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalCreditLimit = creditAccounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0);
  
  // Для кредитов считаем общую сумму выплат, для остальных — текущий остаток
  const totalDebt = debts?.reduce((sum, d) => {
    const amount = d.type === 'bank_loan' ? calculateTotalPayments(d) : d.currentAmount;
    return sum + amount;
  }, 0) || 0;
  
  return { totalBalance, totalCreditLimit, totalDebt };
}