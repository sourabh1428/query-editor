import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection parameters
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_NAME = os.getenv("DB_NAME", "sqlanalytics")

def get_connection():
    """Create a database connection"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME
        )
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        raise

def query(sql, params=None):
    """Execute a query and return the results"""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(sql, params)
            if cursor.description:  # If the query returns rows (e.g., SELECT, or INSERT ... RETURNING)
                result = cursor.fetchall()
                conn.commit()  # Commit if it's an INSERT/UPDATE/DELETE with RETURNING
                return [dict(row) for row in result]
            else:  # For INSERT, UPDATE, DELETE without RETURNING
                conn.commit()
                return None
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Database query error: {e}")
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
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"Transaction error: {e}")
        raise
    finally:
        if conn:
            conn.close()