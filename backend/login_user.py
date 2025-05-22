import requests
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def login_user():
    url = "http://localhost:5000/api/auth/login"
    data = {
        "email": "sppathak1428@gmail.com",
        "password": "123123"
    }
    
    try:
        response = requests.post(url, json=data)
        logger.info(f"Status Code: {response.status_code}")
        logger.info(f"Response: {response.json()}")
    except Exception as e:
        logger.error(f"Error: {str(e)}")

if __name__ == "__main__":
    login_user() 