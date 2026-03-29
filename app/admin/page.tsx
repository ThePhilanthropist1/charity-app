'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { supabase, logAdminAction, deletePhilanthropist } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

export default function AdminMainDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [stats, setStats] = useState({
    total_beneficiaries: 0,
    active_beneficiaries: 0,
    total_philanthropists: 0,
    approved_philanthropists: 0,
    pending_kyc: 0,
    total_tokens_distributed: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
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

      // Get all users
      const { data: allUsers } = await supabase.from('users').select('*');
      setUsers(allUsers || []);

      // Get beneficiary stats
      const { data: beneficiaries, count: benCount } = await supabase
        .from('beneficiaries')
        .select('*', { count: 'exact' });

      const activeBeneficiaries = beneficiaries?.filter((b) => b.is_activated).length || 0;

      // Get philanthropist stats
      const { data: philanthropists, count: philCount } = await supabase
        .from('philanthropists')
        .select('*', { count: 'exact' });

      const approvedPhil = philanthropists?.filter((p) => p.kyc_status === 'approved').length || 0;
      const pendingKyc = philanthropists?.filter((p) => p.kyc_status === 'submitted').length || 0;

      // Get token distribution stats
      const { data: distributions } = await supabase
        .from('token_transactions')
        .select('amount')
        .eq('transaction_type', 'distribution');

      const totalDistributed = distributions?.reduce((sum, d) => sum + d.amount, 0) || 0;

      setStats({
        total_beneficiaries: benCount || 0,
        active_beneficiaries: activeBeneficiaries,
        total_philanthropists: philCount || 0,
        approved_philanthropists: approvedPhil,
        pending_kyc: pendingKyc,
        total_tokens_distributed: totalDistributed,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !user?.id) return;

    try {
      await deletePhilanthropist(selectedUser.id, user.id, 'Admin deletion');
      setSelectedUser(null);
      setConfirmDelete(false);
      await loadDashboard();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + error.message);
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform Management</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200">
            <p className="text-sm text-muted-foreground mb-2">Total Beneficiaries</p>
            <p className="text-4xl font-bold">{stats.total_beneficiaries.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.active_beneficiaries} active
            </p>
          </Card>

          <Card className="p-6 bg-green-50 dark:bg-green-950 border-green-200">
            <p className="text-sm text-muted-foreground mb-2">Philanthropists</p>
            <p className="text-4xl font-bold">{stats.total_philanthropists}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.approved_philanthropists} verified
            </p>
          </Card>

          <Card className="p-6 bg-purple-50 dark:bg-purple-950 border-purple-200">
            <p className="text-sm text-muted-foreground mb-2">Pending KYC</p>
            <p className="text-4xl font-bold">{stats.pending_kyc}</p>
            <p className="text-xs text-muted-foreground mt-2">Reviews needed</p>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Tokens Distributed</p>
            <p className="text-4xl font-bold">{stats.total_tokens_distributed.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-2">All time</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Quick Actions</p>
            <div className="space-x-2">
              <Link href="/admin/kyc-review">
                <Button size="sm" variant="default">
                  Review KYC
                </Button>
              </Link>
              <Link href="/admin/distributions">
                <Button size="sm" variant="outline">
                  Manage Distributions
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Users Management */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Users Management</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Name</th>
                  <th className="text-left py-2 px-4">Email</th>
                  <th className="text-left py-2 px-4">Role</th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-left py-2 px-4">Joined</th>
                  <th className="text-left py-2 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 20).map((u) => (
                  <tr key={u.id} className="border-b hover:bg-muted">
                    <td className="py-3 px-4">{u.full_name}</td>
                    <td className="py-3 px-4 font-mono text-sm">{u.email}</td>
                    <td className="py-3 px-4 capitalize">{u.role}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          u.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : u.status === 'suspended'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser(u)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length > 20 && (
            <p className="text-sm text-muted-foreground mt-4">
              Showing 20 of {users.length} users
            </p>
          )}
        </Card>

        {/* Admin Logs */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Actions</h2>
          <p className="text-sm text-muted-foreground text-center py-8">
            Admin action logs will appear here
          </p>
        </Card>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">User Details</h2>

              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedUser.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{selectedUser.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="font-medium">{selectedUser.country || 'N/A'}</p>
                </div>
              </div>

              {confirmDelete ? (
                <div className="space-y-3">
                  <p className="text-sm text-destructive font-medium">
                    Are you sure you want to delete this user? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleDeleteUser}
                    >
                      Confirm Delete
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete User
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedUser(null)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
