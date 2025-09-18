import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import * as XLSX from 'xlsx';

const SettingsPage: React.FC = () => {
  const [newCategory, setNewCategory] = useState('');
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense');
  const [cnyToMopRate, setCnyToMopRate] = useState('');
  const [mopToCnyRate, setMopToCnyRate] = useState('');
  const [exportFormat, setExportFormat] = useState<'json' | 'excel'>('json');

  // 获取所有分类
  const categories = useLiveQuery(() => db.categories.toArray());
  
  // 获取汇率设置
  const exchangeRates = useLiveQuery(() => db.exchangeRates.toArray());

  // 初始化汇率表单
  React.useEffect(() => {
    if (exchangeRates) {
      const cnyToMop = exchangeRates.find(r => r.fromCurrency === 'CNY' && r.toCurrency === 'MOP');
      const mopToCny = exchangeRates.find(r => r.fromCurrency === 'MOP' && r.toCurrency === 'CNY');
      
      if (cnyToMop) setCnyToMopRate(cnyToMop.rate.toString());
      if (mopToCny) setMopToCnyRate(mopToCny.rate.toString());
    }
  }, [exchangeRates]);

  // 添加新分类
  const addCategory = async () => {
    if (!newCategory.trim()) {
      alert('请输入分类名称');
      return;
    }

    try {
      await db.categories.add({
        name: newCategory.trim(),
        type: categoryType
      });
      setNewCategory('');
      alert('分类添加成功！');
    } catch (error) {
      console.error('添加分类失败:', error);
      alert('添加失败，分类可能已存在');
    }
  };

  // 删除分类
  const deleteCategory = async (id: number) => {
    if (window.confirm('确定要删除这个分类吗？相关的交易记录将不会被删除，但分类信息会丢失。')) {
      await db.categories.delete(id);
      alert('分类删除成功！');
    }
  };

  // 更新汇率
  const updateExchangeRate = async (fromCurrency: 'CNY' | 'MOP', toCurrency: 'CNY' | 'MOP', rate: number) => {
    try {
      // 查找现有汇率记录
      const existingRate = await db.exchangeRates
        .where('fromCurrency').equals(fromCurrency)
        .and(r => r.toCurrency === toCurrency)
        .first();

      if (existingRate) {
        // 更新现有记录
        await db.exchangeRates.update(existingRate.id!, {
          rate,
          updatedAt: new Date().toISOString()
        });
      } else {
        // 创建新记录
        await db.exchangeRates.add({
          fromCurrency,
          toCurrency,
          rate,
          updatedAt: new Date().toISOString()
        });
      }
      
      alert('汇率更新成功！');
    } catch (error) {
      console.error('更新汇率失败:', error);
      alert('更新失败，请重试');
    }
  };

  // 处理汇率表单提交
  const handleExchangeRateSubmit = (e: React.FormEvent, fromCurrency: 'CNY' | 'MOP', toCurrency: 'CNY' | 'MOP') => {
    e.preventDefault();
    const rate = parseFloat(fromCurrency === 'CNY' ? cnyToMopRate : mopToCnyRate);
    
    if (isNaN(rate) || rate <= 0) {
      alert('请输入有效的汇率（大于0的数字）');
      return;
    }

    updateExchangeRate(fromCurrency, toCurrency, rate);
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
        exportedAt: new Date().toISOString()
      };

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `money-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      alert('数据导出成功！');
    } catch (error) {
      console.error('导出数据失败:', error);
      alert('导出失败，请重试');
    }
  };

  // 导出数据到Excel
  const exportToExcel = async () => {
    try {
      const transactions = await db.transactions.toArray();
      
      // 准备Excel数据
      const worksheetData = transactions.map(transaction => ({
        '日期': new Date(transaction.date).toLocaleDateString('zh-CN'),
        '类型': transaction.amount > 0 ? '收入' : '支出',
        '分类': transaction.category,
        '金额': Math.abs(transaction.amount),
        '货币': transaction.currency,
        '描述': transaction.description || ''
      }));

      // 创建工作簿和工作表
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // 设置列宽
      const colWidths = [
        { wch: 15 }, // 日期
        { wch: 10 }, // 类型
        { wch: 15 }, // 分类
        { wch: 12 }, // 金额
        { wch: 10 }, // 货币
        { wch: 20 }  // 描述
      ];
      worksheet['!cols'] = colWidths;

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, '交易记录');

      // 生成Excel文件
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `money-tracker-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      
      alert('Excel导出成功！');
    } catch (error) {
      console.error('导出Excel失败:', error);
      alert('导出失败，请重试');
    }
  };

  // 导出数据（根据选择的格式）
  const exportData = async () => {
    if (exportFormat === 'json') {
      await exportToJSON();
    } else {
      await exportToExcel();
    }
  };

  // 导入数据
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (window.confirm('确定要导入数据吗？这将覆盖当前的所有数据。')) {
          // 清空现有数据
          await db.transactions.clear();
          await db.categories.clear();
          await db.exchangeRates.clear();
          
          // 导入新数据
          if (data.transactions) {
            await db.transactions.bulkAdd(data.transactions);
          }
          if (data.categories) {
            await db.categories.bulkAdd(data.categories);
          }
          if (data.exchangeRates) {
            await db.exchangeRates.bulkAdd(data.exchangeRates);
          }
          
          alert('数据导入成功！');
        }
      } catch (error) {
        console.error('导入数据失败:', error);
        alert('导入失败，文件格式不正确');
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // 重置文件输入
  };

  return (
    <div className="p-4 space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 text-center">设置</h2>

      {/* 分类管理 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">分类管理</h3>
        
        {/* 添加分类表单 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">添加新分类</h4>
          <div className="flex space-x-2 mb-3">
            <button
              onClick={() => setCategoryType('expense')}
              className={`px-4 py-2 rounded-md ${
                categoryType === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-200'
              }`}
            >
              支出
            </button>
            <button
              onClick={() => setCategoryType('income')}
              className={`px-4 py-2 rounded-md ${
                categoryType === 'income' ? 'bg-green-500 text-white' : 'bg-gray-200'
              }`}
            >
              收入
            </button>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="输入分类名称"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={addCategory}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              添加
            </button>
          </div>
        </div>

        {/* 分类列表 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">现有分类</h4>
          {categories && categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center">
                    <span
                      className={`w-2 h-2 rounded-full mr-2 ${
                        category.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></span>
                    <span>{category.name}</span>
                  </div>
                  <button
                    onClick={() => deleteCategory(category.id!)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">暂无分类</p>
          )}
        </div>
      </div>

      {/* 汇率设置 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">汇率设置</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 人民币兑澳门币 */}
          <form onSubmit={(e) => handleExchangeRateSubmit(e, 'CNY', 'MOP')} className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">人民币 → 澳门币</h4>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">1 ¥ =</span>
              <input
                type="number"
                step="0.01"
                value={cnyToMopRate}
                onChange={(e) => setCnyToMopRate(e.target.value)}
                placeholder="1.15"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <span className="text-gray-600">MOP</span>
            </div>
            <button
              type="submit"
              className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              更新汇率
            </button>
          </form>

          {/* 澳门币兑人民币 */}
          <form onSubmit={(e) => handleExchangeRateSubmit(e, 'MOP', 'CNY')} className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">澳门币 → 人民币</h4>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">1 MOP =</span>
              <input
                type="number"
                step="0.01"
                value={mopToCnyRate}
                onChange={(e) => setMopToCnyRate(e.target.value)}
                placeholder="0.87"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <span className="text-gray-600">¥</span>
            </div>
            <button
              type="submit"
              className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              更新汇率
            </button>
          </form>
        </div>
      </div>

      {/* 数据备份与恢复 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">数据管理</h3>
        
        {/* 导出格式选择 */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">导出格式</h4>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="exportFormat"
                value="json"
                checked={exportFormat === 'json'}
                onChange={(e) => setExportFormat(e.target.value as 'json' | 'excel')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">JSON格式</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="exportFormat"
                value="excel"
                checked={exportFormat === 'excel'}
                onChange={(e) => setExportFormat(e.target.value as 'json' | 'excel')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Excel格式</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {exportFormat === 'json' 
              ? 'JSON格式适合程序读取和备份，包含完整的数据结构'
              : 'Excel格式适合人工查看和编辑，只包含交易记录'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={exportData}
            className="px-4 py-3 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            📥 导出数据
          </button>
          
          <label className="px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-center cursor-pointer">
            📤 导入数据
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </label>
        </div>
        
        <p className="text-sm text-gray-500 mt-3">
          建议定期备份数据，以防数据丢失。导入数据将覆盖当前所有数据。
        </p>
      </div>

      {/* 应用信息 */}
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h3 className="text-lg font-medium mb-2">关于</h3>
        <p className="text-gray-600">记账应用 v1.0.0</p>
        <p className="text-sm text-gray-500 mt-2">
          支持人民币和澳门币双币种记账，自动汇率转换
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;