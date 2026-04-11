'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, UserPlus, Eye, EyeOff } from 'lucide-react';

export function RegistrationForm({ defaultRole = 'beneficiary' }: { defaultRole?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreedToTerms) {
      setError('You must read and agree to the Terms of Service and community disclaimer before registering.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email,
          password,
          role: 'beneficiary',
        }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('auth_user', JSON.stringify(result.data.user));
        router.push('/beneficiary/activation');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 6 }}>Create Account</h1>
        <p style={{ fontSize: 13, color: '#8FA3BF' }}>Join the Charity Token community</p>
      </div>

      {/* IMPORTANT NOTICE */}
      <div style={{ padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(255,193,7,0.07)', border: '1px solid rgba(255,193,7,0.25)', marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: '#ffd54f', fontWeight: 700, marginBottom: 6 }}>⚠️ Important Notice</p>
        <p style={{ fontSize: 11, color: '#8FA3BF', lineHeight: 1.7, margin: 0 }}>
          This is <strong style={{ color: 'white' }}>not an investment scheme</strong> and we make <strong style={{ color: 'white' }}>no guaranteed financial returns</strong>. The $1 activation fee is a community support contribution to help fund the building of our platform. The CHARITY Token does not exist yet and will only be issued after all required licences and regulatory approvals are obtained. The value of any future tokens will depend entirely on market demand. Participate only if you believe in the mission.
        </p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, marginBottom: 16 }}>
          <AlertCircle style={{ width: 16, height: 16, color: '#ff6b6b', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#ffb3b3', margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleRegister}>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{ width: '100%', padding: '12px 16px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 6 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8FA3BF', padding: 0, display: 'flex', alignItems: 'center' }}>
              {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#8FA3BF', marginTop: 4 }}>Min 8 characters</p>
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Confirm Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8FA3BF', padding: 0, display: 'flex', alignItems: 'center' }}>
              {showConfirmPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>

        {/* TERMS CHECKBOX */}
        <div
          onClick={() => setAgreedToTerms(!agreedToTerms)}
          style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 12, backgroundColor: agreedToTerms ? 'rgba(0,184,148,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${agreedToTerms ? 'rgba(0,184,148,0.3)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', marginBottom: 20, transition: 'all 0.2s', userSelect: 'none' }}
        >
          <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${agreedToTerms ? '#00B894' : 'rgba(255,255,255,0.2)'}`, backgroundColor: agreedToTerms ? '#00B894' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.2s' }}>
            {agreedToTerms && <span style={{ color: 'white', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
          </div>
          <p style={{ fontSize: 12, color: '#8FA3BF', lineHeight: 1.7, margin: 0 }}>
            I have read and agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: '#67e8f9', textDecoration: 'underline' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: '#67e8f9', textDecoration: 'underline' }}>Privacy Policy</a>.
            {' '}I understand that the $1 activation fee is a <strong style={{ color: 'white' }}>community support contribution</strong>, not an investment. I acknowledge that the CHARITY Token does not currently exist, that no returns are guaranteed, and that any future token value depends on market demand. I am joining this community because I believe in the mission.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !agreedToTerms}
          style={{ width: '100%', padding: '14px', borderRadius: 12, background: (!agreedToTerms || loading) ? 'rgba(0,206,201,0.2)' : 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: (!agreedToTerms || loading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: agreedToTerms ? '0 8px 24px rgba(0,206,201,0.25)' : 'none', opacity: loading ? 0.7 : 1, transition: 'all 0.2s' }}
        >
          <UserPlus style={{ width: 18, height: 18 }} />
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

      </form>

      {/* Sign in link */}
      <div style={{ borderTop: '1px solid rgba(0,206,201,0.15)', marginTop: 24, paddingTop: 18, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#8FA3BF' }}>
          Already have an account?{' '}
          <button onClick={() => router.push('/login')} style={{ color: '#67e8f9', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            Sign in
          </button>
        </p>
      </div>

    </div>
  );
}