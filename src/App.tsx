import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AddTransactionPage from './pages/AddTransactionPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';
import { initializeDatabase } from './services/db';
import './App.css';

function App() {
  // 初始化数据库
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add" element={<AddTransactionPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;