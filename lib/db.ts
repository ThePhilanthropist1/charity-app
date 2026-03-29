import { createClient } from '@supabase/supabase-js';
import type { User, KYCSubmission, BeneficiaryActivation, TokenDistribution, AdminAuditLog } from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// User operations
export async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[v0] Error fetching user:', error);
    return null;
  }
  return data;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) return null;
  return data;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error) return null;
  return data;
}

export async function createUser(userData: Partial<User> & { password_hash: string }): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();

  if (error) {
    console.error('[v0] Error creating user:', error);
    return null;
  }
  return data;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[v0] Error updating user:', error);
    return null;
  }
  return data;
}

// KYC operations
export async function getKYCSubmission(userId: string): Promise<KYCSubmission | null> {
  const { data, error } = await supabase
    .from('kyc_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function getPendingKYCSubmissions(): Promise<KYCSubmission[]> {
  const { data, error } = await supabase
    .from('kyc_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true });

  if (error) {
    console.error('[v0] Error fetching pending KYC:', error);
    return [];
  }
  return data || [];
}

export async function createKYCSubmission(kycData: Partial<KYCSubmission>): Promise<KYCSubmission | null> {
  const { data, error } = await supabase
    .from('kyc_submissions')
    .insert([kycData])
    .select()
    .single();

  if (error) {
    console.error('[v0] Error creating KYC submission:', error);
    return null;
  }
  return data;
}

export async function approveKYCSubmission(submissionId: string, adminId: string): Promise<KYCSubmission | null> {
  const { data, error } = await supabase
    .from('kyc_submissions')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) {
    console.error('[v0] Error approving KYC:', error);
    return null;
  }
  return data;
}

export async function rejectKYCSubmission(submissionId: string, adminId: string, reason: string): Promise<KYCSubmission | null> {
  const { data, error } = await supabase
    .from('kyc_submissions')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) {
    console.error('[v0] Error rejecting KYC:', error);
    return null;
  }
  return data;
}

// Beneficiary Activation operations
export async function getBeneficiaryActivation(userId: string): Promise<BeneficiaryActivation | null> {
  const { data, error } = await supabase
    .from('beneficiary_activations')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
}

export async function createBeneficiaryActivation(activationData: Partial<BeneficiaryActivation>): Promise<BeneficiaryActivation | null> {
  const { data, error } = await supabase
    .from('beneficiary_activations')
    .insert([activationData])
    .select()
    .single();

  if (error) {
    console.error('[v0] Error creating activation:', error);
    return null;
  }
  return data;
}

export async function updateBeneficiaryActivation(userId: string, updates: Partial<BeneficiaryActivation>): Promise<BeneficiaryActivation | null> {
  const { data, error } = await supabase
    .from('beneficiary_activations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[v0] Error updating activation:', error);
    return null;
  }
  return data;
}

// Token Distribution operations
export async function getTokenDistributions(userId: string): Promise<TokenDistribution[]> {
  const { data, error } = await supabase
    .from('token_distributions')
    .select('*')
    .eq('user_id', userId)
    .order('month_year', { ascending: false });

  if (error) {
    console.error('[v0] Error fetching distributions:', error);
    return [];
  }
  return data || [];
}

export async function getPendingDistributions(): Promise<TokenDistribution[]> {
  const { data, error } = await supabase
    .from('token_distributions')
    .select('*')
    .eq('distribution_status', 'pending')
    .order('month_year', { ascending: true });

  if (error) {
    console.error('[v0] Error fetching pending distributions:', error);
    return [];
  }
  return data || [];
}

// Admin Audit Log operations
export async function logAdminAction(auditData: Partial<AdminAuditLog>): Promise<AdminAuditLog | null> {
  const { data, error } = await supabase
    .from('admin_audit_logs')
    .insert([auditData])
    .select()
    .single();

  if (error) {
    console.error('[v0] Error logging action:', error);
    return null;
  }
  return data;
}

export async function getAdminAuditLogs(adminId?: string, limit: number = 100): Promise<AdminAuditLog[]> {
  let query = supabase.from('admin_audit_logs').select('*');

  if (adminId) {
    query = query.eq('admin_user_id', adminId);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[v0] Error fetching audit logs:', error);
    return [];
  }
  return data || [];
}

// Get users by role
export async function getUsersByRole(role: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[v0] Error fetching users by role:', error);
    return [];
  }
  return data || [];
}

// Get active beneficiaries count
export async function getActiveBeneficiariesCount(): Promise<number> {
  const { count, error } = await supabase
    .from('beneficiary_activations')
    .select('*', { count: 'exact' })
    .eq('payment_status', 'verified');

  if (error) {
    console.error('[v0] Error counting beneficiaries:', error);
    return 0;
  }
  return count || 0;
}

// Delete user (admin function)
export async function deleteUser(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('[v0] Error deleting user:', error);
    return false;
  }
  return true;
}
