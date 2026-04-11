'use client';

import { useRef, useState, useEffect } from 'react';

interface StatsBannerProps {
  activeLast24h: number;
  totalActivated: number;
  activePhilanthropists: number;
  goalPercent: number;
  generatedAt: string;
}

export function StatsBanner({
  activeLast24h,
  totalActivated,
  activePhilanthropists,
  goalPercent,
  generatedAt,
}: StatsBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);
  const [downloading, setDownloading] = useState(false);

  // Dynamically compute scale so banner fills its container perfectly
  useEffect(() => {
    const compute = () => {
      if (!shellRef.current) return;
      const w = shellRef.current.offsetWidth;
      setScale(w / 1080);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const downloadBanner = async () => {
    if (!bannerRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(bannerRef.current, {
        backgroundColor: '#060f1e',
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 1080,
        height: 1080,
      });
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = canvas.toDataURL('image/png');
      link.download = `charity-token-stats-${dateStr}.png`;
      link.click();
    } catch (e) {
      console.error('Banner download error:', e);
    } finally {
      setDownloading(false);
    }
  };

  const barWidth = Math.min(goalPercent, 100);
  const remaining = (1000000 - totalActivated).toLocaleString();

  const fmt = (n: number) =>
    n >= 1000000 ? '1M' :
    n >= 1000 ? (n / 1000).toFixed(1) + 'K' :
    n.toLocaleString();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>

      {/* ── PREVIEW SHELL — full width, square aspect ratio ── */}
      <div
        ref={shellRef}
        style={{
          width: '100%',
          position: 'relative',
          paddingBottom: '100%', // 1:1 aspect ratio
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(0,206,201,0.2)',
          backgroundColor: '#060f1e',
        }}
      >
        {/* ── ACTUAL BANNER (1080×1080) scaled to fit shell ── */}
        <div
          ref={bannerRef}
          style={{
            width: 1080,
            height: 1080,
            position: 'absolute',
            top: 0,
            left: 0,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
            background: 'linear-gradient(145deg, #060f1e 0%, #091828 40%, #060f1e 100%)',
            fontFamily: 'Arial, Helvetica, sans-serif',
            overflow: 'hidden',
          }}
        >
          {/* BG DECORATIVE CIRCLES */}
          <div style={{ position: 'absolute', top: -200, right: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,206,201,0.08) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: -200, left: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,184,148,0.07) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 900, height: 900, borderRadius: '50%', border: '1px solid rgba(0,206,201,0.05)' }} />

          {/* TOP ACCENT */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(to right, #00CEC9, #00B894, #00CEC9)' }} />

          <div style={{ padding: '72px 80px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

            {/* HEADER ROW */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <img src="/Charity token logo.jpg" alt="CT" style={{ width: 70, height: 70, borderRadius: 18, border: '2px solid rgba(0,206,201,0.4)' }} crossOrigin="anonymous" />
                <div>
                  <p style={{ fontSize: 32, fontWeight: 900, color: 'white', margin: 0, letterSpacing: 0.5 }}>CHARITY TOKEN</p>
                  <p style={{ fontSize: 16, color: '#00CEC9', margin: 0, letterSpacing: 2, fontWeight: 600 }}>PROJECT</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ padding: '10px 22px', borderRadius: 999, border: '1px solid rgba(0,206,201,0.3)', backgroundColor: 'rgba(0,206,201,0.08)' }}>
                  <p style={{ fontSize: 15, color: '#67e8f9', fontWeight: 700, margin: 0, letterSpacing: 1 }}>DAILY STATS UPDATE</p>
                </div>
                <p style={{ fontSize: 14, color: '#4A5568', marginTop: 10 }}>{generatedAt}</p>
              </div>
            </div>

            {/* TAGLINE */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 22, color: '#8FA3BF', letterSpacing: 3, textTransform: 'uppercase', fontWeight: 600, marginBottom: 16 }}>Empowering One Million Lives</p>
              <div style={{ display: 'inline-block', padding: '6px 28px', borderRadius: 999, background: 'linear-gradient(to right, rgba(0,206,201,0.15), rgba(0,184,148,0.15))', border: '1px solid rgba(0,206,201,0.3)' }}>
                <p style={{ fontSize: 18, color: '#67e8f9', fontWeight: 700, margin: 0, letterSpacing: 1 }}>BUILDING TOGETHER · ONE COMMUNITY · ONE MISSION</p>
              </div>
            </div>

            {/* STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }}>

              {/* Card 1 — 24h */}
              <div style={{ padding: '44px 40px', borderRadius: 28, background: 'linear-gradient(135deg, rgba(0,206,201,0.12) 0%, rgba(0,206,201,0.04) 100%)', border: '1px solid rgba(0,206,201,0.25)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(to right, #00CEC9, #00B894)' }} />
                <p style={{ fontSize: 16, color: '#8FA3BF', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 16px' }}>New Beneficiaries</p>
                <p style={{ fontSize: 15, color: '#67e8f9', fontWeight: 600, margin: '0 0 8px' }}>Last 24 Hours</p>
                <p style={{ fontSize: 96, fontWeight: 900, color: '#00CEC9', margin: 0, lineHeight: 1 }}>{fmt(activeLast24h)}</p>
                <p style={{ fontSize: 16, color: '#4A5568', marginTop: 12 }}>activated accounts</p>
              </div>

              {/* Card 2 — Total */}
              <div style={{ padding: '44px 40px', borderRadius: 28, background: 'linear-gradient(135deg, rgba(0,184,148,0.12) 0%, rgba(0,184,148,0.04) 100%)', border: '1px solid rgba(0,184,148,0.25)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(to right, #00B894, #00CEC9)' }} />
                <p style={{ fontSize: 16, color: '#8FA3BF', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 16px' }}>Total Beneficiaries</p>
                <p style={{ fontSize: 15, color: '#00B894', fontWeight: 600, margin: '0 0 8px' }}>All Time</p>
                <p style={{ fontSize: totalActivated >= 100000 ? 72 : 96, fontWeight: 900, color: '#00B894', margin: 0, lineHeight: 1 }}>{fmt(totalActivated)}</p>
                <p style={{ fontSize: 16, color: '#4A5568', marginTop: 12 }}>{remaining} slots remaining</p>
              </div>

              {/* Card 3 — Philanthropists */}
              <div style={{ padding: '44px 40px', borderRadius: 28, background: 'linear-gradient(135deg, rgba(103,232,249,0.1) 0%, rgba(103,232,249,0.03) 100%)', border: '1px solid rgba(103,232,249,0.2)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(to right, #67e8f9, #00CEC9)' }} />
                <p style={{ fontSize: 16, color: '#8FA3BF', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 16px' }}>Active Philanthropists</p>
                <p style={{ fontSize: 15, color: '#67e8f9', fontWeight: 600, margin: '0 0 8px' }}>Verified & Active</p>
                <p style={{ fontSize: 96, fontWeight: 900, color: '#67e8f9', margin: 0, lineHeight: 1 }}>{fmt(activePhilanthropists)}</p>
                <p style={{ fontSize: 16, color: '#4A5568', marginTop: 12 }}>community builders</p>
              </div>

              {/* Card 4 — Goal % */}
              <div style={{ padding: '44px 40px', borderRadius: 28, background: 'linear-gradient(135deg, rgba(255,193,7,0.1) 0%, rgba(255,193,7,0.03) 100%)', border: '1px solid rgba(255,193,7,0.2)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(to right, #ffc107, #ff9800)' }} />
                <p style={{ fontSize: 16, color: '#8FA3BF', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 16px' }}>Goal Progress</p>
                <p style={{ fontSize: 15, color: '#ffc107', fontWeight: 600, margin: '0 0 8px' }}>Towards 1,000,000</p>
                <p style={{ fontSize: 96, fontWeight: 900, color: '#ffc107', margin: 0, lineHeight: 1 }}>
                  {goalPercent < 1 ? goalPercent.toFixed(2) : goalPercent.toFixed(1)}
                  <span style={{ fontSize: 48 }}>%</span>
                </p>
                <div style={{ marginTop: 16, height: 10, backgroundColor: 'rgba(255,193,7,0.15)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${barWidth}%`, background: 'linear-gradient(to right, #ffc107, #ff9800)', borderRadius: 999, minWidth: barWidth > 0 ? 8 : 0 }} />
                </div>
              </div>
            </div>

            {/* PROGRESS BAR + FOOTER */}
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontSize: 18, color: '#8FA3BF', fontWeight: 600, margin: 0 }}>Community Progress</p>
                  <p style={{ fontSize: 18, color: '#67e8f9', fontWeight: 700, margin: 0 }}>{totalActivated.toLocaleString()} / 1,000,000</p>
                </div>
                <div style={{ height: 16, backgroundColor: 'rgba(0,206,201,0.1)', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(0,206,201,0.15)' }}>
                  <div style={{ height: '100%', width: `${barWidth}%`, background: 'linear-gradient(to right, #00CEC9, #00B894)', borderRadius: 999, minWidth: barWidth > 0 ? 8 : 0 }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1px solid rgba(0,206,201,0.15)' }}>
                <div>
                  <p style={{ fontSize: 20, color: '#00CEC9', fontWeight: 800, margin: 0 }}>charitytoken.net</p>
                  <p style={{ fontSize: 15, color: '#4A5568', margin: '4px 0 0' }}>t.me/CharityTokenProject1</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 14, color: '#4A5568', margin: 0 }}>Not a financial product. Community support only.</p>
                  <p style={{ fontSize: 13, color: '#2d3748', margin: '4px 0 0' }}>© 2026 Charity Token Project. All Rights Reserved.</p>
                </div>
              </div>
            </div>

          </div>

          {/* BOTTOM ACCENT */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(to right, #00B894, #00CEC9, #00B894)' }} />
        </div>
      </div>

      {/* DOWNLOAD BUTTON */}
      <button
        onClick={downloadBanner}
        disabled={downloading}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 32px', borderRadius: 14, background: downloading ? 'rgba(0,206,201,0.2)' : 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.7 : 1, boxShadow: '0 8px 24px rgba(0,206,201,0.25)', width: '100%' }}
      >
        {downloading ? (
          <>
            <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            Generating PNG...
          </>
        ) : (
          '⬇️ Download Stats Banner (PNG 1080×1080)'
        )}
      </button>
      <p style={{ fontSize: 12, color: '#4A5568', textAlign: 'center', marginTop: -8 }}>Square format · Ready for Instagram, Twitter, Facebook & Telegram</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}