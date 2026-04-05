'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, FileText, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const result = await response.json();
      if (result.success) {
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('auth_user', JSON.stringify(result.data.user));
        // Hard redirect forces a full page reload so the auth context
        // hydrates from localStorage BEFORE the dashboard mounts.
        // This is what prevents the redirect loop — router.push() was
        // navigating before the auth context had read the new session.
        window.location.href = '/beneficiary-dashboard';
      } else {
        setError(result.error || 'Invalid email or password');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div suppressHydrationWarning style={{ minHeight: '100vh', backgroundColor: '#0A1628', color: 'white', position: 'relative', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(0,206,201,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(0,184,148,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* LOGO */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -10, background: 'rgba(0,206,201,0.15)', filter: 'blur(16px)', borderRadius: '50%' }} />
              <Image src="/Charity token logo.jpg" alt="Charity Token" width={48} height={48} style={{ borderRadius: 12, position: 'relative', zIndex: 1 }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(to right, #00CEC9, #00B894)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Charity Token
            </h1>
          </div>

          {/* CARD */}
          <div style={{ backgroundColor: '#0F1F35', border: '1px solid rgba(0,206,201,0.2)', borderRadius: 20, padding: '32px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: 6 }}>Welcome Back</h2>
            <p style={{ fontSize: 13, color: '#8FA3BF', textAlign: 'center', marginBottom: 24 }}>Sign in to your Charity Token account</p>

            {error && (
              <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', fontSize: 13, textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Email Address</label>
                <input
                  suppressHydrationWarning
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    suppressHydrationWarning
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px 48px 12px 16px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8FA3BF', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    {showPassword
                      ? <EyeOff style={{ width: 18, height: 18 }} />
                      : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <button type="button" style={{ fontSize: 12, color: '#67e8f9', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0,206,201,0.25)', opacity: loading ? 0.7 : 1 }}
              >
                <LogIn style={{ width: 16, height: 16 }} />
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#8FA3BF', marginTop: 20 }}>
              Don&apos;t have an account?{' '}
              <button onClick={() => router.push('/register')} style={{ color: '#67e8f9', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                Create one now
              </button>
            </p>
          </div>

          <a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, color: '#67e8f9', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
            <FileText style={{ width: 14, height: 14 }} />
            Read our Whitepaper
          </a>

          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#8FA3BF' }}>
            <a href="/" style={{ color: '#67e8f9', textDecoration: 'none', fontWeight: 600 }}>← Back to Home</a>
          </p>
        </div>
      </main>

      <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#4A5568' }}>© 2026 Charity Token Project. All rights reserved.</p>
      </footer>
    </div>
  );
}