import { createClient } from '@supabase/supabase-js';
import type { User, KYCSubmission, BeneficiaryActivation, TokenDistribution, AdminAuditLog } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!serviceRoleKey && process.env.NODE_ENV === 'production') {
  console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set');
}

// Server-only admin client — full access, bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Public anon client — use in components, restricted by RLS
export const supabase = createClient(supabaseUrl, anonKey);

// ── USER OPERATIONS ───────────────────────────────────────────────────────────

export async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) { console.error('[db] getUser:', error.message); return null; }
  return data;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .ilike('email', email.toLowerCase().trim())
    .single();
  if (error) return null;
  return data;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .ilike('username', username.toLowerCase().trim())
    .single();
  if (error) return null;
  return data;
}

export async function createUser(userData: Partial<User> & { password_hash: string }): Promise<User | null> {
  const normalizedData = {
    ...userData,
    email: userData.email?.toLowerCase().trim(),
    username: userData.username?.toLowerCase().trim(),
  };
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([normalizedData])
    .select()
    .single();
  if (error) { console.error('[db] createUser:', error.message); return null; }
  return data;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) { console.error('[db] updateUser:', error.message); return null; }
  return data;
}

// ── KYC OPERATIONS ────────────────────────────────────────────────────────────

export async function getKYCSubmission(userId: string): Promise<KYCSubmission | null> {
  const { data, error } = await supabaseAdmin
    .from('kyc_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function getPendingKYCSubmissions(): Promise<KYCSubmission[]> {
  const { data, error } = await supabaseAdmin
    .from('kyc_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true });
  if (error) { console.error('[db] getPendingKYC:', error.message); return []; }
  return data || [];
}

export async function createKYCSubmission(kycData: Partial<KYCSubmission>): Promise<KYCSubmission | null> {
  const { data, error } = await supabaseAdmin
    .from('kyc_submissions')
    .insert([kycData])
    .select()
    .single();
  if (error) { console.error('[db] createKYC:', error.message); return null; }
  return data;
}

export async function approveKYCSubmission(submissionId: string, adminId: string): Promise<KYCSubmission | null> {
  const { data, error } = await supabaseAdmin
    .from('kyc_submissions')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: adminId, updated_at: new Date().toISOString() })
    .eq('id', submissionId)
    .select()
    .single();
  if (error) { console.error('[db] approveKYC:', error.message); return null; }
  return data;
}

export async function rejectKYCSubmission(submissionId: string, adminId: string, reason: string): Promise<KYCSubmission | null> {
  const { data, error } = await supabaseAdmin
    .from('kyc_submissions')
    .update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString(), reviewed_by: adminId, updated_at: new Date().toISOString() })
    .eq('id', submissionId)
    .select()
    .single();
  if (error) { console.error('[db] rejectKYC:', error.message); return null; }
  return data;
}

// ── BENEFICIARY ACTIVATION ────────────────────────────────────────────────────

export async function getBeneficiaryActivation(userId: string): Promise<BeneficiaryActivation | null> {
  const { data, error } = await supabaseAdmin
    .from('beneficiary_activations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) { console.error('[db] getActivation:', error.message); return null; }
  return data;
}

export async function createBeneficiaryActivation(activationData: Partial<BeneficiaryActivation>): Promise<BeneficiaryActivation | null> {
  // Step 1: Try a clean INSERT first
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('beneficiary_activations')
    .insert([{ ...activationData, updated_at: new Date().toISOString() }])
    .select()
    .single();

  // INSERT succeeded
  if (!insertError) return inserted;

  // Step 2: If duplicate user_id (unique constraint violation), UPDATE instead
  // Error code 23505 = unique_violation in PostgreSQL
  if (insertError.code === '23505') {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('beneficiary_activations')
      .update({ ...activationData, updated_at: new Date().toISOString() })
      .eq('user_id', activationData.user_id!)
      .select()
      .single();
    if (updateError) { console.error('[db] createActivation update:', updateError.message); return null; }
    return updated;
  }

  // Any other error
  console.error('[db] createActivation insert:', insertError.message);
  return null;
}

export async function updateBeneficiaryActivation(userId: string, updates: Partial<BeneficiaryActivation>): Promise<BeneficiaryActivation | null> {
  const { data, error } = await supabaseAdmin
    .from('beneficiary_activations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) { console.error('[db] updateActivation:', error.message); return null; }
  return data;
}

// ── TOKEN DISTRIBUTIONS ───────────────────────────────────────────────────────

export async function getTokenDistributions(userId: string): Promise<TokenDistribution[]> {
  const { data, error } = await supabaseAdmin
    .from('token_distributions')
    .select('*')
    .eq('user_id', userId)
    .order('month_year', { ascending: false });
  if (error) { console.error('[db] getDistributions:', error.message); return []; }
  return data || [];
}

export async function getPendingDistributions(): Promise<TokenDistribution[]> {
  const { data, error } = await supabaseAdmin
    .from('token_distributions')
    .select('*')
    .eq('distribution_status', 'pending')
    .order('month_year', { ascending: true });
  if (error) { console.error('[db] getPendingDistributions:', error.message); return []; }
  return data || [];
}

// ── ADMIN AUDIT LOGS ──────────────────────────────────────────────────────────

export async function logAdminAction(auditData: Partial<AdminAuditLog>): Promise<AdminAuditLog | null> {
  const { data, error } = await supabaseAdmin
    .from('admin_audit_logs')
    .insert([auditData])
    .select()
    .single();
  if (error) { console.error('[db] logAction:', error.message); return null; }
  return data;
}

export async function getAdminAuditLogs(adminId?: string, limit: number = 100): Promise<AdminAuditLog[]> {
  let query = supabaseAdmin.from('admin_audit_logs').select('*');
  if (adminId) query = query.eq('admin_user_id', adminId);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
  if (error) { console.error('[db] getAuditLogs:', error.message); return []; }
  return data || [];
}

// ── USER QUERIES ──────────────────────────────────────────────────────────────

export async function getUsersByRole(role: string): Promise<User[]> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false });
  if (error) { console.error('[db] getUsersByRole:', error.message); return []; }
  return data || [];
}

export async function getActiveBeneficiariesCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('beneficiary_activations')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'verified');
  if (error) { console.error('[db] countBeneficiaries:', error.message); return 0; }
  return count || 0;
}

export async function deleteUser(userId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', userId);
  if (error) { console.error('[db] deleteUser:', error.message); return false; }
  return true;
}