import { createClient } from '@supabase/supabase-js';
import type { User, KYCSubmission, BeneficiaryActivation, TokenDistribution, AdminAuditLog } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── USER OPERATIONS ───────────────────────────────────────────────────────────

export async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) { console.error('[db] Error fetching user:', error); return null; }
  return data;
}

// Case-insensitive email lookup
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email.toLowerCase().trim())
    .single();
  if (error) return null;
  return data;
}

// Case-insensitive username lookup
export async function getUserByUsername(username: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('username', username.toLowerCase().trim())
    .single();
  if (error) return null;
  return data;
}

export async function createUser(userData: Partial<User> & { password_hash: string }): Promise<User | null> {
  // Always store email as lowercase
  const normalizedData = {
    ...userData,
    email: userData.email?.toLowerCase().trim(),
    username: userData.username?.toLowerCase().trim(),
  };
  const { data, error } = await supabase
    .from('users')
    .insert([normalizedData])
    .select()
    .single();
  if (error) { console.error('[db] Error creating user:', error); return null; }
  return data;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) { console.error('[db] Error updating user:', error); return null; }
  return data;
}

// ── KYC OPERATIONS ────────────────────────────────────────────────────────────

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
  if (error) { console.error('[db] Error fetching pending KYC:', error); return []; }
  return data || [];
}

export async function createKYCSubmission(kycData: Partial<KYCSubmission>): Promise<KYCSubmission | null> {
  const { data, error } = await supabase
    .from('kyc_submissions')
    .insert([kycData])
    .select()
    .single();
  if (error) { console.error('[db] Error creating KYC submission:', error); return null; }
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
  if (error) { console.error('[db] Error approving KYC:', error); return null; }
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
  if (error) { console.error('[db] Error rejecting KYC:', error); return null; }
  return data;
}

// ── BENEFICIARY ACTIVATION ────────────────────────────────────────────────────

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
  if (error) { console.error('[db] Error creating activation:', error); return null; }
  return data;
}

export async function updateBeneficiaryActivation(userId: string, updates: Partial<BeneficiaryActivation>): Promise<BeneficiaryActivation | null> {
  const { data, error } = await supabase
    .from('beneficiary_activations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) { console.error('[db] Error updating activation:', error); return null; }
  return data;
}

// ── TOKEN DISTRIBUTIONS ───────────────────────────────────────────────────────

export async function getTokenDistributions(userId: string): Promise<TokenDistribution[]> {
  const { data, error } = await supabase
    .from('token_distributions')
    .select('*')
    .eq('user_id', userId)
    .order('month_year', { ascending: false });
  if (error) { console.error('[db] Error fetching distributions:', error); return []; }
  return data || [];
}

export async function getPendingDistributions(): Promise<TokenDistribution[]> {
  const { data, error } = await supabase
    .from('token_distributions')
    .select('*')
    .eq('distribution_status', 'pending')
    .order('month_year', { ascending: true });
  if (error) { console.error('[db] Error fetching pending distributions:', error); return []; }
  return data || [];
}

// ── ADMIN AUDIT LOGS ──────────────────────────────────────────────────────────

export async function logAdminAction(auditData: Partial<AdminAuditLog>): Promise<AdminAuditLog | null> {
  const { data, error } = await supabase
    .from('admin_audit_logs')
    .insert([auditData])
    .select()
    .single();
  if (error) { console.error('[db] Error logging action:', error); return null; }
  return data;
}

export async function getAdminAuditLogs(adminId?: string, limit: number = 100): Promise<AdminAuditLog[]> {
  let query = supabase.from('admin_audit_logs').select('*');
  if (adminId) query = query.eq('admin_user_id', adminId);
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('[db] Error fetching audit logs:', error); return []; }
  return data || [];
}

// ── USER QUERIES ──────────────────────────────────────────────────────────────

export async function getUsersByRole(role: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false });
  if (error) { console.error('[db] Error fetching users by role:', error); return []; }
  return data || [];
}

// Only count verified beneficiaries
export async function getActiveBeneficiariesCount(): Promise<number> {
  const { count, error } = await supabase
    .from('beneficiary_activations')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'verified');
  if (error) { console.error('[db] Error counting beneficiaries:', error); return 0; }
  return count || 0;
}

// ── ADMIN DELETE ──────────────────────────────────────────────────────────────

export async function deleteUser(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  if (error) { console.error('[db] Error deleting user:', error); return false; }
  return true;
}