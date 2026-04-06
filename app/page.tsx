'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Coins, Users, Shield, ArrowRight, Globe, FileText, XCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const MAX_BENEFICIARIES = 1000000;

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    activeBeneficiaries: 0,
    remainingSlots: MAX_BENEFICIARIES,
    isFull: false,
    loaded: false,
  });

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setStats({
            activeBeneficiaries: res.data.activeBeneficiaries,
            remainingSlots: res.data.remainingSlots,
            isFull: res.data.isFull,
            loaded: true,
          });
        }
      })
      .catch(() => setStats((s) => ({ ...s, loaded: true })));
  }, []);

  const formatNumber = (n: number) =>
    n >= 1000000 ? '1,000,000' : n.toLocaleString();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', color: 'white', fontFamily: 'sans-serif', position: 'relative', overflowX: 'hidden' }}>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, padding: '8px 16px', borderRadius: 999, border: '1px solid rgba(0,206,201,0.3)', color: '#67e8f9', background: 'rgba(0,206,201,0.08)', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText style={{ width: 13, height: 13 }} />
              Whitepaper
            </a>
            <button onClick={() => router.push('/login')} style={{ fontSize: 13, padding: '8px 18px', borderRadius: 999, border: '1px solid rgba(0,206,201,0.5)', color: '#67e8f9', background: 'transparent', cursor: 'pointer' }}>
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ paddingTop: 80, paddingBottom: 60, position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 540, margin: '0 auto', padding: '0 20px' }}>

          {/* REGISTRATION CLOSED BANNER */}
          {stats.isFull && (
            <div style={{ margin: '20px 0', padding: '14px 18px', borderRadius: 14, backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.4)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <XCircle style={{ width: 20, height: 20, color: '#ff6b6b', flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#ffb3b3', fontWeight: 600 }}>
                Registration is now closed. All 1,000,000 beneficiary slots have been filled.
              </p>
            </div>
          )}

          {/* HERO */}
          <section style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: -20, background: 'rgba(0,206,201,0.15)', filter: 'blur(24px)', borderRadius: '50%' }} />
                <Image src="/Charity token logo.jpg" alt="Charity Token Logo" width={110} height={110} style={{ borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', position: 'relative', zIndex: 1 }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999, border: '1px solid rgba(0,206,201,0.3)', backgroundColor: 'rgba(0,206,201,0.1)', color: '#67e8f9', fontSize: 12, fontWeight: 500 }}>
                <Globe style={{ width: 12, height: 12 }} />
                Empowering 1 Million People Worldwide
              </div>
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' }}>
              Empowering Lives{' '}
              <span style={{ background: 'linear-gradient(to right, #00CEC9, #00B894)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Through Impact
              </span>
            </h1>
            <p style={{ color: '#8FA3BF', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
              Receive 500 Charity Tokens monthly for 10 years.<br />
              Own a piece of the future and join a global humanitarian movement.
            </p>
            {!stats.isFull ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <button onClick={() => router.push('/register?role=beneficiary')} style={{ width: '100%', maxWidth: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,206,201,0.3)' }}>
                  Get Started <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
                <button onClick={() => router.push('/login')} style={{ width: '100%', maxWidth: 360, padding: '14px 32px', borderRadius: 14, border: '1.5px solid rgba(0,206,201,0.4)', color: '#67e8f9', background: 'transparent', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                  Sign In
                </button>
              </div>
            ) : (
              <button onClick={() => router.push('/login')} style={{ width: '100%', maxWidth: 360, padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', margin: '0 auto', display: 'block' }}>
                Sign In to Your Account
              </button>
            )}
          </section>

          {/* REAL STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { value: stats.loaded ? formatNumber(stats.activeBeneficiaries) : '...', label: 'Beneficiaries', sub: `${stats.loaded ? formatNumber(stats.remainingSlots) : '...'} slots left` },
              { value: '500', label: 'Tokens/Month', sub: 'Per beneficiary' },
              { value: '10', label: 'Years', sub: 'Starting 2027' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center', padding: '16px 8px', borderRadius: 16, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: s.value.length > 5 ? 16 : 22, fontWeight: 800, background: 'linear-gradient(to right, #00CEC9, #00B894)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</p>
                <p style={{ fontSize: 11, color: '#8FA3BF', marginTop: 3 }}>{s.label}</p>
                <p style={{ fontSize: 10, color: '#4A5568', marginTop: 2 }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* PROGRESS BAR */}
          {stats.loaded && (
            <div style={{ marginBottom: 24, padding: '16px 20px', borderRadius: 16, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#8FA3BF', fontWeight: 600 }}>Beneficiary Slots Filled</span>
                <span style={{ fontSize: 12, color: '#67e8f9', fontWeight: 700 }}>{((stats.activeBeneficiaries / MAX_BENEFICIARIES) * 100).toFixed(2)}%</span>
              </div>
              <div style={{ width: '100%', height: 8, backgroundColor: 'rgba(0,206,201,0.1)', borderRadius: 999 }}>
                <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(to right, #00CEC9, #00B894)', width: `${Math.min((stats.activeBeneficiaries / MAX_BENEFICIARIES) * 100, 100)}%`, transition: 'width 1s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: '#4A5568' }}>{formatNumber(stats.activeBeneficiaries)} joined</span>
                <span style={{ fontSize: 11, color: '#4A5568' }}>{formatNumber(MAX_BENEFICIARIES)} goal</span>
              </div>
            </div>
          )}

          {/* FEATURE CARDS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            {[
              { icon: <Coins style={{ width: 20, height: 20, color: '#00CEC9' }} />, bg: 'rgba(0,206,201,0.15)', title: 'Monthly Reward', value: '500 Tokens', desc: 'Distributed every month for 10 years, starting 2027 — guaranteed.' },
              { icon: <Users style={{ width: 20, height: 20, color: '#00B894' }} />, bg: 'rgba(0,184,148,0.15)', title: 'Global Community', value: '1,000,000', desc: 'People empowered across every region of the world.' },
              { icon: <Shield style={{ width: 20, height: 20, color: '#67e8f9' }} />, bg: 'rgba(103,232,249,0.15)', title: 'Secure & Transparent', value: '100B Supply', desc: 'Fixed token supply. No inflation. Built on blockchain.' },
            ].map((card) => (
              <div key={card.title} style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.icon}</div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>{card.title}</span>
                </div>
                <p style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 6 }}>{card.value}</p>
                <p style={{ fontSize: 12, color: '#8FA3BF' }}>{card.desc}</p>
              </div>
            ))}
          </div>

          {/* WHITEPAPER BANNER */}
          <a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderRadius: 16, border: '1px solid rgba(0,206,201,0.3)', background: 'linear-gradient(135deg, rgba(0,206,201,0.08) 0%, rgba(0,184,148,0.08) 100%)', textDecoration: 'none', marginBottom: 24, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText style={{ width: 22, height: 22, color: '#00CEC9' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 3 }}>Read our Whitepaper</p>
                <p style={{ fontSize: 12, color: '#8FA3BF' }}>Learn about our vision, tokenomics & roadmap</p>
              </div>
            </div>
            <ArrowRight style={{ width: 18, height: 18, color: '#00CEC9', flexShrink: 0 }} />
          </a>

          {/* BOTTOM CTA */}
          {!stats.isFull && (
            <button onClick={() => router.push('/register?role=beneficiary')} style={{ width: '100%', padding: '16px', borderRadius: 14, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,206,201,0.25)' }}>
              Become a Beneficiary
            </button>
          )}

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
  );
}