'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, FileText } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      console.log('Logging in:', email);
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', color: 'white', position: 'relative', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* DECORATIVE BACKGROUND */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(0,206,201,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(0,184,148,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* LOGO */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -10, background: 'rgba(0,206,201,0.15)', filter: 'blur(16px)', borderRadius: '50%' }} />
              <Image
                src="/Charity token logo.jpg"
                alt="Charity Token"
                width={48}
                height={48}
                style={{ borderRadius: 12, position: 'relative', zIndex: 1 }}
              />
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

              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Forgot Password */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <button type="button" style={{ fontSize: 12, color: '#67e8f9', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0,206,201,0.25)', opacity: loading ? 0.7 : 1 }}
              >
                <LogIn style={{ width: 16, height: 16 }} />
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

            </form>

            {/* Register link */}
            <p style={{ textAlign: 'center', fontSize: 13, color: '#8FA3BF', marginTop: 20 }}>
              Don&apos;t have an account?{' '}
              <button onClick={() => router.push('/register')} style={{ color: '#67e8f9', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                Create one now
              </button>
            </p>

          </div>

          {/* WHITEPAPER LINK */}
          <a
            href="/whitepaper.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, color: '#67e8f9', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}
          >
            <FileText style={{ width: 14, height: 14 }} />
            Read our Whitepaper
          </a>

          {/* BACK TO HOME */}
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#8FA3BF' }}>
            <a href="/" style={{ color: '#67e8f9', textDecoration: 'none', fontWeight: 600 }}>← Back to Home</a>
          </p>

        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#4A5568' }}>© 2026 Charity Token Project. All rights reserved.</p>
      </footer>

    </div>
  );
}