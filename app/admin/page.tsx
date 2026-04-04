'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, Shield, Clock, Coins, LogOut, X, Trash2,
  ChevronRight, BarChart3, AlertCircle, Eye, Home
} from 'lucide-react';

export default function AdminMainDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [stats, setStats] = useState({
    total_beneficiaries: 0, active_beneficiaries: 0,
    total_philanthropists: 0, approved_philanthropists: 0,
    pending_kyc: 0, total_tokens_distributed: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    const isAdmin = user?.email?.toLowerCase() === 'dinfadashe@gmail.com' || user?.role === 'admin';
    if (!isAdmin) { router.push('/beneficiary-dashboard'); return; }
    loadDashboard();
  }, [user, authLoading]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // All users
      const { data: allUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers(allUsers || []);

      // Active beneficiaries — only verified
      const { count: activeCount } = await supabase
        .from('beneficiary_activations')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'verified');

      // Philanthropists — users with role = philanthropist
      const philanthropists = (allUsers || []).filter(u => u.role === 'philanthropist');

      // Approved philanthropists — KYC status = approved
      const { count: approvedPhil } = await supabase
        .from('kyc_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Pending KYC
      const { count: pendingKyc } = await supabase
        .from('kyc_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Total tokens distributed
      const { data: distributions } = await supabase
        .from('token_transactions')
        .select('amount')
        .eq('transaction_type', 'distribution');
      const totalDistributed = (distributions || []).reduce((sum, d) => sum + (d.amount || 0), 0);

      setStats({
        total_beneficiaries: activeCount || 0,
        active_beneficiaries: activeCount || 0,
        total_philanthropists: philanthropists.length,
        approved_philanthropists: approvedPhil || 0,
        pending_kyc: pendingKyc || 0,
        total_tokens_distributed: totalDistributed,
      });
    } catch (error) { console.error('Error loading dashboard:', error); }
    finally { setLoading(false); }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !user?.id) return;
    try {
      // Delete related records first
      await supabase.from('beneficiary_activations').delete().eq('user_id', selectedUser.id);
      await supabase.from('kyc_submissions').delete().eq('user_id', selectedUser.id);
      await supabase.from('users').delete().eq('id', selectedUser.id);
      setSelectedUser(null); setConfirmDelete(false);
      await loadDashboard();
    } catch (error: any) { alert('Failed to delete user: ' + error.message); }
  };

  const filteredUsers = users.filter((u) =>
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(108,63,200,0.3)', borderTop: '3px solid #9B59B6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#8FA3BF', fontSize: 14 }}>Verifying admin access...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(0,206,201,0.3)', borderTop: '3px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#8FA3BF', fontSize: 14 }}>Loading admin dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
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

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Active Beneficiaries', value: stats.active_beneficiaries.toLocaleString(), sub: 'Verified accounts', icon: <Users style={{ width: 20, height: 20, color: '#00CEC9' }} />, color: '#00CEC9', bg: 'rgba(0,206,201,0.1)' },
            { label: 'Philanthropists', value: stats.total_philanthropists.toLocaleString(), sub: stats.approved_philanthropists + ' KYC approved', icon: <Shield style={{ width: 20, height: 20, color: '#00B894' }} />, color: '#00B894', bg: 'rgba(0,184,148,0.1)' },
            { label: 'Pending KYC', value: stats.pending_kyc.toLocaleString(), sub: 'Reviews needed', icon: <Clock style={{ width: 20, height: 20, color: '#ffc107' }} />, color: '#ffc107', bg: 'rgba(255,193,7,0.1)' },
            { label: 'Tokens Distributed', value: stats.total_tokens_distributed.toLocaleString(), sub: 'All time', icon: <Coins style={{ width: 20, height: 20, color: '#67e8f9' }} />, color: '#67e8f9', bg: 'rgba(103,232,249,0.1)' },
          ].map((s) => (
            <div key={s.label} style={{ padding: '20px', borderRadius: 18, border: '1px solid rgba(0,206,201,0.12)', backgroundColor: 'rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: 11, backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <p style={{ fontSize: 11, color: '#8FA3BF', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
              <p style={{ fontSize: 30, fontWeight: 800, color: s.color, margin: '0 0 4px', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: '#4A5568', margin: 0 }}>{s.sub}</p>
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
                  {stats.pending_kyc > 0 && (
                    <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', backgroundColor: '#ff6b6b', color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{stats.pending_kyc}</span>
                  )}
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

        {/* USERS TABLE */}
        <div style={{ padding: '24px', borderRadius: 20, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 4, height: 18, backgroundColor: '#00CEC9', borderRadius: 2, display: 'inline-block' }} />
                Users Management
              </p>
              <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>{users.length} total users registered</p>
            </div>
            <input
              placeholder="Search by name, email or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 13, outline: 'none', width: 260 }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,206,201,0.15)' }}>
                  {['Name', 'Email', 'Role', 'Joined', 'Action'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', paddingBottom: 12, color: '#8FA3BF', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, paddingRight: 16 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.slice(0, 20).map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(0,206,201,0.06)' }}>
                    <td style={{ padding: '14px 16px 14px 0', color: 'white', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {u.profile_picture ? (
                          <img src={u.profile_picture} alt={u.full_name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(0,206,201,0.3)', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(0,206,201,0.2)' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#00CEC9' }}>{(u.full_name || u.email || 'U')[0].toUpperCase()}</span>
                          </div>
                        )}
                        <span>{u.full_name || 'No name'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px 14px 0', color: '#8FA3BF', fontFamily: 'monospace', fontSize: 12 }}>{u.email}</td>
                    <td style={{ padding: '14px 16px 14px 0' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: u.role === 'admin' ? 'rgba(155,89,182,0.2)' : u.role === 'philanthropist' ? 'rgba(0,184,148,0.15)' : 'rgba(0,206,201,0.15)', color: u.role === 'admin' ? '#9B59B6' : u.role === 'philanthropist' ? '#00B894' : '#00CEC9', border: '1px solid ' + (u.role === 'admin' ? 'rgba(155,89,182,0.4)' : u.role === 'philanthropist' ? 'rgba(0,184,148,0.3)' : 'rgba(0,206,201,0.3)'), textTransform: 'capitalize' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px 14px 0', color: '#8FA3BF' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 0' }}>
                      <button onClick={() => { setSelectedUser(u); setConfirmDelete(false); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(0,206,201,0.3)', backgroundColor: 'transparent', color: '#00CEC9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        <Eye style={{ width: 13, height: 13 }} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: '#8FA3BF', fontSize: 14 }}>No users match your search.</p>
            </div>
          )}
        </div>

        {/* ADMIN LOGS */}
        <div style={{ padding: '24px', borderRadius: 20, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 4, height: 18, backgroundColor: '#67e8f9', borderRadius: 2, display: 'inline-block' }} />
            Recent Admin Actions
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
          <div style={{ width: '100%', maxWidth: 460, backgroundColor: '#0F1F35', border: '1px solid rgba(0,206,201,0.2)', borderRadius: 20, padding: 28, boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>User Details</h2>
              <button onClick={() => { setSelectedUser(null); setConfirmDelete(false); }} style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', color: '#8FA3BF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: '16px', borderRadius: 14, backgroundColor: 'rgba(0,206,201,0.04)', border: '1px solid rgba(0,206,201,0.1)' }}>
              {selectedUser.profile_picture ? (
                <img src={selectedUser.profile_picture} alt={selectedUser.full_name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,206,201,0.4)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(0,206,201,0.3)', flexShrink: 0 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#00CEC9' }}>{(selectedUser.full_name || selectedUser.email || 'U')[0].toUpperCase()}</span>
                </div>
              )}
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 4px' }}>{selectedUser.full_name || 'No name'}</p>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>{selectedUser.email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                { label: 'Role', value: selectedUser.role, capitalize: true },
                { label: 'Country', value: selectedUser.country || 'Not specified' },
                { label: 'Phone', value: selectedUser.phone || 'Not specified' },
                { label: 'Joined', value: new Date(selectedUser.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'User ID', value: selectedUser.id?.slice(0, 16) + '...' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 12, color: '#8FA3BF', fontWeight: 600 }}>{item.label}</span>
                  <span style={{ fontSize: 13, color: 'white', fontWeight: 500, textTransform: item.capitalize ? 'capitalize' : 'none' }}>{item.value}</span>
                </div>
              ))}
            </div>

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
                <button onClick={() => setSelectedUser(null)} style={{ flex: 1, padding: '12px', borderRadius: 12, backgroundColor: 'transparent', color: '#8FA3BF', fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}