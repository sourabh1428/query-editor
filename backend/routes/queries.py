from flask import Blueprint, request, jsonify, make_response
import csv
from io import StringIO
from middleware.auth_middleware import token_required
from db.db import query
from utils.redis_client import redis_client
from flask_jwt_extended import get_jwt_identity
import logging

queries_bp = Blueprint('queries', __name__)
logger = logging.getLogger(__name__)

@queries_bp.route('/execute', methods=['POST'])
@token_required
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
    try:
        data = request.get_json()
        sql_query = data.get('query')
        user_id = request.user['id']
        
        if not sql_query:
            return jsonify({'message': 'Query is required'}), 400
        
        # Check if query is read-only (for security)
        sql_lower = sql_query.lower().strip()
        if any(keyword in sql_lower for keyword in ['insert', 'update', 'delete', 'drop', 'alter', 'create']):
            return jsonify({'message': 'Only SELECT queries are allowed'}), 400
        
        # Check cache
        cache_key = f"query:{user_id}:{sql_query}"
        cached_result = redis_client.get(cache_key)
        
        if cached_result:
            # Save to history
            query(
                'INSERT INTO queries (user_id, query_text) VALUES (%s, %s)',
                (user_id, sql_query)
            )
            
            return jsonify({
                'message': 'Query executed successfully (cached)',
                'result': cached_result
            }), 200
        
        # Execute query
        result = query(sql_query)
        
        # Save to history
        query(
            'INSERT INTO queries (user_id, query_text) VALUES (%s, %s)',
            (user_id, sql_query)
        )
        
        # Cache result
        redis_client.set(cache_key, result)
        
        return jsonify({
            'message': 'Query executed successfully',
            'result': result
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@queries_bp.route('/history', methods=['GET'])
@token_required
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
    try:
        current_user_id = request.user['id']
        logger.info(f"Fetching query history for user_id: {current_user_id}")
        history = query('SELECT id, user_id, query_text, created_at::text as created_at FROM queries WHERE user_id = %s ORDER BY created_at DESC', (current_user_id,))
        logger.info(f"Query history: {history}")
        return jsonify({
            'message': 'Query history retrieved successfully',
            'history': history
        }), 200
    except Exception as e:
        logger.error(f"Error fetching query history: {str(e)}")
        return jsonify({'message': 'An error occurred while fetching query history'}), 500

@queries_bp.route('/<int:query_id>/favorite', methods=['PUT'])
@token_required
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
    try:
        user_id = request.user['id']
        
        # Check if query exists and belongs to user
        result = query(
            'SELECT * FROM queries WHERE id = %s AND user_id = %s',
            (query_id, user_id)
        )
        
        if not result:
            return jsonify({'message': 'Query not found'}), 404
        
        # Toggle favorite status
        current_status = result[0]['is_favorite']
        new_status = not current_status
        
        query(
            'UPDATE queries SET is_favorite = %s WHERE id = %s',
            (new_status, query_id)
        )
        
        return jsonify({
            'message': f"Query {'added to' if new_status else 'removed from'} favorites",
            'is_favorite': new_status
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@queries_bp.route('/<int:query_id>', methods=['DELETE'])
@token_required
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
    try:
        user_id = request.user['id']
        
        # Check if query exists and belongs to user
        result = query(
            'SELECT * FROM queries WHERE id = %s AND user_id = %s',
            (query_id, user_id)
        )
        
        if not result:
            return jsonify({'message': 'Query not found'}), 404
        
        # Delete query
        query('DELETE FROM queries WHERE id = %s', (query_id,))
        
        return jsonify({'message': 'Query deleted successfully'}), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@queries_bp.route('/<int:query_id>/download', methods=['GET'])
@token_required
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
    try:
        user_id = request.user['id']
        
        # Check if query exists and belongs to user
        result = query(
            'SELECT * FROM queries WHERE id = %s AND user_id = %s',
            (query_id, user_id)
        )
        
        if not result:
            return jsonify({'message': 'Query not found'}), 404
        
        sql_query = result[0]['query_text']
        
        # Execute query
        result = query(sql_query)
        
        if not result:
            return jsonify({'message': 'No results to download'}), 404
        
        # Create CSV
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=result[0].keys())
        writer.writeheader()
        writer.writerows(result)
        
        # Create response
        response = make_response(output.getvalue())
        response.headers["Content-Disposition"] = f"attachment; filename=query-{query_id}.csv"
        response.headers["Content-type"] = "text/csv"
        
        return response
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500