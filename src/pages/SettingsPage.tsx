import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import * as XLSX from 'xlsx';

const SettingsPage: React.FC = () => {
  // 分类管理状态
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('other');
  
  // 汇率管理状态
  const [newExchangeRate, setNewExchangeRate] = useState('');
  
  // 从数据库获取分类和汇率
  const categories = useLiveQuery(() => db.categories.toArray());
  const exchangeRates = useLiveQuery(() => 
    db.exchangeRates.orderBy('date').reverse().limit(5).toArray()
  );
  
  // 添加新分类
  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      alert('请输入分类名称');
      return;
    }
    
    try {
      await db.categories.add({
        name: newCategoryName.trim(),
        icon: newCategoryIcon || 'other',
        type: 'expense' // 默认设为支出类型
      });
      
      // 清空表单
      setNewCategoryName('');
      setNewCategoryIcon('other');
    } catch (error) {
      console.error('添加分类失败:', error);
      alert('添加分类失败，请重试');
    }
  };
  
  // 删除分类
  const deleteCategory = async (id?: number) => {
    if (id === undefined) return;
    
    if (window.confirm('确定要删除这个分类吗？相关交易记录的分类将变为"其他"')) {
      try {
        // 首先更新使用此分类的所有交易记录
        const transactions = await db.transactions
          .where('category')
          .equals(categories?.find(c => c.id === id)?.name || '')
          .toArray();
        
        for (const transaction of transactions) {
          await db.transactions.update(transaction.id!, {
            category: '其他'
          });
        }
        
        // 然后删除分类
        await db.categories.delete(id);
      } catch (error) {
        console.error('删除分类失败:', error);
        alert('删除分类失败，请重试');
      }
    }
  };
  
  // 添加汇率
  const addExchangeRate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rate = parseFloat(newExchangeRate);
    if (isNaN(rate) || rate <= 0) {
      alert('请输入有效的汇率数值');
      return;
    }
    
    try {
      await db.exchangeRates.add({
        rate: rate,
        date: new Date().toISOString().split('T')[0]
      });
      
      setNewExchangeRate('');
    } catch (error) {
      console.error('添加汇率失败:', error);
      alert('添加汇率失败，请重试');
    }
  };
  
  // 导出数据到Excel
  const exportToExcel = async () => {
    try {
      // 获取所有交易记录
      const transactions = await db.transactions.toArray();
      
      // 准备Excel数据 - 优化显示格式
      const worksheet = XLSX.utils.json_to_sheet(transactions.map(t => {
        // 格式化日期为 "19/9/2025" 格式
        const dateObj = new Date(t.date);
        const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
        
        return {
          '日期': formattedDate,
          '类型': t.type === 'income' ? '收入' : '支出',
          '金额': Math.abs(t.amount), // 显示绝对金额值
          '分类': t.category,
          '货币': t.currency,
          '备注': t.description || ''
        };
      }));
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '交易记录');
      
      // 生成Excel文件并下载
      XLSX.writeFile(workbook, '交易记录.xlsx');
      alert('数据导出成功！');
    } catch (error) {
      console.error('导出数据失败:', error);
      alert('导出数据失败，请重试');
    }
  };
  
  // 从Excel导入数据
  const importFromExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // 清空现有数据
        await db.transactions.clear();
        
        // 导入新数据
        for (const item of jsonData) {
          const transaction = item as any;
          const amount = parseFloat(transaction['金额']) || 0;
          
          // 优先使用Excel中的类型字段，如果没有则根据金额正负判断
          let type = transaction['类型'];
          if (type === '收入' || type === 'income') {
            type = 'income';
          } else if (type === '支出' || type === 'expense') {
            type = 'expense';
          } else {
            // 如果没有明确的类型字段，则根据金额正负判断
            type = amount >= 0 ? 'income' : 'expense';
          }
          
          const finalAmount = type === 'income' ? Math.abs(amount) : -Math.abs(amount);
          
          // 处理日期格式：支持 "19/9/2025" 格式和 Date 对象
          let dateValue = transaction['日期'];
          let formattedDate: string;
          
          console.log('原始日期值:', dateValue, '类型:', typeof dateValue);
          
          if (dateValue instanceof Date) {
            formattedDate = dateValue.toISOString().split('T')[0];
          } else if (typeof dateValue === 'string' && dateValue.includes('/')) {
            // 处理 "19/9/2025" 格式
            const [day, month, year] = dateValue.split('/').map(Number);
            const dateObj = new Date(year, month - 1, day);
            formattedDate = dateObj.toISOString().split('T')[0];
          } else if (typeof dateValue === 'string') {
            // 尝试解析其他格式的日期字符串
            const parsedDate = new Date(dateValue);
            if (!isNaN(parsedDate.getTime())) {
              formattedDate = parsedDate.toISOString().split('T')[0];
            } else {
              formattedDate = new Date().toISOString().split('T')[0];
            }
          } else {
            formattedDate = new Date().toISOString().split('T')[0];
          }
          
          console.log('处理后日期:', formattedDate);
          
          await db.transactions.add({
            date: formattedDate,
            type: type,
            amount: finalAmount,
            category: transaction['分类'] || '其他',
            currency: transaction['货币'] || 'MOP',
            description: transaction['备注'] || ''
          });
        }
        
        alert('数据导入成功！');
        event.target.value = ''; // 清空文件输入
      } catch (error) {
        console.error('导入数据失败:', error);
        alert('导入数据失败，请重试');
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  // 清空所有数据
  const clearAllData = async () => {
    if (window.confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      try {
        await db.transactions.clear();
        alert('数据已清空');
      } catch (error) {
        console.error('清空数据失败:', error);
        alert('清空数据失败，请重试');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">设置</h1>
        
        {/* 分类管理 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">分类管理</h2>
          <form onSubmit={addCategory} className="mb-4">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="新分类名称"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="other">其他</option>
                <option value="🍔">餐饮</option>
                <option value="🚗">交通</option>
                <option value="🏠">住房</option>
                <option value="🛒">购物</option>
                <option value="💊">医疗</option>
                <option value="🎮">娱乐</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              添加分类
            </button>
          </form>
          
          <div className="space-y-2">
            {categories?.map((category) => (
              <div key={category.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <span>{category.icon} {category.name}</span>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* 汇率管理 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">汇率管理</h2>
          <form onSubmit={addExchangeRate} className="mb-4">
            <input
              type="number"
              step="0.0001"
              value={newExchangeRate}
              onChange={(e) => setNewExchangeRate(e.target.value)}
              placeholder="人民币兑澳门币汇率"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              添加汇率
            </button>
          </form>
          
          <div className="space-y-2">
            {exchangeRates?.map((rate) => (
              <div key={rate.id} className="bg-gray-50 p-3 rounded-md">
                <div>汇率: 1 CNY = {rate.rate} MOP</div>
                <div className="text-sm text-gray-500">日期: {typeof rate.date === 'string' ? rate.date : new Date(rate.date).toISOString().split('T')[0]}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 数据管理 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">数据管理</h2>
          <button
            onClick={exportToExcel}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-md mb-2 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            导出到Excel
          </button>
          
          <label className="block w-full bg-blue-500 text-white py-2 px-4 rounded-md text-center cursor-pointer hover:bg-blue-600 mb-2">
            从Excel导入
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={importFromExcel}
              className="hidden"
            />
          </label>
          
          <button
            onClick={clearAllData}
            className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            清空所有数据
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;