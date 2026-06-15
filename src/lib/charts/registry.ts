import { Account, Debt, Transaction } from "@/db";

// Тип данных, которые передаются в каждый график
export interface ChartData {
  accounts: Account[];
  debts: Debt[];
  transactions: Transaction[];
}

// Интерфейс, который должен реализовать каждый график
export interface ChartDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  component: React.ComponentType<ChartData>;
}

// Реестр всех доступных графиков
// Чтобы добавить новый график — просто добавь его сюда
import { ExpensesByCategoryChart } from "@/lib/charts/ExpensesByCategoryChart";
import { BalanceTrendChart } from "@/lib/charts/BalanceTrendChart";
import { MonthlyActivityChart } from "@/lib/charts/MonthlyActivityChart";

export const AVAILABLE_CHARTS: ChartDefinition[] = [
  {
    id: "expenses-by-category",
    name: "Расходы по категориям",
    description: "Круговая диаграмма: куда ушли деньги в этом месяце",
    icon: "🥧",
    component: ExpensesByCategoryChart,
  },
  {
    id: "balance-trend",
    name: "Динамика баланса",
    description: "Как менялся ваш баланс за последние 30 дней",
    icon: "📈",
    component: BalanceTrendChart,
  },
  {
    id: "monthly-activity",
    name: "Активность по месяцам",
    description: "Доходы vs расходы за последние 6 месяцев",
    icon: "📊",
    component: MonthlyActivityChart,
  },
];

export function getChartById(id: string): ChartDefinition | undefined {
  return AVAILABLE_CHARTS.find(c => c.id === id);
}