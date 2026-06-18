# Finance Tracker - Структура проекта

## app/
- `app/globals.css` - глобальные стили, CSS-переменные темы, Tailwind
- `app/layout.tsx` - корневой layout приложения, metadata
- `app/page.tsx` - главная страница, роутинг между вкладками, управление модалками

## components/
- `components/AddAccountForm.tsx` - форма добавления счёта (дебет/кредит/наличные/рассрочка)
- `components/AddDebtForm.tsx` - форма добавления обязательства (кредит/рассрочка/физлицо)
- `components/AddTransactionForm.tsx` - форма новой операции (расход/доход/перевод/гашение долга)
- `components/CollapsibleSection.tsx` - сворачиваемая секция с заголовком
- `components/ConfirmDialog.tsx` - диалог подтверждения удаления
- `components/FAQModal.tsx` - модалка с частыми вопросами
- `components/PermissionChecker.tsx` - проверка и запрос разрешений (камера, уведомления, сеть, Bluetooth)
- `components/PickerModal.tsx` - универсальный пикер для выбора счёта/долга

## components/charts/
- `components/charts/ChartPicker.tsx` - модалка выбора графиков для отображения
- `components/charts/ChartWidget.tsx` - обёртка для графика с заголовком и кнопкой удаления

## components/dashboard/
- `components/dashboard/StatsCards.tsx` - 3 карточки статистики (свободные средства/лимит/долг)

## components/layout/
- `components/layout/BottomNav.tsx` - нижняя навигация с 4 вкладками

## components/lists/
- `components/lists/AccountItem.tsx` - карточка счёта в списке
- `components/lists/DebtItem.tsx` - карточка долга в списке
- `components/lists/TransactionItem.tsx` - карточка транзакции с иконкой и суммой

## components/views/
- `components/views/AccountDetailView.tsx` - экран деталей счёта с историей операций
- `components/views/AccountsView.tsx` - список счетов и обязательств
- `components/views/DebtDetailView.tsx` - экран деталей долга с расчётом платежей
- `components/views/HomeView.tsx` - главная страница с карточками и графиками
- `components/views/SettingsView.tsx` - настройки: разрешения, хранилище, очистка
- `components/views/TransactionsView.tsx` - список всех транзакций с пагинацией

## db/
- `db/index.ts` - бизнес-логика: создание/удаление/редактирование счетов, долгов, транзакций

## hooks/
- `hooks/useDatabase.ts` - загрузка данных из БД, функция refresh
- `hooks/useDeviceInfo.ts` - получение информации об устройстве
- `hooks/useFinanceMetrics.ts` - расчёт свободных средств, лимита, общего долга
- `hooks/useModalBackHandler.ts` - обработка аппаратной кнопки "Назад" на Android
- `hooks/useStorageInfo.ts` - проверка размера БД и свободного места

## lib/
- `lib/categories.ts` - список категорий расходов и доходов с иконками
- `lib/database.ts` - слой абстракции БД (SQLite через Capacitor), миграции
- `lib/migration.ts` - миграция данных с IndexedDB на SQLite

## lib/charts/
- `lib/charts/BalanceTrendChart.tsx` - линейный график динамики баланса за 30 дней
- `lib/charts/ExpensesByCategoryChart.tsx` - круговая диаграмма расходов по категориям
- `lib/charts/MonthlyActivityChart.tsx` - столбчатая диаграмма доходов/расходов за 6 месяцев
- `lib/charts/registry.ts` - реестр всех доступных графиков