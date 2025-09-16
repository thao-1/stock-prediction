import os
import requests
from dotenv import load_dotenv

# Load .env from backend directory explicitly
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
masked = (api_key[:2] + "***" + api_key[-2:]) if api_key else "<missing>"
print(f"API Key loaded: {'Yes' if api_key else 'No (check backend/.env)'} ({masked})")  # Debug print

if not api_key:
    print("Error: No API key found. Add ALPHA_VANTAGE_API_KEY=your_key to backend/.env")
    exit(1)

base_url = "https://www.alphavantage.co/query"
params = {
    "function": "TIME_SERIES_DAILY",
    "symbol": "AAPL",
    "apikey": api_key,
    "outputsize": "compact"
}

print("Testing API call...")
try:
    # Basic test without verify (temp bypass SSL)
    response = requests.get(base_url, params=params, timeout=10, verify=False)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Sample data keys: {list(data.keys())[:5]}")
        if "Error Message" in data:
            print(f"API Error: {data['Error Message']}")
        elif "Note" in data:
            print(f"Rate limit: {data['Note']}")
    else:
        print(f"HTTP Error: {response.text}")
except requests.exceptions.SSLError as ssl_err:
    print(f"SSL Error: {ssl_err}")
except requests.exceptions.ConnectionError as conn_err:
    print(f"Connection Error: {conn_err}")
except Exception as e:
    print(f"Other Error: {e}")