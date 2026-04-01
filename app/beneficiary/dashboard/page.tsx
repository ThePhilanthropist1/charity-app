'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase-client';
import {
  CheckCircle, Coins, Users, LogOut, Edit2, Save, X,
  Camera, Shield, Bell, ChevronRight, Award
} from 'lucide-react';
import Image from 'next/image';

export default function BeneficiaryDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut, refreshUser } = useAuth();

  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'history'>('overview');

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [uploadingPic, setUploadingPic] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.push('/login'); return; }
      loadDashboard();
      // Load profile fields
      setFullName(user.full_name || '');
      setCountry((user as any).country || '');
      setPhone((user as any).phone || '');
      setProfilePic((user as any).profile_picture || '');
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploadingPic(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `profiles/${user.id}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        const url = data.publicUrl + '?t=' + Date.now();
        setProfilePic(url);
        await supabase.from('users').update({ profile_picture: url }).eq('id', user.id);
        await refreshUser();
      }
    } catch (err) { console.error(err); }
    finally { setUploadingPic(false); }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await supabase.from('users').update({
        full_name: fullName,
        country,
        phone,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      await refreshUser();
      setEditing(false);
      setSaveMsg('Profile updated successfully!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
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

      {/* BACKGROUND */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(0,206,201,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/Charity token logo.jpg" alt="Charity Token" width={34} height={34} style={{ borderRadius: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>Charity Token</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {profilePic ? (
                <img src={profilePic} alt="Profile" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,206,201,0.4)' }} />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(0,206,201,0.4)' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#00CEC9' }}>{(fullName || user?.email || 'U')[0].toUpperCase()}</span>
                </div>
              )}
              <span style={{ fontSize: 13, color: '#8FA3BF', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName || user?.email}</span>
            </div>
            <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', color: '#8FA3BF', background: 'transparent', cursor: 'pointer' }}>
              <LogOut style={{ width: 14, height: 14 }} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px', position: 'relative', zIndex: 10 }}>

        {/* WELCOME */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, marginBottom: 4 }}>
            Welcome back, {fullName?.split(' ')[0] || 'Beneficiary'} 👋
          </h1>
          <p style={{ fontSize: 13, color: '#8FA3BF' }}>
            {isActivated ? 'Your account is active. Monthly distributions begin 2027.' : 'Activate your account to start receiving tokens.'}
          </p>
        </div>

        {/* ACTIVATION BANNER */}
        {!isActivated && (
          <div style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 14, backgroundColor: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Bell style={{ width: 18, height: 18, color: '#ffc107', flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#ffd54f' }}>Your account is not yet activated. Activate to start receiving 500 tokens monthly.</p>
            </div>
            <button onClick={() => router.push('/beneficiary/activation')} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}>
              Activate Now
            </button>
          </div>
        )}

        {/* SAVE MESSAGE */}
        {saveMsg && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, backgroundColor: 'rgba(0,184,148,0.1)', border: '1px solid rgba(0,184,148,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle style={{ width: 16, height: 16, color: '#00B894' }} />
            <p style={{ fontSize: 13, color: '#00B894' }}>{saveMsg}</p>
          </div>
        )}

        {/* TABS */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
          {(['overview', 'profile', 'history'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, backgroundColor: activeTab === tab ? '#0F1F35' : 'transparent', color: activeTab === tab ? '#00CEC9' : '#8FA3BF', transition: 'all 0.2s' }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ===== OVERVIEW TAB ===== */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Current Balance', value: balance?.current_balance?.toLocaleString() || '0', sub: 'Charity Tokens' },
                { label: 'Total Earned', value: balance?.total_earned?.toLocaleString() || '0', sub: 'All time' },
                { label: 'Monthly Reward', value: '500', sub: 'Starting 2027' },
              ].map((s) => (
                <div key={s.label} style={{ padding: '16px 12px', borderRadius: 16, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: '#8FA3BF', marginBottom: 6 }}>{s.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(to right, #00CEC9, #00B894)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: '#4A5568', marginTop: 3 }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* MEMBERSHIP CARD */}
            <div style={{ padding: 20, borderRadius: 20, background: 'linear-gradient(135deg, #0F1F35 0%, #0A2A3A 100%)', border: '1px solid rgba(0,206,201,0.25)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: 'radial-gradient(circle, rgba(0,206,201,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                {profilePic ? (
                  <img src={profilePic} alt="Profile" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,206,201,0.4)' }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(0,206,201,0.4)', flexShrink: 0 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#00CEC9' }}>{(fullName || user?.email || 'U')[0].toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <p style={{ fontWeight: 800, fontSize: 17, color: 'white', marginBottom: 2 }}>{fullName || 'Beneficiary'}</p>
                  <p style={{ fontSize: 12, color: '#8FA3BF' }}>{user?.email}</p>
                  {country && <p style={{ fontSize: 12, color: '#67e8f9', marginTop: 2 }}>📍 {country}</p>}
                  {phone && <p style={{ fontSize: 12, color: '#8FA3BF', marginTop: 1 }}>📞 {phone}</p>}
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, backgroundColor: isActivated ? 'rgba(0,184,148,0.2)' : 'rgba(255,193,7,0.2)', border: `1px solid ${isActivated ? 'rgba(0,184,148,0.4)' : 'rgba(255,193,7,0.4)'}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isActivated ? '#00B894' : '#ffc107' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: isActivated ? '#00B894' : '#ffc107' }}>{isActivated ? 'Active' : 'Pending'}</span>
                  </div>
                  <p style={{ fontSize: 10, color: '#4A5568', marginTop: 4 }}>ID: {user?.id?.slice(0, 8)?.toUpperCase()}</p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid rgba(0,206,201,0.15)', paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 10, color: '#8FA3BF' }}>Member Since</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'April 2026'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 10, color: '#8FA3BF' }}>Distribution Starts</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#00CEC9' }}>2027</p>
                </div>
              </div>
            </div>

            {/* BECOME A PHILANTHROPIST */}
            <div
              onClick={() => router.push('/philanthropist/kyc')}
              style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(0,206,201,0.3)', background: 'linear-gradient(135deg, rgba(0,206,201,0.06) 0%, rgba(0,184,148,0.06) 100%)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Award style={{ width: 24, height: 24, color: '#00CEC9' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'white', marginBottom: 3 }}>Become a Philanthropist</p>
                  <p style={{ fontSize: 12, color: '#8FA3BF' }}>Help onboard beneficiaries & earn rewards. Submit KYC to apply.</p>
                </div>
              </div>
              <ChevronRight style={{ width: 20, height: 20, color: '#00CEC9', flexShrink: 0 }} />
            </div>

          </div>
        )}

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* PROFILE PICTURE */}
            <div style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#8FA3BF', marginBottom: 16 }}>Profile Picture</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {profilePic ? (
                  <img src={profilePic} alt="Profile" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(0,206,201,0.4)' }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(0,206,201,0.3)' }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: '#00CEC9' }}>{(fullName || user?.email || 'U')[0].toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    <Camera style={{ width: 15, height: 15 }} />
                    {uploadingPic ? 'Uploading...' : 'Change Photo'}
                    <input type="file" accept="image/*" onChange={handleProfilePicChange} style={{ display: 'none' }} disabled={uploadingPic} />
                  </label>
                  <p style={{ fontSize: 11, color: '#4A5568', marginTop: 6 }}>JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>
            </div>

            {/* PROFILE FIELDS */}
            <div style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Personal Information</p>
                {!editing ? (
                  <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(0,206,201,0.3)', backgroundColor: 'transparent', color: '#67e8f9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <Edit2 style={{ width: 13, height: 13 }} /> Edit
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setEditing(false)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: '#8FA3BF', fontSize: 12, cursor: 'pointer' }}>
                      <X style={{ width: 13, height: 13 }} /> Cancel
                    </button>
                    <button onClick={handleSaveProfile} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, background: 'linear-gradient(to right, #00CEC9, #00B894)', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                      <Save style={{ width: 13, height: 13 }} /> {saving ? 'Saving...' : 'Save'}
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
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        placeholder={field.placeholder}
                        style={{ width: '100%', padding: '11px 14px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.3)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <p style={{ fontSize: 14, color: field.value ? 'white' : '#4A5568', padding: '11px 14px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {field.value || `No ${field.label.toLowerCase()} set`}
                      </p>
                    )}
                  </div>
                ))}

                {/* Email (read only) */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8FA3BF', marginBottom: 6 }}>Email Address</label>
                  <p style={{ fontSize: 14, color: '#4A5568', padding: '11px 14px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {user?.email} <span style={{ fontSize: 11, color: '#4A5568' }}>(cannot be changed)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* BECOME A PHILANTHROPIST */}
            <div
              onClick={() => router.push('/philanthropist/kyc')}
              style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(0,206,201,0.3)', background: 'linear-gradient(135deg, rgba(0,206,201,0.06) 0%, rgba(0,184,148,0.06) 100%)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award style={{ width: 24, height: 24, color: '#00CEC9' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'white', marginBottom: 3 }}>Become a Philanthropist</p>
                  <p style={{ fontSize: 12, color: '#8FA3BF' }}>Submit KYC to apply and receive 1,000 free tokens upon approval.</p>
                </div>
              </div>
              <ChevronRight style={{ width: 20, height: 20, color: '#00CEC9', flexShrink: 0 }} />
            </div>

          </div>
        )}

        {/* ===== HISTORY TAB ===== */}
        {activeTab === 'history' && (
          <div style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 16 }}>Transaction History</h2>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Coins style={{ width: 40, height: 40, color: '#4A5568', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, color: '#8FA3BF' }}>No transactions yet.</p>
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
                      <td style={{ padding: '12px 0', color: 'white', textTransform: 'capitalize' }}>{tx.transaction_type}</td>
                      <td style={{ padding: '12px 0', color: tx.amount > 0 ? '#00B894' : '#ff6b6b', fontWeight: 600 }}>{tx.amount > 0 ? '+' : ''}{tx.amount?.toLocaleString()}</td>
                      <td style={{ padding: '12px 0' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: tx.status === 'completed' ? 'rgba(0,184,148,0.15)' : 'rgba(255,193,7,0.15)', color: tx.status === 'completed' ? '#00B894' : '#ffc107' }}>
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 0', color: '#8FA3BF' }}>{new Date(tx.created_at).toLocaleDateString()}</td>
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