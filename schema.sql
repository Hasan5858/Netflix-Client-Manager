DROP TABLE IF EXISTS client_services;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS master_emails;

CREATE TABLE master_emails (
    id INTEGER PRIMARY KEY,
    email_address TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    service_type TEXT DEFAULT 'netflix'
);

CREATE TABLE clients (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- Seed Services
INSERT INTO services (id, name) VALUES 
('netflix', 'Netflix'),
('prime', 'Amazon Prime'),
('hbo', 'HBO Max'),
('chatgpt', 'ChatGPT'),
('hoichoi', 'Hoichoi');

CREATE TABLE client_services (
    id INTEGER PRIMARY KEY,
    client_id INTEGER NOT NULL,
    service_id TEXT NOT NULL,
    master_email_id INTEGER, -- For Netflix (shared creds)
    profile_name TEXT, -- New
    pin TEXT, -- New
    expires_at DATETIME, -- New
    credential_email TEXT, -- For others
    credential_password TEXT, -- For others
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (master_email_id) REFERENCES master_emails(id) ON DELETE SET NULL
);
