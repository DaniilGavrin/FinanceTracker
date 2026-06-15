"use client";
import { Account, Debt } from "@/db";
import { useFinanceMetrics } from "@/hooks/useFinanceMetrics";
import { StatsCards } from "@/components/dashboard/StatsCards";

interface Props {
  accounts: Account[] | undefined;
  debts: Debt[] | undefined;
}

export function HomeView({ accounts, debts }: Props) {
  const { totalBalance, totalCreditLimit, totalDebt } = useFinanceMetrics(accounts, debts);

  return (
    <div className="space-y-6 pb-20">
      <StatsCards totalBalance={totalBalance} totalCreditLimit={totalCreditLimit} totalDebt={totalDebt} />
      <div className="card p-6 text-center text-muted-foreground">
        <p className="font-medium mb-2">📊 Графики и аналитика</p>
        <p className="text-sm">Здесь скоро появятся круговые диаграммы расходов и тренды баланса.</p>
      </div>
    </div>
  );
}