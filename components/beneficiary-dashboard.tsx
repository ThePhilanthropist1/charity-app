'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Coins, Copy, CreditCard, Users, Info, TrendingUp, Clock, Zap, ExternalLink, Send, MessageCircle } from 'lucide-react';
import { useTokenDistributions, useAuth } from '@/hooks/use-charity-api';
import { ProfileUpload } from './profile-upload';
import { MembershipCard } from './membership-card';

export function BeneficiaryActivationFlow() {
  const { user } = useAuth();
  const [method, setMethod] = useState<'wallet' | 'philanthropist' | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [copied, setCopied] = useState(false);

  const walletAddress = '0x5d5A2B49c3F7AE576D93D3d636b37029b68E7e3e';

  const selectMethod = (id: 'wallet' | 'philanthropist') => {
    setError('');
    setTransactionHash('');
    setMethod(method === id ? null : id);
  };

  const copyWallet = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWalletTransfer = async () => {
    if (!transactionHash.trim()) { setError('Please enter your transaction hash'); return; }
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ action: 'wallet_transfer', activation_method: 'wallet_transfer', transaction_hash: transactionHash }),
      });
      const result = await response.json();
      if (result.success) setSuccess(true);
      else setError(result.error || 'Verification failed. Please check your transaction hash and try again.');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 32px', backgroundColor: '#0F1F35', border: '1px solid rgba(0,184,148,0.3)', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(0,184,148,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid rgba(0,184,148,0.3)' }}>
          <CheckCircle style={{ width: 44, height: 44, color: '#00B894' }} />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 12 }}>Account Activated!</h2>
        <p style={{ fontSize: 14, color: '#8FA3BF', lineHeight: 1.8, marginBottom: 28 }}>
          Your account has been successfully activated.<br />
          You will receive 500 Charity Tokens monthly for 10 years.
        </p>
        <button onClick={() => window.location.href = '/beneficiary-dashboard'} style={{ padding: '14px 36px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,206,201,0.3)' }}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 12 }}>
          <AlertCircle style={{ width: 16, height: 16, color: '#ff6b6b', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#ffb3b3', margin: 0, flex: 1 }}>{error}</p>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            <CheckCircle style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}

      {/* PI NETWORK — COMING SOON */}
      <div style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(0,206,201,0.1)', backgroundColor: 'rgba(255,255,255,0.01)', opacity: 0.7, cursor: 'not-allowed', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, padding: '3px 10px', borderRadius: 999, backgroundColor: 'rgba(255,193,7,0.15)', color: '#ffc107', fontWeight: 700, border: '1px solid rgba(255,193,7,0.3)', letterSpacing: 0.5 }}>
          COMING SOON
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(0,206,201,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Coins style={{ width: 26, height: 26, color: '#8FA3BF' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#8FA3BF' }}>Pi Network</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#4A5568' }}>Pi</span>
            </div>
            <p style={{ fontSize: 12, color: '#4A5568', margin: 0, lineHeight: 1.5 }}>
              Pi payment is temporarily unavailable. We are building a dynamic pricing system that will charge exactly based on the Pi value at the time of activation.
            </p>
          </div>
        </div>
      </div>

      {/* WALLET TRANSFER */}
      <div
        onClick={() => selectMethod('wallet')}
        style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid ' + (method === 'wallet' ? 'rgba(0,206,201,0.5)' : 'rgba(0,206,201,0.15)'), backgroundColor: method === 'wallet' ? 'rgba(0,206,201,0.04)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: method === 'wallet' ? '0 0 24px rgba(0,206,201,0.08)' : 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: method === 'wallet' ? 16 : 0 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(0,184,148,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CreditCard style={{ width: 26, height: 26, color: '#00B894' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>Wallet Transfer</span>
              <span style={{ fontSize: 17, fontWeight: 800, background: 'linear-gradient(to right, #00CEC9, #00B894)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>1 USDT</span>
            </div>
            <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>Send USDT (BEP20) to our wallet and verify</p>
          </div>
        </div>
        {method === 'wallet' && (
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0, fontWeight: 600 }}>Send exactly 1 USDT (BEP20) to:</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#0A1628', borderRadius: 10, border: '1px solid rgba(0,206,201,0.2)' }}>
              <code style={{ fontSize: 12, color: '#67e8f9', flex: 1, wordBreak: 'break-all' }}>{walletAddress}</code>
              <button onClick={copyWallet} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#00B894' : '#67e8f9', flexShrink: 0, padding: 0 }}>
                {copied ? <CheckCircle style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
              </button>
            </div>
            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(255,193,7,0.05)', borderRadius: 10, border: '1px solid rgba(255,193,7,0.15)' }}>
              <p style={{ fontSize: 12, color: '#ffc107', margin: 0, lineHeight: 1.6 }}>⚠️ Only send on <strong>BNB Smart Chain (BEP20)</strong>. Sending on other networks will result in loss of funds.</p>
            </div>
            <input
              placeholder="Paste transaction hash here"
              value={transactionHash}
              onChange={(e) => setTransactionHash(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
            <button onClick={handleWalletTransfer} disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verifying...' : 'Verify Payment'}
            </button>
          </div>
        )}
      </div>

      {/* VIA PHILANTHROPIST */}
      <div
        onClick={() => selectMethod('philanthropist')}
        style={{ padding: '18px 20px', borderRadius: 16, border: '1px solid ' + (method === 'philanthropist' ? 'rgba(0,206,201,0.5)' : 'rgba(0,206,201,0.15)'), backgroundColor: method === 'philanthropist' ? 'rgba(0,206,201,0.04)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: method === 'philanthropist' ? '0 0 24px rgba(0,206,201,0.08)' : 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: method === 'philanthropist' ? 16 : 0 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(103,232,249,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users style={{ width: 26, height: 26, color: '#67e8f9' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>Via Philanthropist</span>
              <span style={{ fontSize: 17, fontWeight: 800, background: 'linear-gradient(to right, #00CEC9, #00B894)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>~$1 Fiat</span>
            </div>
            <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>Pay a regional philanthropist in your local currency</p>
          </div>
        </div>
        {method === 'philanthropist' && (
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { num: 1, color: 'linear-gradient(to right, #00CEC9, #00B894)', title: 'Find a Philanthropist in Your Region', body: 'Join our Telegram group to find a verified philanthropist near you.', extra: <a href="https://t.me/CharityTokenProject1" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, backgroundColor: 'rgba(0,136,204,0.15)', border: '1px solid rgba(0,136,204,0.3)', color: '#67e8f9', fontSize: 12, fontWeight: 600, textDecoration: 'none', marginTop: 10 }}><Send style={{ width: 13, height: 13 }} /> Open Telegram Group <ExternalLink style={{ width: 11, height: 11 }} /></a>, bg: 'rgba(0,206,201,0.04)', border: 'rgba(0,206,201,0.12)' },
                { num: 2, color: 'linear-gradient(to right, #00B894, #00CEC9)', title: 'Send $1 Equivalent in Your Local Currency', body: 'Pay using any local fiat method they accept. Methods listed on Telegram.', bg: 'rgba(0,184,148,0.04)', border: 'rgba(0,184,148,0.12)' },
                { num: 3, color: 'linear-gradient(to right, #67e8f9, #00CEC9)', numColor: '#0A1628', title: 'Message the Philanthropist on Telegram', body: 'Send your payment receipt and registered email. Activation within 24 hours.', bg: 'rgba(103,232,249,0.04)', border: 'rgba(103,232,249,0.12)' },
                { num: 4, color: 'linear-gradient(to right, #ffc107, #ff9800)', title: 'Wait for Activation Confirmation', body: 'Log out and back in once activated. Philanthropists must process within 24 hours.', bg: 'rgba(255,193,7,0.04)', border: 'rgba(255,193,7,0.12)' },
              ].map((step) => (
                <div key={step.num} style={{ display: 'flex', gap: 12, padding: '14px 16px', backgroundColor: step.bg, borderRadius: 12, border: `1px solid ${step.border}`, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color: (step as any).numColor || 'white' }}>{step.num}</div>
                  <div>
                    <p style={{ fontSize: 13, color: 'white', fontWeight: 600, margin: '0 0 4px' }}>{step.title}</p>
                    <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0, lineHeight: 1.6 }}>{step.body}</p>
                    {(step as any).extra}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(0,206,201,0.06)', borderRadius: 10, border: '1px solid rgba(0,206,201,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <MessageCircle style={{ width: 15, height: 15, color: '#00CEC9', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0, lineHeight: 1.6 }}>
                Your email: <strong style={{ color: '#67e8f9' }}>{user?.email || 'your email'}</strong> — include this in your Telegram message.
              </p>
            </div>
            <a href="https://t.me/CharityTokenProject1" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', borderRadius: 12, background: 'linear-gradient(to right, #0088cc, #00CEC9)', color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxSizing: 'border-box' }}>
              <Send style={{ width: 16, height: 16 }} /> Go to Telegram Group <ExternalLink style={{ width: 14, height: 14 }} />
            </a>
          </div>
        )}
      </div>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Received', value: totalTokens.toLocaleString(), sub: 'Charity Tokens', icon: <TrendingUp style={{ width: 18, height: 18, color: '#00CEC9' }} />, color: '#00CEC9' },
          { label: 'Pending', value: pendingTokens.toLocaleString(), sub: 'Tokens queued', icon: <Clock style={{ width: 18, height: 18, color: '#ffc107' }} />, color: '#ffc107' },
          { label: 'Monthly Benefit', value: '500', sub: 'CT per month', icon: <Zap style={{ width: 18, height: 18, color: '#00B894' }} />, color: '#00B894' },
        ].map((s) => (
          <div key={s.label} style={{ padding: '20px 18px', borderRadius: 18, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,206,201,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            <p style={{ fontSize: 11, color: '#8FA3BF', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: '0 0 4px', lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#8FA3BF', margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ padding: '20px', borderRadius: 18, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 16, backgroundColor: '#00CEC9', borderRadius: 2, display: 'inline-block' }} />Profile Picture
            </p>
            <ProfileUpload onProfileUpdate={(_, base64) => setProfileImage(base64)} currentImage={profileImage} />
          </div>
          <div style={{ padding: '20px', borderRadius: 18, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 16, backgroundColor: '#00B894', borderRadius: 2, display: 'inline-block' }} />Membership ID Card
            </p>
            <MembershipCard userId={user?.id || ''} fullName={user?.full_name || user?.username || 'Member'} email={user?.email || ''} profileImage={profileImage} joinDate={user?.created_at || new Date().toISOString()} />
          </div>
        </div>
        <div style={{ padding: '24px', borderRadius: 18, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 16, backgroundColor: '#67e8f9', borderRadius: 2, display: 'inline-block' }} />Distribution History
            </p>
            <span style={{ fontSize: 11, color: '#8FA3BF', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(0,206,201,0.2)' }}>{completedCount} completed</span>
          </div>
          {distributions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <TrendingUp style={{ width: 28, height: 28, color: '#00CEC9' }} />
              </div>
              <p style={{ color: 'white', fontWeight: 600, marginBottom: 8 }}>No distributions yet</p>
              <p style={{ fontSize: 13, color: '#8FA3BF', lineHeight: 1.6 }}>Token distributions begin in 2027.</p>
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