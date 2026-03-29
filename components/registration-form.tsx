'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, UserPlus } from 'lucide-react';

export function RegistrationForm({ defaultRole = 'beneficiary' }: { defaultRole?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
          role,
        }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('auth_user', JSON.stringify(result.data.user));

        // Redirect to appropriate dashboard or setup page
        if (role === 'philanthropist') {
          router.push('/philanthropist/kyc');
        } else {
          router.push('/beneficiary/activation');
        }
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
    <div className="charity-glow-card p-8 space-y-6 max-w-md mx-auto">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
        <p className="text-muted-foreground">Join the Charity Token community</p>
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-3 text-foreground">I am a:</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('beneficiary')}
              className={`p-3 rounded-lg border-2 transition text-center ${
                role === 'beneficiary'
                  ? 'border-cyan-400 bg-cyan-500/10 text-foreground'
                  : 'border-cyan-500/30 bg-card/50 text-muted-foreground hover:border-cyan-400/50'
              }`}
            >
              <div className="font-semibold text-sm">Beneficiary</div>
              <div className="text-xs opacity-75">Receive tokens</div>
            </button>
            <button
              type="button"
              onClick={() => setRole('philanthropist')}
              className={`p-3 rounded-lg border-2 transition text-center ${
                role === 'philanthropist'
                  ? 'border-cyan-400 bg-cyan-500/10 text-foreground'
                  : 'border-cyan-500/30 bg-card/50 text-muted-foreground hover:border-cyan-400/50'
              }`}
            >
              <div className="font-semibold text-sm">Philanthropist</div>
              <div className="text-xs opacity-75">Distribute tokens</div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Email Address</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="bg-card border-cyan-500/30 text-foreground placeholder:text-muted-foreground focus:border-cyan-400 focus:ring-cyan-500/30"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-card border-cyan-500/30 text-foreground placeholder:text-muted-foreground focus:border-cyan-400 focus:ring-cyan-500/30"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">Min 8 characters</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Confirm Password</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-card border-cyan-500/30 text-foreground placeholder:text-muted-foreground focus:border-cyan-400 focus:ring-cyan-500/30"
            required
          />
        </div>

        <button 
          type="submit" 
          className="charity-btn-primary w-full flex items-center justify-center gap-2"
          disabled={loading}
        >
          <UserPlus className="w-5 h-5" />
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="border-t border-cyan-500/20 pt-4">
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
