import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3002").split(",")
    DEBUG = os.getenv("DEBUG", "FALSE").lower() == "true"
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
settings = Settings()

