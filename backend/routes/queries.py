from flask import Blueprint, request, jsonify, make_response
import csv
from io import StringIO
from middleware.auth_middleware import token_required
from db.db import query
import logging

queries_bp = Blueprint('queries', __name__)
logger = logging.getLogger(__name__)

def add_cors_headers(response):
    """Add CORS headers to response"""
    if isinstance(response, tuple):
        response_obj, status_code = response
        if hasattr(response_obj, 'headers'):
            response_obj.headers.add('Access-Control-Allow-Origin', '*')
            response_obj.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With')
            response_obj.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            response_obj.headers.add('Access-Control-Allow-Credentials', 'true')
        return response_obj, status_code
    else:
        if hasattr(response, 'headers'):
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,X-Requested-With')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

def validate_query(sql_query, user_type):
    """Validate SQL query for security and allowed operations"""
    # Remove comments and normalize whitespace
    sql_lower = ' '.join(sql_query.lower().split())
    
    # Extract the first word of the query (the command)
    first_word = sql_lower.split()[0] if sql_lower else ''
    
    # Check for INSERT specifically
    if first_word == 'insert':
        if user_type != 'admin_user':
            return False, "Only SELECT queries are allowed"
        return True, None
    
    # Check for other write operations
    if first_word in ['update', 'delete', 'drop', 'alter', 'create', 'truncate']:
        if user_type != 'admin_user':
            return False, "Only SELECT queries are allowed"
        return True, None
    
    # Check if query starts with SELECT
    if first_word != 'select':
        if user_type != 'admin_user':
            return False, "Query must start with SELECT"
    
    return True, None

@queries_bp.route('/execute', methods=['POST', 'OPTIONS'])
def execute_query():
    """
    Execute a SQL query
    ---
    tags:
      - Queries
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - query
          properties:
            query:
              type: string
    responses:
      200:
        description: Query executed successfully
      400:
        description: Invalid query
      401:
        description: Unauthorized
    """
    if request.method == 'OPTIONS':
        response = make_response()
        return add_cors_headers(response)
    
    # Apply token validation only for non-OPTIONS requests    
    @token_required
    def execute_with_auth():
        try:
            data = request.get_json()
            sql_query = data.get('query')
            user_id = request.user['id']
            user_type = request.user['userType']
            
            if not sql_query:
                response = jsonify({'message': 'Query is required'}), 400
                return add_cors_headers(response)
            
            # Log the query and user type for debugging
            logger.debug(f"Validating query for user type {user_type}: {sql_query}")
            
            # Validate query with user type
            is_valid, error_message = validate_query(sql_query, user_type)
            if not is_valid:
                logger.debug(f"Query validation failed: {error_message}")
                response = jsonify({'message': error_message}), 400
                return add_cors_headers(response)
            
            # For INSERT queries, add RETURNING clause if not present
            if sql_query.lower().strip().startswith('insert'):
                if 'returning' not in sql_query.lower():
                    # Add RETURNING * at the end of the query
                    sql_query = sql_query.rstrip(';') + ' RETURNING *;'
            
            # Execute query
            result = query(sql_query)
            
            # Save to history
            query(
                'INSERT INTO queries (user_id, query_text) VALUES (%s, %s)',
                (user_id, sql_query)
            )
            
            response = jsonify({
                'message': 'Query executed successfully',
                'result': result
            }), 200
            return add_cors_headers(response)
        
        except Exception as e:
            logger.error(f"Query execution error: {str(e)}")
            response = jsonify({'message': str(e)}), 500
            return add_cors_headers(response)
    
    return execute_with_auth()

@queries_bp.route('/history', methods=['GET', 'OPTIONS'])
def get_query_history():
    """
    Get user's query history
    ---
    tags:
      - Queries
    security:
      - Bearer: []
    responses:
      200:
        description: Query history retrieved successfully
      401:
        description: Unauthorized
    """
    if request.method == 'OPTIONS':
        response = make_response()
        return add_cors_headers(response)
    
    # Apply token validation only for non-OPTIONS requests
    @token_required
    def get_history_with_auth():
        try:
            current_user_id = request.user['id']
            logger.info(f"Fetching query history for user_id: {current_user_id}")
            history = query('SELECT id, user_id, query_text, created_at::text as created_at FROM queries WHERE user_id = %s ORDER BY created_at DESC', (current_user_id,))
            logger.info(f"Query history: {history}")
            
            response = jsonify({
                'message': 'Query history retrieved successfully',
                'history': history
            }), 200
            return add_cors_headers(response)
        except Exception as e:
            logger.error(f"Error fetching query history: {str(e)}")
            response = jsonify({'message': 'An error occurred while fetching query history'}), 500
            return add_cors_headers(response)
    
    return get_history_with_auth()

