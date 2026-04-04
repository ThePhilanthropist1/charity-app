'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';
import {
  LogOut, Shield, Users, MapPin, Phone, Mail, User,
  ChevronRight, CheckCircle, Clock, AlertCircle, Award, Send
} from 'lucide-react';

export default function PhilanthropistDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [philanthropist, setPhilanthropist] = useState<any>(null);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    loadDashboard();
  }, [user, authLoading]);

  const loadDashboard = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: phil } = await supabase
        .from('philanthropists')
        .select('*')
        .eq('id', user.id)
        .single();
      setPhilanthropist(phil);

      const { data: bens } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('philanthropist_assigned_id', user.id);
      setBeneficiaries(bens || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const kycStatus = philanthropist?.kyc_status || 'pending';

  const kycConfig: Record<string, { color: string; bg: string; border: string; icon: any; label: string; message: string }> = {
    approved: { color: '#00B894', bg: 'rgba(0,184,148,0.08)', border: 'rgba(0,184,148,0.3)', icon: CheckCircle, label: 'Approved', message: 'Your KYC is approved. You can now onboard beneficiaries.' },
    submitted: { color: '#67e8f9', bg: 'rgba(103,232,249,0.08)', border: 'rgba(103,232,249,0.3)', icon: Clock, label: 'Under Review', message: 'Your KYC is under review. You will be notified within 24-48 hours.' },
    rejected: { color: '#ff6b6b', bg: 'rgba(255,107,107,0.08)', border: 'rgba(255,107,107,0.3)', icon: AlertCircle, label: 'Rejected', message: philanthropist?.rejection_reason || 'Your KYC was rejected. Please resubmit with correct documents.' },
    pending: { color: '#ffc107', bg: 'rgba(255,193,7,0.08)', border: 'rgba(255,193,7,0.3)', icon: AlertCircle, label: 'Pending', message: 'Complete your KYC verification to start helping beneficiaries.' },
  };

  const kyc = kycConfig[kycStatus] || kycConfig.pending;
  const KycIcon = kyc.icon;

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(0,206,201,0.3)', borderTop: '3px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#8FA3BF', fontSize: 14 }}>Loading dashboard...</p>
          <style>{@keyframes spin { to { transform: rotate(360deg); } }}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', color: 'white', fontFamily: 'sans-serif' }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(0,206,201,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/Charity token logo.jpg" alt="Charity Token" width={34} height={34} style={{ borderRadius: 8 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: 0 }}>Charity Token</p>
              <p style={{ fontSize: 9, color: '#8FA3BF', margin: 0, letterSpacing: 0.5 }}>PHILANTHROPIST PORTAL</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, backgroundColor: 'rgba(0,206,201,0.1)', border: '1px solid rgba(0,206,201,0.2)' }}>
              <Award style={{ width: 13, height: 13, color: '#00CEC9' }} />
              <span style={{ fontSize: 12, color: '#00CEC9', fontWeight: 600 }}>{user?.full_name || user?.email}</span>
            </div>
            <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: '#8FA3BF', background: 'transparent', cursor: 'pointer' }}>
              <LogOut style={{ width: 13, height: 13 }} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 60px', position: 'relative', zIndex: 10 }}>

        {/* Page Title */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: '#8FA3BF', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Philanthropist Portal</p>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: 'white', margin: 0 }}>Welcome, {user?.full_name?.split(' ')[0] || 'Philanthropist'}</h1>
          <p style={{ fontSize: 13, color: '#8FA3BF', marginTop: 6 }}>Manage your beneficiaries and track your impact</p>
        </div>

        {/* KYC Status Banner */}
        <div style={{ marginBottom: 24, padding: '16px 20px', borderRadius: 16, backgroundColor: kyc.bg, border: '1px solid ' + kyc.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: kyc.bg, border: '1px solid ' + kyc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <KycIcon style={{ width: 20, height: 20, color: kyc.color }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: kyc.color, margin: '0 0 3px' }}>KYC Status: {kyc.label}</p>
              <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>{kyc.message}</p>
            </div>
          </div>
          {(kycStatus === 'pending' || kycStatus === 'rejected') && (
            <button onClick={() => router.push('/philanthropist/kyc')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <Send style={{ width: 14, height: 14 }} />
              {kycStatus === 'rejected' ? 'Resubmit KYC' : 'Complete KYC'}
            </button>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'KYC Status', value: kyc.label, sub: 'Verification status', color: kyc.color, icon: <Shield style={{ width: 20, height: 20, color: kyc.color }} />, bg: kyc.bg },
            { label: 'Assigned Beneficiaries', value: beneficiaries.length.toString(), sub: 'People you support', color: '#00CEC9', icon: <Users style={{ width: 20, height: 20, color: '#00CEC9' }} />, bg: 'rgba(0,206,201,0.1)' },
            { label: 'Region Coverage', value: philanthropist?.region_coverage || user?.region || 'N/A', sub: user?.country || 'Location', color: '#67e8f9', icon: <MapPin style={{ width: 20, height: 20, color: '#67e8f9' }} />, bg: 'rgba(103,232,249,0.1)' },
          ].map((s) => (
            <div key={s.label} style={{ padding: '20px', borderRadius: 18, border: '1px solid rgba(0,206,201,0.12)', backgroundColor: 'rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: 11, backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <p style={{ fontSize: 11, color: '#8FA3BF', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: '0 0 4px', lineHeight: 1.2 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: '#4A5568', margin: 0 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* Personal Info */}
          <div style={{ padding: '24px', borderRadius: 20, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 16, backgroundColor: '#00CEC9', borderRadius: 2, display: 'inline-block' }} />
              Personal Information
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Full Name', value: user?.full_name, icon: <User style={{ width: 14, height: 14 }} /> },
                { label: 'Email', value: user?.email, icon: <Mail style={{ width: 14, height: 14 }} /> },
                { label: 'Phone', value: user?.phone_number || user?.phone || 'Not provided', icon: <Phone style={{ width: 14, height: 14 }} /> },
                { label: 'Location', value: [user?.country, user?.region].filter(Boolean).join(', ') || 'Not provided', icon: <MapPin style={{ width: 14, height: 14 }} /> },
              ].map((f) => (
                <div key={f.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(0,206,201,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#00CEC9', marginTop: 2 }}>
                    {f.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#8FA3BF', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</p>
                    <p style={{ fontSize: 14, color: 'white', fontWeight: 500, margin: 0 }}>{f.value || 'Not provided'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Methods */}
          <div style={{ padding: '24px', borderRadius: 20, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 16, backgroundColor: '#00B894', borderRadius: 2, display: 'inline-block' }} />
              Contact Methods
            </p>

            {philanthropist?.telegram_username || philanthropist?.wallet_address ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {philanthropist?.telegram_username && (
                  <div style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.04)', border: '1px solid rgba(0,206,201,0.12)' }}>
                    <p style={{ fontSize: 11, color: '#8FA3BF', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Telegram</p>
                    <p style={{ fontSize: 14, color: '#67e8f9', fontWeight: 600, margin: 0 }}>@{philanthropist.telegram_username}</p>
                  </div>
                )}
                {philanthropist?.wallet_address && (
                  <div style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.04)', border: '1px solid rgba(0,206,201,0.12)' }}>
                    <p style={{ fontSize: 11, color: '#8FA3BF', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Wallet Address</p>
                    <p style={{ fontSize: 12, color: '#00B894', fontFamily: 'monospace', fontWeight: 600, margin: 0, wordBreak: 'break-all' }}>
                      {philanthropist.wallet_address.slice(0, 12)}...{philanthropist.wallet_address.slice(-10)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <Phone style={{ width: 22, height: 22, color: '#00CEC9' }} />
                </div>
                <p style={{ fontSize: 14, color: '#8FA3BF', marginBottom: 16 }}>No contact methods added yet</p>
                <button onClick={() => router.push('/philanthropist/kyc')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                  Complete KYC to Add Contact Info
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(0,206,201,0.1)' }}>
              <p style={{ fontSize: 11, color: '#8FA3BF', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Quick Actions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => router.push('/philanthropist/kyc')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(0,206,201,0.03)', cursor: 'pointer', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Shield style={{ width: 16, height: 16, color: '#00CEC9' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{kycStatus === 'approved' ? 'View KYC Status' : 'Complete KYC'}</span>
                  </div>
                  <ChevronRight style={{ width: 16, height: 16, color: '#00CEC9' }} />
                </button>
                <button onClick={() => router.push('/beneficiary-dashboard')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(0,206,201,0.03)', cursor: 'pointer', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Users style={{ width: 16, height: 16, color: '#00B894' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Switch to Beneficiary View</span>
                  </div>
                  <ChevronRight style={{ width: 16, height: 16, color: '#00B894' }} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Beneficiaries */}
        <div style={{ padding: '24px', borderRadius: 20, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 16, backgroundColor: '#67e8f9', borderRadius: 2, display: 'inline-block' }} />
              Assigned Beneficiaries
            </p>
            <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 999, backgroundColor: 'rgba(0,206,201,0.1)', color: '#00CEC9', fontWeight: 600, border: '1px solid rgba(0,206,201,0.2)' }}>
              {beneficiaries.length} total
            </span>
          </div>

          {beneficiaries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Users style={{ width: 28, height: 28, color: '#00CEC9' }} />
              </div>
              <p style={{ fontSize: 15, color: 'white', fontWeight: 600, marginBottom: 6 }}>No beneficiaries assigned yet</p>
              <p style={{ fontSize: 13, color: '#8FA3BF' }}>Once your KYC is approved, beneficiaries will be assigned to you.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,206,201,0.15)' }}>
                    {['Username', 'Status', 'Activation Method', 'Activated Date'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', paddingBottom: 12, color: '#8FA3BF', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, paddingRight: 16 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {beneficiaries.map((ben) => (
                    <tr key={ben.id} style={{ borderBottom: '1px solid rgba(0,206,201,0.06)' }}>
                      <td style={{ padding: '14px 16px 14px 0', color: 'white', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(0,206,201,0.2)' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#00CEC9' }}>{(ben.username || 'U')[0].toUpperCase()}</span>
                          </div>
                          <span>{ben.username}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px 14px 0' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: ben.is_activated ? 'rgba(0,184,148,0.15)' : 'rgba(255,193,7,0.15)', color: ben.is_activated ? '#00B894' : '#ffc107', border: '1px solid ' + (ben.is_activated ? 'rgba(0,184,148,0.3)' : 'rgba(255,193,7,0.3)') }}>
                          {ben.is_activated ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px 14px 0', color: '#8FA3BF', textTransform: 'capitalize' }}>{ben.activation_method || 'N/A'}</td>
                      <td style={{ padding: '14px 0', color: '#8FA3BF' }}>{ben.activated_at ? new Date(ben.activated_at).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
