'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, Coins, Copy } from 'lucide-react';
import { useTokenDistributions, useAuth } from '@/hooks/use-charity-api';
import { ProfileUpload } from './profile-upload';
import { MembershipCard } from './membership-card';

export function BeneficiaryActivationFlow() {
  const { user } = useAuth();
  const [method, setMethod] = useState<'pi' | 'wallet' | 'philanthropist' | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [philanthropistUsername, setPhilanthropistUsername] = useState('');

  const handlePiPayment = async () => {
    setLoading(true);
    setError('');

    try {
      // This would integrate with Pi Network payment
      // For now, we'll create a mock activation
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'pi_payment',
          activation_method: 'pi_payment',
          payment_id: 'mock_' + Date.now(),
          txid: 'mock_txid_' + Date.now(),
          amount_pi: 6.0,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Payment failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWalletTransfer = async () => {
    if (!transactionHash.trim()) {
      setError('Please enter transaction hash');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'wallet_transfer',
          activation_method: 'wallet_transfer',
          transaction_hash: transactionHash,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhilanthropistActivation = async () => {
    if (!philanthropistUsername.trim()) {
      setError('Please enter philanthropist username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'philanthropist',
          activation_method: 'philanthropist',
          philanthropist_username: philanthropistUsername,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Activation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-2xl mx-auto p-8 text-center charity-glow-card">
        <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2 text-foreground">Account Activated!</h1>
        <p className="text-muted-foreground mb-6">
          Your account has been successfully activated. You will receive 500 Charity tokens monthly for the next 10 years.
        </p>
        <Button onClick={() => window.location.href = '/beneficiary/dashboard'} className="charity-btn-primary">
          Go to Dashboard
        </Button>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Activate Your Account</h1>
        <p className="text-muted-foreground">Choose a payment method to activate and start receiving 500 tokens monthly</p>
      </div>

      {error && (
        <div className="flex gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {/* Pi Network Payment */}
        <Card
          onClick={() => !success && setMethod(method === 'pi' ? null : 'pi')}
          className={`p-6 cursor-pointer transition charity-glow-card ${method === 'pi' ? 'border-cyan-400' : ''}`}
        >
          <div className="text-center">
            <Coins className="w-8 h-8 mx-auto mb-3 text-cyan-400" />
            <h3 className="font-bold mb-2 text-foreground">Pi Network</h3>
            <p className="text-2xl font-bold mb-4 charity-text-gradient">6.0 Pi</p>
            <p className="text-sm text-muted-foreground mb-4">Fast and secure payment with Pi Network</p>
            <Button
              onClick={handlePiPayment}
              disabled={loading || method !== 'pi'}
              className="w-full charity-btn-primary"
            >
              {loading ? 'Processing...' : 'Pay with Pi'}
            </Button>
          </div>
        </Card>

        {/* Wallet Transfer */}
        <Card
          onClick={() => !success && setMethod(method === 'wallet' ? null : 'wallet')}
          className={`p-6 cursor-pointer transition charity-glow-card ${method === 'wallet' ? 'border-cyan-400' : ''}`}
        >
          <div className="text-center">
            <span className="text-4xl mb-3 block">💳</span>
            <h3 className="font-bold mb-2 text-foreground">Wallet Transfer</h3>
            <p className="text-2xl font-bold mb-4 charity-text-gradient">1 USDT</p>
            <p className="text-sm text-muted-foreground mb-4">Transfer to provided wallet address</p>
            {method === 'wallet' && (
              <div className="text-left space-y-3 mb-4 p-3 bg-cyan-500/5 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Wallet Address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs break-all bg-card p-2 rounded border border-cyan-500/30 flex-1 text-cyan-300">
                      0x1234567890abcdef
                    </code>
                    <Copy className="w-4 h-4 cursor-pointer text-cyan-400 hover:text-cyan-300" />
                  </div>
                </div>
                <Input
                  placeholder="Paste transaction hash"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  className="text-sm bg-card border-cyan-500/30"
                />
                <Button
                  onClick={handleWalletTransfer}
                  disabled={loading}
                  className="w-full charity-btn-primary"
                  size="sm"
                >
                  {loading ? 'Verifying...' : 'Verify Payment'}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Philanthropist Method */}
        <Card
          onClick={() => !success && setMethod(method === 'philanthropist' ? null : 'philanthropist')}
          className={`p-6 cursor-pointer transition charity-glow-card ${method === 'philanthropist' ? 'border-cyan-400' : ''}`}
        >
          <div className="text-center">
            <span className="text-4xl mb-3 block">👥</span>
            <h3 className="font-bold mb-2 text-foreground">Via Philanthropist</h3>
            <p className="text-2xl font-bold mb-4 charity-text-gradient">1 USDT</p>
            <p className="text-sm text-muted-foreground mb-4">Contact a philanthropist from your region</p>
            {method === 'philanthropist' && (
              <div className="text-left space-y-3 mb-4">
                <Input
                  placeholder="Enter philanthropist username"
                  value={philanthropistUsername}
                  onChange={(e) => setPhilanthropistUsername(e.target.value)}
                  className="text-sm bg-card border-cyan-500/30"
                />
                <p className="text-xs text-muted-foreground">Find regional philanthropists on our Telegram channel</p>
                <Button
                  onClick={handlePhilanthropistActivation}
                  disabled={loading}
                  className="w-full charity-btn-primary"
                  size="sm"
                >
                  {loading ? 'Processing...' : 'Submit'}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function BeneficiaryDashboard() {
  const { user } = useAuth();
  const { distributions } = useTokenDistributions(user?.id);
  const [profileImage, setProfileImage] = useState<string>('');

  const totalTokens = distributions.reduce((sum, dist) => sum + dist.amount_tokens, 0);
  const pendingTokens = distributions
    .filter((d) => d.distribution_status === 'pending')
    .reduce((sum, dist) => sum + dist.amount_tokens, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {user?.full_name || user?.username}!</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 charity-glow-card">
          <p className="text-sm text-muted-foreground mb-2">Total Tokens Received</p>
          <p className="text-4xl font-bold charity-text-gradient">{totalTokens.toLocaleString()}</p>
        </Card>

        <Card className="p-6 charity-glow-card">
          <p className="text-sm text-muted-foreground mb-2">Pending Tokens</p>
          <p className="text-4xl font-bold charity-text-gradient">{pendingTokens.toLocaleString()}</p>
        </Card>

        <Card className="p-6 charity-glow-card">
          <p className="text-sm text-muted-foreground mb-2">Monthly Amount</p>
          <p className="text-4xl font-bold charity-text-gradient">500</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile & Membership Card Section */}
        <div className="space-y-4">
          <ProfileUpload
            onProfileUpdate={(_, base64) => setProfileImage(base64)}
            currentImage={profileImage}
          />
          <MembershipCard
            userId={user?.id || ''}
            fullName={user?.full_name || 'User'}
            email={user?.email || ''}
            profileImage={profileImage}
            joinDate={user?.created_at || new Date().toISOString()}
          />
        </div>

        {/* Distribution History */}
        <Card className="p-6 charity-glow-card">
          <h2 className="text-xl font-bold mb-4 text-foreground">Distribution History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-cyan-500/30">
                <tr>
                  <th className="text-left py-2 text-muted-foreground">Month</th>
                  <th className="text-left py-2 text-muted-foreground">Amount</th>
                  <th className="text-left py-2 text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {distributions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
                      No distributions yet. Activate your account to start receiving tokens.
                    </td>
                  </tr>
                ) : (
                  distributions.map((dist) => (
                    <tr key={dist.id} className="border-b border-cyan-500/20 hover:bg-cyan-500/5 transition">
                      <td className="py-3 text-foreground">{dist.month_year}</td>
                      <td className="py-3 font-semibold text-emerald-300">{dist.amount_tokens.toLocaleString()} CT</td>
                      <td className="py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            dist.distribution_status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : dist.distribution_status === 'failed'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}
                        >
                          {dist.distribution_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
