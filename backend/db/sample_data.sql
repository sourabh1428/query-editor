-- Create sample tables with data

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    city VARCHAR(50),
    country VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);

-- Insert sample data into customers
INSERT INTO customers (name, email, city, country) VALUES
    ('John Doe', 'john@example.com', 'New York', 'USA'),
    ('Jane Smith', 'jane@example.com', 'London', 'UK'),
    ('Bob Johnson', 'bob@example.com', 'Paris', 'France'),
    ('Alice Brown', 'alice@example.com', 'Berlin', 'Germany'),
    ('Charlie Wilson', 'charlie@example.com', 'Tokyo', 'Japan');

-- Insert sample data into products
INSERT INTO products (name, category, price, stock_quantity) VALUES
    ('Laptop', 'Electronics', 999.99, 50),
    ('Smartphone', 'Electronics', 699.99, 100),
    ('Headphones', 'Electronics', 199.99, 75),
    ('Desk Chair', 'Furniture', 299.99, 30),
    ('Coffee Table', 'Furniture', 199.99, 20),
    ('Bookshelf', 'Furniture', 149.99, 15);

-- Insert sample data into orders
INSERT INTO orders (customer_id, total_amount, status) VALUES
    (1, 1199.98, 'completed'),
    (2, 699.99, 'completed'),
    (3, 499.98, 'pending'),
    (4, 299.99, 'completed'),
    (5, 149.99, 'pending');

-- Insert sample data into order_items
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (1, 1, 1, 999.99),
    (1, 3, 1, 199.99),
    (2, 2, 1, 699.99),
    (3, 3, 2, 199.99),
    (3, 4, 1, 299.99),
    (4, 4, 1, 299.99),
    (5, 6, 1, 149.99);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    department_id INTEGER,
    hire_date DATE,
    salary NUMERIC(10,2)
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    location VARCHAR(100)
);

-- Queries table
CREATE TABLE IF NOT EXISTS queries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    query_text TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50)
);

-- Insert sample data for departments
INSERT INTO departments (name, location)
SELECT 
    'Department ' || g, 
    CASE WHEN g % 4 = 0 THEN 'Headquarters' WHEN g % 4 = 1 THEN 'Branch A' WHEN g % 4 = 2 THEN 'Branch B' ELSE 'Branch C' END
FROM generate_series(1, 10) AS g;

-- Insert sample data for employees
INSERT INTO employees (first_name, last_name, department_id, hire_date, salary)
SELECT 
    'First' || g, 
    'Last' || g, 
    (g % 10) + 1,
    DATE '2020-01-01' + (g % 100),
    40000 + (g % 20) * 2500
FROM generate_series(1, 100) AS g;

-- Insert sample data for queries
INSERT INTO queries (user_id, query_text, executed_at, status)
SELECT 
    (g % 10) + 1,
    'SELECT * FROM customers WHERE city = ''New York'';',
    CURRENT_TIMESTAMP - (g * INTERVAL '1 hour'),
    CASE WHEN g % 3 = 0 THEN 'completed' WHEN g % 3 = 1 THEN 'failed' ELSE 'pending' END
FROM generate_series(1, 100) AS g; 