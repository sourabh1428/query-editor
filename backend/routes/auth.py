from flask import Blueprint, request, jsonify
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

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    ---
    tags:
      - Auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - username
            - email
            - password
          properties:
            username:
              type: string
            email:
              type: string
            password:
              type: string
    responses:
      201:
        description: User registered successfully
      400:
        description: Invalid input or user already exists
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400

        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        logger.info(f"Registration attempt for email: {email}")
        
        if not username or not email or not password:
            return jsonify({'message': 'Username, email, and password are required'}), 400
        
        # Check if user exists
        existing_user = query(
            'SELECT * FROM users WHERE username = %s OR email = %s',
            (username, email)
        )
        
        if existing_user:
            logger.warning(f"Registration failed: User already exists with email {email}")
            return jsonify({'message': 'User already exists'}), 400
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Create user
        result = query(
            'INSERT INTO users (username, email, password) VALUES (%s, %s, %s) RETURNING id, username, email',
            (username, email, hashed_password.decode('utf-8'))
        )
        
        logger.info(f"User registered successfully: {email}")
        return jsonify({
            'message': 'User registered successfully',
            'user': result[0]
        }), 201
    
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'message': 'An error occurred during registration'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login a user
    ---
    tags:
      - Auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
            password:
              type: string
    responses:
      200:
        description: Login successful
      400:
        description: Invalid credentials
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400

        email = data.get('email')
        password = data.get('password')
        
        logger.info(f"Login attempt for email: {email}")
        
        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Get user
        users = query('SELECT * FROM users WHERE email = %s', (email,))
        logger.info(f"DB query result for email {email}: {users}")
        
        if not users:
            logger.warning(f"Login failed: Invalid email {email}")
            return jsonify({'message': 'Invalid email or password'}), 400
        
        user = users[0]
        logger.info(f"User from DB: {user}")
        logger.info(f"Password from DB: {user['password']}")
        password_check = bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8'))
        logger.info(f"Password check result: {password_check}")
        
        # Check password
        if not password_check:
            logger.warning(f"Login failed: Invalid password for email {email}")
            return jsonify({'message': 'Invalid email or password'}), 400
        
        # Generate token
        token = jwt.encode({
            'id': user['id'],
            'username': user['username'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }, JWT_SECRET, algorithm='HS256')
        
        logger.info(f"User logged in successfully: {email}")
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email']
            }
        }), 200
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'message': 'An error occurred during login'}), 500