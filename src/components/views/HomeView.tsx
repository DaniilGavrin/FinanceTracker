"use client";

import { useState, useEffect } from "react";
import { Account, Debt, Transaction } from "@/db";
import { useFinanceMetrics } from "@/hooks/useFinanceMetrics";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ChartWidget } from "@/components/charts/ChartWidget";
import { ChartPicker } from "@/components/charts/ChartPicker";

interface Props {
  accounts: Account[] | undefined;
  debts: Debt[] | undefined;
  transactions: Transaction[] | undefined;
}

const STORAGE_KEY = "finance-tracker-active-charts";
const DEFAULT_CHARTS = ["expenses-by-category"]; // По умолчанию показываем только круговую

export function HomeView({ accounts, debts, transactions }: Props) {
  const { totalBalance, totalCreditLimit, totalDebt } = useFinanceMetrics(accounts, debts);
  
  const [activeChartIds, setActiveChartIds] = useState<string[]>(DEFAULT_CHARTS);
  const [showPicker, setShowPicker] = useState(false);

  // Загружаем настройки из localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setActiveChartIds(JSON.parse(saved));
      } catch (e) {
        console.error("Ошибка загрузки настроек графиков:", e);
      }
    }
  }, []);

  // Сохраняем настройки в localStorage
  const updateCharts = (newIds: string[]) => {
    setActiveChartIds(newIds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
  };

  const handleToggleChart = (chartId: string) => {
    const newIds = activeChartIds.includes(chartId)
      ? activeChartIds.filter(id => id !== chartId)
      : [...activeChartIds, chartId];
    updateCharts(newIds);
  };

  const handleRemoveChart = (chartId: string) => {
    updateCharts(activeChartIds.filter(id => id !== chartId));
  };

  const chartData = {
    accounts: accounts || [],
    debts: debts || [],
    transactions: transactions || [],
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Карточки статистики */}
      <StatsCards totalBalance={totalBalance} totalCreditLimit={totalCreditLimit} totalDebt={totalDebt} />

      {/* Секция графиков */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Графики</h2>
          <button
            onClick={() => setShowPicker(true)}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Добавить
          </button>
        </div>

        {activeChartIds.length > 0 ? (
          <div className="space-y-4">
            {activeChartIds.map(chartId => (
              <ChartWidget
                key={chartId}
                chartId={chartId}
                data={chartData}
                onRemove={handleRemoveChart}
              />
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-muted-foreground mb-3">Нет активных графиков</p>
            <button
              onClick={() => setShowPicker(true)}
              className="btn-primary text-sm"
            >
              Выбрать графики
            </button>
          </div>
        )}
      </section>

      {/* Модалка выбора */}
      {showPicker && (
        <ChartPicker
          activeChartIds={activeChartIds}
          onToggle={handleToggleChart}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}