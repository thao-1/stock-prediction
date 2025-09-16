import { useState, useCallback } from 'react';
import axios from 'axios';
import { performanceMonitor } from '../utils/performance';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const useStockData = () => {
    const [stockData, setStockData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStock = useCallback(async (symbol) => {
        if (!symbol) return;
        
        setLoading(true);
        setError(null);
        setStockData(null);

        try {
            const result = await performanceMonitor.measureApiCall(
                () => axios.get(`${API_BASE_URL}/stock/${symbol}`, {
                    timeout: 15000,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }),
                `Stock API Call: ${symbol}`
            );

            if (result.data.error) {
                throw new Error(result.data.error);
            }

            setStockData(result.data);
            return result.data;
        } catch (err) {
            let errorMessage = 'Failed to fetch stock data';
            console.error('Error fetching stock data:', err);

            if (err.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout - please try again';
            } else if (err.response?.status === 429) {
                errorMessage = 'API rate limit reached. Please wait and try again.';
            } else if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearData = useCallback(() => {
        setStockData(null);
        setError(null);
    }, []);

    return {
        stockData,
        loading,
        error,
        fetchStock,
        clearData
    };
};
