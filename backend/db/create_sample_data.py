import os
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from datetime import datetime, timedelta
import random
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def get_db_connection():
    """Create a database connection."""
    try:
        conn = psycopg2.connect(
            dbname='sqlanalytics',
            user='postgres',
            password='postgres',
            host='localhost',
            port='5432'
        )
        return conn
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        raise

def create_tables(conn):
    """Create sample tables if they don't exist."""
    try:
        with conn.cursor() as cur:
            # Create customers table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS customers (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    city VARCHAR(50),
                    country VARCHAR(50),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Create products table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    stock_quantity INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Create orders table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS orders (
                    id SERIAL PRIMARY KEY,
                    customer_id INTEGER REFERENCES customers(id),
                    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    total_amount DECIMAL(10,2) NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'pending'
                )
            """)

            # Create order_items table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS order_items (
                    id SERIAL PRIMARY KEY,
                    order_id INTEGER REFERENCES orders(id),
                    product_id INTEGER REFERENCES products(id),
                    quantity INTEGER NOT NULL,
                    unit_price DECIMAL(10,2) NOT NULL
                )
            """)

            conn.commit()
            logger.info("Tables created successfully")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error creating tables: {str(e)}")
        raise

def insert_sample_data(conn):
    """Insert sample data into tables."""
    try:
        with conn.cursor() as cur:
            # Insert customers
            customers = [
                ('John Doe', 'john@example.com', 'New York', 'USA'),
                ('Jane Smith', 'jane@example.com', 'London', 'UK'),
                ('Bob Johnson', 'bob@example.com', 'Paris', 'France'),
                ('Alice Brown', 'alice@example.com', 'Berlin', 'Germany'),
                ('Charlie Wilson', 'charlie@example.com', 'Tokyo', 'Japan')
            ]
            for customer in customers:
                cur.execute("""
                    INSERT INTO customers (name, email, city, country)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (email) DO NOTHING
                """, customer)

            # Insert products
            products = [
                ('Laptop', 'Electronics', 999.99, 50),
                ('Smartphone', 'Electronics', 699.99, 100),
                ('Headphones', 'Electronics', 199.99, 75),
                ('Desk Chair', 'Furniture', 299.99, 30),
                ('Coffee Table', 'Furniture', 199.99, 20),
                ('Bookshelf', 'Furniture', 149.99, 15)
            ]
            for product in products:
                cur.execute("""
                    INSERT INTO products (name, category, price, stock_quantity)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                """, product)

            # Insert orders
            orders = [
                (1, 1199.98, 'completed'),
                (2, 699.99, 'completed'),
                (3, 499.98, 'pending'),
                (4, 299.99, 'completed'),
                (5, 149.99, 'pending')
            ]
            for order in orders:
                cur.execute("""
                    INSERT INTO orders (customer_id, total_amount, status)
                    VALUES (%s, %s, %s)
                    ON CONFLICT DO NOTHING
                """, order)

            # Insert order items
            order_items = [
                (1, 1, 1, 999.99),
                (1, 3, 1, 199.99),
                (2, 2, 1, 699.99),
                (3, 3, 2, 199.99),
                (3, 4, 1, 299.99),
                (4, 4, 1, 299.99),
                (5, 6, 1, 149.99)
            ]
            for item in order_items:
                cur.execute("""
                    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                """, item)

            conn.commit()
            logger.info("Sample data inserted successfully")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error inserting sample data: {str(e)}")
        raise

def main():
    """Main function to create tables and insert sample data."""
    try:
        # Connect to database
        conn = get_db_connection()
        logger.info("Connected to database")

        # Create tables
        create_tables(conn)

        # Insert sample data
        insert_sample_data(conn)

        # Close connection
        conn.close()
        logger.info("Database operations completed successfully")

    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")
        raise

if __name__ == "__main__":
    main() 