'use client';
import { Suspense, useEffect, useState } from 'react';
import { RegistrationForm } from '@/components/registration-form';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

const MAX_BENEFICIARIES = 1_000_000;

function RegisterContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'beneficiary';
  const [isFull, setIsFull] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setIsFull(res.data.isFull);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(0,206,201,0.3)', borderTop: '3px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isFull) {
    return (
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -10, background: 'rgba(0,206,201,0.15)', filter: 'blur(16px)', borderRadius: '50%' }} />
            <Image src="/Charity token logo.jpg" alt="Charity Token" width={48} height={48} style={{ borderRadius: 12, position: 'relative', zIndex: 1 }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(to right, #00CEC9, #00B894)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Charity Token
          </h1>
        </div>

        {/* CLOSED CARD */}
        <div style={{ backgroundColor: '#0F1F35', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 20, padding: '40px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', backgroundColor: 'rgba(255,107,107,0.1)', border: '2px solid rgba(255,107,107,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <span style={{ fontSize: 32 }}>🔒</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 12 }}>Registration Closed</h2>
          <p style={{ fontSize: 14, color: '#8FA3BF', lineHeight: 1.7, marginBottom: 28 }}>
            All <strong style={{ color: 'white' }}>1,000,000</strong> beneficiary slots have been filled.<br />
            Thank you to everyone who joined the Charity Token Project!<br /><br />
            Token distributions begin in <strong style={{ color: '#00CEC9' }}>2027</strong>.
          </p>
          {/* Telegram CTA */}
          <div style={{ padding: '16px 18px', borderRadius: 14, backgroundColor: 'rgba(0,136,204,0.08)', border: '1px solid rgba(0,136,204,0.25)', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#8FA3BF', lineHeight: 1.7, marginBottom: 12 }}>
              <strong style={{ color: 'white' }}>Still want to own Charity Token?</strong><br />
              Join our Telegram channel to get notified when CT is listed on exchanges — and buy your share directly from the market!
            </p>
            <a
              href="https://t.me/charitytokenproject01"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 12, background: 'linear-gradient(to right, #0088cc, #00CEC9)', color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxSizing: 'border-box', boxShadow: '0 6px 20px rgba(0,136,204,0.25)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.008 9.456c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.09 14.99l-2.94-.92c-.64-.204-.652-.64.136-.948l11.49-4.43c.533-.194 1-.12.786.556z"/></svg>
              Join Telegram for Listing Updates
            </a>
          </div>

          <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '13px 28px', borderRadius: 12, border: '1px solid rgba(0,206,201,0.3)', color: '#67e8f9', fontWeight: 600, fontSize: 14, textDecoration: 'none', marginBottom: 12, backgroundColor: 'rgba(0,206,201,0.06)' }}>
            Sign In to Your Account
          </Link>
          <Link href="/" style={{ fontSize: 13, color: '#8FA3BF', textDecoration: 'none' }}>← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      {/* LOGO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: -10, background: 'rgba(0,206,201,0.15)', filter: 'blur(16px)', borderRadius: '50%' }} />
          <Image src="/Charity token logo.jpg" alt="Charity Token" width={48} height={48} style={{ borderRadius: 12, position: 'relative', zIndex: 1 }} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(to right, #00CEC9, #00B894)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Charity Token
        </h1>
      </div>
      {/* FORM CARD */}
      <div style={{ backgroundColor: '#0F1F35', border: '1px solid rgba(0,206,201,0.2)', borderRadius: 20, padding: '32px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <RegistrationForm defaultRole={role} />
      </div>
      {/* BACK TO HOME */}
      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#8FA3BF' }}>
        <a href="/" style={{ color: '#67e8f9', textDecoration: 'none', fontWeight: 600 }}>← Back to Home</a>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', color: 'white', position: 'relative', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(0,206,201,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(0,184,148,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', zIndex: 10 }}>
        <Suspense fallback={<div style={{ color: '#67e8f9', fontSize: 14, textAlign: 'center' }}>Loading...</div>}>
          <RegisterContent />
        </Suspense>
      </main>
      <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '18px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#4A5568', marginBottom: 10 }}>© 2026 Charity Token Project. All rights reserved.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Link href="/terms" style={{ fontSize: 12, color: '#8FA3BF', textDecoration: 'none', padding: '5px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>Terms of Service</Link>
          <Link href="/privacy" style={{ fontSize: 12, color: '#8FA3BF', textDecoration: 'none', padding: '5px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}