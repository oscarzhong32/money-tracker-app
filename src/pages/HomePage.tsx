import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { getTotalAmount } from '../services/db';

const HomePage: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<'CNY' | 'MOP'>('CNY');
  const [totalAmount, setTotalAmount] = useState(0);

  // 获取所有交易记录
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray());

  // 计算总金额
  React.useEffect(() => {
    const calculateTotal = async () => {
      const total = await getTotalAmount(selectedCurrency);
      setTotalAmount(total);
    };
    calculateTotal();
  }, [transactions, selectedCurrency]);

  // 删除交易记录
  const deleteTransaction = async (id: number) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      await db.transactions.delete(id);
    }
  };

  // 格式化金额显示
  const formatAmount = (amount: number, currency: string) => {
    const sign = amount >= 0 ? '+' : '';
    const symbol = currency === 'CNY' ? '¥' : 'MOP';
    return `${sign}${symbol} ${Math.abs(amount).toFixed(2)}`;
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="p-4 space-y-6">
      {/* 头部统计 */}
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="flex justify-center items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mr-4">总余额</h2>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value as 'CNY' | 'MOP')}
            className="px-3 py-1 border rounded-md"
          >
            <option value="CNY">人民币 (¥)</option>
            <option value="MOP">澳门币 (MOP)</option>
          </select>
        </div>
        <p className={`text-4xl font-bold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {selectedCurrency === 'CNY' ? '¥' : 'MOP'} {totalAmount.toFixed(2)}
        </p>
      </div>

      {/* 交易记录列表 */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-800">最近交易</h3>
        {transactions && transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900">
                      {transaction.category}
                    </span>
                    <span className={`text-lg font-semibold ${
                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatAmount(transaction.amount, transaction.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{transaction.description}</span>
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteTransaction(transaction.id!)}
                  className="ml-4 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">暂无交易记录</p>
            <p className="text-gray-400 text-sm mt-2">点击底部"添加"按钮开始记账</p>
          </div>
        )}
      </div>

      {/* 快速统计 */}
      {transactions && transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4 text-gray-800">本月统计</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">收入</p>
              <p className="text-2xl font-bold text-green-600">
                {selectedCurrency === 'CNY' ? '¥' : 'MOP'} {
                  transactions
                    .filter(t => t.amount > 0 && new Date(t.date).getMonth() === new Date().getMonth())
                    .reduce((sum, t) => sum + (t.currency === selectedCurrency ? t.amount : 0), 0)
                    .toFixed(2)
                }
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">支出</p>
              <p className="text-2xl font-bold text-red-600">
                {selectedCurrency === 'CNY' ? '¥' : 'MOP'} {
                  Math.abs(transactions
                    .filter(t => t.amount < 0 && new Date(t.date).getMonth() === new Date().getMonth())
                    .reduce((sum, t) => sum + (t.currency === selectedCurrency ? t.amount : 0), 0))
                    .toFixed(2)
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;