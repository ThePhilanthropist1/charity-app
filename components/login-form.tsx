'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, LogIn } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('auth_user', JSON.stringify(result.data.user));
        
        // Redirect based on role
        if (result.data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (result.data.user.role === 'philanthropist') {
          router.push('/philanthropist/dashboard');
        } else {
          router.push('/beneficiary/dashboard');
        }
      } else {
        setError(result.error || 'Login failed');
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
        <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
        <p className="text-muted-foreground">Sign in to your Charity Token account</p>
      </div>
      
      {error && (
        <div className="flex gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
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
        </div>

        <button 
          type="submit" 
          className="charity-btn-primary w-full flex items-center justify-center gap-2"
          disabled={loading}
        >
          <LogIn className="w-5 h-5" />
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="border-t border-cyan-500/20 pt-4">
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <button
            onClick={() => router.push('/register')}
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
          >
            Create one now
          </button>
        </p>
      </div>
    </div>
  );
}
