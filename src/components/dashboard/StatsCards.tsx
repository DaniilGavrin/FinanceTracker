interface Props {
  totalBalance: number;
  totalCreditLimit: number;
  totalDebt: number;
}

export function StatsCards({ totalBalance, totalCreditLimit, totalDebt }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="card">
        <p className="text-sm text-muted-foreground">Свободные средства</p>
        <p className="text-2xl font-bold text-accent mt-1">₽ {totalBalance.toLocaleString('ru-RU')}</p>
        <p className="text-xs text-muted-foreground mt-1">Дебетовые карты и наличные</p>
      </div>
      <div className="card">
        <p className="text-sm text-muted-foreground">Доступный лимит</p>
        <p className="text-2xl font-bold text-primary mt-1">₽ {totalCreditLimit.toLocaleString('ru-RU')}</p>
        <p className="text-xs text-muted-foreground mt-1">Кредитные карты (деньги банка)</p>
      </div>
      <div className="card">
        <p className="text-sm text-muted-foreground">Общий долг</p>
        <p className="text-2xl font-bold text-destructive mt-1">₽ {totalDebt.toLocaleString('ru-RU')}</p>
        <p className="text-xs text-muted-foreground mt-1">Все обязательства</p>
      </div>
    </div>
  );
}