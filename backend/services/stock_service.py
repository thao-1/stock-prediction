import requests
import pandas as pd 
import numpy as np 
from typing import List, Dict
import os
from dotenv import load_dotenv
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class StockService:
    def __init__(self):
        # Ensure .env is loaded when this service is used directly
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        load_dotenv(dotenv_path=env_path)

        self.api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        if not self.api_key:
            raise ValueError(
                "ALPHA_VANTAGE_API_KEY is not set. Create backend/.env with ALPHA_VANTAGE_API_KEY=your_key"
            )
        self.base_url = "https://www.alphavantage.co/query"

        # Optional toggle to temporarily bypass SSL verification for debugging only
        self.verify_ssl = os.getenv("USE_INSECURE_SSL", "false").lower() not in ("1", "true", "yes")

        # Create a session with retry/backoff to mitigate transient upstream issues
        self.session = requests.Session()
        retry = Retry(
            total=3,
            connect=3,
            read=3,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET"]
        )
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
    async def get_stock_data(self, symbol: str) -> Dict:
        """Fetch stock data from Alpha Vantage API"""
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": symbol,
            "apikey": self.api_key,
            "outputsize": "compact"
        }
        headers = {
            "User-Agent": "StockPredictionApp/1.0",
            "Connection": "close"  # avoid lingering keep-alive issues
        }

        try:
            response = self.session.get(
                self.base_url,
                params=params,
                headers=headers,
                timeout=15,
                verify=self.verify_ssl
            )
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.Timeout:
            raise Exception("Upstream API timeout. Please try again.")
        except requests.exceptions.ConnectionError as e:
            # Surface a clearer message for connection resets
            raise Exception(f"Upstream connection error: {str(e)}")
        except requests.exceptions.HTTPError as e:
            raise Exception(f"Upstream HTTP error: {e.response.status_code}")
        except requests.exceptions.SSLError as e:
            raise Exception(f"Upstream SSL error: {str(e)}")
        except ValueError:
            # JSON decode error
            raise Exception("Invalid response from upstream API.")

        if "Error Message" in data:
            raise Exception(f"Invalid stock symbol: {symbol}")

        if "Note" in data:
            raise Exception("API limit reached. Please try again later.")

        return data
    
    
    def process_stock_data(self, raw_data: Dict) -> List[Dict]:
        """Process raw API data into usable format"""
        time_series = raw_data.get("Time Series (Daily)", {})
        
        processed_data = []
        for date, values in time_series.items():
            processed_data.append({
                "date": date,
                "open": float(values["1. open"]),
                "high": float(values["2. high"]),
                "low": float(values["3. low"]),
                "close": float(values["4. close"]),
                "volume": int(values["5. volume"])
            })
            
        # Sort by date (newest first)
        processed_data.sort(key=lambda x:x["date"], reverse=True)
        return processed_data