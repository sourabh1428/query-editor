import requests
import json
import logging
import sys

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def register_user():
    url = "https://sql-analytics-platform.onrender.com/api/auth/register"
    data = {
        "username": "sppathak",
        "email": "sppathak1428@gmail.com",
        "password": "123123"
    }
    
    try:
        logger.info(f"Sending registration request to {url}")
        logger.info(f"Request data: {json.dumps(data, indent=2)}")
        
        response = requests.post(url, json=data)
        logger.info(f"Status Code: {response.status_code}")
        
        try:
            response_data = response.json()
            logger.info(f"Response: {json.dumps(response_data, indent=2)}")
        except json.JSONDecodeError:
            logger.error(f"Raw response: {response.text}")
            
        if response.status_code != 201:
            logger.error("Registration failed!")
            sys.exit(1)
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    register_user() 