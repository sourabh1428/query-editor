-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL DEFAULT 'regular_user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create queries table
CREATE TABLE IF NOT EXISTS queries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    query_text TEXT NOT NULL,
    result_count INTEGER,
    execution_time FLOAT,
    is_favorite BOOLEAN DEFAULT FALSE,
    favorite_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_queries_user_id ON queries(user_id);
CREATE INDEX IF NOT EXISTS idx_queries_created_at ON queries(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Insert a default admin user (password: 123123)
INSERT INTO users (username, email, password_hash, user_type)
VALUES (
    'admin',
    'sppathak1428@gmail.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpR0.5J5J5J5J5',  -- This is a placeholder, we'll update it with the actual hash
    'admin_user'
) ON CONFLICT (email) DO NOTHING; 