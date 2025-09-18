import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { useNavigate } from 'react-router-dom';

const AddTransactionPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'CNY' as 'CNY' | 'MOP',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // 获取所有分类
  const categories = useLiveQuery(() => db.categories.toArray());

  // 收入/支出切换
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category) {
      alert('请填写金额和分类');
      return;
    }

    // 根据交易类型自动处理金额正负
    const amountValue = parseFloat(formData.amount);
    const finalAmount = transactionType === 'income' ? Math.abs(amountValue) : -Math.abs(amountValue);

    try {
      await db.transactions.add({
        amount: finalAmount,
        currency: formData.currency,
        category: formData.category,
        description: formData.description || '无描述',
        date: formData.date
      });

      // 重置表单
      setFormData({
        amount: '',
        currency: 'CNY',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });

      alert('添加成功！');
      navigate('/');
    } catch (error) {
      console.error('添加交易失败:', error);
      alert('添加失败，请重试');
    }
  };

  // 处理输入变化
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 根据类型过滤分类
  const filteredCategories = categories?.filter(cat => cat.type === transactionType);

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 text-center">添加交易记录</h2>

      {/* 收入/支出切换 */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setTransactionType('expense')}
          className={`px-6 py-2 rounded-lg font-medium ${
            transactionType === 'expense'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          支出
        </button>
        <button
          onClick={() => setTransactionType('income')}
          className={`px-6 py-2 rounded-lg font-medium ${
            transactionType === 'income'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          收入
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 金额 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            金额 ({transactionType === 'income' ? '正数' : '负数'})
          </label>
          <div className="flex items-center">
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
            >
              <option value="CNY">¥ 人民币</option>
              <option value="MOP">MOP 澳门币</option>
            </select>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="0.00"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* 分类 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            分类
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">选择分类</option>
            {filteredCategories?.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            描述（可选）
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="例如：午餐、交通费等"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 日期 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            日期
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          添加交易
        </button>
      </form>

      {/* 快捷操作 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">快捷金额</h3>
        <div className="grid grid-cols-4 gap-2">
          {[10, 20, 50, 100, 200, 500, 1000].map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleInputChange('amount', amount.toString())}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 text-sm"
            >
              {amount}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddTransactionPage;