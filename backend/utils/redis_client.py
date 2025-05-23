import redis
import logging
import time
import os
from dotenv import load_dotenv
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Redis connection parameters
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv('REDIS_DB', 0))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)
MAX_RETRIES = 10
RETRY_DELAY = 2  # seconds

# Create Redis client
redis_client: Optional[redis.Redis] = None

def get_redis_client() -> redis.Redis:
    global redis_client
    if redis_client is None:
        max_retries = 10
        retry_count = 0
        while retry_count < max_retries:
            try:
                logger.info(f"Attempting to connect to Redis at {REDIS_HOST}:{REDIS_PORT} (attempt {retry_count + 1}/{max_retries})")
                redis_client = redis.Redis(
                    host=REDIS_HOST,
                    port=REDIS_PORT,
                    db=REDIS_DB,
                    password=REDIS_PASSWORD,
                    decode_responses=True
                )
                # Test connection
                redis_client.ping()
                logger.info("Successfully connected to Redis")
                break
            except redis.ConnectionError as e:
                retry_count += 1
                if retry_count == max_retries:
                    logger.error(f"Failed to connect to Redis after {max_retries} attempts: {str(e)}")
                    raise
                logger.warning(f"Failed to connect to Redis (attempt {retry_count}/{max_retries}): {str(e)}")
                time.sleep(2)  # Wait 2 seconds before retrying
    return redis_client

class RedisClient:
    _instance = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisClient, cls).__new__(cls)
            cls._instance.connect_with_retry()
        return cls._instance

    def connect_with_retry(self):
        """Connect to Redis with retry logic"""
        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"Attempting to connect to Redis at {REDIS_HOST}:{REDIS_PORT} (attempt {attempt + 1}/{MAX_RETRIES})")
                self._client = redis.Redis(
                    host=REDIS_HOST,
                    port=REDIS_PORT,
                    db=REDIS_DB,
                    password=REDIS_PASSWORD,
                    decode_responses=True,
                    socket_timeout=5,
                    socket_connect_timeout=5
                )
                # Test the connection
                self._client.ping()
                logger.info("Successfully connected to Redis")
                return
            except redis.ConnectionError as e:
                logger.error(f"Failed to connect to Redis (attempt {attempt + 1}/{MAX_RETRIES}): {str(e)}")
                if attempt < MAX_RETRIES - 1:
                    logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                    time.sleep(RETRY_DELAY)
                else:
                    logger.error("Max retries reached. Could not connect to Redis.")
                    raise
            except Exception as e:
                logger.error(f"Unexpected error connecting to Redis: {str(e)}")
                if attempt < MAX_RETRIES - 1:
                    logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                    time.sleep(RETRY_DELAY)
                else:
                    logger.error("Max retries reached. Could not connect to Redis.")
                    raise

    def get(self, key):
        """Get value from Redis"""
        try:
            if not self._client:
                logger.error("Redis client not initialized")
                return None
            return self._client.get(key)
        except Exception as e:
            logger.error(f"Error getting key {key} from Redis: {str(e)}")
            return None

    def set(self, key, value, expiry=None):
        """Set value in Redis with optional expiry"""
        try:
            if not self._client:
                logger.error("Redis client not initialized")
                return False
            if expiry:
                return self._client.setex(key, expiry, value)
            return self._client.set(key, value)
        except Exception as e:
            logger.error(f"Error setting key {key} in Redis: {str(e)}")
            return False

    def delete(self, key):
        """Delete key from Redis"""
        try:
            if not self._client:
                logger.error("Redis client not initialized")
                return False
            return bool(self._client.delete(key))
        except Exception as e:
            logger.error(f"Error deleting key {key} from Redis: {str(e)}")
            return False

    def exists(self, key):
        """Check if key exists in Redis"""
        try:
            if not self._client:
                logger.error("Redis client not initialized")
                return False
            return bool(self._client.exists(key))
        except Exception as e:
            logger.error(f"Error checking key {key} in Redis: {str(e)}")
            return False

# Create a singleton instance
redis_client = RedisClient()