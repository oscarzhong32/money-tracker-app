import Dexie, { Table } from 'dexie';

// 定义交易记录的接口
export interface Transaction {
  id?: number;
  type: 'income' | 'expense';
  amount: number;
  currency: 'MOP' | 'CNY'; // MOP: 澳门币, CNY: 人民币
  category: string;
  description: string;
  date: string;
  exchangeRate?: number; // 当时的汇率
}

// 定义分类的接口
export interface Category {
  id?: number;
  name: string;
  icon: string;
  type: 'income' | 'expense';
}

// 定义汇率记录的接口
export interface ExchangeRate {
  id?: number;
  date: string;
  rate: number; // 1 CNY = ? MOP
}

// 创建数据库类
export class MoneyTrackerDB extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  exchangeRates!: Table<ExchangeRate>;

  constructor() {
    super('MoneyTrackerDB');
    
    this.version(1).stores({
      transactions: '++id, type, amount, currency, category, date',
      categories: '++id, name',
      exchangeRates: '++id, date'
    });
  }
}

export const db = new MoneyTrackerDB();

// 初始化默认数据
export const initializeDatabase = async () => {
  try {
    // 检查是否已经有分类数据
    const existingCategories = await db.categories.count();
    if (existingCategories === 0) {
      // 添加默认分类
      await db.categories.bulkAdd([
        { name: '餐饮', icon: '🍔', type: 'expense' },
        { name: '交通', icon: '🚗', type: 'expense' },
        { name: '住房', icon: '🏠', type: 'expense' },
        { name: '购物', icon: '🛒', type: 'expense' },
        { name: '医疗', icon: '💊', type: 'expense' },
        { name: '娱乐', icon: '🎮', type: 'expense' },
        { name: '工资', icon: '💰', type: 'income' },
        { name: '奖金', icon: '🎁', type: 'income' },
        { name: '投资', icon: '📈', type: 'income' },
        { name: '其他', icon: '📦', type: 'expense' }
      ]);
    }

    // 检查是否已经有汇率数据
    const existingRates = await db.exchangeRates.count();
    if (existingRates === 0) {
      // 添加默认汇率 (1 CNY = 1.13 MOP)
      await db.exchangeRates.add({
        date: new Date().toISOString().split('T')[0],
        rate: 1.13
      });
    }
  } catch (error) {
    console.error('初始化数据库失败:', error);
  }
};