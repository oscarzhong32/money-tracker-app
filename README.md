# 💰 澳門人的記賬應用

一個專為澳門用戶設計的個人記賬應用，支持多貨幣管理和智能統計分析。

## 🚀 功能特性

### 核心功能
- **交易管理**：添加、查看、刪除收入和支出
- **多貨幣支持**：澳門幣(MOP)和人民幣(CNY)
- **智能統計**：月度支出趨勢分析
- **數據導出**：Excel格式導入導出
- **本地存儲**：使用IndexedDB離線存儲

### 貨幣功能
- **自動匯率轉換**：人民幣自動按匯率轉換為澳門幣
- **匯率管理**：在設置頁面設置當前匯率
- **統一統計**：所有數據以澳門幣為單位統計

## 🏗️ 技術架構

### 前端技術棧
- **React 19** + TypeScript
- **TailwindCSS** 樣式框架
- **Chart.js** 圖表庫
- **Dexie.js** IndexedDB操作

### 數據庫結構
```typescript
// 交易記錄
interface Transaction {
  id?: number;
  amount: number;      // 金額（正數為收入，負數為支出）
  currency: 'MOP' | 'CNY'; // 貨幣類型
  category: string;     // 分類
  date: string;        // 日期 YYYY-MM-DD
  description: string; // 描述
  type: 'income' | 'expense'; // 類型
}

// 匯率設置
interface ExchangeRate {
  id?: number;
  rate: number;        // 匯率值（CNY → MOP）
  date: string;        // 設置日期
}
```

## 📁 項目結構

```
src/
├── components/          # 公共組件
│   └── Layout.tsx       # 布局組件
├── pages/              # 頁面組件
│   ├── AddTransactionPage.tsx  # 添加交易
│   ├── HomePage.tsx            # 首頁
│   ├── SettingsPage.tsx       # 設置頁面
│   └── StatsPage.tsx          # 統計頁面
├── services/           # 服務層
│   └── db.ts           # 數據庫服務
└── App.tsx             # 主應用
```

## 🔧 核心組件說明

### 1. 數據庫服務 (db.ts)
- 使用Dexie.js管理IndexedDB
- 定義交易和匯率表結構
- 提供CRUD操作接口

### 2. 添加交易頁面 (AddTransactionPage.tsx)
- 表單驗證和數據提交
- 貨幣類型選擇
- 自動匯率轉換邏輯

### 3. 統計頁面 (StatsPage.tsx)
- 月度支出趨勢圖表
- 分類統計分析
- 貨幣轉換計算

### 4. 設置頁面 (SettingsPage.tsx)
- 匯率管理
- 數據導入導出
- 應用設置

## 💱 匯率轉換邏輯

### 轉換規則
1. **人民幣 → 澳門幣**：`金額 × 匯率`
2. **澳門幣**：保持原金額
3. **統計顯示**：所有數據統一為澳門幣

### 數據存儲
- 原始貨幣信息保留
- 轉換後的金額用於統計
- 匯率變化不影響歷史數據

## 📊 統計分析

### 月度統計
- 自動識別當前月份
- 按日期分組顯示支出
- 支持切換貨幣顯示

### 分類分析
- 支出分類餅圖
- 收入分類分布
- 自定義分類管理

## 🗃️ 數據管理

### 本地存儲
- 使用瀏覽器IndexedDB
- 離線可用
- 數據持久化

### 導入導出
- Excel格式支持
- 完整數據備份恢復
- 跨設備數據遷移

## 🚀 開發指南

### 環境要求
- Node.js 16+
- npm 或 yarn

### 安裝運行
```bash
# 安裝依賴
npm install

# 開發模式運行
npm start

# 生產構建
npm run build
```

### 部署說明
項目配置了Vercel部署：
- `vercel.json` 部署配置
- 自動構建和發布
- 環境變量支持

## 🌐 生產部署

### Vercel部署
```bash
# 安裝Vercel CLI
npm install -g vercel

# 登錄和部署
vercel login
vercel --prod
```


## 📝 版本歷史

### v0.1.0 - 初始版本
- 基礎記賬功能
- 多貨幣支持
- 統計圖表
- Excel導入導出


## 🆘 常見問題

### Q: 數據會丟失嗎？
A: 數據存儲在瀏覽器本地，清除緩存會導致數據丟失，建議定期導出備份。

### Q: 支持其他貨幣嗎？
A: 當前支持MOP和CNY，可以擴展支持更多貨幣。

### Q: 如何遷移數據？
A: 使用導出功能備份數據，在新設備上導入即可。

---

**開發者備註**: 此項目專為澳門用戶設計，充分考慮了澳門的貨幣使用習慣和需求。所有統計數據以澳門幣為統一單位，確保財務分析的準確性和一致性。
