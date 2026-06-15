"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartData } from "./registry";

export function MonthlyActivityChart({ transactions }: ChartData) {
  const months = 6;
  const now = new Date();
  
  const data = [];
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1).getTime();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
    
    const monthTx = transactions.filter(tx => tx.date >= monthStart && tx.date < monthEnd);
    
    const income = monthTx
      .filter(tx => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const expense = monthTx
      .filter(tx => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    data.push({
      month: new Date(monthStart).toLocaleDateString('ru-RU', { month: 'short' }),
      Доходы: income,
      Расходы: expense,
    });
  }

  if (transactions.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
        Недостаточно данных для графика
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
        <YAxis 
          stroke="var(--muted-foreground)" 
          fontSize={10}
          tickFormatter={(value: any) => value != null ? `${(Number(value) / 1000).toFixed(0)}к` : '0'}
        />
        <Tooltip 
          formatter={(value: any, name: any) => [
            value != null ? `${Number(value).toLocaleString('ru-RU')} ₽` : '0 ₽',
            name || 'Неизвестно'
          ]}
          contentStyle={{ 
            backgroundColor: "var(--card)", 
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--foreground)"
          }}
        />
        <Legend />
        <Bar dataKey="Доходы" fill="var(--accent)" radius={[8, 8, 0, 0]} />
        <Bar dataKey="Расходы" fill="var(--destructive)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}