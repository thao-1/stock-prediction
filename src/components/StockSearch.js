import React, { useState } from 'react';
import { validateStockSymbol } from '../utils/validation';

const StockSearch = ({ onSearch, loading }) => {
    const [symbol, setSymbol] = useState('');
    const [validationError, setValidationError] = useState('');
    const [recentSearches, setRecentSearches] = useState(() => {
        const saved = localStorage.getItem('recentStockSearches');
        return saved ? JSON.parse(saved) : [];
    });

    const handleInputChange = (e) => {
        const value = e.target.value.toUpperCase();
        setSymbol(value);
        
        if (validationError) {
            setValidationError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validation = validateStockSymbol(symbol);
        if (!validation.isValid) {
            setValidationError(validation.error);
            return;
        }
        
        await searchStock(validation.symbol);
    };

    const searchStock = async (stockSymbol) => {
        const validation = validateStockSymbol(stockSymbol);
        if (!validation.isValid) {
            setValidationError(validation.error);
            return;
        }

        setValidationError('');
        
        try {
            await onSearch(validation.symbol);
            
            const updatedSearches = [
                validation.symbol, 
                ...recentSearches.filter(s => s !== validation.symbol)
            ].slice(0, 5);
            
            setRecentSearches(updatedSearches);
            localStorage.setItem('recentStockSearches', JSON.stringify(updatedSearches));
            
        } catch (err) {
            console.error('Search error:', err);
            setValidationError('Failed to fetch stock data. Please try again.');
        }
    };

    return (
        <div className="stock-search">
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <div className="input-wrapper">
                        <input
                            type="text"
                            value={symbol}
                            onChange={handleInputChange}
                            placeholder="Enter stock symbol (e.g., AAPL)"
                            maxLength={5}
                            disabled={loading}
                            className={validationError ? 'error' : ''}
                        />
                        {validationError && (
                            <span className="validation-error">{validationError}</span>
                        )}
                    </div>
                    <button 
                        type="submit" 
                        disabled={!symbol.trim() || loading}
                    >
                        {loading ? 'Analyzing...' : 'Analyze Stock'}
                    </button>
                </div>
            </form>

            <div className="popular-stocks">
                <p>Popular stocks:</p>
                {['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'].map(stock => (
                    <button 
                        key={stock}
                        onClick={() => searchStock(stock)}
                        className="stock-chip"
                        disabled={loading}
                    >
                        {stock}
                    </button>
                ))}
            </div>

            {recentSearches.length > 0 && (
                <div className="recent-searches">
                    <p>Recent searches:</p>
                    {recentSearches.map(stock => (
                        <button 
                            key={stock}
                            onClick={() => searchStock(stock)}
                            className="stock-chip recent"
                            disabled={loading}
                        >
                            {stock}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StockSearch;
