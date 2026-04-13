'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [error, setError] = useState('');
  const token = params.get('token');

  useEffect(() => {
    if (!token) { setStatus('error'); setError('Invalid reset link. Please request a new one.'); }
  }, [token]);

  const handleSubmit = async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', token, newPassword: password }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(data.error || 'Reset failed. Please try again.');
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ backgroundColor: '#0F1F35', border: '1px solid rgba(0,206,201,0.2)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ height: 5, background: 'linear-gradient(to right, #00CEC9, #00B894)' }} />
          <div style={{ padding: 36 }}>
            {status === 'form' && (
              <>
                <div style={{ marginBottom: 28, textAlign: 'center' }}>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 8 }}>Set New Password</h1>
                  <p style={{ fontSize: 13, color: '#8FA3BF' }}>Choose a strong password for your account.</p>
                </div>
                {(['New Password', 'Confirm Password'] as const).map((label, i) => (
                  <div key={label} style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8FA3BF', marginBottom: 6 }}>{label}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={i === 0 ? password : confirm}
                        onChange={e => i === 0 ? setPassword(e.target.value) : setConfirm(e.target.value)}
                        placeholder={i === 0 ? 'Minimum 8 characters' : 'Repeat your password'}
                        style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: 10, backgroundColor: '#0A1628', border: `1px solid ${error ? 'rgba(255,107,107,0.4)' : 'rgba(0,206,201,0.2)'}`, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                      />
                      {i === 0 && (
                        <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8FA3BF', cursor: 'pointer', padding: 0 }}>
                          {showPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {error && <p style={{ fontSize: 12, color: '#ff6b6b', marginBottom: 14 }}>{error}</p>}
                <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 12, background: loading ? 'rgba(0,206,201,0.3)' : 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </>
            )}
            {status === 'success' && (
              <div style={{ textAlign: 'center' }}>
                <CheckCircle style={{ width: 56, height: 56, color: '#00B894', margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 12 }}>Password Reset!</h2>
                <p style={{ fontSize: 14, color: '#8FA3BF' }}>Your password has been updated. Redirecting to login...</p>
              </div>
            )}
            {status === 'error' && (
              <div style={{ textAlign: 'center' }}>
                <XCircle style={{ width: 56, height: 56, color: '#ff6b6b', margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 12 }}>Invalid Link</h2>
                <p style={{ fontSize: 14, color: '#8FA3BF', marginBottom: 24 }}>{error}</p>
                <button onClick={() => router.push('/forgot-password')} style={{ padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                  Request New Link
                </button>
              </div>
            )}
          </div>
          <div style={{ height: 4, background: 'linear-gradient(to right, #00B894, #00CEC9)' }} />
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(0,206,201,0.3)', borderTop: '3px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}