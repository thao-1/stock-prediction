import React from 'react';
import StockChart from './StockChart';
import PredictionCard from './PredictionCard';
import { formatPrice, formatPercentage } from '../utils/validation';

const StockDisplay = ({ stockData, loading, onClear }) => {
  if (!stockData) return null;
  if (loading) return <div className="loading">Loading...</div>;
  
  console.log('Stock Data:', stockData);

  const { symbol, data, prediction, meta_data } = stockData;
  const latestData = data?.[0];
  const predictionValue = prediction?.prediction;
  const confidence = prediction?.confidence;

  // Calculate additional statistics
  const calculateMetrics = () => {
    if (!data || data.length === 0) return {};
    
    const prices = data.map(d => d.close);
    const changes = data.map(d => d.change);
    const volume = data.reduce((sum, d) => sum + (d.volume || 0), 0);
    
    return {
      high: Math.max(...prices),
      low: Math.min(...prices),
      avgVolume: Math.round(volume / data.length),
      positiveDays: changes.filter(c => c > 0).length,
      totalDays: changes.length,
      volume: latestData.volume,
      ma20: latestData.ma_20,
      ma50: latestData.ma_50
    };
  };

  const metrics = calculateMetrics();

  // Prepare prediction data for PredictionCard
  const predictionCardData = prediction ? {
    current_price: latestData?.close,
    predicted_price: (latestData?.close * (1 + (prediction.prediction / 100))).toFixed(2),
    trend: prediction.prediction >= 0 ? 'up' : 'down',
    confidence: Math.round(prediction.confidence * 100),
    recommendation: prediction.prediction >= 0 ? 'BUY' : 'SELL'
  } : null;

  return (
    <div className="stock-display">
      <div className="stock-header">
        <div>
          <h2>{symbol}</h2>
          {meta_data?.['1. Information'] && (
            <p className="stock-info">{meta_data['1. Information']}</p>
          )}
        </div>
        <button onClick={onClear} className="clear-button">
          Clear
        </button>
      </div>

      {latestData && (
        <div className="stock-metrics">
          <div className="metric">
            <span className="metric-label">Current Price</span>
            <span className="metric-value">{formatPrice(latestData.close)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Daily Change</span>
            <span className={`metric-value ${latestData.change >= 0 ? 'positive' : 'negative'}`}>
              {formatPercentage(latestData.change)}
            </span>
          </div>
          {predictionValue !== undefined && (
            <div className="metric">
              <span className="metric-label">Next Day Prediction</span>
              <span className={`metric-value ${predictionValue >= 0 ? 'positive' : 'negative'}`}>
                {formatPercentage(predictionValue)}
              </span>
            </div>
          )}
          {confidence !== undefined && (
            <div className="metric">
              <span className="metric-label">Confidence</span>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill" 
                  style={{ width: `${confidence * 100}%` }}
                ></div>
                <span className="confidence-text">{(confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="content-grid">
        {data?.length > 0 && (
          <div className="chart-container">
            <h3>Price Chart (Last 30 Days)</h3>
            <StockChart data={data} />
            
            <div className="stock-stats">
              <h3>Key Statistics</h3>
              <div className="stats-grid">
                <div className="stat">
                  <span className="stat-label">30-Day High</span>
                  <span className="stat-value">{formatPrice(metrics.high)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">30-Day Low</span>
                  <span className="stat-value">{formatPrice(metrics.low)}</span>
                </div>
              <div className="stat">
                <span className="stat-label">Avg. Volume</span>
                <span className="stat-value">{metrics.avgVolume?.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Positive Days</span>
                <span className="stat-value">
                  {metrics.positiveDays} of {metrics.totalDays}
                </span>
              </div>
                <div className="stat">
                  <span className="stat-label">Volume</span>
                  <span className="stat-value">{metrics.volume?.toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">20-Day MA</span>
                  <span className="stat-value">{metrics.ma20 ? formatPrice(metrics.ma20) : 'N/A'}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">50-Day MA</span>
                  <span className="stat-value">{metrics.ma50 ? formatPrice(metrics.ma50) : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {predictionCardData && (
          <div className="prediction-card-container">
            <PredictionCard prediction={predictionCardData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StockDisplay;