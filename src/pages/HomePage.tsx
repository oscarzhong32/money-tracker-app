import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Link } from 'react-router-dom';


const HomePage: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<'MOP' | 'CNY' | 'ALL'>('ALL');
  
  // 使用 Dexie 的 useLiveQuery 钩子获取交易记录
  const transactions = useLiveQuery(
    () => {
      let query = db.transactions.orderBy('date').reverse();
      
      if (selectedCurrency !== 'ALL') {
        query = query.filter(t => t.currency === selectedCurrency);
      }
      
      return query.toArray();
    },
    [selectedCurrency]
  );

  // 格式化日期
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  // 删除交易记录
  const deleteTransaction = async (id?: number) => {
    if (id !== undefined && window.confirm('确定要删除这条记录吗？')) {
      await db.transactions.delete(id);
    }
  };

  // 计算总金额
  const calculateTotal = (currency: 'MOP' | 'CNY') => {
    if (!transactions) return 0;
    
    return transactions
      .filter(t => t.currency === currency)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">交易记录</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setSelectedCurrency('ALL')}
            className={`px-3 py-1 rounded-md ${selectedCurrency === 'ALL' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            全部
          </button>
          <button 
            onClick={() => setSelectedCurrency('MOP')}
            className={`px-3 py-1 rounded-md ${selectedCurrency === 'MOP' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            澳门币
          </button>
          <button 
            onClick={() => setSelectedCurrency('CNY')}
            className={`px-3 py-1 rounded-md ${selectedCurrency === 'CNY' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            人民币
          </button>
        </div>
      </div>

      {/* 余额摘要 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">澳门币总额</h3>
          <p className="text-2xl font-bold">MOP {calculateTotal('MOP').toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">人民币总额</h3>
          <p className="text-2xl font-bold">¥ {calculateTotal('CNY').toFixed(2)}</p>
        </div>
      </div>

      {/* 交易列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {transactions && transactions.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {transactions.map(transaction => (
              <li key={transaction.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(transaction.date)} · {transaction.category}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`font-bold ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {transaction.currency === 'MOP' ? 'MOP ' : '¥ '}
                      {transaction.amount.toFixed(2)}
                    </span>
                    <div className="flex space-x-2">
                      <Link to={`/edit/${transaction.id}`}>
                        <span className="text-blue-500 cursor-pointer">✏️</span>
                      </Link>
                      <span 
                        className="text-red-500 cursor-pointer"
                        onClick={() => deleteTransaction(transaction.id)}
                      >🗑️</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-gray-500">
            {transactions ? '没有交易记录' : '加载中...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;