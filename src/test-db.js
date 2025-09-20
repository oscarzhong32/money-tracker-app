// 简单的数据库测试脚本
import { db } from './services/db';

async function testDatabase() {
  try {
    const transactions = await db.transactions.toArray();
    console.log('数据库中的交易记录:', transactions);
    console.log('记录数量:', transactions.length);
    
    // 检查9月份的支出记录
    const septemberExpenses = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === 8 && // 9月（0-based）
             date.getFullYear() === 2025 &&
             t.amount < 0;
    });
    
    console.log('9月份支出记录:', septemberExpenses);
    console.log('9月份支出记录数量:', septemberExpenses.length);
    
  } catch (error) {
    console.error('数据库查询错误:', error);
  }
}

// 运行测试
testDatabase();