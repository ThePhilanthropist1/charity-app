'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

export default function PhilanthropistDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [philanthropist, setPhilanthropist] = useState<any>(null);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assigned: 0,
    verified: 0,
    pending_verifications: 0,
  });

  useEffect(() => {
    if (!authLoading && user?.role !== 'philanthropist') {
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

      // Get philanthropist details
      const { data: phil } = await supabase
        .from('philanthropists')
        .select('*')
        .eq('id', user?.id)
        .single();

      setPhilanthropist(phil);

      // Get assigned beneficiaries
      const { data: bens } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('philanthropist_assigned_id', user?.id);

      setBeneficiaries(bens || []);

      // Calculate stats
      setStats({
        assigned: bens?.length || 0,
        verified: phil?.kyc_status === 'approved' ? 1 : 0,
        pending_verifications: phil?.kyc_status === 'submitted' ? 1 : 0,
      });
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.full_name}</h1>
            <p className="text-muted-foreground">Philanthropist Dashboard</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>

        {/* KYC Status Alert */}
        {philanthropist && (
          <Card className={`p-4 mb-6 ${
            philanthropist.kyc_status === 'approved' ? 'bg-green-50 dark:bg-green-950 border-green-200' :
            philanthropist.kyc_status === 'submitted' ? 'bg-blue-50 dark:bg-blue-950 border-blue-200' :
            'bg-yellow-50 dark:bg-yellow-950 border-yellow-200'
          }`}>
            <p className="font-semibold mb-2">
              KYC Status: <span className="capitalize">{philanthropist.kyc_status}</span>
            </p>
            {philanthropist.kyc_status === 'pending' && (
              <>
                <p className="text-sm mb-3">Complete your KYC verification to start helping beneficiaries.</p>
                <Link href="/philanthropist-kyc">
                  <Button size="sm">Complete KYC</Button>
                </Link>
              </>
            )}
            {philanthropist.kyc_status === 'submitted' && (
              <p className="text-sm">Your KYC is under review. You&apos;ll be notified once it&apos;s approved.</p>
            )}
            {philanthropist.kyc_status === 'rejected' && (
              <>
                <p className="text-sm mb-3">Your KYC was rejected. You can submit again with updated information.</p>
                <Link href="/philanthropist-kyc">
                  <Button size="sm">Resubmit KYC</Button>
                </Link>
              </>
            )}
          </Card>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Status</p>
            <p className="text-3xl font-bold capitalize">
              {philanthropist?.kyc_status || 'pending'}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Assigned Beneficiaries</p>
            <p className="text-3xl font-bold">{stats.assigned}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Region Coverage</p>
            <p className="text-xl font-bold">{philanthropist?.region_coverage || 'N/A'}</p>
          </Card>
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Personal Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{user?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{user?.phone_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{user?.country}, {user?.region}</p>
              </div>
            </div>
          </Card>

          {/* Contact Methods */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Methods</h2>
            <div className="space-y-3">
              {philanthropist?.telegram_username && (
                <div>
                  <p className="text-sm text-muted-foreground">Telegram</p>
                  <p className="font-medium">@{philanthropist.telegram_username}</p>
                </div>
              )}
              {philanthropist?.wallet_address && (
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Address</p>
                  <p className="font-medium font-mono text-xs">
                    {philanthropist.wallet_address.slice(0, 10)}...{philanthropist.wallet_address.slice(-10)}
                  </p>
                </div>
              )}
              {!philanthropist?.telegram_username && !philanthropist?.wallet_address && (
                <p className="text-muted-foreground">No contact methods provided yet</p>
              )}
            </div>
          </Card>
        </div>

        {/* Assigned Beneficiaries */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Assigned Beneficiaries ({beneficiaries.length})</h2>

          {beneficiaries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No beneficiaries assigned yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Username</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Activation Method</th>
                    <th className="text-left py-2 px-4">Activated Date</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiaries.map((ben) => (
                    <tr key={ben.id} className="border-b hover:bg-muted">
                      <td className="py-3 px-4">{ben.username}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            ben.is_activated
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {ben.is_activated ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize">{ben.activation_method || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {ben.activated_at ? new Date(ben.activated_at).toLocaleDateString() : 'N/A'}
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
