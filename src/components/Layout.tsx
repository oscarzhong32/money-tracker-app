import React from 'react';
import { Link, useLocation } from 'react-router-dom';

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

    </div>
  );
};

export default Layout;