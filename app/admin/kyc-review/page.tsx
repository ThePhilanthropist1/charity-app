'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import {
  CheckCircle, XCircle, Clock, Users, ArrowLeft,
  User, Phone, MapPin, FileText, Shield, Eye
} from 'lucide-react';
import Image from 'next/image';

// ── API HELPER — always fresh token ──────────────────────────────────────────
async function kycPatch(body: object): Promise<{ success: boolean; error?: string }> {
  const token = localStorage.getItem('auth_token') || '';
  const res = await fetch('/api/kyc', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { return { success: false, error: 'Server error: ' + text.slice(0, 100) }; }
}

export default function AdminKYCReviewPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [kycSubmissions, setKycSubmissions]   = useState<any[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [selectedKYC, setSelectedKYC]         = useState<any | null>(null);
  const [reviewAction, setReviewAction]       = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes]         = useState('');
  const [submitting, setSubmitting]           = useState(false);
  const [toast, setToast]                     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [approvedToday, setApprovedToday]     = useState(0);
  const [rejectedToday, setRejectedToday]     = useState(0);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!authLoading) { loadKYCSubmissions(); loadTodayStats(); }
  }, [authLoading]);

  const loadKYCSubmissions = async () => {
    setLoading(true);
    try {
      // Read directly via anon client — kyc_select_all RLS allows anon SELECT
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data, error } = await sb
        .from('kyc_submissions')
        .select('*, users:user_id(full_name, email, country, phone)')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: true });
      if (error) throw error;
      setKycSubmissions(data || []);
    } catch (e) { console.error('[kyc-review] load error:', e); }
    finally { setLoading(false); }
  };

  const loadTodayStats = async () => {
    // Use supabase client for reads — reads are allowed for anon
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const today = new Date().toISOString().split('T')[0];
    const [{ count: approved }, { count: rejected }] = await Promise.all([
      sb.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'approved').gte('reviewed_at', today),
      sb.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'rejected').gte('reviewed_at', today),
    ]);
    setApprovedToday(approved || 0);
    setRejectedToday(rejected || 0);
  };

  // ── APPROVE ────────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!selectedKYC || !user?.id) return;
    setSubmitting(true);
    try {
      const result = await kycPatch({
        action:        'approve',
        submission_id: selectedKYC.id,
        review_notes:  reviewNotes || '',
      });
      if (!result.success) { showToast('Failed to approve: ' + (result.error || 'Unknown error'), 'error'); return; }
      showToast('✅ KYC approved! Philanthropist account is ready. Approval email sent.', 'success');
      setSelectedKYC(null); setReviewNotes(''); setReviewAction(null);
      await loadKYCSubmissions(); await loadTodayStats();
    } catch (e: any) { showToast('Failed to approve: ' + e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  // ── REJECT ─────────────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!selectedKYC || !user?.id) return;
    if (!rejectionReason.trim()) { showToast('Please provide a rejection reason', 'error'); return; }
    setSubmitting(true);
    try {
      const result = await kycPatch({
        action:           'reject',
        submission_id:    selectedKYC.id,
        rejection_reason: rejectionReason.trim(),
      });
      if (!result.success) { showToast('Failed to reject: ' + (result.error || 'Unknown error'), 'error'); return; }
      showToast('KYC rejected. Rejection email sent to applicant.', 'success');
      setSelectedKYC(null); setRejectionReason(''); setReviewNotes(''); setReviewAction(null);
      await loadKYCSubmissions(); await loadTodayStats();
    } catch (e: any) { showToast('Failed to reject: ' + e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const pageStyle = { minHeight: '100vh', backgroundColor: '#0A1628', color: 'white', fontFamily: 'sans-serif' };

  if (authLoading || loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(0,206,201,0.3)', borderTop: '3px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#8FA3BF' }}>Loading KYC submissions...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const Toast = () => toast ? (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, padding: '12px 20px', borderRadius: 12, backgroundColor: toast.type === 'success' ? 'rgba(0,184,148,0.15)' : 'rgba(255,107,107,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(0,184,148,0.4)' : 'rgba(255,107,107,0.4)'}`, color: toast.type === 'success' ? '#00B894' : '#ff6b6b', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      {toast.type === 'success' ? <CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} /> : <XCircle style={{ width: 16, height: 16, flexShrink: 0 }} />}
      {toast.msg}
    </div>
  ) : null;

  // ── REVIEW DETAIL VIEW ────────────────────────────────────────────────────
  if (selectedKYC) {
    const applicantName    = selectedKYC.users?.full_name || 'Unknown';
    const applicantEmail   = selectedKYC.users?.email     || 'Unknown';
    const applicantCountry = selectedKYC.users?.country   || selectedKYC.country || '—';
    const applicantPhone   = selectedKYC.users?.phone     || selectedKYC.phone_number || '—';

    return (
      <ProtectedRoute>
        <div style={pageStyle}>
          <Toast />
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(0,206,201,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
          </div>

          <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(12px)' }}>
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setSelectedKYC(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: '#8FA3BF', cursor: 'pointer', fontSize: 13 }}>
                <ArrowLeft style={{ width: 15, height: 15 }} /> Back
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield style={{ width: 18, height: 18, color: '#9B59B6' }} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>KYC Review — {applicantName}</span>
              </div>
            </div>
          </header>

          <main style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 60px', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

              {/* Applicant info */}
              <div style={{ padding: 24, borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User style={{ width: 16, height: 16, color: '#00CEC9' }} /> Applicant Information
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Full Name',  value: applicantName,    icon: <User     style={{ width: 14, height: 14 }} /> },
                    { label: 'Email',      value: applicantEmail,   icon: <User     style={{ width: 14, height: 14 }} /> },
                    { label: 'Country',    value: applicantCountry, icon: <MapPin   style={{ width: 14, height: 14 }} /> },
                    { label: 'Phone',      value: applicantPhone,   icon: <Phone    style={{ width: 14, height: 14 }} /> },
                    { label: 'ID Type',    value: selectedKYC.government_id_type?.replace(/_/g, ' '), icon: <FileText style={{ width: 14, height: 14 }} /> },
                    { label: 'Submitted',  value: new Date(selectedKYC.submitted_at || selectedKYC.created_at).toLocaleString(), icon: <Clock style={{ width: 14, height: 14 }} /> },
                  ].map((f) => (
                    <div key={f.label} style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(0,206,201,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#00CEC9', marginTop: 2 }}>{f.icon}</div>
                      <div>
                        <p style={{ fontSize: 11, color: '#8FA3BF', marginBottom: 2 }}>{f.label}</p>
                        <p style={{ fontSize: 14, color: 'white', fontWeight: 500, textTransform: f.label === 'ID Type' ? 'capitalize' : 'none' }}>{f.value || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {selectedKYC.government_id_url && (
                  <div style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#8FA3BF', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText style={{ width: 14, height: 14, color: '#00CEC9' }} /> Government ID
                    </h3>
                    <img src={selectedKYC.government_id_url} alt="ID Document" style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(0,206,201,0.2)', objectFit: 'cover' }} />
                  </div>
                )}
                {selectedKYC.face_capture_url && (
                  <div style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#8FA3BF', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User style={{ width: 14, height: 14, color: '#00CEC9' }} /> Face Capture
                    </h3>
                    <img src={selectedKYC.face_capture_url} alt="Face Capture" style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(0,206,201,0.2)', objectFit: 'cover', maxHeight: 280 }} />
                  </div>
                )}
                {!selectedKYC.government_id_url && !selectedKYC.face_capture_url && (
                  <div style={{ padding: 24, borderRadius: 18, border: '1px solid rgba(255,193,7,0.2)', backgroundColor: 'rgba(255,193,7,0.05)', textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: '#ffc107' }}>No documents uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Decision panel */}
            <div style={{ padding: 24, borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 18 }}>Review Decision</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8FA3BF', marginBottom: 6 }}>Review Notes — will be included in approval email (optional)</label>
                  <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="Add notes for the applicant or internal records..." rows={3} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                {reviewAction === 'reject' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#ff6b6b', marginBottom: 6 }}>Rejection Reason * — will be emailed to applicant</label>
                    <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Explain clearly why this application is being rejected. The applicant will receive this in their email." rows={4} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(255,107,107,0.3)', color: 'white', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button onClick={() => setReviewAction(reviewAction === 'approve' ? null : 'approve')} style={{ padding: '12px', borderRadius: 12, border: `2px solid ${reviewAction === 'approve' ? 'rgba(0,184,148,0.6)' : 'rgba(0,184,148,0.2)'}`, backgroundColor: reviewAction === 'approve' ? 'rgba(0,184,148,0.15)' : 'transparent', color: '#00B894', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <CheckCircle style={{ width: 18, height: 18 }} /> Approve
                  </button>
                  <button onClick={() => setReviewAction(reviewAction === 'reject' ? null : 'reject')} style={{ padding: '12px', borderRadius: 12, border: `2px solid ${reviewAction === 'reject' ? 'rgba(255,107,107,0.6)' : 'rgba(255,107,107,0.2)'}`, backgroundColor: reviewAction === 'reject' ? 'rgba(255,107,107,0.15)' : 'transparent', color: '#ff6b6b', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <XCircle style={{ width: 18, height: 18 }} /> Reject
                  </button>
                </div>
                {reviewAction && (
                  <button onClick={reviewAction === 'approve' ? handleApprove : handleReject} disabled={submitting || (reviewAction === 'reject' && !rejectionReason.trim())} style={{ width: '100%', padding: '14px', borderRadius: 12, background: reviewAction === 'approve' ? 'linear-gradient(to right, #00B894, #00CEC9)' : 'linear-gradient(to right, #ff6b6b, #ee5a24)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: (submitting || (reviewAction === 'reject' && !rejectionReason.trim())) ? 'not-allowed' : 'pointer', opacity: (submitting || (reviewAction === 'reject' && !rejectionReason.trim())) ? 0.6 : 1 }}>
                    {submitting ? 'Processing...' : reviewAction === 'approve' ? 'Confirm Approval ✓ — Email will be sent' : 'Confirm Rejection ✗ — Email will be sent'}
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute>
      <div style={pageStyle}>
        <Toast />
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(108,63,200,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
        </div>

        <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(12px)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Image src="/Charity token logo.jpg" alt="Charity Token" width={32} height={32} style={{ borderRadius: 8 }} />
              <span style={{ fontWeight: 700, fontSize: 15 }}>Charity Token</span>
              <span style={{ fontSize: 12, color: '#9B59B6', backgroundColor: 'rgba(108,63,200,0.15)', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(108,63,200,0.3)', fontWeight: 600 }}>ADMIN</span>
            </div>
            <button onClick={() => router.push('/admin')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: '#8FA3BF', cursor: 'pointer', fontSize: 12 }}>
              <ArrowLeft style={{ width: 13, height: 13 }} /> Admin Home
            </button>
          </div>
        </header>

        <main style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 60px', position: 'relative', zIndex: 10 }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, marginBottom: 4 }}>KYC Review</h1>
            <p style={{ fontSize: 13, color: '#8FA3BF' }}>Review and approve or reject philanthropist KYC submissions. Applicants are notified by email.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Pending Reviews', value: kycSubmissions.length, color: '#ffc107', bg: 'rgba(255,193,7,0.1)', border: 'rgba(255,193,7,0.2)', icon: <Clock style={{ width: 20, height: 20, color: '#ffc107' }} /> },
              { label: 'Approved Today',  value: approvedToday,          color: '#00B894', bg: 'rgba(0,184,148,0.1)', border: 'rgba(0,184,148,0.2)', icon: <CheckCircle style={{ width: 20, height: 20, color: '#00B894' }} /> },
              { label: 'Rejected Today',  value: rejectedToday,          color: '#ff6b6b', bg: 'rgba(255,107,107,0.1)', border: 'rgba(255,107,107,0.2)', icon: <XCircle style={{ width: 20, height: 20, color: '#ff6b6b' }} /> },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: '18px 16px', borderRadius: 16, border: `1px solid ${stat.border}`, backgroundColor: stat.bg, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{stat.icon}</div>
                <div>
                  <p style={{ fontSize: 26, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
                  <p style={{ fontSize: 12, color: '#8FA3BF', marginTop: 3 }}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users style={{ width: 16, height: 16, color: '#00CEC9' }} />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>Pending KYC Submissions</h2>
              {kycSubmissions.length > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 12, padding: '3px 10px', borderRadius: 999, backgroundColor: 'rgba(255,193,7,0.15)', color: '#ffc107', fontWeight: 700, border: '1px solid rgba(255,193,7,0.3)' }}>
                  {kycSubmissions.length} pending
                </span>
              )}
            </div>
            {kycSubmissions.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <CheckCircle style={{ width: 44, height: 44, color: '#00B894', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 15, color: 'white', fontWeight: 600, marginBottom: 4 }}>All caught up!</p>
                <p style={{ fontSize: 13, color: '#8FA3BF' }}>No pending KYC submissions at this time.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {kycSubmissions.map((kyc, i) => {
                  const name    = kyc.users?.full_name || 'Unknown';
                  const email   = kyc.users?.email     || 'Unknown';
                  const country = kyc.users?.country   || '—';
                  const submitted = kyc.submitted_at || kyc.created_at;
                  return (
                    <div key={kyc.id} style={{ padding: '16px 20px', borderBottom: i < kycSubmissions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(0,206,201,0.2)' }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#00CEC9' }}>{name[0].toUpperCase()}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 3 }}>{name}</p>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: '#8FA3BF' }}>{email}</span>
                          {country !== '—' && <span style={{ fontSize: 12, color: '#8FA3BF', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin style={{ width: 11, height: 11 }} />{country}</span>}
                          <span style={{ fontSize: 12, color: '#8FA3BF', display: 'flex', alignItems: 'center', gap: 4 }}><Clock style={{ width: 11, height: 11 }} />{new Date(submitted).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, backgroundColor: 'rgba(255,193,7,0.15)', color: '#ffc107', fontWeight: 600, border: '1px solid rgba(255,193,7,0.3)', flexShrink: 0 }}>Pending</span>
                      <button onClick={() => { setSelectedKYC(kyc); setReviewAction(null); setReviewNotes(''); setRejectionReason(''); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                        <Eye style={{ width: 14, height: 14 }} /> Review
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}