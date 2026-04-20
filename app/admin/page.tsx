'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { StatsBanner } from '@/components/stats-banner';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, Shield, Clock, Coins, LogOut, X, Trash2,
  ChevronRight, BarChart3, AlertCircle, Eye, Home,
  CheckCircle, UserX, Download, FileSpreadsheet, Send
} from 'lucide-react';

export default function AdminMainDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [stats, setStats] = useState({
    total_beneficiaries: 0, active_beneficiaries: 0,
    total_philanthropists: 0, approved_philanthropists: 0,
    pending_kyc: 0, total_tokens_distributed: 0,
    unactivated_users: 0,
  });
  const [bannerStats, setBannerStats] = useState({
    activeLast24h: 0, totalActivated: 0,
    activePhilanthropists: 0, goalPercent: 0, generatedAt: '',
  });
  const [users, setUsers] = useState<any[]>([]);
  const [activationMap, setActivationMap] = useState<Record<string, any>>({});
  const [philanthropistMap, setPhilanthropistMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedActivation, setSelectedActivation] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'activated' | 'unactivated' | 'philanthropist' | 'admin'>('all');
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState<string>('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    const isAdmin = user?.email?.toLowerCase() === 'dinfadashe@gmail.com' || user?.role === 'admin';
    if (!isAdmin) { router.push('/beneficiary-dashboard'); return; }
    loadDashboard();
  }, [user, authLoading]);

  const loadBannerStats = async () => {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [{ count: total }, { count: last24h }, { count: philanthropists }] = await Promise.all([
        supabase.from('beneficiary_activations').select('*', { count: 'exact', head: true }).eq('payment_status', 'verified'),
        supabase.from('beneficiary_activations').select('*', { count: 'exact', head: true }).eq('payment_status', 'verified').gte('activated_at', yesterday),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'philanthropist'),
      ]);
      const totalCount = total ?? 0;
      setBannerStats({
        activeLast24h: last24h ?? 0, totalActivated: totalCount,
        activePhilanthropists: philanthropists ?? 0,
        goalPercent: parseFloat(((totalCount / 1000000) * 100).toFixed(2)),
        generatedAt: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      });
    } catch (e) { console.error('Banner stats error:', e); }
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const { data: allUsers } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      const { data: allActivations } = await supabase.from('beneficiary_activations').select('*');
      const actMap: Record<string, any> = {};
      (allActivations || []).forEach(a => { actMap[a.user_id] = a; });
      setActivationMap(actMap);
      const { data: philActivations } = await supabase.from('beneficiary_activations').select('philanthropist_id').eq('payment_status', 'verified').not('philanthropist_id', 'is', null);
      const philMap: Record<string, number> = {};
      (philActivations || []).forEach(a => { if (a.philanthropist_id) philMap[a.philanthropist_id] = (philMap[a.philanthropist_id] || 0) + 1; });
      setPhilanthropistMap(philMap);
      setUsers(allUsers || []);
      const activeCount = Object.values(actMap).filter(a => a.payment_status === 'verified').length;
      const unactivatedCount = (allUsers || []).filter(u => u.role === 'beneficiary' && !actMap[u.id]).length;
      const philanthropists = (allUsers || []).filter(u => u.role === 'philanthropist');
      const { count: approvedPhil } = await supabase.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'approved');
      const { count: pendingKyc } = await supabase.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { data: distributions } = await supabase.from('token_transactions').select('amount').eq('transaction_type', 'distribution');
      const totalDistributed = (distributions || []).reduce((sum, d) => sum + (d.amount || 0), 0);
      setStats({
        total_beneficiaries: activeCount, active_beneficiaries: activeCount,
        total_philanthropists: philanthropists.length, approved_philanthropists: approvedPhil || 0,
        pending_kyc: pendingKyc || 0, total_tokens_distributed: totalDistributed,
        unactivated_users: unactivatedCount,
      });
      await loadBannerStats();
    } catch (error) { console.error('Error loading dashboard:', error); }
    finally { setLoading(false); }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !user?.id) return;
    try {
      await supabase.from('beneficiary_activations').delete().eq('user_id', selectedUser.id);
      await supabase.from('kyc_submissions').delete().eq('user_id', selectedUser.id);
      await supabase.from('users').delete().eq('id', selectedUser.id);
      setSelectedUser(null); setConfirmDelete(false);
      await loadDashboard();
    } catch (error: any) { alert('Failed to delete user: ' + error.message); }
  };

  // ── SEND ACTIVATION REMINDER EMAILS ─────────────────────────────────────────
  const sendActivationReminders = async () => {
    setSendingReminders(true); setReminderResult('');
    try {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch('/api/send-activation-reminders', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setReminderResult(`✅ Sent to ${data.sent} users. ${data.failed > 0 ? `${data.failed} failed.` : ''}`);
      } else {
        setReminderResult(`❌ Failed: ${data.error}`);
      }
    } catch (e: any) {
      setReminderResult('❌ Network error. Please try again.');
    } finally { setSendingReminders(false); }
  };

  // ── EXPORT PHILANTHROPIST ACTIVITY TO CSV ──────────────────────────────────
  const exportPhilanthropistCSV = async (phil: any) => {
    setExportingId(phil.id);
    try {
      // Fetch all activations done by this philanthropist with beneficiary details
      const { data: activations, error } = await supabase
        .from('beneficiary_activations')
        .select(`
          id, payment_status, activation_method, activated_at, created_at,
          transaction_hash,
          users:user_id (
            id, full_name, email, country, phone,
            username, created_at, updated_at, is_active, role
          )
        `)
        .eq('philanthropist_id', phil.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Also fetch philanthropist's own KYC info
      const { data: kycData } = await supabase
        .from('kyc_submissions')
        .select('status, submitted_at, reviewed_at, government_id_type')
        .eq('user_id', phil.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // ── BUILD CSV ────────────────────────────────────────────────────────
      const now = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      const escape = (v: any) => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };

      const rows: string[] = [];

      // ── SECTION 1: PHILANTHROPIST INFO ────────────────────────────────────
      rows.push('CHARITY TOKEN PROJECT — PHILANTHROPIST ACTIVITY REPORT');
      rows.push(`Generated: ${now}`);
      rows.push('');
      rows.push('PHILANTHROPIST PROFILE');
      rows.push(`Full Name,${escape(phil.full_name || 'N/A')}`);
      rows.push(`Email,${escape(phil.email || 'N/A')}`);
      rows.push(`Country,${escape(phil.country || 'N/A')}`);
      rows.push(`Phone,${escape(phil.phone || 'N/A')}`);
      rows.push(`User ID,${escape(phil.id)}`);
      rows.push(`Registered,${escape(phil.created_at ? new Date(phil.created_at).toLocaleDateString('en-GB') : 'N/A')}`);
      rows.push(`Role,${escape(phil.role)}`);
      rows.push('');

      // ── SECTION 2: KYC INFO ───────────────────────────────────────────────
      rows.push('KYC INFORMATION');
      if (kycData) {
        rows.push(`KYC Status,${escape(kycData.status)}`);
        rows.push(`ID Type,${escape(kycData.government_id_type?.replace(/_/g, ' ') || 'N/A')}`);
        rows.push(`Submitted,${escape(kycData.submitted_at ? new Date(kycData.submitted_at).toLocaleDateString('en-GB') : 'N/A')}`);
        rows.push(`Reviewed,${escape(kycData.reviewed_at ? new Date(kycData.reviewed_at).toLocaleDateString('en-GB') : 'Pending')}`);
      } else {
        rows.push('KYC Status,No KYC submission found');
      }
      rows.push('');

      // ── SECTION 3: ACTIVATION SUMMARY ────────────────────────────────────
      const totalActivations  = (activations || []).length;
      const verifiedCount     = (activations || []).filter(a => a.payment_status === 'verified').length;
      const pendingCount      = (activations || []).filter(a => a.payment_status === 'pending').length;
      const rejectedCount     = (activations || []).filter(a => a.payment_status === 'rejected').length;

      rows.push('ACTIVATION SUMMARY');
      rows.push(`Total Activations,${totalActivations}`);
      rows.push(`Verified,${verifiedCount}`);
      rows.push(`Pending,${pendingCount}`);
      rows.push(`Rejected,${rejectedCount}`);
      rows.push('');

      // ── SECTION 4: ACTIVATION RECORDS ────────────────────────────────────
      rows.push('ACTIVATION RECORDS');
      rows.push([
        '#',
        'Full Name',
        'Email Address',
        'Phone Number',
        'Username',
        'Country',
        'Account Created',
        'Account Status',
        'Beneficiary User ID',
        'Payment Status',
        'Activation Method',
        'Transaction Hash',
        'Activated At',
        'Record Created',
        'Activation Record ID',
      ].map(escape).join(','));

      (activations || []).forEach((a: any, idx: number) => {
        const ben = a.users || {};
        rows.push([
          idx + 1,
          ben.full_name  || 'N/A',
          ben.email      || 'N/A',
          ben.phone      || 'N/A',
          ben.username   || 'N/A',
          ben.country    || 'N/A',
          ben.created_at ? new Date(ben.created_at).toLocaleDateString('en-GB') : 'N/A',
          ben.is_active  ? 'Active' : 'Inactive',
          ben.id         || 'N/A',
          a.payment_status       || 'N/A',
          a.activation_method?.replace(/_/g, ' ') || 'N/A',
          a.transaction_hash     || 'N/A',
          a.activated_at  ? new Date(a.activated_at).toLocaleString('en-GB')  : 'N/A',
          a.created_at    ? new Date(a.created_at).toLocaleString('en-GB')    : 'N/A',
          a.id,
        ].map(escape).join(','));
      });

      rows.push('');
      rows.push(`END OF REPORT — Charity Token Project — charitytoken.net`);

      // ── DOWNLOAD ─────────────────────────────────────────────────────────
      const csv     = rows.join('\r\n');
      const blob    = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
      const url     = URL.createObjectURL(blob);
      const safeName = (phil.full_name || 'philanthropist').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const dateStr  = new Date().toISOString().slice(0, 10);
      const a        = Object.assign(document.createElement('a'), {
        href: url, download: `CT_Philanthropist_${safeName}_${dateStr}.csv`,
      });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);

    } catch (e: any) {
      alert('Export failed: ' + (e.message || 'Unknown error'));
    } finally {
      setExportingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchQuery.toLowerCase());
    const activation  = activationMap[u.id];
    const isActivated = activation?.payment_status === 'verified';
    if (roleFilter === 'activated')      return matchesSearch && isActivated;
    if (roleFilter === 'unactivated')    return matchesSearch && u.role === 'beneficiary' && !isActivated;
    if (roleFilter === 'philanthropist') return matchesSearch && u.role === 'philanthropist';
    if (roleFilter === 'admin')          return matchesSearch && u.role === 'admin';
    return matchesSearch;
  });

  const getActivationStatus = (u: any) => {
    const activation = activationMap[u.id];
    if (u.role === 'admin')          return { label: 'Admin', color: '#9B59B6', bg: 'rgba(155,89,182,0.15)', border: 'rgba(155,89,182,0.3)' };
    if (u.role === 'philanthropist') { const count = philanthropistMap[u.id] || 0; return { label: `Philanthropist · ${count} activated`, color: '#00B894', bg: 'rgba(0,184,148,0.12)', border: 'rgba(0,184,148,0.3)' }; }
    if (activation?.payment_status === 'verified') return { label: '✓ Activated', color: '#00CEC9', bg: 'rgba(0,206,201,0.12)', border: 'rgba(0,206,201,0.3)' };
    if (activation?.payment_status === 'pending')  return { label: '⏳ Pending',  color: '#ffc107',  bg: 'rgba(255,193,7,0.12)',  border: 'rgba(255,193,7,0.3)' };
    return { label: 'Not Activated', color: '#ff6b6b', bg: 'rgba(255,107,107,0.1)', border: 'rgba(255,107,107,0.25)' };
  };

  // Philanthropist-only list for the report section
  const philanthropists = users.filter(u => u.role === 'philanthropist');

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(108,63,200,0.3)', borderTop: '3px solid #9B59B6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#8FA3BF', fontSize: 14 }}>Loading admin dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, background: 'radial-gradient(circle, rgba(108,63,200,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
        </div>

        {/* HEADER */}
        <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(12px)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Image src="/Charity token logo.jpg" alt="Charity Token" width={36} height={36} style={{ borderRadius: 9 }} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>Charity Token</p>
                <p style={{ fontSize: 10, color: '#9B59B6', margin: 0, letterSpacing: 0.5, fontWeight: 600 }}>ADMIN CONSOLE</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => router.push('/beneficiary-dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(0,206,201,0.2)', color: '#67e8f9', background: 'transparent', cursor: 'pointer' }}>
                <Home style={{ width: 13, height: 13 }} /> My Dashboard
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, backgroundColor: 'rgba(108,63,200,0.15)', border: '1px solid rgba(108,63,200,0.3)' }}>
                <Shield style={{ width: 14, height: 14, color: '#9B59B6' }} />
                <span style={{ fontSize: 12, color: '#9B59B6', fontWeight: 600 }}>{user?.full_name || user?.email}</span>
              </div>
              <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: '#8FA3BF', background: 'transparent', cursor: 'pointer' }}>
                <LogOut style={{ width: 14, height: 14 }} /> Sign Out
              </button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px', position: 'relative', zIndex: 10 }}>

          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, color: '#9B59B6', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Platform Management</p>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: 0 }}>Admin Dashboard</h1>
            <p style={{ fontSize: 13, color: '#8FA3BF', marginTop: 6 }}>Monitor platform activity, manage users, and review KYC submissions</p>
          </div>

          {/* STATS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Activated Beneficiaries', value: stats.active_beneficiaries.toLocaleString(), sub: 'Payment verified', icon: <CheckCircle style={{ width: 20, height: 20, color: '#00CEC9' }} />, color: '#00CEC9', bg: 'rgba(0,206,201,0.1)' },
              { label: 'Not Yet Activated', value: stats.unactivated_users.toLocaleString(), sub: 'Registered, unpaid', icon: <UserX style={{ width: 20, height: 20, color: '#ff6b6b' }} />, color: '#ff6b6b', bg: 'rgba(255,107,107,0.1)' },
              { label: 'Philanthropists', value: stats.total_philanthropists.toLocaleString(), sub: stats.approved_philanthropists + ' KYC approved', icon: <Shield style={{ width: 20, height: 20, color: '#00B894' }} />, color: '#00B894', bg: 'rgba(0,184,148,0.1)' },
              { label: 'Pending KYC', value: stats.pending_kyc.toLocaleString(), sub: 'Reviews needed', icon: <Clock style={{ width: 20, height: 20, color: '#ffc107' }} />, color: '#ffc107', bg: 'rgba(255,193,7,0.1)' },
              { label: 'Tokens Distributed', value: stats.total_tokens_distributed.toLocaleString(), sub: 'All time', icon: <Coins style={{ width: 20, height: 20, color: '#67e8f9' }} />, color: '#67e8f9', bg: 'rgba(103,232,249,0.1)' },
            ].map((s) => (
              <div key={s.label} style={{ padding: '18px 16px', borderRadius: 18, border: '1px solid rgba(0,206,201,0.12)', backgroundColor: 'rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 10, backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
                <p style={{ fontSize: 10, color: '#8FA3BF', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: s.color, margin: '0 0 3px', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 10, color: '#4A5568', margin: 0 }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* QUICK ACTIONS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <Link href="/admin/kyc-review" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '20px 24px', borderRadius: 16, border: `1px solid ${stats.pending_kyc > 0 ? 'rgba(255,193,7,0.4)' : 'rgba(0,206,201,0.25)'}`, background: stats.pending_kyc > 0 ? 'linear-gradient(135deg, rgba(255,193,7,0.08) 0%, rgba(0,206,201,0.06) 100%)' : 'linear-gradient(135deg, rgba(0,206,201,0.06) 0%, rgba(0,184,148,0.06) 100%)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: stats.pending_kyc > 0 ? 'rgba(255,193,7,0.15)' : 'rgba(0,206,201,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <Shield style={{ width: 22, height: 22, color: stats.pending_kyc > 0 ? '#ffc107' : '#00CEC9' }} />
                    {stats.pending_kyc > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#ff6b6b', color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{stats.pending_kyc}</span>}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: 'white', margin: '0 0 3px' }}>Review KYC Submissions</p>
                    <p style={{ fontSize: 12, color: stats.pending_kyc > 0 ? '#ffc107' : '#8FA3BF', margin: 0 }}>{stats.pending_kyc > 0 ? `${stats.pending_kyc} pending — action required` : 'No pending reviews'}</p>
                  </div>
                </div>
                <ChevronRight style={{ width: 20, height: 20, color: stats.pending_kyc > 0 ? '#ffc107' : '#00CEC9' }} />
              </div>
            </Link>
            <Link href="/admin/distributions" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '20px 24px', borderRadius: 16, border: '1px solid rgba(0,184,148,0.25)', background: 'linear-gradient(135deg, rgba(0,184,148,0.06) 0%, rgba(103,232,249,0.06) 100%)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: 'rgba(0,184,148,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart3 style={{ width: 22, height: 22, color: '#00B894' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: 'white', margin: '0 0 3px' }}>Manage Distributions</p>
                    <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>Schedule and process token distributions</p>
                  </div>
                </div>
                <ChevronRight style={{ width: 20, height: 20, color: '#00B894' }} />
              </div>
            </Link>
          </div>

          {/* DAILY STATS BANNER */}
          <div style={{ padding: '28px', borderRadius: 20, border: '1px solid rgba(255,193,7,0.2)', backgroundColor: 'rgba(255,193,7,0.03)', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 4, height: 18, backgroundColor: '#ffc107', borderRadius: 2, display: 'inline-block' }} />
                  Daily Stats Banner
                </p>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>Download and post on social media every day. Exports as 1080×1080px PNG.</p>
              </div>
              <button onClick={loadBannerStats} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(0,206,201,0.3)', backgroundColor: 'rgba(0,206,201,0.08)', color: '#67e8f9', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                🔄 Refresh Stats
              </button>
            </div>
            <StatsBanner activeLast24h={bannerStats.activeLast24h} totalActivated={bannerStats.totalActivated} activePhilanthropists={bannerStats.activePhilanthropists} goalPercent={bannerStats.goalPercent} generatedAt={bannerStats.generatedAt} />
          </div>

          {/* ── ACTIVATION REMINDERS ─────────────────────────────────────────────── */}
          <div style={{ padding: '22px 24px', borderRadius: 20, border: '1px solid rgba(0,206,201,0.18)', backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 4, height: 18, backgroundColor: '#0088cc', borderRadius: 2, display: 'inline-block' }} />
                  Send Activation Reminders
                </p>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>
                  Email all <strong style={{ color: '#ff6b6b' }}>{stats.unactivated_users}</strong> unactivated users with a Telegram button to contact a philanthropist and pay $1 to activate.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <button
                  onClick={sendActivationReminders}
                  disabled={sendingReminders || stats.unactivated_users === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, background: sendingReminders ? 'rgba(0,136,204,0.15)' : 'linear-gradient(135deg,#0088cc,#229ED9)', color: sendingReminders ? '#0088cc' : 'white', fontWeight: 700, fontSize: 14, border: sendingReminders ? '1px solid rgba(0,136,204,0.3)' : 'none', cursor: (sendingReminders || stats.unactivated_users === 0) ? 'not-allowed' : 'pointer', boxShadow: sendingReminders ? 'none' : '0 6px 20px rgba(0,136,204,0.3)', opacity: stats.unactivated_users === 0 ? 0.5 : 1 }}>
                  {sendingReminders
                    ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,136,204,0.3)', borderTop: '2px solid #0088cc', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Sending…</>
                    : <><span style={{ fontSize: 16 }}>💬</span> Send Telegram Reminder Emails</>
                  }
                </button>
                {reminderResult && (
                  <p style={{ fontSize: 12, color: reminderResult.startsWith('✅') ? '#00B894' : '#ff6b6b', margin: 0, fontWeight: 600 }}>
                    {reminderResult}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── PHILANTHROPIST ACTIVITY REPORTS ──────────────────────────────────── */}
          <div style={{ padding: '24px', borderRadius: 20, border: '1px solid rgba(0,184,148,0.2)', backgroundColor: 'rgba(0,184,148,0.02)', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 4, height: 18, backgroundColor: '#00B894', borderRadius: 2, display: 'inline-block' }} />
                  Philanthropist Activity Reports
                </p>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>
                  Download a full CSV report of every activation made by each philanthropist — includes beneficiary details, payment method, dates and transaction hashes.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10, backgroundColor: 'rgba(0,184,148,0.08)', border: '1px solid rgba(0,184,148,0.2)' }}>
                <FileSpreadsheet style={{ width: 14, height: 14, color: '#00B894' }} />
                <span style={{ fontSize: 12, color: '#00B894', fontWeight: 600 }}>{philanthropists.length} philanthropists</span>
              </div>
            </div>

            {philanthropists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Users style={{ width: 36, height: 36, color: '#4A5568', margin: '0 auto 10px' }} />
                <p style={{ color: '#8FA3BF', fontSize: 14 }}>No philanthropists registered yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {philanthropists.map((phil) => {
                  const count      = philanthropistMap[phil.id] || 0;
                  const isExporting = exportingId === phil.id;
                  return (
                    <div key={phil.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,184,148,0.1)', transition: 'border-color 0.2s' }}>
                      {/* Avatar */}
                      {phil.profile_picture
                        ? <img src={phil.profile_picture} alt={phil.full_name} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,184,148,0.35)', flexShrink: 0 }} />
                        : <div style={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: 'rgba(0,184,148,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(0,184,148,0.25)' }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: '#00B894' }}>{(phil.full_name || phil.email || 'U')[0].toUpperCase()}</span>
                          </div>
                      }

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'white', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {phil.full_name || 'No name'}
                        </p>
                        <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {phil.email}
                          {phil.country ? ` · ${phil.country}` : ''}
                        </p>
                      </div>

                      {/* Activation count badge */}
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <p style={{ fontSize: 22, fontWeight: 800, color: '#00B894', lineHeight: 1, margin: 0 }}>{count}</p>
                        <p style={{ fontSize: 10, color: '#8FA3BF', margin: 0 }}>activated</p>
                      </div>

                      {/* Download button */}
                      <button
                        onClick={() => exportPhilanthropistCSV(phil)}
                        disabled={isExporting}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          padding: '10px 18px', borderRadius: 10,
                          background: isExporting
                            ? 'rgba(0,184,148,0.15)'
                            : 'linear-gradient(to right, #00B894, #00CEC9)',
                          color: isExporting ? '#00B894' : 'white',
                          fontWeight: 700, fontSize: 13,
                          border: isExporting ? '1px solid rgba(0,184,148,0.3)' : 'none',
                          cursor: isExporting ? 'not-allowed' : 'pointer',
                          flexShrink: 0,
                          boxShadow: isExporting ? 'none' : '0 4px 14px rgba(0,184,148,0.3)',
                        }}
                      >
                        {isExporting
                          ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(0,184,148,0.3)', borderTop: '2px solid #00B894', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Exporting…</>
                          : <><Download style={{ width: 14, height: 14 }} /> Download CSV</>
                        }
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* USERS TABLE */}
          <div style={{ padding: '24px', borderRadius: 20, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 4, height: 18, backgroundColor: '#00CEC9', borderRadius: 2, display: 'inline-block' }} />
                  Users Management
                </p>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>{filteredUsers.length} of {users.length} users shown</p>
              </div>
              <input placeholder="Search by name, email or role..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 13, outline: 'none', width: 240 }} />
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
              {[
                { key: 'all',            label: `All (${users.length})`,                             color: '#8FA3BF' },
                { key: 'activated',      label: `✓ Activated (${stats.active_beneficiaries})`,       color: '#00CEC9' },
                { key: 'unactivated',    label: `✗ Not Activated (${stats.unactivated_users})`,      color: '#ff6b6b' },
                { key: 'philanthropist', label: `Philanthropists (${stats.total_philanthropists})`,  color: '#00B894' },
                { key: 'admin',          label: 'Admins',                                            color: '#9B59B6' },
              ].map((f) => (
                <button key={f.key} onClick={() => setRoleFilter(f.key as any)}
                  style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                    backgroundColor: roleFilter === f.key ? f.color : 'rgba(255,255,255,0.04)',
                    color: roleFilter === f.key ? '#0A1628' : f.color,
                    outline: roleFilter === f.key ? 'none' : `1px solid ${f.color}44` }}>
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,206,201,0.15)' }}>
                    {['Name', 'Email', 'Status', 'Joined', 'Action'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', paddingBottom: 12, color: '#8FA3BF', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, paddingRight: 16 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.slice(0, 25).map((u) => {
                    const status = getActivationStatus(u);
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(0,206,201,0.06)' }}>
                        <td style={{ padding: '13px 16px 13px 0', color: 'white', fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {u.profile_picture
                              ? <img src={u.profile_picture} alt={u.full_name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(0,206,201,0.3)', flexShrink: 0 }} />
                              : <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(0,206,201,0.2)' }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#00CEC9' }}>{(u.full_name || u.email || 'U')[0].toUpperCase()}</span>
                                </div>
                            }
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{u.full_name || 'No name'}</p>
                              <p style={{ margin: 0, fontSize: 10, color: '#4A5568', textTransform: 'capitalize' }}>{u.role}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '13px 16px 13px 0', color: '#8FA3BF', fontFamily: 'monospace', fontSize: 12 }}>{u.email}</td>
                        <td style={{ padding: '13px 16px 13px 0' }}>
                          <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: status.bg, color: status.color, border: `1px solid ${status.border}`, whiteSpace: 'nowrap' }}>
                            {status.label}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px 13px 0', color: '#8FA3BF' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '13px 0' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { setSelectedUser(u); setSelectedActivation(activationMap[u.id] || null); setConfirmDelete(false); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(0,206,201,0.3)', backgroundColor: 'transparent', color: '#00CEC9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              <Eye style={{ width: 13, height: 13 }} /> View
                            </button>
                            {u.role === 'philanthropist' && (
                              <button onClick={() => exportPhilanthropistCSV(u)} disabled={exportingId === u.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(0,184,148,0.3)', backgroundColor: 'rgba(0,184,148,0.08)', color: '#00B894', fontSize: 12, fontWeight: 600, cursor: exportingId === u.id ? 'not-allowed' : 'pointer', opacity: exportingId === u.id ? 0.6 : 1 }}>
                                {exportingId === u.id
                                  ? <div style={{ width: 11, height: 11, border: '2px solid rgba(0,184,148,0.3)', borderTop: '2px solid #00B894', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                  : <Download style={{ width: 11, height: 11 }} />
                                }
                                CSV
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: '#8FA3BF', fontSize: 14 }}>No users match your filter.</p>
              </div>
            )}
          </div>

          {/* ADMIN LOGS */}
          <div style={{ padding: '24px', borderRadius: 20, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 18, backgroundColor: '#67e8f9', borderRadius: 2, display: 'inline-block' }} />Recent Admin Actions
            </p>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <BarChart3 style={{ width: 40, height: 40, color: '#4A5568', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: '#8FA3BF' }}>Admin action logs will appear here</p>
            </div>
          </div>

        </main>

        {/* USER DETAIL MODAL */}
        {selectedUser && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100, backdropFilter: 'blur(4px)' }}>
            <div style={{ width: '100%', maxWidth: 480, backgroundColor: '#0F1F35', border: '1px solid rgba(0,206,201,0.2)', borderRadius: 20, padding: 28, boxShadow: '0 40px 80px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>User Details</h2>
                <button onClick={() => { setSelectedUser(null); setSelectedActivation(null); setConfirmDelete(false); }} style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', color: '#8FA3BF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '16px', borderRadius: 14, backgroundColor: 'rgba(0,206,201,0.04)', border: '1px solid rgba(0,206,201,0.1)' }}>
                {selectedUser.profile_picture
                  ? <img src={selectedUser.profile_picture} alt={selectedUser.full_name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,206,201,0.4)', flexShrink: 0 }} />
                  : <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(0,206,201,0.3)', flexShrink: 0 }}><span style={{ fontSize: 22, fontWeight: 800, color: '#00CEC9' }}>{(selectedUser.full_name || selectedUser.email || 'U')[0].toUpperCase()}</span></div>
                }
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 4px' }}>{selectedUser.full_name || 'No name'}</p>
                  <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>{selectedUser.email}</p>
                </div>
                {(() => { const s = getActivationStatus(selectedUser); return (<span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, flexShrink: 0 }}>{s.label}</span>); })()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {[
                  { label: 'Role',    value: selectedUser.role },
                  { label: 'Country', value: selectedUser.country || 'Not specified' },
                  { label: 'Phone',   value: selectedUser.phone  || 'Not specified' },
                  { label: 'Joined',  value: new Date(selectedUser.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  { label: 'User ID', value: selectedUser.id?.slice(0, 20) + '...' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 12, color: '#8FA3BF', fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontSize: 13, color: 'white', fontWeight: 500, textTransform: 'capitalize' }}>{item.value}</span>
                  </div>
                ))}
              </div>
              {selectedActivation && (
                <div style={{ marginBottom: 20, padding: '16px', borderRadius: 14, backgroundColor: 'rgba(0,206,201,0.04)', border: '1px solid rgba(0,206,201,0.12)' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#00CEC9', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Activation Details</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Method',       value: selectedActivation.activation_method?.replace(/_/g, ' ') || '—' },
                      { label: 'Status',       value: selectedActivation.payment_status || '—' },
                      { label: 'Activated At', value: selectedActivation.activated_at ? new Date(selectedActivation.activated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                      ...(selectedActivation.transaction_hash ? [{ label: 'Tx Hash', value: selectedActivation.transaction_hash.slice(0, 18) + '...' }] : []),
                    ].map((item) => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#8FA3BF' }}>{item.label}</span>
                        <span style={{ color: 'white', fontWeight: 600, textTransform: 'capitalize' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedUser.role === 'philanthropist' && (
                <div style={{ marginBottom: 20, padding: '16px', borderRadius: 14, backgroundColor: 'rgba(0,184,148,0.05)', border: '1px solid rgba(0,184,148,0.15)' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#00B894', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Philanthropist Activity</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, color: '#8FA3BF' }}>Beneficiaries Activated</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#00B894' }}>{philanthropistMap[selectedUser.id] || 0}</span>
                  </div>
                  <button onClick={() => { exportPhilanthropistCSV(selectedUser); setSelectedUser(null); setSelectedActivation(null); }}
                    disabled={exportingId === selectedUser.id}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 11, background: 'linear-gradient(to right, #00B894, #00CEC9)', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,184,148,0.25)' }}>
                    <Download style={{ width: 15, height: 15 }} />
                    Download Full Activity Report (.CSV)
                  </button>
                </div>
              )}
              {confirmDelete ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 10, padding: '12px 16px', backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 12 }}>
                    <AlertCircle style={{ width: 16, height: 16, color: '#ff6b6b', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: '#ffb3b3', margin: 0 }}>This action cannot be undone. Are you sure?</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleDeleteUser} style={{ flex: 1, padding: '12px', borderRadius: 12, backgroundColor: '#ff6b6b', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>Confirm Delete</button>
                    <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, backgroundColor: 'transparent', color: '#8FA3BF', fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  {selectedUser.email?.toLowerCase() !== 'dinfadashe@gmail.com' && (
                    <button onClick={() => setConfirmDelete(true)} style={{ flex: 1, padding: '12px', borderRadius: 12, backgroundColor: 'rgba(255,107,107,0.1)', color: '#ff6b6b', fontWeight: 700, fontSize: 14, border: '1px solid rgba(255,107,107,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Trash2 style={{ width: 15, height: 15 }} /> Delete User
                    </button>
                  )}
                  <button onClick={() => { setSelectedUser(null); setSelectedActivation(null); }} style={{ flex: 1, padding: '12px', borderRadius: 12, backgroundColor: 'transparent', color: '#8FA3BF', fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>Close</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}