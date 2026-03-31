// User roles
export type UserRole = 'beneficiary' | 'philanthropist' | 'admin';

// User interface
export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  full_name: string | null;
  date_of_birth: string | null;
  phone_number: string | null;
  country: string | null;
  region: string | null;
  home_address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

// KYC Submission interface
export interface KYCSubmission {
  id: string;
  user_id: string;
  government_id_type: 'passport' | 'national_id' | 'driver_license' | null;
  government_id_url: string | null;
  face_capture_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

// Beneficiary Activation interface
export interface BeneficiaryActivation {
  id: string;
  user_id: string;
  activation_method: 'pi_payment' | 'wallet_transfer' | 'philanthropist';
  payment_status: 'pending' | 'verified' | 'failed';
  transaction_hash: string | null;
  philanthropist_username: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

// Token Distribution interface
export interface TokenDistribution {
  id: string;
  user_id: string;
  month_year: string;
  amount_tokens: number;
  distribution_status: 'pending' | 'completed' | 'failed';
  distributed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Wallet Address interface
export interface WalletAddress {
  id: string;
  user_id: string;
  wallet_address: string;
  blockchain_network: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// Pi Transaction interface
export interface PiTransaction {
  id: string;
  user_id: string;
  transaction_type: 'payment' | 'distribution';
  amount_pi: number;
  product_id: string | null;
  payment_id: string | null;
  txid: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

// Wallet Transfer interface
export interface WalletTransfer {
  id: string;
  user_id: string;
  transaction_hash: string;
  amount_usdt: number;
  verification_status: 'pending' | 'verified' | 'failed';
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

// Philanthropist Region interface
export interface PhilanthropistRegion {
  id: string;
  philanthropist_user_id: string;
  region: string;
  telegram_username: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Beneficiary Assignment interface
export interface BeneficiaryAssignment {
  id: string;
  beneficiary_user_id: string;
  philanthropist_user_id: string;
  assignment_date: string;
  created_at: string;
}

// Admin Audit Log interface
export interface AdminAuditLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_user_id: string | null;
  details: Record<string, any>;
  created_at: string;
}

// Distribution Stats interface
export interface DistributionStats {
  id: string;
  month_year: string;
  total_beneficiaries_eligible: number;
  total_tokens_distributed: number;
  distribution_date: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

// Auth Session interface
export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}

// API Response interface
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
