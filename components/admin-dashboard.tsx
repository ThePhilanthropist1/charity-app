'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, XCircle, Eye, Trash2, RefreshCw } from 'lucide-react';
import { useAdminUsers, useAdminAuditLogs } from '@/hooks/use-charity-api';
import type { User, KYCSubmission } from '@/lib/types';

interface AdminDashboardProps {
  pendingKYC?: KYCSubmission[];
}

export function AdminDashboard({ pendingKYC = [] }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'kyc' | 'users' | 'distributions' | 'audit'>('kyc');
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const { users: philanthropists, mutate: mutatePh } = useAdminUsers('philanthropist');
  const { users: beneficiaries, mutate: mutateBen } = useAdminUsers('beneficiary');
  const { logs: auditLogs } = useAdminAuditLogs();

  // Approve KYC
  const approveKYC = async (submissionId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/kyc', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'approve',
          submission_id: submissionId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSelectedSubmission(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reject KYC
  const rejectKYC = async (submissionId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/kyc', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'reject',
          submission_id: submissionId,
          rejection_reason: rejectionReason,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSelectedSubmission(null);
        setRejectionReason('');
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (userId: string, reason?: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_user_id: userId,
          reason: reason || 'No reason provided',
        }),
      });

      const result = await response.json();
      if (result.success) {
        mutatePh();
        mutateBen();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage KYC submissions, users, and system operations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['kyc', 'users', 'distributions', 'audit'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* KYC Tab */}
      {activeTab === 'kyc' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">KYC Submissions ({pendingKYC.length})</h2>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {pendingKYC.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-muted-foreground">No pending KYC submissions</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingKYC.map((submission) => (
                <Card key={submission.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">ID Type: {submission.government_id_type}</p>
                      <p className="text-sm text-muted-foreground">
                        Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => setSelectedSubmission(submission)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Review Modal */}
          {selectedSubmission && (
            <Card className="p-6 border-2 border-blue-500">
              <h3 className="text-xl font-bold mb-4">Review Submission</h3>

              <div className="space-y-4 mb-6">
                {selectedSubmission.government_id_url && (
                  <div>
                    <p className="text-sm font-medium mb-2">Government ID</p>
                    <img
                      src={selectedSubmission.government_id_url}
                      alt="ID"
                      className="w-full rounded-lg max-h-96 object-cover"
                    />
                  </div>
                )}

                {selectedSubmission.face_capture_url && (
                  <div>
                    <p className="text-sm font-medium mb-2">Face Capture</p>
                    <img
                      src={selectedSubmission.face_capture_url}
                      alt="Face"
                      className="w-full rounded-lg max-h-96 object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rejection Reason (if rejecting)</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Optional - explain why this submission is being rejected"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => approveKYC(selectedSubmission.id)}
                    disabled={loading}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => rejectKYC(selectedSubmission.id)}
                    variant="destructive"
                    disabled={loading}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => setSelectedSubmission(null)}
                    variant="outline"
                    disabled={loading}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-4">Philanthropists ({philanthropists.length})</h2>
            <div className="grid gap-3">
              {philanthropists.map((user: User) => (
                <Card key={user.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{user.full_name || user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Button
                    onClick={() => deleteUser(user.id, 'Policy violation')}
                    variant="destructive"
                    size="sm"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Beneficiaries ({beneficiaries.length})</h2>
            <div className="grid gap-3">
              {beneficiaries.map((user: User) => (
                <Card key={user.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{user.full_name || user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Button
                    onClick={() => deleteUser(user.id, 'Policy violation')}
                    variant="destructive"
                    size="sm"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Audit Logs</h2>
          <div className="grid gap-3">
            {auditLogs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{log.action_type}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">{log.action_type.replace('_', ' ')}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
