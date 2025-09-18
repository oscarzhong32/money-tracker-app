import Dexie, { Table } from 'dexie';

// 定义交易记录的接口
export interface Transaction {
  id?: number;
  amount: number;
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
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  exchangeRates!: Table<ExchangeRate>;

  constructor() {
    super('MoneyTrackerDB');
    
    // 定义数据库结构
    this.version(1).stores({
      transactions: '++id, currency, category, date',
      categories: '++id, name',
      exchangeRates: '++id, date'
    });
  }
}

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