'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Coins, Copy, CreditCard, Users, Info, TrendingUp, Clock, Zap } from 'lucide-react';
import { useTokenDistributions, useAuth } from '@/hooks/use-charity-api';
import { ProfileUpload } from './profile-upload';
import { MembershipCard } from './membership-card';

export function BeneficiaryActivationFlow() {
  const { user } = useAuth();
  const [method, setMethod] = useState<'pi' | 'wallet' | 'philanthropist' | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [philanthropistUsername, setPhilanthropistUsername] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPiBrowser, setIsPiBrowser] = useState(false);

 const walletAddress = '0x5d5A2B49c3F7AE576D93D3d636b37029b68E7e3e';

  useEffect(() => {
    const ua = navigator.userAgent || '';
    setIsPiBrowser(ua.includes('PiBrowser') || ua.includes('Pi Network'));
  }, []);

  const copyWallet = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePiPayment = async () => {
    if (!isPiBrowser) return;
    setLoading(true);
    setError('');
    try {
      const Pi = (window as any).Pi;
      if (!Pi) throw new Error('Pi SDK not available.');
      await Pi.createPayment(
        { amount: 6.0, memo: 'Charity Token Account Activation', metadata: { purpose: 'activation', userId: user?.id } },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            const token = localStorage.getItem('auth_token');
            await fetch('/api/activation', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ action: 'approve_pi', payment_id: paymentId }) });
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/activation', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ action: 'pi_payment', activation_method: 'pi_payment', payment_id: paymentId, txid, amount_pi: 6.0 }) });
            const result = await response.json();
            if (result.success) setSuccess(true);
            else setError(result.error || 'Payment failed');
            setLoading(false);
          },
          onCancel: () => { setError('Payment was cancelled.'); setLoading(false); },
          onError: (err: any) => { setError(err?.message || 'Payment failed.'); setLoading(false); },
        }
      );
    } catch (err: any) {
      setError(err?.message || 'Payment failed.');
      setLoading(false);
    }
  };

  const handleWalletTransfer = async () => {
    if (!transactionHash.trim()) { setError('Please enter transaction hash'); return; }
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/activation', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ action: 'wallet_transfer', activation_method: 'wallet_transfer', transaction_hash: transactionHash }) });
      const result = await response.json();
      if (result.success) setSuccess(true);
      else setError(result.error || 'Verification failed');
    } finally { setLoading(false); }
  };

  const handlePhilanthropistActivation = async () => {
    if (!philanthropistUsername.trim()) { setError('Please enter philanthropist username'); return; }
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/activation', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ action: 'philanthropist', activation_method: 'philanthropist', philanthropist_username: philanthropistUsername }) });
      const result = await response.json();
      if (result.success) setSuccess(true);
      else setError(result.error || 'Activation failed');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 32px', backgroundColor: '#0F1F35', border: '1px solid rgba(0,184,148,0.3)', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(0,184,148,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid rgba(0,184,148,0.3)' }}>
          <CheckCircle style={{ width: 44, height: 44, color: '#00B894' }} />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 12 }}>Account Activated!</h2>
        <p style={{ fontSize: 14, color: '#8FA3BF', lineHeight: 1.8, marginBottom: 28 }}>Your account has been successfully activated.<br />You will receive 500 Charity Tokens monthly for 10 years.</p>
        <button onClick={() => window.location.href = '/beneficiary/dashboard'} style={{ padding: '14px 36px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,206,201,0.3)' }}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  const methods = [
    { id: 'pi', icon: <Coins style={{ width: 26, height: 26, color: '#00CEC9' }} />, bg: 'rgba(0,206,201,0.12)', title: 'Pi Network', amount: '6.0 Pi', desc: 'Pay with Pi - requires Pi Browser app' },
    { id: 'wallet', icon: <CreditCard style={{ width: 26, height: 26, color: '#00B894' }} />, bg: 'rgba(0,184,148,0.12)', title: 'Wallet Transfer', amount: '1 USDT', desc: 'Send USDT to our wallet and verify' },
    { id: 'philanthropist', icon: <Users style={{ width: 26, height: 26, color: '#67e8f9' }} />, bg: 'rgba(103,232,249,0.12)', title: 'Via Philanthropist', amount: '1 USDT', desc: 'Contact a regional philanthropist on Telegram' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 12 }}>
          <AlertCircle style={{ width: 16, height: 16, color: '#ff6b6b', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#ffb3b3', margin: 0 }}>{error}</p>
        </div>
      )}

      {methods.map((m) => (
        <div key={m.id} onClick={() => setMethod(method === m.id as any ? null : m.id as any)}
          style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid ' + (method === m.id ? 'rgba(0,206,201,0.5)' : 'rgba(0,206,201,0.15)'), backgroundColor: method === m.id ? 'rgba(0,206,201,0.04)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: method === m.id ? '0 0 24px rgba(0,206,201,0.08)' : 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: method === m.id ? 16 : 0 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {m.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>{m.title}</span>
                  {m.id === 'pi' && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, backgroundColor: isPiBrowser ? 'rgba(0,184,148,0.2)' : 'rgba(255,193,7,0.15)', color: isPiBrowser ? '#00B894' : '#ffc107', fontWeight: 600, border: '1px solid ' + (isPiBrowser ? 'rgba(0,184,148,0.3)' : 'rgba(255,193,7,0.3)') }}>
                      {isPiBrowser ? 'Ready' : 'Pi Browser Only'}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 17, fontWeight: 800, background: 'linear-gradient(to right, #00CEC9, #00B894)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{m.amount}</span>
              </div>
              <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>{m.desc}</p>
            </div>
          </div>

          {method === 'pi' && m.id === 'pi' && (
            <div onClick={(e) => e.stopPropagation()}>
              {!isPiBrowser ? (
                <div style={{ display: 'flex', gap: 10, padding: '14px 16px', backgroundColor: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.25)', borderRadius: 12 }}>
                  <Info style={{ width: 16, height: 16, color: '#ffc107', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 13, color: '#ffd54f', fontWeight: 600, margin: '0 0 4px' }}>Pi Browser Required</p>
                    <p style={{ fontSize: 12, color: '#8FA3BF', lineHeight: 1.6, margin: 0 }}>Open this website in your Pi Browser app to pay with Pi. Use Wallet Transfer or Via Philanthropist from any browser.</p>
                  </div>
                </div>
              ) : (
                <button onClick={handlePiPayment} disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Processing...' : 'Pay 6.0 Pi'}
                </button>
              )}
            </div>
          )}

          {method === 'wallet' && m.id === 'wallet' && (
            <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0, fontWeight: 600 }}>Send exactly 1 USDT to:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#0A1628', borderRadius: 10, border: '1px solid rgba(0,206,201,0.2)' }}>
                <code style={{ fontSize: 12, color: '#67e8f9', flex: 1, wordBreak: 'break-all' }}>{walletAddress}</code>
                <button onClick={copyWallet} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#00B894' : '#67e8f9', flexShrink: 0, padding: 0 }}>
                  {copied ? <CheckCircle style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
                </button>
              </div>
              <input placeholder="Paste transaction hash here" value={transactionHash} onChange={(e) => setTransactionHash(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              <button onClick={handleWalletTransfer} disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Verifying...' : 'Verify Payment'}
              </button>
            </div>
          )}

          {method === 'philanthropist' && m.id === 'philanthropist' && (
            <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(0,206,201,0.04)', borderRadius: 10, border: '1px solid rgba(0,206,201,0.12)' }}>
                <p style={{ fontSize: 12, color: '#8FA3BF', lineHeight: 1.7, margin: 0 }}>Find your regional philanthropist on our <a href="https://t.me/CharityTokenProject" target="_blank" rel="noopener noreferrer" style={{ color: '#67e8f9', fontWeight: 600 }}>Telegram channel</a>, pay them 1 USDT, then enter their username below.</p>
              </div>
              <input placeholder="Enter philanthropist username" value={philanthropistUsername} onChange={(e) => setPhilanthropistUsername(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              <button onClick={handlePhilanthropistActivation} disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Processing...' : 'Submit'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function BeneficiaryDashboard() {
  const { user } = useAuth();
  const { distributions } = useTokenDistributions(user?.id);
  const [profileImage, setProfileImage] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const totalTokens = distributions.reduce((sum, dist) => sum + dist.amount_tokens, 0);
  const pendingTokens = distributions.filter((d) => d.distribution_status === 'pending').reduce((sum, dist) => sum + dist.amount_tokens, 0);
  const completedCount = distributions.filter((d) => d.distribution_status === 'completed').length;

  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Beneficiary Portal</p>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: 'white', margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: '#8FA3BF', marginTop: 6 }}>Welcome back, <span style={{ color: '#00CEC9', fontWeight: 600 }}>{user?.full_name || user?.username || ''}</span></p>
        </div>
        <div style={{ padding: '8px 16px', borderRadius: 999, border: '1px solid rgba(0,184,148,0.3)', backgroundColor: 'rgba(0,184,148,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00B894' }} />
          <span style={{ fontSize: 12, color: '#00B894', fontWeight: 600 }}>Active Member</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Received', value: totalTokens.toLocaleString(), sub: 'Charity Tokens', icon: <TrendingUp style={{ width: 18, height: 18, color: '#00CEC9' }} />, color: '#00CEC9' },
          { label: 'Pending', value: pendingTokens.toLocaleString(), sub: 'Tokens queued', icon: <Clock style={{ width: 18, height: 18, color: '#ffc107' }} />, color: '#ffc107' },
          { label: 'Monthly Benefit', value: '500', sub: 'CT per month', icon: <Zap style={{ width: 18, height: 18, color: '#00B894' }} />, color: '#00B894' },
        ].map((s) => (
          <div key={s.label} style={{ padding: '20px 18px', borderRadius: 18, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,206,201,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.icon}
            </div>
            <p style={{ fontSize: 11, color: '#8FA3BF', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: '0 0 4px', lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#8FA3BF', margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>

        {/* Left: Profile + ID Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ padding: '20px', borderRadius: 18, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 16, backgroundColor: '#00CEC9', borderRadius: 2, display: 'inline-block' }} />
              Profile Picture
            </p>
            <ProfileUpload onProfileUpdate={(_, base64) => setProfileImage(base64)} currentImage={profileImage} />
          </div>

          <div style={{ padding: '20px', borderRadius: 18, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 16, backgroundColor: '#00B894', borderRadius: 2, display: 'inline-block' }} />
              Membership ID Card
            </p>
            <MembershipCard userId={user?.id || ''} fullName={user?.full_name || user?.username || 'Member'} email={user?.email || ''} profileImage={profileImage} joinDate={user?.created_at || new Date().toISOString()} />
          </div>
        </div>

        {/* Right: Distribution History */}
        <div style={{ padding: '24px', borderRadius: 18, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 16, backgroundColor: '#67e8f9', borderRadius: 2, display: 'inline-block' }} />
              Distribution History
            </p>
            <span style={{ fontSize: 11, color: '#8FA3BF', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(0,206,201,0.2)' }}>
              {completedCount} completed
            </span>
          </div>

          {distributions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <TrendingUp style={{ width: 28, height: 28, color: '#00CEC9' }} />
              </div>
              <p style={{ color: 'white', fontWeight: 600, marginBottom: 8 }}>No distributions yet</p>
              <p style={{ fontSize: 13, color: '#8FA3BF', lineHeight: 1.6 }}>Activate your account to start receiving 500 CT monthly.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,206,201,0.15)' }}>
                    {['Month', 'Amount', 'Status'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', paddingBottom: 12, color: '#8FA3BF', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((dist) => (
                    <tr key={dist.id} style={{ borderBottom: '1px solid rgba(0,206,201,0.06)' }}>
                      <td style={{ padding: '14px 0', color: 'white', fontWeight: 500 }}>{dist.month_year}</td>
                      <td style={{ padding: '14px 0', color: '#00B894', fontWeight: 700 }}>{dist.amount_tokens.toLocaleString()} CT</td>
                      <td style={{ padding: '14px 0' }}>
                        <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: dist.distribution_status === 'completed' ? 'rgba(0,184,148,0.15)' : dist.distribution_status === 'failed' ? 'rgba(255,107,107,0.15)' : 'rgba(255,193,7,0.15)', color: dist.distribution_status === 'completed' ? '#00B894' : dist.distribution_status === 'failed' ? '#ff6b6b' : '#ffc107', border: '1px solid ' + (dist.distribution_status === 'completed' ? 'rgba(0,184,148,0.3)' : dist.distribution_status === 'failed' ? 'rgba(255,107,107,0.3)' : 'rgba(255,193,7,0.3)') }}>
                          {dist.distribution_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
