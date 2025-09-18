import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
<<<<<<< HEAD
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
=======

// 简单的CSS图表组件
const BarChart: React.FC<{ data: Array<{ label: string; value: number; color: string }>; height?: number }> = ({ 
  data, 
  height = 200 
}) => {
  const maxValue = Math.max(...data.map(item => Math.abs(item.value)));
  
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="flex items-end h-full space-x-2">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t transition-all duration-300 hover:opacity-80"
              style={{
                height: `${(Math.abs(item.value) / maxValue) * 80}%`,
                backgroundColor: item.color,
                minHeight: '4px'
              }}
              title={`${item.label}: ${item.value.toFixed(2)}`}
            />
            <div className="text-xs text-gray-600 mt-1 truncate w-full text-center">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedCurrency, setSelectedCurrency] = useState<'CNY' | 'MOP'>('CNY');
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'trends'>('overview');
  
  const transactions = useLiveQuery(() => db.transactions.toArray());

  const calculateStats = () => {
    if (!transactions) return null;
    
    const now = new Date();
    let startDate: Date;
    
    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }
    
    const filteredTransactions = transactions.filter(
      t => new Date(t.date) >= startDate
    );
    
    // 按分类统计
    const categoryStats = filteredTransactions.reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, type: transaction.amount > 0 ? 'income' : 'expense' };
      }
      acc[category].total += transaction.amount;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number; type: 'income' | 'expense' }>);
    
    // 按货币统计
    const currencyStats = filteredTransactions.reduce((acc, transaction) => {
      const currency = transaction.currency;
      if (!acc[currency]) {
        acc[currency] = 0;
      }
      acc[currency] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // 收入支出统计
    const income = filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    // 每日趋势
    const dailyTrend = filteredTransactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { income: 0, expense: 0, net: 0 };
      }
      if (transaction.amount > 0) {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += Math.abs(transaction.amount);
      }
      acc[date].net += transaction.amount;
      return acc;
    }, {} as Record<string, { income: number; expense: number; net: number }>);

    return {
      totalTransactions: filteredTransactions.length,
      income,
      expense: Math.abs(expense),
      net: income + expense,
      categoryStats,
      currencyStats,
      dailyTrend,
      filteredTransactions
    };
  };
  
  const stats = calculateStats();
  
  if (!transactions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载交易数据中...</p>
        </div>
      </div>
    );
  }

  const getCategoryColor = (index: number, type: 'income' | 'expense') => {
    const incomeColors = ['#10B981', '#059669', '#047857', '#065F46'];
    const expenseColors = ['#EF4444', '#DC2626', '#B91C1C', '#991B1B'];
    const colors = type === 'income' ? incomeColors : expenseColors;
    return colors[index % colors.length];
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
          <div className="text-sm text-green-600 mb-2">总收入</div>
          <div className="text-2xl font-bold text-green-800">
            {selectedCurrency === 'CNY' ? '¥' : 'MOP'} {stats?.income.toFixed(2)}
          </div>
          <div className="text-xs text-green-600 mt-2">💰 积极增长</div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-sm border border-red-200">
          <div className="text-sm text-red-600 mb-2">总支出</div>
          <div className="text-2xl font-bold text-red-800">
            {selectedCurrency === 'CNY' ? '¥' : 'MOP'} {stats?.expense.toFixed(2)}
          </div>
          <div className="text-xs text-red-600 mt-2">📉 消费分析</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
          <div className="text-sm text-blue-600 mb-2">净收入</div>
          <div className={`text-2xl font-bold ${stats && stats.net >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
            {selectedCurrency === 'CNY' ? '¥' : 'MOP'} {stats?.net?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-blue-600 mt-2">
            {stats && stats.net >= 0 ? '📈 盈利中' : '📉 亏损中'}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200">
          <div className="text-sm text-purple-600 mb-2">交易笔数</div>
          <div className="text-2xl font-bold text-purple-800">{stats?.totalTransactions}</div>
          <div className="text-xs text-purple-600 mt-2">📊 总交易量</div>
        </div>
      </div>

      {/* 货币分布 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">货币分布</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600 mb-1">澳门币</div>
              <div className="text-xl font-bold text-orange-800">
                MOP {stats?.currencyStats.MOP?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="text-center p-4 bg-cyan-50 rounded-lg">
              <div className="text-sm text-cyan-600 mb-1">人民币</div>
              <div className="text-xl font-bold text-cyan-800">
                ¥ {stats?.currencyStats.CNY?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* 收支比例 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">收支比例</h3>
          {stats && stats.income + stats.expense > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">收入</span>
                <span className="text-gray-600">{((stats.income / (stats.income + stats.expense)) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.income / (stats.income + stats.expense)) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-sm mt-3">
                <span className="text-red-600">支出</span>
                <span className="text-gray-600">{((stats.expense / (stats.income + stats.expense)) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.expense / (stats.income + stats.expense)) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCategories = () => {
    if (!stats || Object.keys(stats.categoryStats).length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <p className="text-gray-500">暂无分类数据</p>
        </div>
      );
    }

    const incomeCategories = Object.entries(stats.categoryStats)
      .filter(([_, data]) => data.type === 'income')
      .sort(([, a], [, b]) => b.total - a.total);

    const expenseCategories = Object.entries(stats.categoryStats)
      .filter(([_, data]) => data.type === 'expense')
      .sort(([, a], [, b]) => Math.abs(b.total) - Math.abs(a.total));

    return (
      <div className="space-y-8">
        {/* 收入分类 */}
        {incomeCategories.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">收入分类</h3>
            <BarChart
              data={incomeCategories.map(([label, data], index) => ({
                label,
                value: data.total,
                color: getCategoryColor(index, 'income')
              }))}
              height={150}
            />
            <div className="mt-4 space-y-2">
              {incomeCategories.map(([category, data], index) => (
                <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: getCategoryColor(index, 'income') }}
                    ></div>
                    <span className="font-medium">{category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-green-600 font-semibold">+{data.total.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{data.count} 笔交易</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 支出分类 */}
        {expenseCategories.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">支出分类</h3>
            <BarChart
              data={expenseCategories.map(([label, data], index) => ({
                label,
                value: Math.abs(data.total),
                color: getCategoryColor(index, 'expense')
              }))}
              height={150}
            />
            <div className="mt-4 space-y-2">
              {expenseCategories.map(([category, data], index) => (
                <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: getCategoryColor(index, 'expense') }}
                    ></div>
                    <span className="font-medium">{category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-red-600 font-semibold">-{Math.abs(data.total).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{data.count} 笔交易</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTrends = () => {
    if (!stats || Object.keys(stats.dailyTrend).length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📈</div>
          <p className="text-gray-500">暂无趋势数据</p>
        </div>
      );
    }

    const dailyData = Object.entries(stats.dailyTrend)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-7); // 只显示最近7天

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">近期趋势</h3>
          <div className="h-64">
            <div className="flex items-end h-48 space-x-2">
              {dailyData.map(([date, data], index) => (
                <div key={date} className="flex-1 flex flex-col items-center">
                  <div className="flex items-end justify-center space-x-1 mb-2">
                    {/* 收入柱 */}
                    <div
                      className="w-3 bg-green-400 rounded-t transition-all duration-300 hover:bg-green-500"
                      style={{ height: `${(data.income / Math.max(...dailyData.map(d => d[1].income))) * 80}%` }}
                      title={`收入: ${data.income.toFixed(2)}`}
                    />
                    {/* 支出柱 */}
                    <div
                      className="w-3 bg-red-400 rounded-t transition-all duration-300 hover:bg-red-500"
                      style={{ height: `${(data.expense / Math.max(...dailyData.map(d => d[1].expense))) * 80}%` }}
                      title={`支出: ${data.expense.toFixed(2)}`}
                    />
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    {new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
            
            {/* 图例 */}
            <div className="flex justify-center space-x-4 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded mr-2"></div>
                <span className="text-xs text-gray-600">收入</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-400 rounded mr-2"></div>
                <span className="text-xs text-gray-600">支出</span>
              </div>
            </div>
          </div>
        </div>

        {/* 详细日数据 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">每日明细</h3>
          <div className="space-y-3">
            {dailyData.map(([date, data]) => (
              <div key={date} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">
                  {new Date(date).toLocaleDateString('zh-CN', { 
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                <div className="text-right">
                  <div className="text-sm">
                    <span className="text-green-600">+{data.income.toFixed(2)}</span>
                    {' • '}
                    <span className="text-red-600">-{data.expense.toFixed(2)}</span>
                  </div>
                  <div className={`text-xs ${data.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    净: {data.net >= 0 ? '+' : ''}{data.net.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <h1 className="text-2xl font-bold text-gray-800">财务统计</h1>
            
            <div className="flex flex-wrap gap-4">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as 'CNY' | 'MOP')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="CNY">人民币 (¥)</option>
                <option value="MOP">澳门币 (MOP)</option>
              </select>
              
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'year')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="year">今年</option>
              </select>
            </div>
          </div>

          {/* 标签导航 */}
          <div className="flex space-x-1 mt-6 p-1 bg-gray-100 rounded-lg">
            {[
              { id: 'overview' as const, label: '概览', icon: '📊' },
              { id: 'categories' as const, label: '分类', icon: '🗂️' },
              { id: 'trends' as const, label: '趋势', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'categories' && renderCategories()}
          {activeTab === 'trends' && renderTrends()}
        </div>

        {/* 底部统计信息 */}
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-sm text-gray-500">
            统计时间段: {selectedPeriod === 'week' ? '最近7天' : selectedPeriod === 'month' ? '本月' : '今年'} • 
            共 {stats?.totalTransactions} 笔交易 • 
            最后更新: {new Date().toLocaleString('zh-CN')}
          </p>
>>>>>>> 242aa4e8d8cc742b6d1fa73f61ab1631a824e3a3
        </div>
      </div>
    </div>
  );
};

export default StatsPage;