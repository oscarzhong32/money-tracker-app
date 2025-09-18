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
        icon: newCategoryIcon || 'other'
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
        
        // 批量更新交易记录
        await Promise.all(
          transactions.map(transaction => 
            db.transactions.update(transaction.id!, { category: '其他' })
          )
        );
        
        // 然后删除分类
        await db.categories.delete(id);
      } catch (error) {
        console.error('删除分类失败:', error);
        alert('删除分类失败，请重试');
      }
    }
  };
  
  // 添加新汇率
  const addExchangeRate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rate = parseFloat(newExchangeRate);
    if (isNaN(rate) || rate <= 0) {
      alert('请输入有效的汇率值');
      return;
    }
    
    try {
      await db.exchangeRates.add({
        date: new Date(),
        rate
      });
      
      // 清空表单
      setNewExchangeRate('');
    } catch (error) {
      console.error('添加汇率失败:', error);
      alert('添加汇率失败，请重试');
    }
  };
  
  // 格式化日期
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 导出数据到JSON
  const exportToJSON = async () => {
    try {
      const transactions = await db.transactions.toArray();
      const categories = await db.categories.toArray();
      const exchangeRates = await db.exchangeRates.toArray();
      
      const data = {
        transactions,
        categories,
        exchangeRates,
        exportDate: new Date()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `money-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出数据失败:', error);
      alert('导出数据失败，请重试');
    }
  };

  // 导出数据到Excel
  const exportToExcel = async () => {
    try {
      const transactions = await db.transactions.toArray();
      
      // 准备Excel数据
      const excelData = transactions.map(transaction => ({
        '日期': new Date(transaction.date).toLocaleDateString('zh-CN'),
        '金额': transaction.amount,
        '货币': transaction.currency,
        '描述': transaction.description,
        '分类': transaction.category,
        '汇率': transaction.exchangeRate || ''
      }));
      
      // 创建工作簿和工作表
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // 设置列宽
      const colWidths = [
        { wch: 15 }, // 日期
        { wch: 12 }, // 金额
        { wch: 8 },  // 货币
        { wch: 25 }, // 描述
        { wch: 15 }, // 分类
        { wch: 10 }  // 汇率
      ];
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, '交易记录');
      
      // 生成Excel文件
      XLSX.writeFile(wb, `money-tracker-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('导出Excel失败:', error);
      alert('导出Excel失败，请重试');
    }
  };

  // 从Excel导入数据
  const importFromExcel = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          alert('Excel文件中没有数据');
          return;
        }
        
        if (window.confirm(`将导入 ${jsonData.length} 条交易记录，确定要继续吗？`)) {
          const transactions = jsonData.map((item: any) => ({
            amount: parseFloat(item['金额'] || 0),
            description: item['描述'] || '',
            category: item['分类'] || '其他',
            currency: item['货币'] || 'MOP',
            date: new Date(item['日期']),
            exchangeRate: parseFloat(item['汇率'] || '1.03')
          }));
          
          await db.transactions.bulkAdd(transactions);
          alert(`成功导入 ${transactions.length} 条交易记录`);
          window.location.reload();
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('导入Excel失败:', error);
      alert('导入Excel失败，请确保文件格式正确');
    }
  };
  
  // 导入数据
  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        if (!data.transactions || !data.categories || !data.exchangeRates) {
          throw new Error('无效的数据格式');
        }
        
        if (window.confirm('导入将覆盖现有数据，确定要继续吗？')) {
          // 清空现有数据
          await db.transactions.clear();
          await db.categories.clear();
          await db.exchangeRates.clear();
          
          // 导入新数据
          await db.transactions.bulkAdd(data.transactions);
          await db.categories.bulkAdd(data.categories);
          await db.exchangeRates.bulkAdd(data.exchangeRates);
          
          alert('数据导入成功');
          window.location.reload();
        }
      } catch (error) {
        console.error('导入数据失败:', error);
        alert('导入数据失败，请确保文件格式正确');
      }
    };
    
    reader.readAsText(file);
  };
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">设置</h2>
      
      {/* 分类管理 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">分类管理</h3>
        
        {/* 添加分类表单 */}
        <form onSubmit={addCategory} className="mb-6">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="新分类名称"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>➕</span>
            </button>
          </div>
        </form>
        
        {/* 分类列表 */}
        <div className="space-y-2">
          {categories?.map((category) => (
            <div 
              key={category.id} 
              className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
            >
              <span>{category.name}</span>
              <button
                onClick={() => deleteCategory(category.id)}
                className="text-red-500 hover:text-red-700"
              >
                <span>🗑️</span>
              </button>
            </div>
          ))}
          
          {!categories?.length && (
            <p className="text-gray-500 text-center py-4">暂无分类</p>
          )}
        </div>
      </div>
      
      {/* 汇率管理 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">汇率管理 (1 CNY = ? MOP)</h3>
        
        {/* 添加汇率表单 */}
        <form onSubmit={addExchangeRate} className="mb-6">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              step="0.0001"
              value={newExchangeRate}
              onChange={(e) => setNewExchangeRate(e.target.value)}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如: 1.03"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>➕</span>
            </button>
          </div>
        </form>
        
        {/* 汇率历史 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 mb-2">最近汇率记录</h4>
          
          {exchangeRates?.map((rate) => (
            <div 
              key={rate.id} 
              className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
            >
              <span>1 CNY = {rate.rate} MOP</span>
              <span className="text-sm text-gray-500">{formatDate(rate.date)}</span>
            </div>
          ))}
          
          {!exchangeRates?.length && (
            <p className="text-gray-500 text-center py-4">暂无汇率记录</p>
          )}
        </div>
      </div>
      
      {/* 数据管理 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">数据管理</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={exportToJSON}
              className="bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-200 font-medium"
            >
              📊 导出JSON
            </button>
            
            <button
              onClick={exportToExcel}
              className="bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 font-medium"
            >
              📈 导出Excel
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="bg-yellow-600 text-white py-3 px-6 rounded-xl hover:bg-yellow-700 cursor-pointer text-center font-medium transition-all duration-200">
              📥 导入JSON
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
            
            <label className="bg-purple-600 text-white py-3 px-6 rounded-xl hover:bg-purple-700 cursor-pointer text-center font-medium transition-all duration-200">
              📥 导入Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importFromExcel(file);
                }}
                className="hidden"
              />
            </label>
          </div>
          
          <button
            onClick={() => {
              if (window.confirm('确定要清空所有数据吗？此操作不可恢复！')) {
                db.transactions.clear();
                alert('数据已清空');
              }
            }}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-xl hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-all duration-200 font-medium"
          >
            🗑️ 清空数据
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;