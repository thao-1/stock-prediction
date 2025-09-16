import React from 'react';
import './App.css';
import StockSearch from './components/StockSearch';
import StockDisplay from './components/StockDisplay';
import { useStockData } from './hooks/useStockData';

function App() {
  const { stockData, loading, error, fetchStock, clearData } = useStockData();

  return (
    <div className="App">
      <header className="App-header">
        <h1>📈 Stock Market Predictions</h1>
        <p>AI-powered stock analysis and predictions</p>
      </header>
      
      <main>
        <StockSearch 
          onSearch={fetchStock}
          loading={loading}
        />
        
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            Loading stock data...
          </div>
        )}
        
        {error && (
          <div className="error">
            Error: {error}
            <button onClick={clearData} className="clear-error">✕</button>
          </div>
        )}
        
        {stockData && <StockDisplay stockData={stockData} loading={loading} onClear={clearData} />}
      </main>

      <footer className="app-footer">
        <p>⚠️ This is an educational project. Not financial advice.</p>
        <p>Data provided by Alpha Vantage</p>
      </footer>
    </div>
  );
}

export default App;