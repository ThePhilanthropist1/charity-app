import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: 'beneficiary' | 'philanthropist' | 'admin';
  status: 'pending' | 'active' | 'suspended' | 'deleted';
  country?: string;
  region?: string;
  phone_number?: string;
  created_at: string;
};

export type Beneficiary = {
  id: string;
  username: string;
  activation_method?: 'telegram' | 'wallet' | 'pi_network';
  is_activated: boolean;
  activated_at?: string;
  total_tokens_received: number;
  last_distribution_date?: string;
};

export type Philanthropist = {
  id: string;
  date_of_birth: string;
  home_address: string;
  telegram_username?: string;
  wallet_address?: string;
  region_coverage?: string;
  kyc_status: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  kyc_submitted_at?: string;
  kyc_approved_at?: string;
};

export type KYCSubmission = {
  id: string;
  philanthropist_id: string;
  full_name: string;
  date_of_birth: string;
  country: string;
  region: string;
  phone_number: string;
  home_address: string;
  id_type: 'passport' | 'national_id' | 'drivers_license';
  id_document_url?: string;
  face_capture_url?: string;
  submission_status: 'pending' | 'under_review' | 'approved' | 'rejected';
  rejection_reason?: string;
  submitted_at: string;
};

// Auth functions
export async function signUp(email: string, password: string, fullName: string, role: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (error) throw error;

  // Create user record
  if (data.user) {
    const { error: insertError } = await supabase.from('users').insert({
      id: data.user.id,
      email,
      password_hash: '', // Password handled by Supabase Auth
      full_name: fullName,
      role,
      status: 'pending',
    });

    if (insertError) throw insertError;
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getUserData(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateUserStatus(userId: string, status: string) {
  const { error } = await supabase
    .from('users')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}

// Beneficiary functions
export async function createBeneficiary(userId: string, username: string) {
  const { data, error } = await supabase
    .from('beneficiaries')
    .insert({
      id: userId,
      username,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getBeneficiaryByUsername(username: string): Promise<Beneficiary | null> {
  const { data, error } = await supabase
    .from('beneficiaries')
    .select('*')
    .eq('username', username)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function activateBeneficiary(
  beneficiaryId: string,
  activationMethod: string,
  activationProof: string
) {
  const { data, error } = await supabase
    .from('beneficiaries')
    .update({
      is_activated: true,
      activation_method: activationMethod,
      activation_proof: activationProof,
      activated_at: new Date().toISOString(),
    })
    .eq('id', beneficiaryId)
    .select()
    .single();

  if (error) throw error;

  // Update user status to active
  await updateUserStatus(beneficiaryId, 'active');

  return data;
}

// Philanthropist functions
export async function createPhilanthropist(userId: string, data: Partial<Philanthropist>) {
  const { data: result, error } = await supabase
    .from('philanthropists')
    .insert({
      id: userId,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getPhilanthropistByUserId(userId: string): Promise<Philanthropist | null> {
  const { data, error } = await supabase
    .from('philanthropists')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// KYC functions
export async function submitKYC(philanthropistId: string, kycData: Partial<KYCSubmission>) {
  const { data, error } = await supabase
    .from('kyc_submissions')
    .insert({
      philanthropist_id: philanthropistId,
      ...kycData,
      submission_status: 'under_review',
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Update philanthropist KYC status
  await supabase
    .from('philanthropists')
    .update({
      kyc_status: 'submitted',
      kyc_submission_id: data.id,
      kyc_submitted_at: new Date().toISOString(),
    })
    .eq('id', philanthropistId);

  return data;
}

export async function getKYCSubmission(kycId: string): Promise<KYCSubmission | null> {
  const { data, error } = await supabase
    .from('kyc_submissions')
    .select('*')
    .eq('id', kycId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getPendingKYCSubmissions() {
  const { data, error } = await supabase
    .from('kyc_submissions')
    .select('*')
    .eq('submission_status', 'under_review')
    .order('submitted_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function approveKYC(kycId: string, adminId: string, notes?: string) {
  const { data: kyc, error: kycError } = await supabase
    .from('kyc_submissions')
    .update({
      submission_status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewer_notes: notes,
    })
    .eq('id', kycId)
    .select()
    .single();

  if (kycError) throw kycError;

  // Update philanthropist status
  await supabase
    .from('philanthropists')
    .update({
      kyc_status: 'approved',
      kyc_approved_at: new Date().toISOString(),
      kyc_reviewer_id: adminId,
    })
    .eq('id', kyc.philanthropist_id);

  // Update user status to active
  await updateUserStatus(kyc.philanthropist_id, 'active');

  // Log admin action
  await logAdminAction(adminId, 'kyc_approved', kyc.philanthropist_id, { kycId });

  return kyc;
}

export async function rejectKYC(kycId: string, adminId: string, rejectionReason: string, notes?: string) {
  const { data: kyc, error: kycError } = await supabase
    .from('kyc_submissions')
    .update({
      submission_status: 'rejected',
      rejection_reason: rejectionReason,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: notes,
    })
    .eq('id', kycId)
    .select()
    .single();

  if (kycError) throw kycError;

  // Update philanthropist status
  await supabase
    .from('philanthropists')
    .update({
      kyc_status: 'rejected',
    })
    .eq('id', kyc.philanthropist_id);

  // Log admin action
  await logAdminAction(adminId, 'kyc_rejected', kyc.philanthropist_id, { kycId, rejectionReason });

  return kyc;
}

// Admin functions
export async function logAdminAction(adminId: string, action: string, targetUserId?: string, details?: any) {
  const { error } = await supabase
    .from('admin_logs')
    .insert({
      admin_id: adminId,
      action,
      target_user_id: targetUserId,
      details,
      timestamp: new Date().toISOString(),
    });

  if (error) throw error;
}

export async function deletePhilanthropist(philanthropistId: string, adminId: string, reason?: string) {
  // Soft delete by updating status
  await updateUserStatus(philanthropistId, 'deleted');

  // Log the action
  await logAdminAction(adminId, 'philanthropist_deleted', philanthropistId, { reason });

  return true;
}

export async function getAdminLogs(limit = 100, offset = 0) {
  const { data, error } = await supabase
    .from('admin_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

// Token functions
export async function getBeneficiaryBalance(beneficiaryId: string) {
  const { data, error } = await supabase
    .from('beneficiary_balances')
    .select('*')
    .eq('beneficiary_id', beneficiaryId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // Create new balance if doesn't exist
    if (error.code === 'PGRST116') {
      const { data: newBalance, error: insertError } = await supabase
        .from('beneficiary_balances')
        .insert({
          beneficiary_id: beneficiaryId,
          current_balance: 0,
          total_earned: 0,
          total_redeemed: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return newBalance;
    }
    throw error;
  }
  return data;
}

export async function recordTransaction(beneficiaryId: string, transactionData: any) {
  const balance = await getBeneficiaryBalance(beneficiaryId);

  const { data, error } = await supabase
    .from('token_transactions')
    .insert({
      beneficiary_id: beneficiaryId,
      balance_before: balance.current_balance,
      balance_after: balance.current_balance + transactionData.amount,
      ...transactionData,
    })
    .select()
    .single();

  if (error) throw error;

  // Update balance
  await supabase
    .from('beneficiary_balances')
    .update({
      current_balance: balance.current_balance + transactionData.amount,
      total_earned: transactionData.transaction_type === 'distribution' 
        ? balance.total_earned + transactionData.amount 
        : balance.total_earned,
      last_updated: new Date().toISOString(),
    })
    .eq('beneficiary_id', beneficiaryId);

  return data;
}

// Distribution functions
export async function getDistributionSchedule(month: string) {
  const { data, error } = await supabase
    .from('distribution_schedule')
    .select('*')
    .eq('distribution_month', month)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createDistributionSchedule(month: string, tokenAmount = 500) {
  const { data: beneficiaries, error: countError } = await supabase
    .from('beneficiaries')
    .select('id', { count: 'exact' })
    .eq('is_activated', true);

  if (countError) throw countError;

  const totalBeneficiaries = beneficiaries?.length || 0;
  const totalTokens = totalBeneficiaries * tokenAmount;

  const { data, error } = await supabase
    .from('distribution_schedule')
    .insert({
      distribution_month: month,
      token_amount: tokenAmount,
      total_beneficiaries: totalBeneficiaries,
      total_tokens_distributed: totalTokens,
      distribution_status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function executeMonthlyDistribution(distributionId: string) {
  // Get distribution details
  const { data: distribution, error: distError } = await supabase
    .from('distribution_schedule')
    .select('*')
    .eq('id', distributionId)
    .single();

  if (distError) throw distError;

  // Update status to in progress
  await supabase
    .from('distribution_schedule')
    .update({ distribution_status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', distributionId);

  // Get all active beneficiaries
  const { data: beneficiaries, error: bError } = await supabase
    .from('beneficiaries')
    .select('id')
    .eq('is_activated', true);

  if (bError) throw bError;

  // Distribute tokens to each beneficiary
  for (const beneficiary of beneficiaries || []) {
    await recordTransaction(beneficiary.id, {
      transaction_type: 'distribution',
      amount: distribution.token_amount,
      reference_id: distributionId,
      status: 'completed',
    });

    await supabase
      .from('distribution_records')
      .insert({
        distribution_id: distributionId,
        beneficiary_id: beneficiary.id,
        tokens_distributed: distribution.token_amount,
        distribution_status: 'completed',
        distributed_at: new Date().toISOString(),
      });
  }

  // Update distribution status to completed
  await supabase
    .from('distribution_schedule')
    .update({
      distribution_status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', distributionId);

  return true;
}
