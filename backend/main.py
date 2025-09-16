from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from services.stock_service import StockService
from services.prediction_service import PredictionService
import logging
import pandas as pd
from config import settings

# Configure logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Stock Prediction API",
    debug=settings.DEBUG
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stock_service = StockService()
prediction_service = PredictionService()


@app.get("/", status_code=status.HTTP_200_OK)
async def root():
    return {
        "message": "Stock Prediction API is running!",
        "environment": "development" if settings.DEBUG else "production",
        "version": "1.0.0"
    }

@app.get("/stock/{symbol}", response_model=dict)
async def get_stock_analysis(symbol: str):
    """
    Get stock data and prediction for a given symbol
    
    Args:
        symbol: Stock symbol to analyze (1-5 uppercase letters)
        
    Returns:
        dict: Stock data, predictions, and metadata
        
    Raises:
        HTTPException: If symbol is invalid or data cannot be retrieved
    """
    try:
        logger.info(f"Fetching data for symbol: {symbol}")
        
        # Validate symbol
        if not symbol or not symbol.isalpha() or len(symbol) > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock symbol must be 1-5 alphabetic characters"
            )
        
        # Fetch raw stock data
        raw_data = await stock_service.get_stock_data(symbol.upper())
        
        # Process the data
        processed_data = stock_service.process_stock_data(raw_data)
        
        if len(processed_data) < 10:
            raise HTTPException(status_code=400, detail="Insufficient data for analysis")
        
        #Calculate moving averages
        data_with_ma = prediction_service.calculate_moving_average(processed_data)
        
        #Generate prediction
        prediction = prediction_service.generate_prediction(processed_data)
        logger.info(f"Successfully processed data for {symbol}")
        
        return {
            "symbol": symbol.upper(),
            "data": data_with_ma[:30], # Return last 30 days
            "prediction": prediction,
            "meta_data": raw_data.get("Meta Data", {}),
            "timestamp": pd.Timestamp.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": pd.Timestamp.now().isoformat()}