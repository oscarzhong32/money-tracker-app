import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import Layout from '../components/Layout';

const StatsPage: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<'MOP' | 'CNY'>('MOP');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [monthlyExpenseData, setMonthlyExpenseData] = useState<Array<{ day: number; amount: number }>>([]);
  
  const transactions = useLiveQuery(() => db.transactions.toArray());

  // 获取本月每日支出数据（不分货币类型，自动转换汇率）
  useEffect(() => {
    const getMonthlyExpenseData = () => {
      if (!transactions) return [];
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // 创建本月所有天的数组
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        amount: 0
      }));

      // 汇率转换函数（简化的汇率）
      const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
        if (fromCurrency === toCurrency) return amount;
        
        // 简化的汇率转换（实际应用中应该使用实时汇率API）
        if (fromCurrency === 'CNY' && toCurrency === 'MOP') {
          return amount * 1.13; // 人民币转澳门币
        } else if (fromCurrency === 'MOP' && toCurrency === 'CNY') {
          return amount * 0.88; // 澳门币转人民币
        }
        return amount;
      };

      // 填充每日支出数据（所有货币类型，自动转换）
      transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        
        if (date.getMonth() === currentMonth && 
            date.getFullYear() === currentYear &&
            transaction.amount < 0) {
          const day = date.getDate();
          // 转换金额到选择的货币
          const convertedAmount = convertCurrency(
            Math.abs(transaction.amount),
            transaction.currency,
            selectedCurrency
          );
          dailyData[day - 1].amount += convertedAmount;
        }
      });

      return dailyData;
    };

    const data = getMonthlyExpenseData();
    setMonthlyExpenseData(data);
  }, [transactions, selectedCurrency]);

  // 智能柱状图组件 - 优化版
  const BarChart: React.FC<{ data: Array<{ day: number; amount: number }> }> = ({ data }) => {
    if (data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-lg font-medium mb-2">暂无支出数据</p>
            <p className="text-sm text-gray-500">开始记账后，这里将显示您的支出趋势</p>
          </div>
        </div>
      );
    }

    const hasData = data.some(d => d.amount > 0);
    const now = new Date();
    const currentDay = now.getDate();

    if (!hasData) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">💸</div>
            <p className="text-lg font-medium mb-2">本月暂无支出</p>
            <p className="text-sm text-gray-500">继续保持良好的消费习惯！</p>
          </div>
        </div>
      );
    }

    // 智能计算最大金额 - 确保小金额也能有良好的可视化效果
    const amounts = data.map(d => d.amount).filter(amount => amount > 0);
    const maxAmount = Math.max(...amounts);
    
    // 简单直观的高度计算 - 确保金额与高度直接对应
    const getAdjustedHeight = (amount: number) => {
      if (amount === 0) return 10; // 最小基础高度（像素）
      
      // 使用固定比例：每10元对应10像素高度
      // 20元 → 20像素，100元 → 100像素，1000元 → 200像素（最大限制）
      const baseHeight = amount * 1; // 1:1比例
      return Math.min(Math.max(baseHeight, 20), 200); // 最小20px，最大200px
    };
    

    

    


    const totalAmount = data.reduce((sum, d) => sum + d.amount, 0);
    const nonZeroDays = data.filter(d => d.amount > 0).length;
    const averageAmount = nonZeroDays > 0 ? totalAmount / nonZeroDays : 0;

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        {/* 智能统计摘要 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{maxAmount.toFixed(0)}</div>
            <div className="text-xs text-blue-600 font-medium">单日最高</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-700">{totalAmount.toFixed(0)}</div>
            <div className="text-xs text-green-600 font-medium">本月总支</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">{averageAmount.toFixed(0)}</div>
            <div className="text-xs text-purple-600 font-medium">日均支出</div>
          </div>
        </div>

        {/* 交互式柱状图容器 */}
        <div className="h-72 relative group">
          {/* 动态网格背景 */}
          <div className="absolute inset-0 grid grid-cols-7 gap-4 opacity-20">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-t border-blue-200" 
                style={{ marginTop: `${(i + 1) * 20}%` }}></div>
            ))}
          </div>
          
          {/* 主要柱状图 */}
          <div className="relative w-full h-full flex items-end justify-between px-3">
            {data.map((d, i) => {
              const adjustedHeight = getAdjustedHeight(d.amount);
              const isToday = d.day === currentDay;
              const isFuture = d.day > currentDay;
              const isEmpty = d.amount === 0;
              
              return (
                <div
                  key={i}
                  className="flex-1 mx-1 flex flex-col items-center justify-end group relative"
                >
                  {/* 金额标签 - 始终显示但更美观 */}
                  {d.amount > 0 && (
                    <div className="text-xs font-semibold text-gray-700 mb-2 px-2 py-1 bg-white rounded-full shadow-sm border border-gray-200">
                      {d.amount.toFixed(0)}
                    </div>
                  )}
                  
                  {/* 智能柱状图柱子 */}
                  <div
                    className={`w-4/5 rounded-t-lg transition-all duration-700 ease-out cursor-pointer ${
                      isToday 
                        ? 'bg-gradient-to-b from-red-500 to-red-600 shadow-xl ring-2 ring-red-300' 
                        : isFuture
                        ? 'bg-gradient-to-b from-gray-200 to-gray-300 opacity-50'
                        : isEmpty
                        ? 'bg-gradient-to-b from-gray-100 to-gray-200 opacity-30'
                        : 'bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 shadow-lg hover:shadow-xl'
                    }`}
                    style={{
                      height: `${adjustedHeight}px`,
                      minHeight: '16px'
                    }}
                    title={isFuture ? '未来日期' : isEmpty ? '无支出' : `${d.day}号: MOP ${d.amount.toFixed(2)}`}
                  />
                  
                  {/* 日期标签 */}
                  <div className={`text-xs font-semibold mt-3 px-2 py-1 rounded-full ${
                    isToday 
                      ? 'bg-red-100 text-red-700 ring-1 ring-red-300' 
                      : isFuture
                      ? 'text-gray-400 bg-gray-100'
                      : 'text-gray-600 bg-gray-50'
                  }`}>
                    {d.day}
                  </div>
                  
                  {/* 增强悬停提示 */}
                  <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 text-xs bg-gray-900 text-white px-3 py-2 rounded-lg shadow-2xl z-20 pointer-events-none">
                    <div className="font-bold">{d.day}号</div>
                    <div>{d.amount > 0 ? `MOP ${d.amount.toFixed(2)}` : '无支出'}</div>
                    {isToday && <div className="text-red-300 text-xs mt-1">今天</div>}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 智能Y轴刻度 */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-600 font-medium pr-3">
            <span>{maxAmount.toFixed(0)}</span>
            <span>{(maxAmount * 0.75).toFixed(0)}</span>
            <span>{(maxAmount * 0.5).toFixed(0)}</span>
            <span>{(maxAmount * 0.25).toFixed(0)}</span>
            <span className="text-gray-400">0</span>
          </div>
        </div>
        
        {/* 交互式图例 */}
        <div className="flex justify-center gap-4 mt-6 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gradient-to-b from-blue-500 to-blue-600 rounded mr-2"></div>
            <span className="text-gray-600">已支出</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gradient-to-b from-red-500 to-red-600 rounded mr-2"></div>
            <span className="text-gray-600">今日</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gradient-to-b from-gray-200 to-gray-300 rounded mr-2"></div>
            <span className="text-gray-600">未来日期</span>
          </div>
        </div>
      </div>
    );
  };
  
  const getFilteredTransactions = () => {
    if (!transactions) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 本月第一天
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1); // 本年1月1日
        break;
    }
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getTime() >= startDate.getTime() && 
             transactionDate.getTime() <= now.getTime();
    });
  };
  
  const getCategoryData = () => {
    const filtered = getFilteredTransactions();
    const categoryMap = new Map<string, number>();
    
    filtered.forEach(transaction => {
      const convertedAmount = convertCurrency(
        Math.abs(transaction.amount),
        transaction.currency,
        selectedCurrency
      );
      const currentAmount = categoryMap.get(transaction.category) || 0;
      categoryMap.set(transaction.category, currentAmount + convertedAmount);
    });
    
    return Array.from(categoryMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  };
  
  const calculateTotal = () => {
    const filtered = getFilteredTransactions();
    let total = 0;

    filtered.forEach(transaction => {
      const convertedAmount = convertCurrency(
        Math.abs(transaction.amount),
        transaction.currency,
        selectedCurrency
      );
      
      if (transaction.amount > 0) {
        total += convertedAmount;
      } else {
        total -= convertedAmount;
      }
    });

    return total;
  };
  
  // 汇率转换函数（简化的汇率）
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    
    // 简化的汇率转换（实际应用中应该使用实时汇率API）
    if (fromCurrency === 'CNY' && toCurrency === 'MOP') {
      return amount * 1.13; // 人民币转澳门币
    } else if (fromCurrency === 'MOP' && toCurrency === 'CNY') {
      return amount * 0.88; // 澳门币转人民币
    }
    return amount;
  };

  const getIncomeExpense = () => {
    const filtered = getFilteredTransactions();
    let income = 0;
    let expense = 0;

    filtered.forEach(transaction => {
      const convertedAmount = convertCurrency(
        Math.abs(transaction.amount),
        transaction.currency,
        selectedCurrency
      );
      
      if (transaction.amount > 0) {
        income += convertedAmount;
      } else {
        expense += convertedAmount;
      }
    });

    return { income, expense };
  };
  
  if (!transactions) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const { income, expense } = getIncomeExpense();
  const categoryData = getCategoryData();
  const total = calculateTotal();

  // 计算日均交易数
  const calculateDailyAverage = (): number => {
    const filteredTransactions = getFilteredTransactions();
    if (filteredTransactions.length === 0) return 0;
    
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
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
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const daysDiff = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    return Math.round((filteredTransactions.length / daysDiff) * 10) / 10;
  };

  // 计算支出收入比
  const calculateExpenseIncomeRatio = (): string => {
    const filteredTransactions = getFilteredTransactions();
    let totalExpense = 0;
    let totalIncome = 0;

    filteredTransactions.forEach(transaction => {
      const convertedAmount = convertCurrency(
        Math.abs(transaction.amount),
        transaction.currency,
        selectedCurrency
      );
      
      if (transaction.amount < 0) {
        totalExpense += convertedAmount;
      } else {
        totalIncome += convertedAmount;
      }
    });

    if (totalIncome === 0) return totalExpense === 0 ? '0.00' : '∞';
    const ratio = totalExpense / totalIncome;
    return ratio.toFixed(2);
  };

  // 获取最大单笔交易金额
  const getLargestTransaction = (): string => {
    const filteredTransactions = getFilteredTransactions();
    if (filteredTransactions.length === 0) return '0';

    let largest = 0;
    filteredTransactions.forEach(transaction => {
      const convertedAmount = convertCurrency(
        Math.abs(transaction.amount),
        transaction.currency,
        selectedCurrency
      );
      largest = Math.max(largest, convertedAmount);
    });
    
    return largest.toFixed(2);
  };

  // 获取分类占比数据
  const getCategoryPercentageData = (): [string, string, number][] => {
    const filteredTransactions = getFilteredTransactions();
    const expenseTransactions = filteredTransactions.filter(t => t.amount < 0);
    
    if (expenseTransactions.length === 0) return [];

    const categoryTotals: Record<string, number> = {};
    let totalExpense = 0;

    expenseTransactions.forEach(transaction => {
      const convertedAmount = convertCurrency(
        Math.abs(transaction.amount),
        transaction.currency,
        selectedCurrency
      );
      const category = transaction.category || '其他';
      categoryTotals[category] = (categoryTotals[category] || 0) + convertedAmount;
      totalExpense += convertedAmount;
    });

    return Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => [
        category,
        ((amount / totalExpense) * 100).toFixed(1),
        amount
      ] as [string, string, number])
      .slice(0, 5); // 只显示前5个分类
  };



  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">统计分析</h1>
        
        {/* 筛选器 */}
        <div className="flex flex-wrap gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">货币</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedCurrency('MOP')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCurrency === 'MOP' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                澳门币
              </button>
              <button 
                onClick={() => setSelectedCurrency('CNY')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCurrency === 'CNY' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                人民币
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">时间范围</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setTimeRange('week')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === 'week' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                本周
              </button>
              <button 
                onClick={() => setTimeRange('month')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === 'month' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                本月
              </button>
              <button 
                onClick={() => setTimeRange('year')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === 'year' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                本年
              </button>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-2">总收入</div>
            <div className="text-2xl font-bold text-green-600">
              {selectedCurrency === 'MOP' ? 'MOP ' : '¥ '}
              {income.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-2">总支出</div>
            <div className="text-2xl font-bold text-red-600">
              {selectedCurrency === 'MOP' ? 'MOP ' : '¥ '}
              {expense.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-2">净收入</div>
            <div className={`text-2xl font-bold ${total >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {selectedCurrency === 'MOP' ? 'MOP ' : '¥ '}
              {total.toFixed(2)}
            </div>
          </div>
        </div>

        {/* 分类统计 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">分类统计</h2>
          <div className="space-y-4">
            {categoryData.map(([category, amount], index) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                  <span className="font-medium">{category}</span>
                </div>
                <div className="text-lg font-semibold">
                  {selectedCurrency === 'MOP' ? 'MOP ' : '¥ '}
                  {amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 本月支出趋势图 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">本月支出趋势</h2>
          {/* 滑动容器 - 防止柱状图在移动设备上超出界面 */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              <BarChart data={monthlyExpenseData} />
            </div>
          </div>
          <div className="mt-3 text-center text-sm text-gray-500">
            每日支出趋势 ({selectedCurrency === 'CNY' ? '¥' : 'MOP'})
          </div>
        </div>

        {/* 增强版交易统计 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">📈 交易深度分析</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* 交易笔数统计 */}
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-700">{getFilteredTransactions().length}</div>
              <div className="text-sm text-blue-600 font-medium">总交易笔数</div>
              <div className="text-xs text-blue-500 mt-1">
                {timeRange === 'week' ? '本周' : timeRange === 'month' ? '本月' : '本年'}
              </div>
            </div>

            {/* 日均交易数 */}
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-700">
                {calculateDailyAverage()}
              </div>
              <div className="text-sm text-green-600 font-medium">日均交易</div>
              <div className="text-xs text-green-500 mt-1">笔/天</div>
            </div>

            {/* 支出收入比 */}
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="text-3xl font-bold text-purple-700">
                {calculateExpenseIncomeRatio()}
              </div>
              <div className="text-sm text-purple-600 font-medium">收支比</div>
              <div className="text-xs text-purple-500 mt-1">支出/收入</div>
            </div>

            {/* 最大单笔交易 */}
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <div className="text-3xl font-bold text-orange-700">
                {getLargestTransaction()}
              </div>
              <div className="text-sm text-orange-600 font-medium">最大交易</div>
              <div className="text-xs text-orange-500 mt-1">{selectedCurrency === 'MOP' ? 'MOP' : '¥'}</div>
            </div>
          </div>

          {/* 分类占比分析 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">🏷️ 支出分类占比</h3>
            <div className="space-y-3">
              {getCategoryPercentageData().map(([category, percentage, amount], index) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="w-4 h-4 rounded-full bg-blue-500 mr-3"></div>
                    <span className="font-medium text-gray-700 text-sm">{category}</span>
                    <span className="text-xs text-gray-500 ml-2">{percentage}%</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {selectedCurrency === 'MOP' ? 'MOP ' : '¥ '}
                    {amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>


        </div>
      </div>
    </Layout>
  );
};

export default StatsPage;