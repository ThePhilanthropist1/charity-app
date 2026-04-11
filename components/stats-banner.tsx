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
  const [isMobile, setIsMobile] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    const compute = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile) setShowPreview(false);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── MOBILE SUMMARY CARDS (visible on mobile instead of full preview) ── */}
      {isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'New (24h)', value: fmt(activeLast24h), color: '#00CEC9', bg: 'rgba(0,206,201,0.08)', border: 'rgba(0,206,201,0.2)' },
            { label: 'Total Members', value: fmt(totalActivated), color: '#00B894', bg: 'rgba(0,184,148,0.08)', border: 'rgba(0,184,148,0.2)' },
            { label: 'Philanthropists', value: fmt(activePhilanthropists), color: '#67e8f9', bg: 'rgba(103,232,249,0.08)', border: 'rgba(103,232,249,0.2)' },
            { label: 'Goal', value: (goalPercent < 1 ? goalPercent.toFixed(2) : goalPercent.toFixed(1)) + '%', color: '#ffc107', bg: 'rgba(255,193,7,0.08)', border: 'rgba(255,193,7,0.2)' },
          ].map((s) => (
            <div key={s.label} style={{ padding: '16px 12px', borderRadius: 14, border: `1px solid ${s.border}`, backgroundColor: s.bg, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#8FA3BF', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{s.label}</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── PROGRESS BAR (mobile) ── */}
      {isMobile && (
        <div style={{ padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#8FA3BF', fontWeight: 600 }}>Community Progress</span>
            <span style={{ fontSize: 12, color: '#67e8f9', fontWeight: 700 }}>{totalActivated.toLocaleString()} / 1,000,000</span>
          </div>
          <div style={{ height: 8, backgroundColor: 'rgba(0,206,201,0.1)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${barWidth}%`, background: 'linear-gradient(to right, #00CEC9, #00B894)', borderRadius: 999, minWidth: barWidth > 0 ? 4 : 0 }} />
          </div>
          <p style={{ fontSize: 11, color: '#4A5568', marginTop: 6, textAlign: 'right' }}>{remaining} slots remaining</p>
        </div>
      )}

      {/* ── PREVIEW TOGGLE (mobile only) ── */}
      {isMobile && (
        <button
          onClick={() => setShowPreview(!showPreview)}
          style={{ width: '100%', padding: '11px', borderRadius: 10, border: '1px solid rgba(0,206,201,0.25)', backgroundColor: 'rgba(0,206,201,0.06)', color: '#67e8f9', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          {showPreview ? '▲ Hide Banner Preview' : '▼ Preview Banner (1080×1080)'}
        </button>
      )}

      {/* ── BANNER PREVIEW SHELL ── */}
      {showPreview && (
        <div
          ref={shellRef}
          style={{
            width: '100%',
            position: 'relative',
            paddingBottom: '100%',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(0,206,201,0.2)',
            backgroundColor: '#060f1e',
          }}
        >
          {/* 1080×1080 canvas scaled to fit */}
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
            {/* BG CIRCLES */}
            <div style={{ position: 'absolute', top: -200, right: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,206,201,0.08) 0%, transparent 70%)' }} />
            <div style={{ position: 'absolute', bottom: -200, left: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,184,148,0.07) 0%, transparent 70%)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 900, height: 900, borderRadius: '50%', border: '1px solid rgba(0,206,201,0.05)' }} />

            {/* TOP ACCENT */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(to right, #00CEC9, #00B894, #00CEC9)' }} />

            <div style={{ padding: '72px 80px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

              {/* HEADER */}
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
                {[
                  { label: 'New Beneficiaries', sub: 'Last 24 Hours', value: fmt(activeLast24h), note: 'activated accounts', color: '#00CEC9', bg: 'rgba(0,206,201,0.12)', border: 'rgba(0,206,201,0.25)', bar: 'linear-gradient(to right, #00CEC9, #00B894)' },
                  { label: 'Total Beneficiaries', sub: 'All Time', value: fmt(totalActivated), note: remaining + ' slots remaining', color: '#00B894', bg: 'rgba(0,184,148,0.12)', border: 'rgba(0,184,148,0.25)', bar: 'linear-gradient(to right, #00B894, #00CEC9)' },
                  { label: 'Active Philanthropists', sub: 'Verified & Active', value: fmt(activePhilanthropists), note: 'community builders', color: '#67e8f9', bg: 'rgba(103,232,249,0.10)', border: 'rgba(103,232,249,0.2)', bar: 'linear-gradient(to right, #67e8f9, #00CEC9)' },
                  { label: 'Goal Progress', sub: 'Towards 1,000,000', value: (goalPercent < 1 ? goalPercent.toFixed(2) : goalPercent.toFixed(1)) + '%', note: '', color: '#ffc107', bg: 'rgba(255,193,7,0.10)', border: 'rgba(255,193,7,0.2)', bar: 'linear-gradient(to right, #ffc107, #ff9800)', showBar: true },
                ].map((card) => (
                  <div key={card.label} style={{ padding: '44px 40px', borderRadius: 28, background: `linear-gradient(135deg, ${card.bg} 0%, transparent 100%)`, border: `1px solid ${card.border}`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: card.bar }} />
                    <p style={{ fontSize: 16, color: '#8FA3BF', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 16px' }}>{card.label}</p>
                    <p style={{ fontSize: 15, color: card.color, fontWeight: 600, margin: '0 0 8px' }}>{card.sub}</p>
                    <p style={{ fontSize: 96, fontWeight: 900, color: card.color, margin: 0, lineHeight: 1 }}>{card.value}</p>
                    {card.note && <p style={{ fontSize: 16, color: '#4A5568', marginTop: 12 }}>{card.note}</p>}
                    {card.showBar && (
                      <div style={{ marginTop: 16, height: 10, backgroundColor: 'rgba(255,193,7,0.15)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barWidth}%`, background: card.bar, borderRadius: 999, minWidth: barWidth > 0 ? 8 : 0 }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* PROGRESS + FOOTER */}
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
      )}

      {/* DOWNLOAD BUTTON */}
      <button
        onClick={downloadBanner}
        disabled={downloading}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 24px', borderRadius: 14, background: downloading ? 'rgba(0,206,201,0.2)' : 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.7 : 1, boxShadow: '0 8px 24px rgba(0,206,201,0.25)', width: '100%' }}
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
      <p style={{ fontSize: 12, color: '#4A5568', textAlign: 'center', marginTop: -8 }}>
        Square format · Ready for Instagram, Twitter, Facebook & Telegram
      </p>
    </div>
  );
}