from flask import Blueprint, request, jsonify, make_response
from middleware.auth_middleware import token_required
from db.db import query, get_connection
import logging

schema_bp = Blueprint('schema', __name__)
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

@schema_bp.route('/tables', methods=['GET'])
@token_required
def get_tables(current_user):
    """Get list of all tables in the database"""
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        # Query to get all table names
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = [row[0] for row in cur.fetchall()]
        cur.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'tables': tables
        })
    except Exception as e:
        logger.error(f"Error getting tables: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to get tables'
        }), 500

@schema_bp.route('/tables/<table_name>', methods=['GET', 'OPTIONS'])
@token_required
def get_table_schema(table_name, current_user):
    """
    Get columns for a specific table
    ---
    tags:
      - Schema
    security:
      - Bearer: []
    parameters:
      - in: path
        name: table_name
        required: true
        type: string
    responses:
      200:
        description: Columns retrieved successfully
      401:
        description: Unauthorized
      404:
        description: Table not found
    """
    if request.method == 'OPTIONS':
        response = make_response()
        return add_cors_headers(response)
    
    try:
        # Check if table exists
        table_check_sql = """
            SELECT 
                table_name 
            FROM 
                information_schema.tables 
            WHERE 
                table_schema = 'public' 
                AND table_name = %s
        """
        
        table_check = query(table_check_sql, (table_name,))
        
        if not table_check:
            response = jsonify({'message': 'Table not found'}), 404
            return add_cors_headers(response)
        
        # Get columns
        columns_sql = """
            SELECT 
                column_name, 
                data_type, 
                is_nullable, 
                column_default
            FROM 
                information_schema.columns 
            WHERE 
                table_schema = 'public' 
                AND table_name = %s
            ORDER BY 
                ordinal_position
        """
        
        columns = query(columns_sql, (table_name,))
        
        # Get primary keys
        pk_sql = """
            SELECT 
                kcu.column_name
            FROM 
                information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE 
                tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_name = %s
        """
        
        pk_result = query(pk_sql, (table_name,))
        primary_keys = [row['column_name'] for row in pk_result]
        
        # Get foreign keys
        fk_sql = """
            SELECT 
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM 
                information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE 
                tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name = %s
        """
        
        foreign_keys = query(fk_sql, (table_name,))
        
        # Get sample data
        sample_sql = f"SELECT * FROM {table_name} LIMIT 5"
        sample_data = query(sample_sql)
        
        response = jsonify({
            'message': 'Table schema retrieved successfully',
            'table': table_name,
            'columns': columns,
            'primaryKeys': primary_keys,
            'foreignKeys': foreign_keys,
            'sampleData': sample_data
        }), 200
        return add_cors_headers(response)
    
    except Exception as e:
        response = jsonify({'message': str(e)}), 500
        return add_cors_headers(response)