@queries_bp.route('/<int:query_id>/favorite', methods=['PUT', 'OPTIONS'])
def toggle_favorite(query_id):
    """
    Toggle favorite status of a query
    ---
    tags:
      - Queries
    security:
      - Bearer: []
    parameters:
      - in: path
        name: query_id
        required: true
        type: integer
    responses:
      200:
        description: Favorite status updated successfully
      401:
        description: Unauthorized
      404:
        description: Query not found
    """
    if request.method == 'OPTIONS':
        response = make_response()
        return add_cors_headers(response)
    
    # Apply token validation only for non-OPTIONS requests
    @token_required
    def toggle_favorite_with_auth():
        try:
            user_id = request.user['id']
            
            # Check if query exists and belongs to user
            result = query(
                'SELECT * FROM queries WHERE id = %s AND user_id = %s',
                (query_id, user_id)
            )
            
            if not result:
                response = jsonify({'message': 'Query not found'}), 404
                return add_cors_headers(response)
            
            # Toggle favorite status
            current_status = result[0]['is_favorite']
            new_status = not current_status
            
            query(
                'UPDATE queries SET is_favorite = %s WHERE id = %s',
                (new_status, query_id)
            )
            
            response = jsonify({
                'message': f"Query {'added to' if new_status else 'removed from'} favorites",
                'is_favorite': new_status
            }), 200
            return add_cors_headers(response)
        
        except Exception as e:
            response = jsonify({'message': str(e)}), 500
            return add_cors_headers(response)
    
    return toggle_favorite_with_auth()

@queries_bp.route('/<int:query_id>', methods=['DELETE', 'OPTIONS'])
def delete_query(query_id):
    """
    Delete a query from history
    ---
    tags:
      - Queries
    security:
      - Bearer: []
    parameters:
      - in: path
        name: query_id
        required: true
        type: integer
    responses:
      200:
        description: Query deleted successfully
      401:
        description: Unauthorized
      404:
        description: Query not found
    """
    if request.method == 'OPTIONS':
        response = make_response()
        return add_cors_headers(response)
    
    # Apply token validation only for non-OPTIONS requests
    @token_required
    def delete_query_with_auth():
        try:
            user_id = request.user['id']
            
            # Check if query exists and belongs to user
            result = query(
                'SELECT * FROM queries WHERE id = %s AND user_id = %s',
                (query_id, user_id)
            )
            
            if not result:
                response = jsonify({'message': 'Query not found'}), 404
                return add_cors_headers(response)
            
            # Delete query
            query('DELETE FROM queries WHERE id = %s', (query_id,))
            
            response = jsonify({'message': 'Query deleted successfully'}), 200
            return add_cors_headers(response)
        
        except Exception as e:
            response = jsonify({'message': str(e)}), 500
            return add_cors_headers(response)
    
    return delete_query_with_auth()

@queries_bp.route('/<int:query_id>/download', methods=['GET', 'OPTIONS'])
def download_results(query_id):
    """
    Download query results as CSV
    ---
    tags:
      - Queries
    security:
      - Bearer: []
    parameters:
      - in: path
        name: query_id
        required: true
        type: integer
    responses:
      200:
        description: CSV file
      401:
        description: Unauthorized
      404:
        description: Query not found
    """
    if request.method == 'OPTIONS':
        response = make_response()
        return add_cors_headers(response)
    
    # Apply token validation only for non-OPTIONS requests
    @token_required
    def download_results_with_auth():
        try:
            user_id = request.user['id']
            
            # Check if query exists and belongs to user
            result = query(
                'SELECT * FROM queries WHERE id = %s AND user_id = %s',
                (query_id, user_id)
            )
            
            if not result:
                response = jsonify({'message': 'Query not found'}), 404
                return add_cors_headers(response)
            
            sql_query = result[0]['query_text']
            
            # Execute query
            result = query(sql_query)
            
            if not result:
                response = jsonify({'message': 'No results to download'}), 404
                return add_cors_headers(response)
            
            # Create CSV
            output = StringIO()
            writer = csv.DictWriter(output, fieldnames=result[0].keys())
            writer.writeheader()
            writer.writerows(result)
            
            # Create response
            response = make_response(output.getvalue())
            response.headers["Content-Disposition"] = f"attachment; filename=query-{query_id}.csv"
            response.headers["Content-type"] = "text/csv"
            
            return add_cors_headers(response)
        
        except Exception as e:
            response = jsonify({'message': str(e)}), 500
            return add_cors_headers(response)
    
    return download_results_with_auth()