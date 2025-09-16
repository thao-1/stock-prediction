import pytest
from fastapi.testclient import TestClient
from main import app


client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "Stock Prediction API is running!" in response.json()["message"]
    
def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    
def test_invalid_symbol():
    response = client.get("/stock/INVALID123")
    assert response.status_code == 400
    
    
def test_empty_symbol():
    response = client.get("/stock/")
    assert response.status_code == 404    #FastAPI returns 404 for missing path params
    
    