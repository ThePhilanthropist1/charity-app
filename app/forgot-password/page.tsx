'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot_password', email }),
      });
      const data = await res.json();
      if (data.success) setSent(true);
      else setError(data.error || 'Something went wrong.');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ backgroundColor: '#0F1F35', border: '1px solid rgba(0,206,201,0.2)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ height: 5, background: 'linear-gradient(to right, #00CEC9, #00B894)' }} />
          <div style={{ padding: 36 }}>
            {!sent ? (
              <>
                <div style={{ marginBottom: 28, textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(0,206,201,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Mail style={{ width: 26, height: 26, color: '#00CEC9' }} />
                  </div>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 8 }}>Forgot Password?</h1>
                  <p style={{ fontSize: 13, color: '#8FA3BF' }}>Enter your email and we will send you a reset link.</p>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8FA3BF', marginBottom: 6 }}>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="your@email.com"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#0A1628', border: `1px solid ${error ? 'rgba(255,107,107,0.4)' : 'rgba(0,206,201,0.2)'}`, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                  {error && <p style={{ fontSize: 12, color: '#ff6b6b', marginTop: 6 }}>{error}</p>}
                </div>
                <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 12, background: loading ? 'rgba(0,206,201,0.3)' : 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 16 }}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <div style={{ textAlign: 'center' }}>
                  <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8FA3BF', textDecoration: 'none' }}>
                    <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center' }}>
                  <CheckCircle style={{ width: 56, height: 56, color: '#00B894', margin: '0 auto 16px' }} />
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 12 }}>Check Your Email</h2>
                  <p style={{ fontSize: 14, color: '#8FA3BF', lineHeight: 1.7, marginBottom: 28 }}>
                    If an account exists for <strong style={{ color: 'white' }}>{email}</strong>, a password reset link has been sent. Check your inbox and spam folder.
                  </p>
                  <button onClick={() => router.push('/login')} style={{ padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                    Back to Login
                  </button>
                </div>
              </>
            )}
          </div>
          <div style={{ height: 4, background: 'linear-gradient(to right, #00B894, #00CEC9)' }} />
        </div>
      </div>
    </div>
  );
}