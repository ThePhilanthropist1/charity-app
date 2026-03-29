'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { supabase, getPendingKYCSubmissions, approveKYC, rejectKYC, logAdminAction } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/auth-context';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [kycSubmissions, setKycSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKYC, setSelectedKYC] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.push('/');
      return;
    }

    loadKYCSubmissions();
  }, [user, authLoading, router]);

  const loadKYCSubmissions = async () => {
    try {
      setLoading(true);
      const submissions = await getPendingKYCSubmissions();
      setKycSubmissions(submissions || []);
    } catch (error) {
      console.error('Error loading KYC submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedKYC || !user?.id) return;

    setSubmitting(true);
    try {
      await approveKYC(selectedKYC.id, user.id, reviewNotes);
      
      // Log action
      await logAdminAction(user.id, 'kyc_approved', selectedKYC.philanthropist_id, {
        kycId: selectedKYC.id,
        notes: reviewNotes,
      });

      setSelectedKYC(null);
      setReviewNotes('');
      setReviewAction(null);
      await loadKYCSubmissions();
    } catch (error: any) {
      console.error('Error approving KYC:', error);
      alert('Failed to approve KYC: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedKYC || !user?.id) return;

    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setSubmitting(true);
    try {
      await rejectKYC(selectedKYC.id, user.id, rejectionReason, reviewNotes);

      // Log action
      await logAdminAction(user.id, 'kyc_rejected', selectedKYC.philanthropist_id, {
        kycId: selectedKYC.id,
        reason: rejectionReason,
        notes: reviewNotes,
      });

      setSelectedKYC(null);
      setRejectionReason('');
      setReviewNotes('');
      setReviewAction(null);
      await loadKYCSubmissions();
    } catch (error: any) {
      console.error('Error rejecting KYC:', error);
      alert('Failed to reject KYC: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (selectedKYC) {
    return (
      <KYCReviewDetail
        kyc={selectedKYC}
        reviewAction={reviewAction}
        rejectionReason={rejectionReason}
        reviewNotes={reviewNotes}
        submitting={submitting}
        onSetReviewAction={setReviewAction}
        onSetRejectionReason={setRejectionReason}
        onSetReviewNotes={setReviewNotes}
        onApprove={handleApprove}
        onReject={handleReject}
        onBack={() => setSelectedKYC(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard - KYC Review</h1>

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Pending KYC Submissions</h2>

            {kycSubmissions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No pending KYC submissions
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Name</th>
                      <th className="text-left py-2 px-4">Country</th>
                      <th className="text-left py-2 px-4">Phone</th>
                      <th className="text-left py-2 px-4">Submitted</th>
                      <th className="text-left py-2 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kycSubmissions.map((kyc) => (
                      <tr key={kyc.id} className="border-b hover:bg-muted">
                        <td className="py-3 px-4">{kyc.full_name}</td>
                        <td className="py-3 px-4">{kyc.country}</td>
                        <td className="py-3 px-4">{kyc.phone_number}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(kyc.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            onClick={() => setSelectedKYC(kyc)}
                          >
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        <Card className="mt-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold">{kycSubmissions.length}</p>
                <p className="text-muted-foreground">Pending Reviews</p>
              </div>
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-muted-foreground">Approved Today</p>
              </div>
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-muted-foreground">Rejected Today</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function KYCReviewDetail({
  kyc,
  reviewAction,
  rejectionReason,
  reviewNotes,
  submitting,
  onSetReviewAction,
  onSetRejectionReason,
  onSetReviewNotes,
  onApprove,
  onReject,
  onBack,
}: any) {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Back to List
        </Button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* KYC Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Applicant Information</h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{kyc.full_name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{kyc.date_of_birth}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Country</p>
                <p className="font-medium">{kyc.country}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Region</p>
                <p className="font-medium">{kyc.region}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="font-medium">{kyc.phone_number}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Home Address</p>
                <p className="font-medium">{kyc.home_address}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">ID Type</p>
                <p className="font-medium capitalize">{kyc.id_type}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium">
                  {new Date(kyc.submitted_at).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Documents */}
          <div className="space-y-6">
            {kyc.id_document_url && (
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Government ID</h3>
                <img
                  src={kyc.id_document_url}
                  alt="ID Document"
                  className="w-full rounded border"
                />
              </Card>
            )}

            {kyc.face_capture_url && (
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Face Capture</h3>
                <img
                  src={kyc.face_capture_url}
                  alt="Face Capture"
                  className="w-full rounded border"
                />
              </Card>
            )}
          </div>
        </div>

        {/* Review Section */}
        <Card className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Review Decision</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Review Notes</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => onSetReviewNotes(e.target.value)}
                placeholder="Add your review notes..."
                className="w-full border rounded px-3 py-2 text-sm"
                rows={4}
              />
            </div>

            {reviewAction === 'reject' && (
              <div>
                <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => onSetRejectionReason(e.target.value)}
                  placeholder="Explain why you&apos;re rejecting this application..."
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant={reviewAction === 'approve' ? 'default' : 'outline'}
                onClick={() => onSetReviewAction('approve')}
                className="flex-1"
              >
                Approve
              </Button>

              <Button
                variant={reviewAction === 'reject' ? 'destructive' : 'outline'}
                onClick={() => onSetReviewAction('reject')}
                className="flex-1"
              >
                Reject
              </Button>
            </div>

            {reviewAction && (
              <Button
                onClick={reviewAction === 'approve' ? onApprove : onReject}
                disabled={submitting}
                className="w-full"
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              >
                {submitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
                {submitting ? 'Processing...' : `Confirm ${reviewAction === 'approve' ? 'Approval' : 'Rejection'}`}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
