'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';
import {
  LogOut, Shield, Users, MapPin, Phone, Mail, User,
  ChevronRight, CheckCircle, Clock, AlertCircle, Award, Send
} from 'lucide-react';

export default function PhilanthropistDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [philanthropist, setPhilanthropist] = useState<any>(null);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    loadDashboard();
  }, [user, authLoading]);

  const loadDashboard = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: phil } = await supabase
        .from('philanthropists')
        .select('*')
        .eq('id', user.id)
        .single();
      setPhilanthropist(phil);

      const { data: bens } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('philanthropist_assigned_id', user.id);
      setBeneficiaries(bens || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const kycStatus = philanthropist?.kyc_status || 'pending';

  const kycConfig: Record<string, { color: string; bg: string; border: string; icon: any; label: string; message: string }> = {
    approved: { color: '#00B894', bg: 'rgba(0,184,148,0.08)', border: 'rgba(0,184,148,0.3)', icon: CheckCircle, label: 'Approved', message: 'Your KYC is approved. You can now onboard beneficiaries.' },
    submitted: { color: '#67e8f9', bg: 'rgba(103,232,249,0.08)', border: 'rgba(103,232,249,0.3)', icon: Clock, label: 'Under Review', message: 'Your KYC is under review. You will be notified within 24-48 hours.' },
    rejected: { color: '#ff6b6b', bg: 'rgba(255,107,107,0.08)', border: 'rgba(255,107,107,0.3)', icon: AlertCircle, label: 'Rejected', message: philanthropist?.rejection_reason || 'Your KYC was rejected. Please resubmit with correct documents.' },
    pending: { color: '#ffc107', bg: 'rgba(255,193,7,0.08)', border: 'rgba(255,193,7,0.3)', icon: AlertCircle, label: 'Pending', message: 'Complete your KYC verification to start helping beneficiaries.' },
  };

  const kyc = kycConfig[kycStatus] || kycConfig.pending;
  const KycIcon = kyc.icon;

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(0,206,201,0.3)', borderTop: '3px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#8FA3BF', fontSize: 14 }}>Loading dashboard...</p>

          {/* ✅ FIXED HERE */}
          <style jsx>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>

        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', color: 'white', fontFamily: 'sans-serif' }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(0,206,201,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/Charity token logo.jpg" alt="Charity Token" width={34} height={34} style={{ borderRadius: 8 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: 0 }}>Charity Token</p>
              <p style={{ fontSize: 9, color: '#8FA3BF', margin: 0, letterSpacing: 0.5 }}>PHILANTHROPIST PORTAL</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, backgroundColor: 'rgba(0,206,201,0.1)', border: '1px solid rgba(0,206,201,0.2)' }}>
              <Award style={{ width: 13, height: 13, color: '#00CEC9' }} />
              <span style={{ fontSize: 12, color: '#00CEC9', fontWeight: 600 }}>{user?.full_name || user?.email}</span>
            </div>
            <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: '#8FA3BF', background: 'transparent', cursor: 'pointer' }}>
              <LogOut style={{ width: 13, height: 13 }} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* REST OF YOUR CODE CONTINUES EXACTLY THE SAME */}
    </div>
  );
}