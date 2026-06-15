"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartData } from "./registry";

export function BalanceTrendChart({ transactions, accounts }: ChartData) {
  const days = 30;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  const currentBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = now - i * dayMs;
    
    let balance = currentBalance;
    const futureTx = transactions.filter(tx => tx.date >= dayStart);
    
    for (const tx of futureTx) {
      if (tx.type === "income") balance -= tx.amount;
      if (tx.type === "expense") balance += tx.amount;
      // Для transfer баланс не меняется в сумме, так как деньги просто перемещаются
    }
    
    data.push({
      date: new Date(dayStart).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      balance: Math.round(balance),
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
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis 
          dataKey="date" 
          stroke="var(--muted-foreground)" 
          fontSize={10}
          interval="preserveStartEnd"
        />
        <YAxis 
          stroke="var(--muted-foreground)" 
          fontSize={10}
          tickFormatter={(value: any) => value != null ? `${(Number(value) / 1000).toFixed(0)}к` : '0'}
        />
        <Tooltip 
          formatter={(value: any) => value != null ? `${Number(value).toLocaleString('ru-RU')} ₽` : '0 ₽'}
          contentStyle={{ 
            backgroundColor: "var(--card)", 
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--foreground)"
          }}
        />
        <Line 
          type="monotone" 
          dataKey="balance" 
          stroke="var(--primary)" 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}