from db.db import query
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_database():
    try:
        # Check if users table exists and has correct structure
        result = query("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        """)
        logger.info("Users table structure:")
        for row in result:
            logger.info(f"Column: {row['column_name']}, Type: {row['data_type']}")
        
        # Check if there are any users
        users = query("SELECT COUNT(*) as count FROM users")
        logger.info(f"Number of users in database: {users[0]['count']}")
        
        return True
    except Exception as e:
        logger.error(f"Database check failed: {str(e)}")
        return False

if __name__ == "__main__":
    check_database() 