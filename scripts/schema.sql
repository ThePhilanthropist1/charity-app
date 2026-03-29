-- Users table (stores all user types)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'beneficiary', -- beneficiary, philanthropist, admin
  full_name VARCHAR(255),
  date_of_birth DATE,
  phone_number VARCHAR(20),
  country VARCHAR(100),
  region VARCHAR(100),
  home_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_username (username)
);

-- KYC submissions table (for Philanthropists)
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  government_id_type VARCHAR(50), -- passport, national_id, driver_license
  government_id_url VARCHAR(255),
  face_capture_url VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- Beneficiary activation table
CREATE TABLE IF NOT EXISTS beneficiary_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activation_method VARCHAR(50), -- pi_payment, wallet_transfer, philanthropist
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed
  transaction_hash VARCHAR(255),
  philanthropist_username VARCHAR(100),
  activated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_payment_status (payment_status)
);

-- Token distributions table (monthly payments)
CREATE TABLE IF NOT EXISTS token_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_year VARCHAR(7), -- YYYY-MM format
  amount_tokens BIGINT DEFAULT 500,
  distribution_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  distributed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_month_year (month_year),
  INDEX idx_status (distribution_status)
);

-- Wallet addresses table
CREATE TABLE IF NOT EXISTS wallet_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(255) NOT NULL,
  blockchain_network VARCHAR(50), -- pi, ethereum, polygon, etc
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
);

-- Pi Network transactions table
CREATE TABLE IF NOT EXISTS pi_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50), -- payment, distribution
  amount_pi DECIMAL(10, 2),
  product_id VARCHAR(255),
  payment_id VARCHAR(255),
  txid VARCHAR(255),
  status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- Wallet transfer verifications table
CREATE TABLE IF NOT EXISTS wallet_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_hash VARCHAR(255) UNIQUE NOT NULL,
  amount_usdt DECIMAL(10, 2),
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_hash (transaction_hash),
  INDEX idx_status (verification_status)
);

-- Philanthropist communications (telegram usernames, regions)
CREATE TABLE IF NOT EXISTS philanthropist_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  philanthropist_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  region VARCHAR(100) NOT NULL,
  telegram_username VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_philanthropist (philanthropist_user_id),
  INDEX idx_region (region)
);

-- Beneficiary assignments to Philanthropists
CREATE TABLE IF NOT EXISTS beneficiary_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  philanthropist_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_beneficiary (beneficiary_user_id),
  INDEX idx_philanthropist (philanthropist_user_id)
);

-- Admin audit logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(100), -- kyc_approved, kyc_rejected, account_deleted, distribution_processed
  target_user_id UUID REFERENCES users(id),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin (admin_user_id),
  INDEX idx_action (action_type),
  INDEX idx_created_at (created_at)
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_key (config_key)
);

-- Monthly distribution stats
CREATE TABLE IF NOT EXISTS distribution_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year VARCHAR(7),
  total_beneficiaries_eligible BIGINT,
  total_tokens_distributed BIGINT,
  distribution_date TIMESTAMP,
  status VARCHAR(50), -- pending, in_progress, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(month_year)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_kyc_status_user ON kyc_submissions(status, user_id);
CREATE INDEX IF NOT EXISTS idx_distributions_user_month ON token_distributions(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_activations_user_status ON beneficiary_activations(user_id, payment_status);
