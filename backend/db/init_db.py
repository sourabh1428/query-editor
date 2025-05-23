import os
import bcrypt
from db import query, execute_transaction

def init_db():
    # Read and execute the SQL initialization script
    with open(os.path.join(os.path.dirname(__file__), 'init.sql'), 'r') as f:
        sql_script = f.read()
    
    # Execute the SQL script
    execute_transaction([(sql_script, None)])
    
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