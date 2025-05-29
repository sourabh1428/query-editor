import os
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection parameters for local development
DB_HOST = "localhost"  # Changed from postgres to localhost
DB_PORT = "5432"
DB_USER = "postgres"
DB_PASSWORD = "postgres"
DB_NAME = "sqlanalytics"

def add_user():
    conn = None
    try:
        # Connect to the database
        logger.info(f"Attempting to connect to database at {DB_HOST}:{DB_PORT}")
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME
        )
        
        # Create users table if it doesn't exist
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            user_type VARCHAR(20) NOT NULL DEFAULT 'regular_user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        # Insert user SQL
        insert_user_sql = """
        INSERT INTO users (username, email, password_hash, user_type)
        VALUES (
            'admin',
            'sppathak1428@gmail.com',
            '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',  -- This is the bcrypt hash for '123123'
            'admin_user'
        ) ON CONFLICT (email) 
        DO UPDATE SET 
            password_hash = EXCLUDED.password_hash,
            user_type = EXCLUDED.user_type;
        """
        
        with conn.cursor() as cur:
            # Create table
            cur.execute(create_table_sql)
            # Insert user
            cur.execute(insert_user_sql)
            conn.commit()
        
        logger.info("User added successfully!")
        
    except Exception as e:
        logger.error(f"Error adding user: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    add_user() 