'use client';

import { Suspense } from 'react';
import { RegistrationForm } from '@/components/registration-form';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

function RegisterContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'beneficiary';

  return (
    <div style={{ width: '100%', maxWidth: 480 }}>

      {/* LOGO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: -10, background: 'rgba(0,206,201,0.15)', filter: 'blur(16px)', borderRadius: '50%' }} />
          <Image
            src="/Charity token logo.jpg"
            alt="Charity Token"
            width={48}
            height={48}
            style={{ borderRadius: 12, position: 'relative', zIndex: 1 }}
          />
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

      {/* DECORATIVE BACKGROUND */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(0,206,201,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(0,184,148,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', zIndex: 10 }}>
        <Suspense fallback={
          <div style={{ color: '#67e8f9', fontSize: 14, textAlign: 'center' }}>Loading...</div>
        }>
          <RegisterContent />
        </Suspense>
      </main>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#4A5568' }}>© 2026 Charity Token Project. All rights reserved.</p>
      </footer>

    </div>
  );
}