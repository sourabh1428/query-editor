import os
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from create_sample_data import get_db_connection, create_sample_data

logger = logging.getLogger(__name__)

def init_db():
    """Initialize the database with tables and sample data"""
    try:
        # Get database connection
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Create tables
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(100) NOT NULL,
                user_type VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS queries (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                query_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_favorite BOOLEAN DEFAULT FALSE,
                favorite_name VARCHAR(100)
            );
        """)
        
        conn.commit()
        logger.info("Database tables created successfully")
        
        # Create sample data
        create_sample_data()
        
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
        raise
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    init_db() 