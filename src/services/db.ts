import Dexie, { Table } from 'dexie';

// 定义交易记录的接口
export interface Transaction {
  id?: number;
  amount: number;
<<<<<<< HEAD
  currency: 'MOP' | 'CNY'; // MOP: 澳门币, CNY: 人民币
  category: string;
  description: string;
  date: Date;
  exchangeRate?: number; // 当时的汇率
}

// 定义分类的接口
export interface Category {
  id?: number;
  name: string;
  icon: string;
}

// 定义汇率记录的接口
export interface ExchangeRate {
  id?: number;
  date: Date;
  rate: number; // 1 CNY = ? MOP
}

// 创建数据库类
class MoneyTrackerDatabase extends Dexie {
=======
  currency: 'CNY' | 'MOP';
  category: string;
  description: string;
  date: string;
  exchangeRate?: number; // 汇率，用于货币转换
}

// 定义分类设置的接口
export interface Category {
  id?: number;
  name: string;
  type: 'income' | 'expense';
}

// 定义汇率设置的接口
export interface ExchangeRate {
  id?: number;
  fromCurrency: 'CNY' | 'MOP';
  toCurrency: 'CNY' | 'MOP';
  rate: number;
  updatedAt: string;
}

// 创建数据库类
export class MoneyTrackerDB extends Dexie {
>>>>>>> 242aa4e8d8cc742b6d1fa73f61ab1631a824e3a3
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  exchangeRates!: Table<ExchangeRate>;

  constructor() {
    super('MoneyTrackerDB');
    
<<<<<<< HEAD
    // 定义数据库结构
    this.version(1).stores({
      transactions: '++id, currency, category, date',
      categories: '++id, name',
      exchangeRates: '++id, date'
=======
    this.version(1).stores({
      transactions: '++id, amount, currency, category, date',
      categories: '++id, name, type',
      exchangeRates: '++id, fromCurrency, toCurrency, updatedAt'
>>>>>>> 242aa4e8d8cc742b6d1fa73f61ab1631a824e3a3
    });
  }
}

<<<<<<< HEAD
// 创建并导出数据库实例
export const db = new MoneyTrackerDatabase();

// 预定义的分类
export const defaultCategories: Category[] = [
  { name: '食物', icon: 'food' },
  { name: '交通', icon: 'transport' },
  { name: '住宿', icon: 'home' },
  { name: '娱乐', icon: 'entertainment' },
  { name: '购物', icon: 'shopping' },
  { name: '医疗', icon: 'medical' },
  { name: '教育', icon: 'education' },
  { name: '生活用品', icon: 'daily' },
  { name: '其他', icon: 'other' }
];

// 初始化数据库
export async function initializeDatabase() {
  // 检查分类表是否为空
  const categoryCount = await db.categories.count();
  
  // 如果为空，添加默认分类
  if (categoryCount === 0) {
    await db.categories.bulkAdd(defaultCategories);
  }
  
  // 添加默认汇率（如果需要）
  const rateCount = await db.exchangeRates.count();
  if (rateCount === 0) {
    await db.exchangeRates.add({
      date: new Date(),
      rate: 1.03 // 默认汇率：1 CNY = 1.03 MOP
    });
  }
}
=======
// 创建数据库实例
export const db = new MoneyTrackerDB();

// 初始化默认数据
export const initializeDatabase = async () => {
  // 初始化默认分类
  const defaultCategories: Category[] = [
    { name: '食物', type: 'expense' },
    { name: '交通', type: 'expense' },
    { name: '住房', type: 'expense' },
    { name: '娱乐', type: 'expense' },
    { name: '医疗', type: 'expense' },
    { name: '教育', type: 'expense' },
    { name: '购物', type: 'expense' },
    { name: '生活用品', type: 'expense' },
    { name: '工资', type: 'income' },
    { name: '投资', type: 'income' },
    { name: '奖金', type: 'income' },
    { name: '其他收入', type: 'income' }
  ];

  // 检查是否已有分类
  const existingCategories = await db.categories.count();
  if (existingCategories === 0) {
    await db.categories.bulkAdd(defaultCategories);
  }

  // 初始化默认汇率（人民币兑澳门币，假设汇率为1.15）
  const existingRates = await db.exchangeRates.count();
  if (existingRates === 0) {
    await db.exchangeRates.add({
      fromCurrency: 'CNY',
      toCurrency: 'MOP',
      rate: 1.15,
      updatedAt: new Date().toISOString()
    });
    await db.exchangeRates.add({
      fromCurrency: 'MOP',
      toCurrency: 'CNY',
      rate: 0.87,
      updatedAt: new Date().toISOString()
    });
  }
};

// 货币转换函数
export const convertCurrency = async (
  amount: number,
  fromCurrency: 'CNY' | 'MOP',
  toCurrency: 'CNY' | 'MOP'
): Promise<number> => {
  if (fromCurrency === toCurrency) return amount;

  const rate = await db.exchangeRates
    .where('fromCurrency').equals(fromCurrency)
    .and(r => r.toCurrency === toCurrency)
    .first();

  return rate ? amount * rate.rate : amount;
};

// 获取所有交易的总金额（转换为指定货币）
export const getTotalAmount = async (currency: 'CNY' | 'MOP' = 'CNY') => {
  const transactions = await db.transactions.toArray();
  
  let total = 0;
  for (const transaction of transactions) {
    if (transaction.currency === currency) {
      total += transaction.amount;
    } else {
      const convertedAmount = await convertCurrency(
        transaction.amount,
        transaction.currency,
        currency
      );
      total += convertedAmount;
    }
  }
  
  return total;
};
>>>>>>> 242aa4e8d8cc742b6d1fa73f61ab1631a824e3a3
