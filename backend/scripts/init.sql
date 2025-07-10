-- Initialize database schema for web crawler application

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS urls (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    url VARCHAR(2048) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analyses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    url_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(500),
    description TEXT,
    word_count INT DEFAULT 0,
    link_count INT DEFAULT 0,
    image_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS broken_links (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    url_id BIGINT UNSIGNED NOT NULL,
    link_url VARCHAR(2048) NOT NULL,
    status_code INT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_urls_user_id ON urls(user_id);
CREATE INDEX idx_urls_status ON urls(status);
CREATE INDEX idx_analyses_url_id ON analyses(url_id);
CREATE INDEX idx_broken_links_url_id ON broken_links(url_id); 