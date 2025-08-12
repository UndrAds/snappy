-- Initialize Snappy database
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist (already created by POSTGRES_DB env var)
-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE snappy_db TO snappy_user;

-- Connect to the snappy_db database
\c snappy_db;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO snappy_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO snappy_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO snappy_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO snappy_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO snappy_user;
