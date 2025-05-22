from flask import Blueprint, request, jsonify, make_response
import bcrypt
import jwt
import os
import datetime
from db.db import query
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")

def add_cors_headers(response):
    if isinstance(response, tuple):
        response_obj, status_code = response
        response_obj.headers.add('Access-Control-Allow-Origin', '*')
        response_obj.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response_obj.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response_obj.headers.add('Access-Control-Allow-Credentials', 'true')
        return response_obj, status_code
    else:
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

@auth_bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        response = make_response()
        return add_cors_headers(response)
        
    try:
        data = request.get_json()
        if not data:
            response = jsonify({'message': 'No data provided'}), 400
            return add_cors_headers(response)

        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        logger.info(f"Registration attempt for email: {email}")
        
        if not username or not email or not password:
            response = jsonify({'message': 'Username, email, and password are required'}), 400
            return add_cors_headers(response)
        
        # Check if user exists
        existing_user = query(
            'SELECT * FROM users WHERE username = %s OR email = %s',
            (username, email)
        )
        
        if existing_user:
            logger.warning(f"Registration failed: User already exists with email {email}")
            response = jsonify({'message': 'User already exists'}), 400
            return add_cors_headers(response)
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Create user
        result = query(
            'INSERT INTO users (username, email, password) VALUES (%s, %s, %s) RETURNING id, username, email',
            (username, email, hashed_password.decode('utf-8'))
        )
        
        # Generate token
        token = jwt.encode({
            'id': result[0]['id'],
            'username': result[0]['username'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }, JWT_SECRET, algorithm='HS256')
        
        response = jsonify({
            'message': 'User registered successfully',
            'user': result[0],
            'token': token
        })
        return add_cors_headers(response), 201
    
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        response = jsonify({'message': 'An error occurred during registration'}), 500
        return add_cors_headers(response)

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        response = make_response()
        return add_cors_headers(response)
        
    try:
        data = request.get_json()
        if not data:
            response = jsonify({'message': 'No data provided'}), 400
            return add_cors_headers(response)

        email = data.get('email')
        password = data.get('password')
        
        logger.info(f"Login attempt for email: {email}")
        
        if not email or not password:
            response = jsonify({'message': 'Email and password are required'}), 400
            return add_cors_headers(response)
        
        # Get user
        users = query('SELECT * FROM users WHERE email = %s', (email,))
        logger.info(f"DB query result for email {email}: {users}")
        
        if not users:
            logger.warning(f"Login failed: Invalid email {email}")
            response = jsonify({'message': 'Invalid email or password'}), 400
            return add_cors_headers(response)
        
        user = users[0]
        logger.info(f"User from DB: {user}")
        logger.info(f"Password from DB: {user['password']}")
        password_check = bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8'))
        logger.info(f"Password check result: {password_check}")
        
        # Check password
        if not password_check:
            logger.warning(f"Login failed: Invalid password for email {email}")
            response = jsonify({'message': 'Invalid email or password'}), 400
            return add_cors_headers(response)
        
        # Generate token
        token = jwt.encode({
            'id': user['id'],
            'username': user['username'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }, JWT_SECRET, algorithm='HS256')
        
        response = jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email']
            }
        })
        return add_cors_headers(response), 200
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        response = jsonify({'message': 'An error occurred during login'}), 500
        return add_cors_headers(response)