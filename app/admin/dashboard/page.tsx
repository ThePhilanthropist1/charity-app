'use client';

import { useState, useEffect } from 'react';
import { AdminDashboard } from '@/components/admin-dashboard';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import type { KYCSubmission } from '@/lib/types';

export default function AdminDashboardPage() {
  const [pendingKYC, setPendingKYC] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingKYC = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/kyc', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const result = await response.json();
        if (result.success) {
          setPendingKYC(result.data || []);
        }
      } catch (error) {
        console.error('[v0] Failed to fetch KYC submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingKYC();
  }, []);

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </Card>
        ) : (
          <AdminDashboard pendingKYC={pendingKYC} />
        )}
      </div>
    </main>
  );
}
