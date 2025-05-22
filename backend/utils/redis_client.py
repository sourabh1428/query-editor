import redis
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Redis connection parameters
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")

class RedisClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisClient, cls).__new__(cls)
            cls._instance.client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                decode_responses=False
            )
            try:
                cls._instance.client.ping()
                print("Connected to Redis successfully")
            except redis.ConnectionError:
                print("Failed to connect to Redis")
                cls._instance.client = None
        return cls._instance

    def get(self, key):
        """Get a value from Redis"""
        if not self.client:
            return None
        
        try:
            data = self.client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            print(f"Redis get error: {e}")
            return None

    def set(self, key, value, expire=300):
        """Set a value in Redis with expiration"""
        if not self.client:
            return False
        
        try:
            serialized = json.dumps(value)
            return self.client.set(key, serialized, ex=expire)
        except Exception as e:
            print(f"Redis set error: {e}")
            return False

    def delete(self, key):
        """Delete a key from Redis"""
        if not self.client:
            return False
        
        try:
            return self.client.delete(key)
        except Exception as e:
            print(f"Redis delete error: {e}")
            return False

# Create a singleton instance
redis_client = RedisClient()