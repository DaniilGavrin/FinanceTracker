export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: CategoryType;
}

export const DEFAULT_CATEGORIES: Category[] = [
  // Расходы
  { id: 'food', name: 'Еда и продукты', icon: '🍔', type: 'expense' },
  { id: 'transport', name: 'Транспорт', icon: '🚕', type: 'expense' },
  { id: 'home', name: 'Жильё и ЖКХ', icon: '🏠', type: 'expense' },
  { id: 'entertainment', name: 'Развлечения', icon: '🎬', type: 'expense' },
  { id: 'health', name: 'Здоровье', icon: '💊', type: 'expense' },
  { id: 'shopping', name: 'Покупки', icon: '🛍️', type: 'expense' },
  { id: 'education', name: 'Обучение', icon: '📚', type: 'expense' },
  { id: 'debt_payment', name: 'Платеж по долгу', icon: '💳', type: 'expense' },
  { id: 'other_expense', name: 'Другое', icon: '📦', type: 'expense' },
  
  // Доходы
  { id: 'salary', name: 'Зарплата', icon: '💰', type: 'income' },
  { id: 'freelance', name: 'Фриланс / Подработка', icon: '💻', type: 'income' },
  { id: 'gift', name: 'Подарки', icon: '🎁', type: 'income' },
  { id: 'cashback', name: 'Кэшбэк / Проценты', icon: '🔄', type: 'income' },
  { id: 'other_income', name: 'Другое', icon: '💵', type: 'income' },
];

export function getCategoryById(id: string): Category | undefined {
  return DEFAULT_CATEGORIES.find(c => c.id === id);
}