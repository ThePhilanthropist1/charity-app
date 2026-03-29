-- Charity Token Database Schema

-- Users table (base for all roles)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('beneficiary', 'philanthropist', 'admin')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'deleted')),
  country VARCHAR(100),
  region VARCHAR(100),
  phone_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Beneficiaries table
CREATE TABLE IF NOT EXISTS beneficiaries (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(100) UNIQUE NOT NULL,
  activation_method VARCHAR(50) CHECK (activation_method IN ('telegram', 'wallet', 'pi_network')),
  activation_proof TEXT,
  is_activated BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMP,
  philanthropist_assigned_id UUID REFERENCES users(id),
  total_tokens_received DECIMAL(20, 2) DEFAULT 0,
  last_distribution_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Philanthropists table
CREATE TABLE IF NOT EXISTS philanthropists (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE NOT NULL,
  home_address TEXT NOT NULL,
  telegram_username VARCHAR(100),
  wallet_address VARCHAR(255),
  region_coverage VARCHAR(255),
  assigned_beneficiaries_count INTEGER DEFAULT 0,
  kyc_submission_id UUID,
  kyc_status VARCHAR(50) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'under_review', 'approved', 'rejected')),
  kyc_submitted_at TIMESTAMP,
  kyc_approved_at TIMESTAMP,
  kyc_reviewer_id UUID REFERENCES users(id),
  kyc_review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KYC Submissions table
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  philanthropist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  country VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  home_address TEXT NOT NULL,
  id_type VARCHAR(50) NOT NULL CHECK (id_type IN ('passport', 'national_id', 'drivers_license')),
  id_document_url VARCHAR(500),
  face_capture_url VARCHAR(500),
  submission_status VARCHAR(50) DEFAULT 'pending' CHECK (submission_status IN ('pending', 'under_review', 'approved', 'rejected')),
  rejection_reason TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewer_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_user_id UUID REFERENCES users(id),
  details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Token Transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID NOT NULL REFERENCES users(id),
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('distribution', 'purchase', 'transfer', 'redemption')),
  amount DECIMAL(20, 2) NOT NULL,
  balance_before DECIMAL(20, 2),
  balance_after DECIMAL(20, 2),
  reference_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Beneficiary Balances table (for fast queries)
CREATE TABLE IF NOT EXISTS beneficiary_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_balance DECIMAL(20, 2) DEFAULT 0,
  total_earned DECIMAL(20, 2) DEFAULT 0,
  total_redeemed DECIMAL(20, 2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Verifications table
CREATE TABLE IF NOT EXISTS payment_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID NOT NULL REFERENCES users(id),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('telegram', 'wallet', 'pi_network')),
  payment_amount DECIMAL(10, 2) NOT NULL,
  transaction_hash VARCHAR(255),
  wallet_address VARCHAR(255),
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monthly Distribution Schedule table
CREATE TABLE IF NOT EXISTS distribution_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_month DATE NOT NULL,
  token_amount DECIMAL(20, 2) NOT NULL DEFAULT 500,
  total_beneficiaries INTEGER,
  total_tokens_distributed DECIMAL(20, 2),
  distribution_status VARCHAR(50) DEFAULT 'pending' CHECK (distribution_status IN ('pending', 'in_progress', 'completed', 'failed')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Distribution Records table
CREATE TABLE IF NOT EXISTS distribution_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID NOT NULL REFERENCES distribution_schedule(id),
  beneficiary_id UUID NOT NULL REFERENCES users(id),
  tokens_distributed DECIMAL(20, 2) NOT NULL DEFAULT 500,
  distribution_status VARCHAR(50) DEFAULT 'pending' CHECK (distribution_status IN ('pending', 'completed', 'failed')),
  distributed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_beneficiaries_username ON beneficiaries(username);
CREATE INDEX idx_beneficiaries_activated ON beneficiaries(is_activated);
CREATE INDEX idx_philanthropists_kyc_status ON philanthropists(kyc_status);
CREATE INDEX idx_kyc_submissions_status ON kyc_submissions(submission_status);
CREATE INDEX idx_kyc_submissions_philanthropist ON kyc_submissions(philanthropist_id);
CREATE INDEX idx_token_transactions_beneficiary ON token_transactions(beneficiary_id);
CREATE INDEX idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_target ON admin_logs(target_user_id);
CREATE INDEX idx_admin_logs_timestamp ON admin_logs(timestamp);
CREATE INDEX idx_payment_verifications_beneficiary ON payment_verifications(beneficiary_id);
CREATE INDEX idx_payment_verifications_status ON payment_verifications(verification_status);
CREATE INDEX idx_distribution_records_distribution ON distribution_records(distribution_id);
CREATE INDEX idx_distribution_records_beneficiary ON distribution_records(beneficiary_id);

-- Create RLS policies (if using Supabase)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE philanthropists ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Beneficiaries can only view their own data
CREATE POLICY "Beneficiaries view own data" ON beneficiaries
  FOR SELECT USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Philanthropists can only view their own KYC
CREATE POLICY "Philanthropists view own kyc" ON kyc_submissions
  FOR SELECT USING (philanthropist_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Admins can view all admin logs
CREATE POLICY "Admins view all logs" ON admin_logs
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Users can view their own transactions
CREATE POLICY "Users view own transactions" ON token_transactions
  FOR SELECT USING (beneficiary_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');
