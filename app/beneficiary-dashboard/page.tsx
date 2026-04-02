'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase-client';
import {
  CheckCircle, Coins, LogOut, Edit2, Save, X,
  Camera, Bell, ChevronRight, Award, Download, AlertCircle, Shield
} from 'lucide-react';
import Image from 'next/image';

// ─── MEMBERSHIP CARD ─────────────────────────────────────────────────────────
function MembershipCard({ userId, fullName, email, profileImage, joinDate, country, phone, isActivated }: {
  userId: string; fullName: string; email: string;
  profileImage?: string; joinDate: string;
  country?: string; phone?: string; isActivated?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  const memberId = 'CT-' + userId.substring(0, 6).toUpperCase() + '-' + new Date(joinDate).getFullYear();

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#0a1628', scale: 3, logging: false, useCORS: true, allowTaint: true });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'charity-membership-' + userId + '.png';
      link.click();
    } catch { setError('Failed to download. Try again.'); }
    finally { setLoading(false); }
  };

  if (!profileImage) {
    return (
      <div style={{ padding: 18, borderRadius: 14, border: '1px solid rgba(255,193,7,0.3)', backgroundColor: 'rgba(255,193,7,0.06)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertCircle style={{ width: 18, height: 18, color: '#ffc107', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontWeight: 700, color: 'white', marginBottom: 4, fontSize: 13 }}>Upload Profile Picture to Generate ID Card</p>
          <p style={{ fontSize: 12, color: '#8FA3BF', lineHeight: 1.6 }}>Your membership card will appear here once you upload a profile photo.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && <p style={{ fontSize: 12, color: '#ff6b6b', textAlign: 'center' }}>{error}</p>}
      <div ref={cardRef} style={{ width: '100%', maxWidth: 480, aspectRatio: '1.586', margin: '0 auto', borderRadius: 16, overflow: 'hidden', position: 'relative', fontFamily: 'Arial, sans-serif', background: 'linear-gradient(135deg, #0d2137 0%, #0a1628 50%, #0d2137 100%)', border: '2px solid rgba(0,206,201,0.4)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(0,206,201,0.06)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(to right, #00CEC9, #00B894)' }} />
        <div style={{ padding: '16px 20px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #00CEC9, #00B894)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: 'white' }}>CT</span>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#00CEC9', margin: 0, letterSpacing: 1 }}>CHARITY TOKEN</p>
                <p style={{ fontSize: 8, color: 'rgba(207,250,254,0.6)', margin: 0 }}>MEMBERSHIP CARD</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 8, color: 'rgba(207,250,254,0.5)', margin: 0 }}>MEMBER ID</p>
              <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#00CEC9', fontWeight: 700, margin: 0 }}>{memberId}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <img src={profileImage} alt={fullName} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', border: '2px solid rgba(0,206,201,0.5)', flexShrink: 0 }} crossOrigin="anonymous" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 8, color: 'rgba(207,250,254,0.5)', margin: '0 0 2px', letterSpacing: 0.5 }}>FULL NAME</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'white', margin: '0 0 6px', lineHeight: 1.2 }}>{fullName || 'Beneficiary'}</p>
              <p style={{ fontSize: 8, color: 'rgba(207,250,254,0.5)', margin: '0 0 2px', letterSpacing: 0.5 }}>EMAIL</p>
              <p style={{ fontSize: 10, color: '#67e8f9', margin: '0 0 4px' }}>{email}</p>
              {country && <p style={{ fontSize: 10, color: '#8FA3BF', margin: 0 }}>📍 {country}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(0,206,201,0.2)', paddingTop: 10 }}>
            <div>
              <p style={{ fontSize: 8, color: 'rgba(207,250,254,0.5)', margin: '0 0 2px' }}>MEMBER SINCE</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'white', margin: 0 }}>{new Date(joinDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 8, color: 'rgba(207,250,254,0.5)', margin: '0 0 2px' }}>STATUS</p>
              <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 999, backgroundColor: isActivated ? 'rgba(0,184,148,0.2)' : 'rgba(255,193,7,0.2)', color: isActivated ? '#00B894' : '#ffc107', fontWeight: 700, border: `1px solid ${isActivated ? 'rgba(0,184,148,0.4)' : 'rgba(255,193,7,0.4)'}` }}>
                {isActivated ? 'ACTIVE' : 'PENDING'}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 8, color: 'rgba(207,250,254,0.5)', margin: '0 0 2px' }}>MONTHLY</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#00B894', margin: 0 }}>500 CT</p>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(to right, #00B894, #00CEC9)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button onClick={downloadCard} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          <Download style={{ width: 16, height: 16 }} />
          {loading ? 'Generating...' : 'Download ID Card'}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function BeneficiaryDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut, refreshUser } = useAuth();

  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'history'>('overview');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [uploadingPic, setUploadingPic] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  const isAdmin = user?.email?.toLowerCase() === 'dinfadashe@gmail.com';

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return; }
      setFullName(user.full_name || '');
      setCountry(user.country || '');
      setPhone(user.phone || user.phone_number || '');
      setProfilePic(user.profile_picture || '');
      loadDashboard();
    }
  }, [user, authLoading]);

  const loadDashboard = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: bal } = await supabase
        .from('beneficiary_activations')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setBalance(bal);

      const { data: txns } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('beneficiary_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setTransactions(txns || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (file.size > 2 * 1024 * 1024) { setSaveError('Image must be under 2MB'); return; }
    setUploadingPic(true);
    setSaveError('');
    try {
      const ext = file.name.split('.').pop();
      const path = `profiles/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = urlData.publicUrl + '?t=' + Date.now();
      const { error: updateError } = await supabase.from('users').update({ profile_picture: url, updated_at: new Date().toISOString() }).eq('id', user.id);
      if (updateError) throw updateError;
      setProfilePic(url);
      const stored = localStorage.getItem('auth_user');
      if (stored) localStorage.setItem('auth_user', JSON.stringify({ ...JSON.parse(stored), profile_picture: url }));
      await refreshUser();
      setSaveMsg('Profile picture updated!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to upload image');
    } finally { setUploadingPic(false); }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    setSaveError('');
    try {
      const updates = { full_name: fullName, country, phone, updated_at: new Date().toISOString() };
      const { error } = await supabase.from('users').update(updates).eq('id', user.id);
      if (error) throw error;
      const stored = localStorage.getItem('auth_user');
      if (stored) localStorage.setItem('auth_user', JSON.stringify({ ...JSON.parse(stored), ...updates }));
      await refreshUser();
      setEditing(false);
      setSaveMsg('Profile saved successfully!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save profile');
    } finally { setSaving(false); }
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(0,206,201,0.3)', borderTop: '3px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#8FA3BF', fontSize: 14 }}>Loading your dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const isActivated = balance?.payment_status === 'verified';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', color: 'white', fontFamily: 'sans-serif', position: 'relative', overflowX: 'hidden' }}>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(0,206,201,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/Charity token logo.jpg" alt="Charity Token" width={32} height={32} style={{ borderRadius: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>Charity Token</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {profilePic ? (
              <img src={profilePic} alt="Profile" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,206,201,0.4)' }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(0,206,201,0.3)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#00CEC9' }}>{(fullName || user?.email || 'U')[0].toUpperCase()}</span>
              </div>
            )}
            <span style={{ fontSize: 12, color: '#8FA3BF', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName || user?.email}</span>
            <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', color: '#8FA3BF', background: 'transparent', cursor: 'pointer' }}>
              <LogOut style={{ width: 13, height: 13 }} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px', position: 'relative', zIndex: 10 }}>

        {/* WELCOME + ADMIN BUTTON */}
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, marginBottom: 4 }}>
              Welcome, {fullName?.split(' ')[0] || 'Beneficiary'} 👋
            </h1>
            <p style={{ fontSize: 13, color: '#8FA3BF' }}>
              {isActivated ? 'Your account is active. Monthly distributions begin 2027.' : 'Activate your account to start receiving tokens.'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, background: 'linear-gradient(to right, #6C3FC8, #9B59B6)', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(108,63,200,0.4)', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              <Shield style={{ width: 15, height: 15 }} />
              Admin Panel
            </button>
          )}
        </div>

        {/* ALERTS */}
        {!isActivated && (
          <div style={{ marginBottom: 16, padding: '14px 18px', borderRadius: 14, backgroundColor: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell style={{ width: 16, height: 16, color: '#ffc107', flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#ffd54f' }}>Account not activated. Activate to receive 500 tokens monthly.</p>
            </div>
            <button onClick={() => router.push('/beneficiary/activation')} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 10, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}>
              Activate
            </button>
          </div>
        )}

        {saveMsg && (
          <div style={{ marginBottom: 14, padding: '11px 16px', borderRadius: 10, backgroundColor: 'rgba(0,184,148,0.1)', border: '1px solid rgba(0,184,148,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle style={{ width: 15, height: 15, color: '#00B894' }} />
            <p style={{ fontSize: 13, color: '#00B894' }}>{saveMsg}</p>
          </div>
        )}
        {saveError && (
          <div style={{ marginBottom: 14, padding: '11px 16px', borderRadius: 10, backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle style={{ width: 15, height: 15, color: '#ff6b6b' }} />
            <p style={{ fontSize: 13, color: '#ff6b6b' }}>{saveError}</p>
          </div>
        )}

        {/* TABS */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
          {(['overview', 'profile', 'history'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, backgroundColor: activeTab === tab ? '#0F1F35' : 'transparent', color: activeTab === tab ? '#00CEC9' : '#8FA3BF', transition: 'all 0.2s' }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Current Balance', value: balance?.current_balance?.toLocaleString() || '0', sub: 'Charity Tokens' },
                { label: 'Total Earned', value: balance?.total_earned?.toLocaleString() || '0', sub: 'All time' },
                { label: 'Monthly Reward', value: '500', sub: 'Starting 2027' },
              ].map((s) => (
                <div key={s.label} style={{ padding: '14px 10px', borderRadius: 16, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: '#8FA3BF', marginBottom: 5 }}>{s.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(to right, #00CEC9, #00B894)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: '#4A5568', marginTop: 2 }}>{s.sub}</p>
                </div>
              ))}
            </div>

            <MembershipCard userId={user?.id || ''} fullName={fullName} email={user?.email || ''} profileImage={profilePic} joinDate={user?.created_at || new Date().toISOString()} country={country} phone={phone} isActivated={isActivated} />

            {/* BECOME A PHILANTHROPIST */}
            <div onClick={() => router.push('/philanthropist/kyc')} style={{ padding: '16px 18px', borderRadius: 16, border: '1px solid rgba(0,206,201,0.3)', background: 'linear-gradient(135deg, rgba(0,206,201,0.06) 0%, rgba(0,184,148,0.06) 100%)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Award style={{ width: 22, height: 22, color: '#00CEC9' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 3 }}>Become a Philanthropist</p>
                  <p style={{ fontSize: 12, color: '#8FA3BF' }}>Help onboard beneficiaries & earn 1,000 free tokens. Submit KYC to apply.</p>
                </div>
              </div>
              <ChevronRight style={{ width: 18, height: 18, color: '#00CEC9', flexShrink: 0 }} />
            </div>

            {/* ADMIN PANEL CARD — only for admin */}
            {isAdmin && (
              <div onClick={() => router.push('/admin')} style={{ padding: '16px 18px', borderRadius: 16, border: '1px solid rgba(108,63,200,0.4)', background: 'linear-gradient(135deg, rgba(108,63,200,0.08) 0%, rgba(155,89,182,0.08) 100%)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(108,63,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Shield style={{ width: 22, height: 22, color: '#9B59B6' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 3 }}>Admin Panel</p>
                    <p style={{ fontSize: 12, color: '#8FA3BF' }}>Manage KYC, philanthropists, distributions and platform settings.</p>
                  </div>
                </div>
                <ChevronRight style={{ width: 18, height: 18, color: '#9B59B6', flexShrink: 0 }} />
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#8FA3BF', marginBottom: 14 }}>Profile Picture</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {profilePic ? (
                  <img src={profilePic} alt="Profile" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(0,206,201,0.4)' }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(0,206,201,0.3)' }}>
                    <span style={{ fontSize: 30, fontWeight: 800, color: '#00CEC9' }}>{(fullName || user?.email || 'U')[0].toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 600, fontSize: 13, cursor: uploadingPic ? 'not-allowed' : 'pointer', opacity: uploadingPic ? 0.7 : 1 }}>
                    <Camera style={{ width: 14, height: 14 }} />
                    {uploadingPic ? 'Uploading...' : 'Change Photo'}
                    <input type="file" accept="image/*" onChange={handleProfilePicChange} style={{ display: 'none' }} disabled={uploadingPic} />
                  </label>
                  <p style={{ fontSize: 11, color: '#4A5568', marginTop: 6 }}>JPG or PNG. Max 2MB.</p>
                </div>
              </div>
            </div>

            <div style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Personal Information</p>
                {!editing ? (
                  <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(0,206,201,0.3)', backgroundColor: 'transparent', color: '#67e8f9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <Edit2 style={{ width: 12, height: 12 }} /> Edit
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setEditing(false); setSaveError(''); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: '#8FA3BF', fontSize: 12, cursor: 'pointer' }}>
                      <X style={{ width: 12, height: 12 }} /> Cancel
                    </button>
                    <button onClick={handleSaveProfile} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, background: 'linear-gradient(to right, #00CEC9, #00B894)', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                      <Save style={{ width: 12, height: 12 }} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Full Name', value: fullName, setter: setFullName, placeholder: 'Enter your full name', type: 'text' },
                  { label: 'Country', value: country, setter: setCountry, placeholder: 'Enter your country', type: 'text' },
                  { label: 'Phone Number', value: phone, setter: setPhone, placeholder: 'Enter your phone number', type: 'tel' },
                ].map((field) => (
                  <div key={field.label}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8FA3BF', marginBottom: 6 }}>{field.label}</label>
                    {editing ? (
                      <input type={field.type} value={field.value} onChange={(e) => field.setter(e.target.value)} placeholder={field.placeholder} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.3)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    ) : (
                      <p style={{ fontSize: 14, color: field.value ? 'white' : '#4A5568', padding: '11px 14px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', margin: 0 }}>
                        {field.value || `No ${field.label.toLowerCase()} set`}
                      </p>
                    )}
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8FA3BF', marginBottom: 6 }}>Email Address</label>
                  <p style={{ fontSize: 14, color: '#4A5568', padding: '11px 14px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', margin: 0 }}>
                    {user?.email} <span style={{ fontSize: 11 }}>(cannot be changed)</span>
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#8FA3BF', marginBottom: 14 }}>Your Membership ID Card</p>
              <MembershipCard userId={user?.id || ''} fullName={fullName} email={user?.email || ''} profileImage={profilePic} joinDate={user?.created_at || new Date().toISOString()} country={country} phone={phone} isActivated={isActivated} />
            </div>

            <div onClick={() => router.push('/philanthropist/kyc')} style={{ padding: '16px 18px', borderRadius: 16, border: '1px solid rgba(0,206,201,0.3)', background: 'linear-gradient(135deg, rgba(0,206,201,0.06) 0%, rgba(0,184,148,0.06) 100%)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award style={{ width: 22, height: 22, color: '#00CEC9' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 3 }}>Become a Philanthropist</p>
                  <p style={{ fontSize: 12, color: '#8FA3BF' }}>Submit KYC to apply and receive 1,000 free tokens upon approval.</p>
                </div>
              </div>
              <ChevronRight style={{ width: 18, height: 18, color: '#00CEC9', flexShrink: 0 }} />
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 16 }}>Transaction History</h2>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0' }}>
                <Coins style={{ width: 36, height: 36, color: '#4A5568', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: '#8FA3BF' }}>No transactions yet.</p>
                <p style={{ fontSize: 12, color: '#4A5568', marginTop: 4 }}>Activate your account to start receiving tokens.</p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,206,201,0.2)' }}>
                    {['Type', 'Amount', 'Status', 'Date'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', paddingBottom: 10, color: '#8FA3BF', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(0,206,201,0.08)' }}>
                      <td style={{ padding: '11px 0', color: 'white', textTransform: 'capitalize' }}>{tx.transaction_type}</td>
                      <td style={{ padding: '11px 0', color: tx.amount > 0 ? '#00B894' : '#ff6b6b', fontWeight: 600 }}>{tx.amount > 0 ? '+' : ''}{tx.amount?.toLocaleString()}</td>
                      <td style={{ padding: '11px 0' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: tx.status === 'completed' ? 'rgba(0,184,148,0.15)' : 'rgba(255,193,7,0.15)', color: tx.status === 'completed' ? '#00B894' : '#ffc107' }}>
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: '11px 0', color: '#8FA3BF' }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </main>
    </div>
  );
}