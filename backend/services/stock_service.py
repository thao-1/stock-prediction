import requests
import pandas as pd 
import numpy as np 
from typing import List, Dict, Optional
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

class StockService:
    def __init__(self):
        # Ensure .env is loaded when this service is used directly
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        load_dotenv(dotenv_path=env_path)

        # Try to get API key from environment
        self.api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        print(f"API Key from env: {'*' * 8 + self.api_key[-4:] if self.api_key else 'NOT FOUND'}")
        
        if not self.api_key:
            raise ValueError(
                "ALPHA_VANTAGE_API_KEY is not set. Create backend/.env with ALPHA_VANTAGE_API_KEY=your_polygon_io_key"
            )
            
        self.base_url = "https://api.polygon.io"
        print(f"Using base URL: {self.base_url}")

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
        
    def _format_date(self, date: datetime) -> str:
        """Format datetime to YYYY-MM-DD string"""
        return date.strftime("%Y-%m-%d")

    async def get_stock_data(self, symbol: str) -> Dict:
        """Fetch stock data from Polygon.io API"""
        # Get dates for the last 30 days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        params = {
            "apiKey": self.api_key,
            "adjusted": "true",
            "sort": "desc",
            "limit": 30
        }
        
        headers = {
            "User-Agent": "StockPredictionApp/1.0",
            "Connection": "close"
        }
        
        # Build the URL with the API key as a query parameter
        url = f"{self.base_url}/v2/aggs/ticker/{symbol.upper()}/range/1/day/{self._format_date(start_date)}/{self._format_date(end_date)}"
        print(f"Request URL: {url}")
        print(f"Params: {params}")
        
        try:
            # Add API key to params
            params["apiKey"] = self.api_key
            
            # Make the request with detailed logging
            print(f"Making request to: {url}")
            response = self.session.get(
                url,
                params=params,
                headers=headers,
                timeout=15,
                verify=self.verify_ssl
            )
            print(f"Response status: {response.status_code}")
            print(f"Response headers: {response.headers}")
            print(f"Response content: {response.text[:200]}...")  # Print first 200 chars of response
            response.raise_for_status()
            data = response.json()
            
            # Check for error in response
            if data.get("status") == "ERROR":
                error_msg = data.get("error", "Unknown error from Polygon.io")
                raise Exception(f"Polygon.io error: {error_msg}")
                
            return data
            
        except requests.exceptions.Timeout:
            raise Exception("Polygon.io API timeout. Please try again.")
        except requests.exceptions.ConnectionError as e:
            raise Exception(f"Connection to Polygon.io failed: {str(e)}")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                raise Exception("API rate limit exceeded. Please try again later.")
            raise Exception(f"Polygon.io HTTP error: {e.response.status_code}")
        except ValueError:
            raise Exception("Invalid JSON response from Polygon.io")
    
    
    def process_stock_data(self, raw_data: Dict) -> List[Dict]:
        """Process Polygon.io API data into usable format"""
        if not raw_data.get("results"):
            print("No results in API response")
            return []
            
        processed_data = []
        
        for result in raw_data["results"]:
            try:
                # Convert timestamp (in milliseconds) to date string
                date = datetime.fromtimestamp(result["t"] / 1000).strftime("%Y-%m-%d")
                
                processed_data.append({
                    "date": date,
                    "open": result["o"],
                    "high": result["h"],
                    "low": result["l"],
                    "close": result["c"],
                    "volume": result["v"],
                    # Add additional fields that might be useful
                    "change": result.get("c") - result.get("o", 0),
                    "change_percent": ((result.get("c", 0) / result.get("o", 1)) - 1) * 100 if result.get("o") else 0,
                    "vwap": result.get("vw")  # Volume Weighted Average Price
                })
            except (KeyError, ValueError) as e:
                print(f"Error processing data point: {str(e)}")
                continue
        
        # Sort by date (newest first)
        processed_data.sort(key=lambda x: x["date"], reverse=True)
        print(f"Processed {len(processed_data)} data points from Polygon.io")
        return processed_data