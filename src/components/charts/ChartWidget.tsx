"use client";

import { ChartData, getChartById } from "@/lib/charts/registry";

interface Props {
  chartId: string;
  data: ChartData;
  onRemove: (chartId: string) => void;
}

export function ChartWidget({ chartId, data, onRemove }: Props) {
  const chart = getChartById(chartId);
  
  if (!chart) return null;
  
  const ChartComponent = chart.component;

  return (
    <div className="card relative group">
      {/* Кнопка удаления */}
      <button
        onClick={() => onRemove(chartId)}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Удалить график"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{chart.icon}</span>
        <h3 className="font-semibold text-sm">{chart.name}</h3>
      </div>

      {/* Сам график */}
      <ChartComponent {...data} />
    </div>
  );
}