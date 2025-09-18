import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, Transaction } from '../services/db';
import { useLiveQuery } from 'dexie-react-hooks';

const AddTransactionPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = id !== undefined;
  
  // 表单状态
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [currency, setCurrency] = useState<'MOP' | 'CNY'>('MOP');
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
  });
  const [exchangeRate, setExchangeRate] = useState<string>('1.03');
  
  // 从数据库获取分类列表
  const categories = useLiveQuery(() => db.categories.toArray());
  
  // 如果是编辑模式，加载现有交易数据
  useEffect(() => {
    if (isEditing && id) {
      const loadTransaction = async () => {
        const transaction = await db.transactions.get(parseInt(id));
        if (transaction) {
          setAmount(Math.abs(transaction.amount).toString());
          setDescription(transaction.description);
          setCategory(transaction.category);
          setCurrency(transaction.currency);
          const transactionDate = new Date(transaction.date);
          setDate(`${transactionDate.getDate().toString().padStart(2, '0')}/${(transactionDate.getMonth() + 1).toString().padStart(2, '0')}/${transactionDate.getFullYear()}`);
          if (transaction.exchangeRate) {
            setExchangeRate(transaction.exchangeRate.toString());
          }
        }
      };
      
      loadTransaction();
    }
  }, [id, isEditing]);
  
  // 获取最新的汇率
  useEffect(() => {
    const getLatestRate = async () => {
      const latestRate = await db.exchangeRates
        .orderBy('date')
        .reverse()
        .first();
      
      if (latestRate) {
        setExchangeRate(latestRate.rate.toString());
      }
    };
    
    getLatestRate();
  }, []);
  
  // 保存交易记录
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description || !category) {
      alert('请填写所有必填字段');
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      alert('请输入有效金额');
      return;
    }
    
    const parsedExchangeRate = parseFloat(exchangeRate);
    if (isNaN(parsedExchangeRate) || parsedExchangeRate <= 0) {
      alert('请输入有效汇率');
      return;
    }
    
    // 验证日期格式 (DD/MM/YYYY)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(date)) {
      alert('请输入有效的日期格式 (DD/MM/YYYY)');
      return;
    }
    
    // 验证日期是否有效
    const [day, month, year] = date.split('/').map(Number);
    const dateObj = new Date(year, month - 1, day);
    if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
      alert('请输入有效的日期');
      return;
    }
    
    const transactionData: Transaction = {
      amount: parsedAmount,
      description,
      category,
      currency,
      date: new Date(date.split('/').reverse().join('-')),
      exchangeRate: parsedExchangeRate
    };
    
    try {
      if (isEditing && id) {
        await db.transactions.update(parseInt(id), transactionData);
      } else {
        await db.transactions.add(transactionData);
        
        // 保存当前汇率
        await db.exchangeRates.add({
          date: new Date(),
          rate: parsedExchangeRate
        });
      }
      
      // 返回首页
      navigate('/');
    } catch (error) {
      console.error('保存交易记录时出错:', error);
      alert('保存失败，请重试');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 to-purple-50/80 py-8 px-4">
      <div className="max-w-md mx-auto bg-white/95 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-sm border border-white/20">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center rounded-b-[2rem]">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isEditing ? '编辑交易' : '新增交易'}
          </h1>
          <p className="text-blue-100/90">记录您的财务收支</p>
        </div>
        
        {/* 表单内容 */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 金额 */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 flex items-center">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-2">💰</span>
                金额 *
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-200/80 rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-400/80 transition-all duration-200 bg-gray-50/60 backdrop-blur-sm"
                placeholder="0.00"
                required
              />
            </div>
            
            {/* 描述 */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 flex items-center">
                <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs mr-2">📝</span>
                描述 *
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-200/80 rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-400/80 transition-all duration-200 bg-gray-50/60 backdrop-blur-sm"
                placeholder="请输入交易描述"
                required
              />
            </div>
            
            {/* 分类 */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 flex items-center">
                <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs mr-2">🏷️</span>
                分类 *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-5 py-4 border border-gray-200/80 rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-400/80 transition-all duration-200 bg-gray-50/60 backdrop-blur-sm appearance-none"
                required
              >
                <option value="">请选择分类</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 货币 */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 flex items-center">
                <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs mr-2">💱</span>
                货币
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col items-center p-4 border-2 border-gray-200/60 rounded-[1.5rem] cursor-pointer transition-all duration-200 hover:border-blue-400/60 hover:shadow-md has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/50">
                  <input
                    type="radio"
                    value="MOP"
                    checked={currency === 'MOP'}
                    onChange={() => setCurrency('MOP')}
                    className="sr-only"
                  />
                  <span className="text-2xl mb-2">🇲🇴</span>
                  <span className="text-sm font-medium text-gray-700">澳门币</span>
                  <span className="text-xs text-gray-500">MOP</span>
                </label>
                <label className="flex flex-col items-center p-4 border-2 border-gray-200/60 rounded-[1.5rem] cursor-pointer transition-all duration-200 hover:border-blue-400/60 hover:shadow-md has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/50">
                  <input
                    type="radio"
                    value="CNY"
                    checked={currency === 'CNY'}
                    onChange={() => setCurrency('CNY')}
                    className="sr-only"
                  />
                  <span className="text-2xl mb-2">🇨🇳</span>
                  <span className="text-sm font-medium text-gray-700">人民币</span>
                  <span className="text-xs text-gray-500">CNY</span>
                </label>
              </div>
            </div>
            
            {/* 汇率 */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 flex items-center">
                <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs mr-2">📊</span>
                汇率 (1 CNY = ? MOP)
              </label>
              <input
                type="number"
                step="0.0001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-200/80 rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-400/80 transition-all duration-200 bg-gray-50/60 backdrop-blur-sm"
                placeholder="1.03"
                required
              />
            </div>
            
            {/* 日期 */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 flex items-center">
                <span className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs mr-2">📅</span>
                日期 (DD/MM/YYYY) *
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-5 py-4 border border-gray-200/80 rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-400/80 transition-all duration-200 bg-gray-50/60 backdrop-blur-sm"
                placeholder="DD/MM/YYYY"
                pattern="\d{2}/\d{2}/\d{4}"
                required
              />
            </div>
            
            {/* 提交按钮 */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-5 px-6 rounded-[2rem] shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200/50 flex items-center justify-center space-x-2"
              >
                <span>{isEditing ? '🔄' : '💾'}</span>
                <span>{isEditing ? '更新记录' : '保存记录'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionPage;