'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { supabase, signUp, createBeneficiary } from '@/lib/supabase-client';
import Link from 'next/link';

export default function BeneficiaryRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'registration' | 'activation'>('registration');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      // Sign up user
      const { data } = await signUp(email, password, fullName, 'beneficiary');
      
      if (data.user) {
        // Create beneficiary record
        await createBeneficiary(data.user.id, username);
        setUserId(data.user.id);
        setStep('activation');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Beneficiary Registration</h1>

          {step === 'registration' ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                {loading ? 'Registering...' : 'Register'}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          ) : (
            <ActivationStep userId={userId} username={username} />
          )}
        </div>
      </Card>
    </div>
  );
}

function ActivationStep({ userId, username }: { userId: string; username: string }) {
  const [activationMethod, setActivationMethod] = useState<'telegram' | 'wallet'>('telegram');
  const [activationProof, setActivationProof] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleActivate = async () => {
    setError('');
    setLoading(true);

    try {
      if (!activationProof.trim()) {
        throw new Error('Please provide activation proof');
      }

      const { error: updateError } = await supabase
        .from('beneficiaries')
        .update({
          is_activated: true,
          activation_method: activationMethod,
          activation_proof: activationProof,
          activated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Update user status
      await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', userId);

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message || 'Activation failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h2 className="text-xl font-semibold mb-2">Account Activated!</h2>
        <p className="text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Activate your account to start receiving Charity tokens monthly.
      </p>

      <div className="space-y-3">
        <label className="block">
          <input
            type="radio"
            value="telegram"
            checked={activationMethod === 'telegram'}
            onChange={(e) => setActivationMethod(e.target.value as any)}
            className="mr-2"
          />
          <span className="text-sm">Via Telegram Philanthropist</span>
        </label>

        <label className="block">
          <input
            type="radio"
            value="wallet"
            checked={activationMethod === 'wallet'}
            onChange={(e) => setActivationMethod(e.target.value as any)}
            className="mr-2"
          />
          <span className="text-sm">Via Wallet Transfer (1 USDT)</span>
        </label>
      </div>

      {activationMethod === 'telegram' && (
        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-sm">
          <p className="font-semibold mb-2">Telegram Instructions:</p>
          <p>Contact a Philanthropist from your region. Username: {username}</p>
          <p className="mt-2">Enter their Telegram username below:</p>
        </div>
      )}

      {activationMethod === 'wallet' && (
        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-sm">
          <p className="font-semibold mb-2">Wallet Instructions:</p>
          <p>Send 1 USDT to: 0x1234567890abcdef1234567890abcdef12345678</p>
          <p className="mt-2">Enter the transaction hash below:</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          {activationMethod === 'telegram' ? 'Philanthropist Username' : 'Transaction Hash'}
        </label>
        <Input
          value={activationProof}
          onChange={(e) => setActivationProof(e.target.value)}
          placeholder={activationMethod === 'telegram' ? '@username' : '0x...'}
        />
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">
          {error}
        </div>
      )}

      <Button onClick={handleActivate} className="w-full" disabled={loading}>
        {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
        {loading ? 'Activating...' : 'Activate Account'}
      </Button>
    </div>
  );
}
