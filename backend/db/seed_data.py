import os

import bcrypt
import psycopg2
import logging
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import json
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def connect_db():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "postgres"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "project"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres")
    )

def create_tables(cur):
    # Create tables if they don't exist
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            user_type VARCHAR(20) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            category_id INTEGER REFERENCES categories(id),
            stock_quantity INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            total_amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(20) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id INTEGER REFERENCES orders(id),
            product_id INTEGER REFERENCES products(id),
            quantity INTEGER NOT NULL,
            price_at_time DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(order_id, product_id)
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            product_id INTEGER REFERENCES products(id),
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, product_id)
        );

        CREATE TABLE IF NOT EXISTS addresses (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            address_line1 VARCHAR(255) NOT NULL,
            address_line2 VARCHAR(255),
            city VARCHAR(100) NOT NULL,
            state VARCHAR(100) NOT NULL,
            postal_code VARCHAR(20) NOT NULL,
            country VARCHAR(100) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            order_id INTEGER REFERENCES orders(id),
            amount DECIMAL(10,2) NOT NULL,
            payment_method VARCHAR(50) NOT NULL,
            status VARCHAR(20) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)

def seed_users(cur):
    users = [
        {
            'username': 'admin',
            'email': 'sppathak1428@gmail.com',
            'password': '123123',
            'user_type': 'admin_user'
        },
        {
            'username': 'john_doe',
            'email': 'john.doe@example.com',
            'password': 'SecurePass123!',
            'user_type': 'regular_user'
        },
        {
            'username': 'sarah_smith',
            'email': 'sarah.smith@techcorp.com',
            'password': 'Tech2024!',
            'user_type': 'regular_user'
        },
        {
            'username': 'mike_wilson',
            'email': 'mike.wilson@datascience.com',
            'password': 'DataSci2024!',
            'user_type': 'regular_user'
        },
        {
            'username': 'lisa_chen',
            'email': 'lisa.chen@analytics.com',
            'password': 'Analytics2024!',
            'user_type': 'regular_user'
        }
    ]

    for user in users:
        hashed_password = bcrypt.hashpw(user['password'].encode('utf-8'), bcrypt.gensalt())
        try:
            cur.execute("""
                INSERT INTO users (username, email, password_hash, user_type, created_at)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (email) DO UPDATE 
                SET username = EXCLUDED.username,
                    password_hash = EXCLUDED.password_hash,
                    user_type = EXCLUDED.user_type
                RETURNING id
            """, (
                user['username'],
                user['email'],
                hashed_password.decode('utf-8'),
                user['user_type'],
                datetime.now(timezone.utc)
            ))
            user_id = cur.fetchone()[0]
            logger.info(f"Successfully inserted/updated user: {user['username']} with ID: {user_id}")
        except Exception as e:
            logger.error(f"Error inserting user {user['username']}: {str(e)}")
            raise

    # Verify users were inserted
    cur.execute("SELECT COUNT(*) FROM users")
    count = cur.fetchone()[0]
    logger.info(f"Total users in database: {count}")
    
    if count == 0:
        raise Exception("No users were inserted into the database")

def seed_categories(cur):
    categories = [
        ('Electronics', 'Electronic devices and accessories'),
        ('Clothing', 'Fashion and apparel'),
        ('Books', 'Books and publications'),
        ('Home & Garden', 'Home decor and garden supplies'),
        ('Sports', 'Sports equipment and accessories')
    ]

    for category in categories:
        cur.execute("""
            INSERT INTO categories (name, description, created_at)
            VALUES (%s, %s, %s)
            ON CONFLICT (name) DO NOTHING
        """, (
            category[0],
            category[1],
            datetime.now(timezone.utc)
        ))

