from flask import Blueprint, request, jsonify, make_response, Response
import csv
from io import StringIO
from middleware.auth_middleware import token_required
from db.db import query, get_connection
import logging
import io

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
            return False, "Your access is not admin type, you can't run this command"
        return True, None
    
    # Check for other write operations
    if first_word in ['update', 'delete', 'drop', 'alter', 'create', 'truncate']:
        if user_type != 'admin_user':
            return False, "Your access is not admin type, you can't run this command"
        return True, None
    
    # Check if query starts with SELECT
    if first_word != 'select':
        if user_type != 'admin_user':
            return False, "Your access is not admin type, you can't run this command"
    
    return True, None

@queries_bp.route('/execute', methods=['POST'])
@token_required
def execute_query(current_user):
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
    try:
        data = request.get_json()
        sql_query = data.get('query')
        user_id = current_user['id']
        user_type = current_user.get('userType')
        
        if not user_type:
            return jsonify({'message': 'User type not found in token'}), 400
        
        if not sql_query:
            return jsonify({'message': 'Query is required'}), 400
        
        # Log the query and user type for debugging
        logger.debug(f"Validating query for user type {user_type}: {sql_query}")
        
        # Validate query with user type
        is_valid, error_message = validate_query(sql_query, user_type)
        if not is_valid:
            logger.debug(f"Query validation failed: {error_message}")
            return jsonify({'message': error_message}), 400
        
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
        
        return jsonify({
            'message': 'Query executed successfully',
            'result': result
        }), 200
    
    except Exception as e:
        logger.error(f"Query execution error: {str(e)}")
        return jsonify({'message': str(e)}), 500

@queries_bp.route('/history', methods=['GET'])
@token_required
def get_query_history(current_user):
    """Get query history for the current user"""
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        # Get query history for the current user
        cur.execute("""
            SELECT id, query_text, created_at, user_id, is_favorite, favorite_name
            FROM queries 
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (current_user['id'],))
        
        history = []
        for row in cur.fetchall():
            history.append({
                'id': row[0],
                'query_text': row[1],
                'created_at': row[2].isoformat() if row[2] else None,
                'user_id': row[3],
                'is_favorite': row[4],
                'favorite_name': row[5]
            })
        
        cur.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'history': history
        })
    except Exception as e:
        logger.error(f"Error getting query history: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to get query history'
        }), 500

@queries_bp.route('/<int:query_id>/favorite', methods=['PUT', 'POST', 'OPTIONS'])
@token_required
def toggle_favorite(query_id, current_user):
    if request.method == 'OPTIONS':
        response = make_response()
        return add_cors_headers(response)
    try:
        user_id = current_user['id']
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

@queries_bp.route('/<int:query_id>/download', methods=['GET'])
@token_required
def download_results(query_id: int, current_user):
    try:
        # Get the query from the database
        conn = get_connection()
        cur = conn.cursor()
        
        # First check if the query exists and belongs to the user
        cur.execute(
            "SELECT query_text FROM queries WHERE id = %s AND user_id = %s",
            (query_id, current_user['id'])
        )
        query_result = cur.fetchone()
        
        if not query_result:
            return jsonify({
                'status': 'error',
                'message': 'Query not found or unauthorized'
            }), 404
            
        query_text = query_result[0]
        
        # Execute the query to get results
        cur.execute(query_text)
        results = cur.fetchall()
        column_names = [desc[0] for desc in cur.description]
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(column_names)
        writer.writerows(results)
        
        # Create the response
        output.seek(0)
        return Response(
            output,
            mimetype='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename=query-results-{query_id}.csv'
            }
        )
        
    except Exception as e:
        logger.error(f"Error downloading results: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

@queries_bp.route('/<int:query_id>/favorite/name', methods=['PUT', 'OPTIONS'])
@token_required
def update_favorite_name(query_id, current_user):
    if request.method == 'OPTIONS':
        response = make_response()
        return add_cors_headers(response)
    try:
        data = request.get_json()
        name = data.get('name')
        user_id = current_user['id']
        # Check if query exists and belongs to user
        result = query(
            'SELECT * FROM queries WHERE id = %s AND user_id = %s',
            (query_id, user_id)
        )
        if not result:
            response = jsonify({'message': 'Query not found'}), 404
            return add_cors_headers(response)
        # Update favorite name
        query(
            'UPDATE queries SET favorite_name = %s WHERE id = %s',
            (name, query_id)
        )
        response = jsonify({'message': 'Favorite name updated successfully'}), 200
        return add_cors_headers(response)
    except Exception as e:
        response = jsonify({'message': str(e)}), 500
        return add_cors_headers(response)