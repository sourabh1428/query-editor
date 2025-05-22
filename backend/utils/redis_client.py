import redis
import json
import os
import time
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Redis connection parameters
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
MAX_RETRIES = 10
RETRY_DELAY = 2  # seconds

class RedisClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisClient, cls).__new__(cls)
            cls._instance.client = None
            cls._instance.connect_with_retry()
        return cls._instance

    def connect_with_retry(self):
        """Attempt to connect to Redis with retries"""
        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"Attempting to connect to Redis at {REDIS_HOST}:{REDIS_PORT} (attempt {attempt + 1}/{MAX_RETRIES})")
                self.client = redis.Redis(
                    host=REDIS_HOST,
                    port=REDIS_PORT,
                    decode_responses=False,
                    socket_timeout=5,
                    socket_connect_timeout=5,
                    retry_on_timeout=True,
                    health_check_interval=30
                )
                # Test the connection
                self.client.ping()
                logger.info("Connected to Redis successfully")
                return
            except redis.ConnectionError as e:
                logger.error(f"Failed to connect to Redis (attempt {attempt + 1}/{MAX_RETRIES}): {str(e)}")
                if attempt < MAX_RETRIES - 1:
                    logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                    time.sleep(RETRY_DELAY)
                else:
                    logger.error("Max retries reached. Redis connection failed.")
                    self.client = None
            except Exception as e:
                logger.error(f"Unexpected error connecting to Redis: {str(e)}")
                if attempt < MAX_RETRIES - 1:
                    logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                    time.sleep(RETRY_DELAY)
                else:
                    logger.error("Max retries reached. Redis connection failed.")
                    self.client = None

    def get(self, key):
        """Get a value from Redis"""
        if not self.client:
            logger.warning("Redis client not available")
            return None
        
        try:
            data = self.client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None

    def set(self, key, value, expire=300):
        """Set a value in Redis with expiration"""
        if not self.client:
            logger.warning("Redis client not available")
            return False
        
        try:
            serialized = json.dumps(value)
            return self.client.set(key, serialized, ex=expire)
        except Exception as e:
            logger.error(f"Redis set error: {e}")
            return False

    def delete(self, key):
        """Delete a key from Redis"""
        if not self.client:
            logger.warning("Redis client not available")
            return False
        
        try:
            return self.client.delete(key)
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return False

# Create a singleton instance
redis_client = RedisClient()