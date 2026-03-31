'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { supabase, createDistributionSchedule, executeMonthlyDistribution } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/auth-context';

export default function AdminDistributionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [distributions, setDistributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [distributionMonth, setDistributionMonth] = useState('');

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.push('/');
      return;
    }

    loadDistributions();
  }, [user, authLoading, router]);

  const loadDistributions = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('distribution_schedule')
        .select('*')
        .order('distribution_month', { ascending: false });

      setDistributions(data || []);
    } catch (error) {
      console.error('Error loading distributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDistribution = async () => {
    if (!distributionMonth) {
      alert('Please select a month');
      return;
    }

    try {
      setLoading(true);
      await createDistributionSchedule(distributionMonth, 500);
      setDistributionMonth('');
      setShowCreateForm(false);
      await loadDistributions();
    } catch (error: any) {
      alert('Failed to create distribution: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteDistribution = async (distributionId: string) => {
    if (!confirm('Execute this distribution? This will distribute tokens to all active beneficiaries.')) {
      return;
    }

    try {
      setExecuting(true);
      await executeMonthlyDistribution(distributionId);
      await loadDistributions();
    } catch (error: any) {
      alert('Failed to execute distribution: ' + error.message);
    } finally {
      setExecuting(false);
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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Monthly Distributions</h1>
            <p className="text-muted-foreground">Manage token distributions to beneficiaries</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            Create Distribution
          </Button>
        </div>

        {/* Create Distribution Form */}
        {showCreateForm && (
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Create New Distribution</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Distribution Month</label>
                <input
                  type="month"
                  value={distributionMonth}
                  onChange={(e) => setDistributionMonth(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Each beneficiary will receive 500 tokens
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={handleCreateDistribution}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  Create
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Distributions Table */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Distribution History</h2>

          {distributions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No distributions created yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Month</th>
                    <th className="text-left py-2 px-4">Beneficiaries</th>
                    <th className="text-left py-2 px-4">Tokens/Beneficiary</th>
                    <th className="text-left py-2 px-4">Total Tokens</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((dist) => (
                    <tr key={dist.id} className="border-b hover:bg-muted">
                      <td className="py-3 px-4">
                        {new Date(dist.distribution_month).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        {dist.total_beneficiaries?.toLocaleString() || 0}
                      </td>
                      <td className="py-3 px-4">{dist.token_amount}</td>
                      <td className="py-3 px-4">
                        {(dist.total_tokens_distributed || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                            dist.distribution_status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : dist.distribution_status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {dist.distribution_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {dist.distribution_status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleExecuteDistribution(dist.id)}
                            disabled={executing}
                          >
                            {executing ? <Spinner className="mr-2 h-4 w-4" /> : null}
                            Execute
                          </Button>
                        )}
                        {dist.distribution_status === 'completed' && (
                          <span className="text-sm text-green-600">✓ Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
