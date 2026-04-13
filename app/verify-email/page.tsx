'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); setMessage('Invalid verification link.'); return; }

    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify_email', token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setMessage('Your email has been confirmed! Redirecting to your dashboard...');
          setTimeout(() => router.push('/beneficiary-dashboard'), 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. Please try again.');
        }
      })
      .catch(() => { setStatus('error'); setMessage('Something went wrong. Please try again.'); });
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420, backgroundColor: '#0F1F35', border: '1px solid rgba(0,206,201,0.2)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ height: 5, background: 'linear-gradient(to right, #00CEC9, #00B894)' }} />
        <div style={{ padding: 40, textAlign: 'center' }}>
          {status === 'loading' && (
            <>
              <Loader style={{ width: 48, height: 48, color: '#00CEC9', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 8 }}>Verifying your email...</h2>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle style={{ width: 56, height: 56, color: '#00B894', margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 12 }}>Email Confirmed!</h2>
              <p style={{ fontSize: 14, color: '#8FA3BF', lineHeight: 1.6 }}>{message}</p>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle style={{ width: 56, height: 56, color: '#ff6b6b', margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 12 }}>Verification Failed</h2>
              <p style={{ fontSize: 14, color: '#8FA3BF', lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
              <button onClick={() => router.push('/login')} style={{ padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                Back to Login
              </button>
            </>
          )}
        </div>
        <div style={{ height: 4, background: 'linear-gradient(to right, #00B894, #00CEC9)' }} />
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(0,206,201,0.3)', borderTop: '3px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}