import { useState, useCallback } from 'react';
import axios from 'axios';

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
      const response = await axios.get(`${API_BASE_URL}/stock/${symbol}`, {
        timeout: 15000, // 15 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      setStockData(response.data);
      return response.data;
    } catch (err) {
      let errorMessage = 'Failed to fetch stock data';
      
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