import pandas as pd 
import numpy as np
from typing import List, Dict

class PredictionService:
    def __init__(self):
        pass
    
    def calculate_moving_average(self, data: List[Dict]) -> List[Dict]:
        """Calculate 20-day and 50-day moving averages"""
        df = pd.DataFrame(data)
        df = df.sort_values('date') #Sort oldest first 
        
        # Calculate moving averages
        df['ma_20'] = df['close'].rolling(window=20).mean()
        df['ma_50'] = df['close'].rolling(window=50).mean()
        
        # Convert back to list of dictionaries, newest first
        df = df.sort_values('date', ascending=False)
        return df.to_dict('records')
    
    def generate_prediction(self, data: List[Dict]) -> Dict:
        """Generate simple trend prediction"""
        if len(data) < 50:
            return {"error": "Not enough data for prediction"}
        
        recent_data = data[:20] # Last 20 days
        recent_prices = [item['close'] for item in recent_data]
        
        # Calculate trend
        x = np.arange(len(recent_prices))
        slope = np.polyfit(x, recent_prices, 1)[0]
        
        current_price = recent_prices[0]
        predicted_price = current_price + (slope * 5) # 5-day prediction
        
        trend = "bullish" if slope > 0 else "bearish"
        confidence = min(abs(slope) * 10, 100) # Simple confidence score
        
        return {
            "current_price": current_price,
            "predicted_price": round(predicted_price, 2),
            "trend": trend,
            "confidence": round(confidence, 1),
            "recommendation": self._get_recommendation(trend, confidence)
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