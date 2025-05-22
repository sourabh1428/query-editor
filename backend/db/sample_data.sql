-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    city VARCHAR(50),
    signup_date DATE
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    category VARCHAR(50),
    price NUMERIC(10,2),
    in_stock BOOLEAN
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    product_id INTEGER REFERENCES products(id),
    order_date DATE,
    quantity INTEGER,
    total NUMERIC(10,2)
);

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

-- Insert sample data for customers
INSERT INTO customers (name, email, city, signup_date)
SELECT 
    'Customer ' || g, 
    'customer' || g || '@example.com', 
    CASE WHEN g % 5 = 0 THEN 'New York' WHEN g % 5 = 1 THEN 'Los Angeles' WHEN g % 5 = 2 THEN 'Chicago' WHEN g % 5 = 3 THEN 'Houston' ELSE 'Phoenix' END,
    DATE '2023-01-01' + (g % 365)
FROM generate_series(1, 100) AS g;

-- Insert sample data for products
INSERT INTO products (name, category, price, in_stock)
SELECT 
    'Product ' || g, 
    CASE WHEN g % 3 = 0 THEN 'Electronics' WHEN g % 3 = 1 THEN 'Clothing' ELSE 'Books' END,
    (10 + (g % 50) * 2.5),
    (g % 2 = 0)
FROM generate_series(1, 100) AS g;

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

-- Insert sample data for orders
INSERT INTO orders (customer_id, product_id, order_date, quantity, total)
SELECT 
    (g % 100) + 1,
    (g % 100) + 1,
    DATE '2023-06-01' + (g % 60),
    (g % 5) + 1,
    ((g % 5) + 1) * (10 + (g % 50) * 2.5)
FROM generate_series(1, 100) AS g;

-- Insert sample data for queries
INSERT INTO queries (user_id, query_text, executed_at, status)
SELECT 
    (g % 10) + 1,
    'SELECT * FROM customers WHERE city = ''New York'';',
    CURRENT_TIMESTAMP - (g * INTERVAL '1 hour'),
    CASE WHEN g % 3 = 0 THEN 'completed' WHEN g % 3 = 1 THEN 'failed' ELSE 'pending' END
FROM generate_series(1, 100) AS g; 