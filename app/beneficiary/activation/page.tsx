'use client';
import { BeneficiaryActivationFlow } from '@/components/beneficiary-dashboard';
import { ProtectedRoute } from '@/components/protected-route';
import Image from 'next/image';
import Link from 'next/link';

export default function ActivationPage() {
  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', color: 'white', position: 'relative', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* DECORATIVE BACKGROUND */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(0,206,201,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(0,184,148,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        </div>

        {/* HEADER */}
        <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,22,40,0.92)', backdropFilter: 'blur(12px)' }}>
          <div style={{ maxWidth: 580, margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Image src="/Charity token logo.jpg" alt="Charity Token" width={36} height={36} style={{ borderRadius: 8 }} />
              <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>Charity Token</span>
            </div>
            <a href="/" style={{ fontSize: 13, color: '#67e8f9', textDecoration: 'none' }}>← Home</a>
          </div>
        </header>

        {/* MAIN */}
        <main style={{ flex: 1, paddingTop: 80, paddingBottom: 60, position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 580, margin: '0 auto', padding: '0 20px' }}>
            <div style={{ textAlign: 'center', paddingTop: 32, paddingBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999, border: '1px solid rgba(0,206,201,0.3)', backgroundColor: 'rgba(0,206,201,0.1)', color: '#67e8f9', fontSize: 12, fontWeight: 500 }}>
                  🎉 Almost there — activate your account
                </div>
              </div>
              <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 10 }}>
                Activate Your{' '}
                <span style={{ background: 'linear-gradient(to right, #00CEC9, #00B894)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Charity Account
                </span>
              </h1>
              <p style={{ color: '#8FA3BF', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                Choose a payment method below to activate and start receiving<br />500 Charity Tokens every month for 10 years.
              </p>

              {/* HOW WE USE YOUR $1 BUTTON */}
              <Link href="/how-we-use-your-dollar" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '14px 28px', borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(255,208,0,0.12), rgba(0,206,201,0.08))',
                  border: '1.5px solid rgba(255,208,0,0.35)',
                  cursor: 'pointer', marginBottom: 8,
                  transition: 'all 0.2s ease',
                }}>
                  <span style={{ fontSize: 18 }}>💡</span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#FFD000', margin: 0, letterSpacing: 0.2 }}>
                      Wondering where your $1 goes?
                    </p>
                    <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0, marginTop: 2 }}>
                      See our full transparent fund allocation →
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            <BeneficiaryActivationFlow />
          </div>
        </main>

        {/* FOOTER */}
        <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '18px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#4A5568', marginBottom: 10 }}>© 2026 Charity Token Project. All rights reserved.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Link href="/terms" style={{ fontSize: 12, color: '#8FA3BF', textDecoration: 'none', padding: '5px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              Terms of Service
            </Link>
            <Link href="/privacy" style={{ fontSize: 12, color: '#8FA3BF', textDecoration: 'none', padding: '5px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              Privacy Policy
            </Link>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}