"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartData } from "./registry";
import { getCategoryById } from "@/lib/categories";

export function ExpensesByCategoryChart({ transactions }: ChartData) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  
  const expenses = transactions.filter(
    tx => tx.type === "expense" && tx.date >= startOfMonth && tx.categoryId
  );

  const grouped = expenses.reduce((acc, tx) => {
    const catId = tx.categoryId!;
    acc[catId] = (acc[catId] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(grouped).map(([catId, amount]) => {
    const cat = getCategoryById(catId);
    return {
      name: cat?.name || "Без категории",
      icon: cat?.icon || "📦",
      value: amount,
    };
  }).sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
        Нет расходов в этом месяце
      </div>
    );
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: any) => value != null ? `${Number(value).toLocaleString('ru-RU')} ₽` : '0 ₽'}
          contentStyle={{ 
            backgroundColor: "var(--card)", 
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--foreground)"
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}