export const validateStockSymbol = (symbol) => {
    if (!symbol || typeof symbol !== 'string') {
      return { isValid: false, error: 'Symbol is required' };
    }
    
    const cleanSymbol = symbol.trim().toUpperCase();
    
    if (cleanSymbol.length === 0) {
      return { isValid: false, error: 'Symbol cannot be empty' };
    }
    
    if (cleanSymbol.length > 5) {
      return { isValid: false, error: 'Symbol must be 5 characters or less' };
    }
    
    if (!/^[A-Z]+$/.test(cleanSymbol)) {
      return { isValid: false, error: 'Symbol must contain only letters' };
    }
    
    return { isValid: true, symbol: cleanSymbol };
  };
  
  export const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return 'N/A';
    }
    return `${price.toFixed(2)}`;
  };
  
  export const formatPercentage = (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'N/A';
    }
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };