import redis
import json
import os
import time
from dotenv import load_dotenv

load_dotenv()

# Redis connection parameters
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
MAX_RETRIES = 5
RETRY_DELAY = 2  # seconds

class RedisClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisClient, cls).__new__(cls)
            cls._instance.client = None
        return cls._instance

    def connect_with_retry(self):
        """Attempt to connect to Redis with retries"""
        for attempt in range(MAX_RETRIES):
            try:
                print(f"Attempting to connect to Redis at {REDIS_HOST}:{REDIS_PORT} (attempt {attempt + 1}/{MAX_RETRIES})")
                self.client = redis.Redis(
                    host=REDIS_HOST,
                    port=REDIS_PORT,
                    decode_responses=False,
                    socket_timeout=5,
                    socket_connect_timeout=5
                )
                self.client.ping()
                print("Connected to Redis successfully")
                return
            except redis.ConnectionError as e:
                print(f"Failed to connect to Redis (attempt {attempt + 1}/{MAX_RETRIES}): {str(e)}")
                if attempt < MAX_RETRIES - 1:
                    print(f"Retrying in {RETRY_DELAY} seconds...")
                    time.sleep(RETRY_DELAY)
                else:
                    print("Max retries reached. Redis connection failed.")
                    self.client = None

    def get(self, key):
        """Get a value from Redis"""
        return None

    def set(self, key, value, expire=300):
        """Set a value in Redis with expiration"""
        return False

    def delete(self, key):
        """Delete a key from Redis"""
        return False

# Create a singleton instance
redis_client = RedisClient()