'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { supabase, getBeneficiaryBalance } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/auth-context';

export default function BeneficiaryDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user?.role !== 'beneficiary') {
      router.push('/');
      return;
    }

    if (user?.id) {
      loadDashboard();
    }
  }, [user, authLoading, router]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // Get balance
      if (user?.id) {
        const balanceData = await getBeneficiaryBalance(user.id);
        setBalance(balanceData);

        // Get transactions
        const { data: txns } = await supabase
          .from('token_transactions')
          .select('*')
          .eq('beneficiary_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        setTransactions(txns || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.full_name}</h1>
            <p className="text-muted-foreground">Beneficiary Dashboard</p>
          </div>

          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
            <p className="text-3xl font-bold">
              {balance?.current_balance?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Charity Tokens</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Earned</p>
            <p className="text-3xl font-bold">
              {balance?.total_earned?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-2">All time</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Redeemed</p>
            <p className="text-3xl font-bold">
              {balance?.total_redeemed?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Charity Tokens</p>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>

          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Type</th>
                    <th className="text-left py-2 px-4">Amount</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-muted">
                      <td className="py-3 px-4 capitalize">{tx.transaction_type}</td>
                      <td className="py-3 px-4">
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            tx.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Info Section */}
        <Card className="mt-6 p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold mb-2">Monthly Distribution</h3>
          <p className="text-sm">
            You receive 500 Charity tokens every month for 10 years. Next distribution
            will be on the 1st of next month.
          </p>
        </Card>
      </div>
    </div>
  );
}
