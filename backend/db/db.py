import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import logging
import time
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get database URL from environment variable or use default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/sqlanalytics")

MAX_RETRIES = 5
RETRY_DELAY = 2  # seconds

def get_default_db_url():
    """Get the default database URL for initial connection"""
    # Parse the DATABASE_URL to get connection parameters
    db_url = DATABASE_URL
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    
    # Replace the database name with 'postgres' for initial connection
    db_url = re.sub(r'/([^/]+)$', '/postgres', db_url)
    return db_url

def create_database_if_not_exists():
    """Create the database if it doesn't exist"""
    # Get the default database URL
    default_db_url = get_default_db_url()
    
    # Connect to the default 'postgres' database
    conn = None
    try:
        conn = psycopg2.connect(default_db_url)
        conn.autocommit = True
        cur = conn.cursor()
        
        # Check if our database exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'sqlanalytics'")
        exists = cur.fetchone()
        
        if not exists:
            # Create the database
            cur.execute('CREATE DATABASE sqlanalytics')
            logger.info("Created database 'sqlanalytics'")
    except Exception as e:
        logger.error(f"Error creating database: {e}")
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

def get_connection():
    """Create a database connection with retry logic"""
    for attempt in range(MAX_RETRIES):
        try:
            logger.info(f"Attempting to connect to database (attempt {attempt + 1}/{MAX_RETRIES})")
            logger.info(f"Using DATABASE_URL: {DATABASE_URL}")
            
            # On first attempt, ensure database exists
            if attempt == 0:
                create_database_if_not_exists()
            
            # Connect to our database
            conn = psycopg2.connect(DATABASE_URL)
            logger.info("Database connection successful")
            return conn
        except psycopg2.Error as e:
            logger.error(f"Database connection error: {e}")
            if attempt < MAX_RETRIES - 1:
                logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                raise
        except Exception as e:
            logger.error(f"Unexpected error connecting to database: {e}")
            if attempt < MAX_RETRIES - 1:
                logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                raise

def query(sql, params=None):
    """Execute a query and return results"""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            if cur.description:  # If the query returns results
                result = cur.fetchall()
            else:
                result = None
            conn.commit()
            return result
    except Exception as e:
        logger.error(f"Database query error: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

def execute_transaction(queries_and_params):
    """Execute multiple queries in a transaction"""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            for sql, params in queries_and_params:
                cursor.execute(sql, params)
            conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Transaction error: {e}")
        raise
    finally:
        if conn:
            conn.close()