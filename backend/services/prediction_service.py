import pandas as pd 
import numpy as np
from typing import List, Dict

class PredictionService:
    def __init__(self):
        pass
    
    def calculate_moving_average(self, data: List[Dict]) -> List[Dict]:
        """Calculate 20-day and 50-day moving averages"""
        if not data:
            return []
            
        df = pd.DataFrame(data)
        
        # Ensure data is sorted by date (oldest first) for accurate moving averages
        df = df.sort_values('date')
        
        # Calculate moving averages
        df['ma_20'] = df['close'].rolling(window=min(20, len(df))).mean()
        df['ma_50'] = df['close'].rolling(window=min(50, len(df))).mean()
        
        # Convert back to list of dictionaries, newest first
        df = df.sort_values('date', ascending=False)
        
        # Convert numpy types to native Python types for JSON serialization
        result = []
        for _, row in df.iterrows():
            item = row.to_dict()
            # Convert numpy types to native Python types
            for key, value in item.items():
                if hasattr(value, 'item'):  # For numpy types
                    item[key] = value.item()
            result.append(item)
            
        return result
    
    def generate_prediction(self, data: List[Dict]) -> Dict:
        """Generate simple trend prediction"""
        if not data or len(data) < 10:
            return {
                "error": "Not enough data for prediction",
                "prediction": 0,
                "confidence": 0,
                "trend": "neutral"
            }
        
        # Use the most recent data points for prediction (up to 30 days)
        recent_data = data[:min(30, len(data))]
        recent_prices = [item['close'] for item in recent_data]
        
        try:
            # Calculate trend using linear regression
            x = np.arange(len(recent_prices))
            slope = np.polyfit(x, recent_prices, 1)[0]
            
            current_price = recent_prices[0]
            # Calculate 5-day prediction
            predicted_change = (slope * 5) / current_price * 100  # as percentage
            
            # Determine trend and confidence
            if abs(slope) < 0.1:  # Flat trend threshold
                trend = "neutral"
                confidence = 30.0
            else:
                trend = "bullish" if slope > 0 else "bearish"
                # Confidence based on slope magnitude, capped at 95%
                confidence = min(abs(slope) * 100, 95.0)
            
            return {
                "prediction": round(predicted_change, 2),  # as percentage
                "confidence": round(confidence, 1),
                "trend": trend,
                "recommendation": self._get_recommendation(trend, confidence)
            }
            
        except Exception as e:
            print(f"Error generating prediction: {str(e)}")
            return {
                "error": "Error generating prediction",
                "prediction": 0,
                "confidence": 0,
                "trend": "neutral"
            }
        
    def _get_recommendation(self, trend: str, confidence: float) -> str:
        """Generate investment recommendation"""
        if confidence < 30:
            return "HOLD - Low confidence in prediction"
        elif trend == "bullish" and confidence > 60:
            return "BUY - Strong upward trend detected"
        elif trend == "bearish" and confidence > 60:
            return "SELL - Strong downward trend detected"
        else: 
            return "HOLD - Mixed signals"