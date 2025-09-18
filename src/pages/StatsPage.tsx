import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// 注册Chart.js组件
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const StatsPage: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<'MOP' | 'CNY'>('MOP');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  
  // 获取交易数据
  const transactions = useLiveQuery(() => db.transactions.toArray());
  
  // 根据时间范围筛选交易
  const getFilteredTransactions = () => {
    if (!transactions) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return transactions.filter(t => 
      t.currency === selectedCurrency && 
      new Date(t.date) >= startDate
    );
  };
  
  // 按分类汇总数据
  const getCategoryData = () => {
    const filtered = getFilteredTransactions();
    const categoryMap = new Map<string, number>();
    
    filtered.forEach(transaction => {
      const currentAmount = categoryMap.get(transaction.category) || 0;
      categoryMap.set(transaction.category, currentAmount + Math.abs(transaction.amount));
    });
    
    return {
      labels: Array.from(categoryMap.keys()),
      datasets: [
        {
          data: Array.from(categoryMap.values()),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#8AC926', '#1982C4', '#6A4C93', '#F45B69'
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  // 按月份汇总数据
  const getMonthlyData = () => {
    const filtered = getFilteredTransactions();
    const monthlyMap = new Map<string, number>();
    
    // 初始化最近12个月
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      months.unshift(monthKey);
      monthlyMap.set(monthKey, 0);
    }
    
    filtered.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (monthlyMap.has(monthKey)) {
        const currentAmount = monthlyMap.get(monthKey) || 0;
        monthlyMap.set(monthKey, currentAmount + transaction.amount);
      }
    });
    
    // 格式化月份标签
    const formattedLabels = months.map(month => {
      const [year, monthNum] = month.split('-');
      return `${year}/${monthNum}`;
    });
    
    return {
      labels: formattedLabels,
      datasets: [
        {
          label: selectedCurrency === 'MOP' ? '澳门币' : '人民币',
          data: months.map(month => monthlyMap.get(month) || 0),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };
  };
  
  // 计算总金额
  const calculateTotal = () => {
    const filtered = getFilteredTransactions();
    return filtered.reduce((sum, transaction) => sum + transaction.amount, 0);
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">统计分析</h2>
      
      {/* 筛选器 */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            货币
          </label>
          <div className="flex space-x-2">
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
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            时间范围
          </label>
          <div className="flex space-x-2">
            <button 
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 rounded-md ${timeRange === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              一周
            </button>
            <button 
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 rounded-md ${timeRange === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              一月
            </button>
            <button 
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1 rounded-md ${timeRange === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              一年
            </button>
          </div>
        </div>
      </div>
      
      {/* 总金额摘要 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm text-gray-500">
          {timeRange === 'week' ? '本周' : timeRange === 'month' ? '本月' : '本年'}总金额
        </h3>
        <p className="text-2xl font-bold">
          {selectedCurrency === 'MOP' ? 'MOP ' : '¥ '}
          {calculateTotal().toFixed(2)}
        </p>
      </div>
      
      {/* 图表 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 分类饼图 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">分类支出</h3>
          <div className="h-64">
            {transactions && transactions.length > 0 ? (
              <Pie data={getCategoryData()} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                暂无数据
              </div>
            )}
          </div>
        </div>
        
        {/* 月度柱状图 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">月度趋势</h3>
          <div className="h-64">
            {transactions && transactions.length > 0 ? (
              <Bar 
                data={getMonthlyData()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                暂无数据
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;