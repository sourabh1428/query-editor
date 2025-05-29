import os
import jwt
from functools import wraps
from flask import request, jsonify, make_response
from dotenv import load_dotenv
from db.db import query

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Handle preflight requests
        if request.method == 'OPTIONS':
            return make_response(), 200

        token = None

        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Access denied. No token provided.'}), 401
        
        try:
            # Decode token
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            
            # Get user from database
            user = query('SELECT * FROM users WHERE id = %s', (payload['id'],))[0]
            
            # Add user info to request
            request.user = user
            
            return f(*args, current_user=user, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expired.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token.'}), 401
        except Exception as e:
            return jsonify({'message': f'Error validating token: {str(e)}'}), 401
    
    return decorated