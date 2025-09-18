import React from 'react';
import { Link, useLocation } from 'react-router-dom';

<<<<<<< HEAD
interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // 检查当前路径以高亮显示活动的导航项
  const isActive = (path: string) => {
    return location.pathname === path ? 'text-blue-500' : 'text-gray-500';
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-800">记账助手</h1>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* 底部导航栏 - 在移动设备上特别有用 */}
      <nav className="bg-white shadow-lg fixed bottom-0 w-full">
        <div className="flex justify-around items-center h-16">
          <Link to="/" className={`flex flex-col items-center ${isActive('/')}`}>
            <div className="text-xl">🏠</div>
            <span className="text-xs mt-1">首页</span>
          </Link>
          <Link to="/add" className={`flex flex-col items-center ${isActive('/add')}`}>
            <div className="text-xl">➕</div>
            <span className="text-xs mt-1">添加</span>
          </Link>
          <Link to="/stats" className={`flex flex-col items-center ${isActive('/stats')}`}>
            <div className="text-xl">📊</div>
            <span className="text-xs mt-1">统计</span>
          </Link>
          <Link to="/settings" className={`flex flex-col items-center ${isActive('/settings')}`}>
            <div className="text-xl">⚙️</div>
            <span className="text-xs mt-1">设置</span>
          </Link>
        </div>
      </nav>
      
      {/* 为底部导航栏添加一些底部填充 */}
      <div className="h-16"></div>
=======
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/add', label: '添加', icon: '➕' },
    { path: '/stats', label: '统计', icon: '📊' },
    { path: '/settings', label: '设置', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 主要内容 */}
      <main className="pb-16">
        {children}
      </main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-3 px-4 ${
                location.pathname === item.path
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
>>>>>>> 242aa4e8d8cc742b6d1fa73f61ab1631a824e3a3
    </div>
  );
};

export default Layout;