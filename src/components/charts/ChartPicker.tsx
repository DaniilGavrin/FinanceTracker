"use client";

import { AVAILABLE_CHARTS } from "@/lib/charts/registry";

interface Props {
  activeChartIds: string[];
  onToggle: (chartId: string) => void;
  onClose: () => void;
}

export function ChartPicker({ activeChartIds, onToggle, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Добавить графики</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Выберите графики, которые хотите видеть на главной странице
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AVAILABLE_CHARTS.map((chart) => {
            const isActive = activeChartIds.includes(chart.id);
            return (
              <button
                key={chart.id}
                onClick={() => onToggle(chart.id)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isActive
                    ? "bg-primary/10 border-primary"
                    : "bg-secondary border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{chart.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{chart.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {chart.description}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isActive ? "bg-primary border-primary" : "border-muted-foreground"
                  }`}>
                    {isActive && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="btn-primary w-full"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}