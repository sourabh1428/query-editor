from flask import Blueprint, request, jsonify
from middleware.auth_middleware import token_required
from db.db import query

schema_bp = Blueprint('schema', __name__)

@schema_bp.route('/tables', methods=['GET'])
@token_required
def get_tables():
    """
    Get all tables in the database
    ---
    tags:
      - Schema
    security:
      - Bearer: []
    responses:
      200:
        description: Tables retrieved successfully
      401:
        description: Unauthorized
    """
    try:
        sql = """
            SELECT 
                table_name 
            FROM 
                information_schema.tables 
            WHERE 
                table_schema = 'public' 
                AND table_type = 'BASE TABLE'
            ORDER BY 
                table_name
        """
        
        result = query(sql)
        
        return jsonify({
            'message': 'Tables retrieved successfully',
            'tables': [row['table_name'] for row in result]
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@schema_bp.route('/tables/<table_name>', methods=['GET'])
@token_required
def get_table_schema(table_name):
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
            return jsonify({'message': 'Table not found'}), 404
        
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
        
        return jsonify({
            'message': 'Table schema retrieved successfully',
            'table': table_name,
            'columns': columns,
            'primaryKeys': primary_keys,
            'foreignKeys': foreign_keys,
            'sampleData': sample_data
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500