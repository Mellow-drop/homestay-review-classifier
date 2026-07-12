-- Create tables for Trishul Eco-Homestays Sentiment Classifier

-- Table for Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table for Classification Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_name VARCHAR(255) NOT NULL,
    total_reviews INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table for Classified Reviews
CREATE TABLE IF NOT EXISTS classified_reviews (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    original_review TEXT NOT NULL,
    sentiment VARCHAR(20) NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    theme VARCHAR(50) NOT NULL CHECK (theme IN ('food', 'host', 'location', 'cleanliness', 'value', 'experience')),
    suggested_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster lookup on session_id
CREATE INDEX IF NOT EXISTS idx_classified_reviews_session_id ON classified_reviews(session_id);

-- Enable Row Level Security (RLS) to prevent public client API access
-- Your backend connects directly as the database superuser, bypassing RLS.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE classified_reviews ENABLE ROW LEVEL SECURITY;
