-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create queries table
CREATE TABLE IF NOT EXISTS queries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_favorite BOOLEAN DEFAULT FALSE
);

-- Create sample tables for demo purposes
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  inventory INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);

-- Insert sample data
INSERT INTO customers (name, email) VALUES
  ('John Doe', 'john@example.com'),
  ('Jane Smith', 'jane@example.com'),
  ('Bob Johnson', 'bob@example.com'),
  ('Alice Brown', 'alice@example.com'),
  ('Charlie Davis', 'charlie@example.com');

INSERT INTO products (name, price, inventory) VALUES
  ('Laptop', 999.99, 50),
  ('Smartphone', 699.99, 100),
  ('Headphones', 149.99, 200),
  ('Monitor', 299.99, 30),
  ('Keyboard', 79.99, 150);

INSERT INTO orders (customer_id, amount, status) VALUES
  (1, 1149.98, 'completed'),
  (2, 699.99, 'processing'),
  (3, 229.98, 'completed'),
  (4, 999.99, 'completed'),
  (5, 379.98, 'processing'),
  (1, 299.99, 'completed'),
  (2, 149.99, 'completed');

INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
  (1, 1, 1, 999.99),
  (1, 3, 1, 149.99),
  (2, 2, 1, 699.99),
  (3, 3, 1, 149.99),
  (3, 5, 1, 79.99),
  (4, 1, 1, 999.99),
  (5, 4, 1, 299.99),
  (5, 5, 1, 79.99),
  (6, 4, 1, 299.99),
  (7, 3, 1, 149.99);