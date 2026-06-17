import { Account, Debt } from "@/db";

export function useFinanceMetrics(accounts: Account[] | undefined, debts: Debt[] | undefined) {
  const debitAccounts = accounts?.filter(a => a.type === 'debit' || a.type === 'cash') || [];
  const creditAccounts = accounts?.filter(a => a.type === 'credit') || [];
  const installmentAccounts = accounts?.filter(a => a.type === 'installment') || [];
  
  // Свободные средства: дебетовые карты + наличные
  const totalBalance = debitAccounts.reduce((sum, a) => sum + a.balance, 0);
  
  // Доступный лимит: сколько ещё можно потратить по кредиткам и рассрочкам
  // Отрицательный баланс = перерасход, доступного лимита нет
  const totalCreditLimit = [...creditAccounts, ...installmentAccounts].reduce((sum, a) => {
    return sum + Math.max(0, a.balance);
  }, 0);
  
  // Общий долг: все обязательства
  const totalDebt = debts?.reduce((sum, d) => sum + d.currentAmount, 0) || 0;

  return { totalBalance, totalCreditLimit, totalDebt };
}