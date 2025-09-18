import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// 导入组件
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AddTransactionPage from './pages/AddTransactionPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';

// 导入数据库初始化函数
import { initializeDatabase } from './services/db';

function App() {
  // 在应用启动时初始化数据库
  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();
        console.log('数据库初始化成功');
      } catch (error) {
        console.error('数据库初始化失败:', error);
      }
    };
    
    init();
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add" element={<AddTransactionPage />} />
          <Route path="/edit/:id" element={<AddTransactionPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;