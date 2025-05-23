import os
import bcrypt
import psycopg2
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def register_user(username, email, password):
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432"),
            database=os.getenv("DB_NAME", "project"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "postgres")
        )
        
        # Create cursor
        cur = conn.cursor()
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Insert user
        cur.execute("""
            INSERT INTO users (username, email, password_hash, user_type)
            VALUES (%s, %s, %s, %s)
            RETURNING id, username, email, user_type
        """, (username, email, hashed_password.decode('utf-8'), 'admin_user'))
        
        # Get the inserted user
        user = cur.fetchone()
        
        # Commit the transaction
        conn.commit()
        
        logger.info(f"Successfully registered user: {username} with email: {email}")
        return user
        
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        if conn:
            conn.rollback()
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    # Example usage
    username = "admin"
    email = "sppathak1428@gmail.com"
    password = "123123"
    
    try:
        user = register_user(username, email, password)
        logger.info(f"User registered successfully: {user}")
    except Exception as e:
        logger.error(f"Failed to register user: {str(e)}") 