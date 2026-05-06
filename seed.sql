-- 1. Mock Master Emails (For Shared Accounts)
INSERT INTO master_emails (email_address, password, service_type) VALUES 
('master1@netflix.com', 'NetPass1', 'netflix'), 
('master2@netflix.com', 'NetPass2', 'netflix'),
('master3@prime.com', 'AmznPass', 'prime'),
('master4@chatgpt.com', 'GptPass', 'chatgpt'),
('master5@hbo.com', 'HboPass5', 'hbo');

-- 2. Mock Clients (Customers)
INSERT INTO clients (name, api_key) VALUES 
('John Doe', 'key_12345'),
('Jane Smith', 'key_67890'),
('Alice Wonderland', 'key_alice11'),
('Bob Builder', 'key_bob22'),
('Charlie Chaplin', 'key_charlie33');

-- 3. Mock Client Services (Links between Clients, Master Emails, and Services)
-- John: Netflix (Shared) + Prime (Individual)
INSERT INTO client_services (client_id, service_id, credential_email, credential_password, master_email_id, profile_name, pin, expires_at) VALUES 
(1, 'netflix', NULL, NULL, 1, 'John Profile', '1234', '2025-12-31 00:00:00'),
(1, 'prime', 'john@amazon.com', 'primepass', NULL, NULL, NULL, '2025-12-31 00:00:00');

-- Jane: Netflix only
INSERT INTO client_services (client_id, service_id, credential_email, credential_password, master_email_id, profile_name, pin, expires_at) VALUES 
(2, 'netflix', NULL, NULL, 2, 'Jane Profile', '5678', '2025-06-30 00:00:00');

-- Alice: ChatGPT (Shared) + HBO (Shared)
INSERT INTO client_services (client_id, service_id, credential_email, credential_password, master_email_id, profile_name, pin, expires_at) VALUES 
(3, 'chatgpt', NULL, NULL, 4, 'Alice AI', NULL, '2025-08-15 00:00:00'),
(3, 'hbo', NULL, NULL, 5, 'Alice Shows', NULL, '2025-08-15 00:00:00');

-- Bob: Prime (Shared)
INSERT INTO client_services (client_id, service_id, credential_email, credential_password, master_email_id, profile_name, pin, expires_at) VALUES 
(4, 'prime', NULL, NULL, 3, 'Bob Video', '1111', '2025-11-20 00:00:00');

-- Charlie: Netflix (Private/Individual)
INSERT INTO client_services (client_id, service_id, credential_email, credential_password, master_email_id, profile_name, pin, expires_at) VALUES 
(5, 'netflix', 'charlie@personal.com', 'charpass', NULL, 'Charlie Main', '9999', '2026-01-01 00:00:00');
