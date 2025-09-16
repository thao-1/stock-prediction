import React from 'react';

const PredictionCard = ({ prediction }) => {
  const { current_price, predicted_price, trend, confidence, recommendation } = prediction;
  const priceChange = predicted_price - current_price;
  const priceChangePercent = ((priceChange / current_price) * 100).toFixed(2);

  const getRecommendationColor = () => {
    if (recommendation.includes('BUY')) return '#4CAF50';
    if (recommendation.includes('SELL')) return '#f44336';
    return '#FF9800';
  };

  return (
    <div className="prediction-card">
      <h3>5-Day Prediction</h3>
      
      <div className="prediction-content">
        <div className="prediction-price">
          <div className="price-item">
            <label>Current Price</label>
            <span>${current_price?.toFixed(2)}</span>
          </div>
          <div className="price-item">
            <label>Predicted Price</label>
            <span>${predicted_price}</span>
          </div>
          <div className="price-item">
            <label>Expected Change</label>
            <span className={priceChange >= 0 ? 'positive' : 'negative'}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent}%)
            </span>
          </div>
        </div>

        <div className="prediction-metrics">
          <div className="metric">
            <label>Trend</label>
            <span className={`trend ${trend}`}>{trend.toUpperCase()}</span>
          </div>
          <div className="metric">
            <label>Confidence</label>
            <span>{confidence}%</span>
          </div>
        </div>

        <div className="recommendation" style={{borderColor: getRecommendationColor()}}>
          <strong style={{color: getRecommendationColor()}}>{recommendation}</strong>
        </div>
      </div>

      <div className="prediction-disclaimer">
        <small>
          ⚠️ This is a simplified prediction model for educational purposes. 
          Not financial advice. Always do your own research.
        </small>
      </div>
    </div>
  );
};

export default PredictionCard;