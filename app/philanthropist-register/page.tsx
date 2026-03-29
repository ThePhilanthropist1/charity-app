'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { signUp, createPhilanthropist } from '@/lib/supabase-client';
import Link from 'next/link';

export default function PhilanthropistRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'registration' | 'success'>('registration');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const { data } = await signUp(email, password, fullName, 'philanthropist');

      if (data.user) {
        // Create philanthropist record
        await createPhilanthropist(data.user.id, {
          date_of_birth: dateOfBirth,
          home_address: homeAddress,
          telegram_username: telegramUsername || undefined,
          wallet_address: walletAddress || undefined,
        });

        // Update user with additional info
        const { supabase: sb } = await import('@/lib/supabase-client');
        await sb.from('users').update({
          country,
          region,
          phone_number: phoneNumber,
        }).eq('id', data.user.id);

        setStep('success');
        setTimeout(() => router.push('/philanthropist-kyc'), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <div className="p-6">
            <div className="text-5xl mb-4">✓</div>
            <h1 className="text-2xl font-bold mb-2">Registration Complete!</h1>
            <p className="text-muted-foreground mb-6">
              Redirecting to KYC verification...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Philanthropist Registration</h1>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+234..."
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Country *</label>
                <Input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g., Nigeria"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Region/State *</label>
                <Input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g., Lagos"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Home Address *</label>
              <Input
                type="text"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="Street address"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Telegram Username (Optional)</label>
                <Input
                  type="text"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="@username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Wallet Address (Optional)</label>
                <Input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password *</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
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
        </div>
      </Card>
    </div>
  );
}