def seed_products(cur):
    products = [
        {
            'name': 'iPhone 13 Pro',
            'description': 'Latest Apple smartphone with advanced camera system',
            'price': 999.99,
            'category_id': 1,
            'stock_quantity': 50
        },
        {
            'name': 'Nike Air Max',
            'description': 'Comfortable running shoes with air cushioning',
            'price': 129.99,
            'category_id': 2,
            'stock_quantity': 100
        },
        {
            'name': 'The Great Gatsby',
            'description': 'Classic novel by F. Scott Fitzgerald',
            'price': 14.99,
            'category_id': 3,
            'stock_quantity': 200
        },
        {
            'name': 'Smart LED TV 55"',
            'description': '4K Ultra HD Smart TV with HDR',
            'price': 699.99,
            'category_id': 1,
            'stock_quantity': 30
        },
        {
            'name': 'Yoga Mat',
            'description': 'Non-slip exercise mat for yoga and fitness',
            'price': 29.99,
            'category_id': 5,
            'stock_quantity': 150
        }
    ]

    for product in products:
        cur.execute("""
            INSERT INTO products (name, description, price, category_id, stock_quantity, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (name) DO NOTHING
        """, (
            product['name'],
            product['description'],
            product['price'],
            product['category_id'],
            product['stock_quantity'],
            datetime.now(timezone.utc)
        ))

def seed_orders(cur):
    # Create some orders for each user
    for user_id in range(1, 6):  # Assuming we have 5 users
        for _ in range(2):  # 2 orders per user
            cur.execute("""
                INSERT INTO orders (user_id, total_amount, status, created_at)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (
                user_id,
                random.uniform(50.0, 500.0),
                random.choice(['pending', 'completed', 'shipped']),
                datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))
            ))
            order_id = cur.fetchone()[0]

            # Add 1-3 items to each order
            for _ in range(random.randint(1, 3)):
                product_id = random.randint(1, 5)
                quantity = random.randint(1, 3)
                cur.execute("""
                    SELECT price FROM products WHERE id = %s
                """, (product_id,))
                price = cur.fetchone()[0]

                cur.execute("""
                    INSERT INTO order_items (order_id, product_id, quantity, price_at_time, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    order_id,
                    product_id,
                    quantity,
                    price,
                    datetime.now(timezone.utc)
                ))

def seed_addresses(cur):
    for user_id in range(1, 6):
        cur.execute("""
            INSERT INTO addresses (user_id, address_line1, address_line2, city, state, postal_code, country, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id,
            f"{user_id} Main St",
            f"Apt {user_id*10}",
            "Sample City",
            "Sample State",
            f"1000{user_id}",
            "Sample Country",
            datetime.now(timezone.utc)
        ))

def seed_payments(cur):
    # For each order, create a payment
    cur.execute("SELECT id, user_id, total_amount FROM orders")
    orders = cur.fetchall()
    for order in orders:
        cur.execute("""
            INSERT INTO payments (user_id, order_id, amount, payment_method, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            order[1],
            order[0],
            order[2],
            random.choice(['credit_card', 'paypal', 'bank_transfer']),
            random.choice(['completed', 'pending']),
            datetime.now(timezone.utc)
        ))

def seed_reviews(cur):
    # Create reviews for products
    for product_id in range(1, 6):  # For each product
        for user_id in range(1, 6):  # Each user reviews each product
            if random.random() > 0.3:  # 70% chance to leave a review
                cur.execute("""
                    INSERT INTO reviews (user_id, product_id, rating, comment, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    user_id,
                    product_id,
                    random.randint(1, 5),
                    f"Great product! Would recommend to others." if random.random() > 0.5 else "Good product, but could be better.",
                    datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))
                ))

def seed_database():
    conn = None
    cur = None
    try:
        conn = connect_db()
        cur = conn.cursor()

        # Create tables
        logger.info("Creating tables...")
        create_tables(cur)
        
        # Seed data
        logger.info("Seeding users...")
        seed_users(cur)
        conn.commit()  # Commit after users
        
        logger.info("Seeding categories...")
        seed_categories(cur)
        conn.commit()  # Commit after categories
        
        logger.info("Seeding products...")
        seed_products(cur)
        conn.commit()  # Commit after products
        
        logger.info("Seeding orders...")
        seed_orders(cur)
        conn.commit()  # Commit after orders

        logger.info("Seeding addresses...")
        seed_addresses(cur)
        conn.commit()

        logger.info("Seeding payments...")
        seed_payments(cur)
        conn.commit()
        
        logger.info("Seeding reviews...")
        seed_reviews(cur)

        # Commit the transaction
        conn.commit()
        logger.info("Database seeding completed successfully!")

    except Exception as e:
        logger.error(f"Error seeding database: {str(e)}")
        if conn:
            conn.rollback()
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    try:
        seed_database()
    except Exception as e:
        logger.error(f"Failed to seed database: {str(e)}") 