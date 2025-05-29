import os
import bcrypt
from db import query, execute_transaction
from create_sample_data import create_tables, insert_sample_data, get_db_connection

def init_db():
    # Read and execute the SQL initialization script
    with open(os.path.join(os.path.dirname(__file__), 'init.sql'), 'r') as f:
        sql_script = f.read()
    
    # Execute the SQL script
    execute_transaction([(sql_script, None)])
    
    # Create sample tables and insert sample data
    conn = get_db_connection()
    try:
        create_tables(conn)
        insert_sample_data(conn)
    finally:
        conn.close()
    
    # Check if trigger exists before creating it
    check_trigger = """
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_users_updated_at'
    );
    """
    result = query(check_trigger)
    trigger_exists = False
    if result:
        # If result is a list of tuples/lists
        if isinstance(result[0], (list, tuple)) and len(result[0]) > 0:
            trigger_exists = result[0][0]
        # If result is a list of dicts (e.g., from DictCursor)
        elif isinstance(result[0], dict) and 'exists' in result[0]:
            trigger_exists = result[0]['exists']
    
    if not trigger_exists:
        create_trigger = """
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        """
        execute_transaction([(create_trigger, None)])
    
    # Generate password hash for the admin user
    password = "123123"
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    # Update the admin user's password hash
    update_query = """
    UPDATE users 
    SET password_hash = %s 
    WHERE email = 'sppathak1428@gmail.com'
    """
    execute_transaction([(update_query, (password_hash,))])
    
    print("Database initialized successfully!")

if __name__ == "__main__":
    init_db() 