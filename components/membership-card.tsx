'use client';

import { useRef, useState, useEffect } from 'react';
import { Download, AlertCircle } from 'lucide-react';

interface MembershipCardProps {
  userId: string;
  fullName: string;
  email: string;
  profileImage?: string;
  joinDate: string;
  country?: string;
  isActivated?: boolean;
}

export function MembershipCard({
  userId, fullName, email, profileImage, joinDate, country, isActivated = true
}: MembershipCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cardWidth, setCardWidth] = useState(480);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const memberId = 'CT-' + userId.substring(0, 6).toUpperCase() + '-' + new Date(joinDate).getFullYear();

  // Credit card ratio: 85.6mm × 53.98mm = 1.586:1
  const RATIO = 1.586;

  // Measure the wrapper width so we can set explicit pixel height
  useEffect(() => {
    if (!wrapperRef.current) return;
    const obs = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) setCardWidth(Math.min(w, 480));
    });
    obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, []);

  const cardHeight = Math.round(cardWidth / RATIO);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setError('');
    setLoading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;

      // Wait for fonts + images to fully render
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 600));

      // Capture at 3× for a crisp high-res PNG
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale:           3,
        logging:         false,
        useCORS:         true,
        allowTaint:      true,
        width:           cardRef.current.offsetWidth,
        height:          cardRef.current.offsetHeight,
        windowWidth:     cardRef.current.offsetWidth,
        windowHeight:    cardRef.current.offsetHeight,
      });

      const a = document.createElement('a');
      a.href     = canvas.toDataURL('image/png');
      a.download = 'charity-token-membership-' + userId + '.png';
      a.click();
    } catch (e) {
      console.error('Download error:', e);
      setError('Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!profileImage) {
    return (
      <div style={{ padding: 18, borderRadius: 14, border: '1px solid rgba(255,193,7,0.3)', backgroundColor: 'rgba(255,193,7,0.06)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertCircle style={{ width: 18, height: 18, color: '#ffc107', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontWeight: 700, color: 'white', marginBottom: 4, fontSize: 13 }}>Upload Profile Picture to Generate ID Card</p>
          <p style={{ fontSize: 12, color: '#8FA3BF', lineHeight: 1.6 }}>Your membership card will appear here once you upload a profile photo.</p>
        </div>
      </div>
    );
  }

  // Scale fonts/sizes proportionally to card width
  const s = cardWidth / 480;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <p style={{ fontSize: 12, color: '#ff6b6b', textAlign: 'center', margin: 0 }}>{error}</p>}

      {/* Wrapper — measures available width */}
      <div ref={wrapperRef} style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>

        {/* ── THE CARD — explicit pixel width AND height, no aspectRatio ── */}
        <div
          ref={cardRef}
          style={{
            width:        cardWidth,
            height:       cardHeight,
            borderRadius: Math.round(16 * s),
            overflow:     'hidden',
            position:     'relative',
            fontFamily:   'Arial, Helvetica, sans-serif',
            background:   'linear-gradient(135deg, #e6faf8 0%, #ffffff 45%, #e6faf8 100%)',
            border:       `${Math.max(2, Math.round(2.5 * s))}px solid #00CEC9`,
            boxShadow:    '0 8px 32px rgba(0,206,201,0.18)',
            boxSizing:    'border-box',
            flexShrink:   0,
          }}
        >
          {/* Decorative blobs */}
          <div style={{ position: 'absolute', top: -50 * s, right: -50 * s, width: 180 * s, height: 180 * s, borderRadius: '50%', background: 'rgba(0,206,201,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40 * s, left: -40 * s, width: 150 * s, height: 150 * s, borderRadius: '50%', background: 'rgba(0,184,148,0.06)', pointerEvents: 'none' }} />

          {/* Top accent bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: Math.round(7 * s), background: 'linear-gradient(to right, #00CEC9, #00B894, #00CEC9)', zIndex: 2 }} />

          {/* Content — fills between top and bottom bars */}
          <div style={{
            position:       'absolute',
            top:            Math.round(7 * s),
            bottom:         Math.round(5 * s),
            left:           0,
            right:          0,
            padding:        `${Math.round(10 * s)}px ${Math.round(16 * s)}px`,
            display:        'flex',
            flexDirection:  'column',
            justifyContent: 'space-between',
            boxSizing:      'border-box',
          }}>

            {/* ROW 1: Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(8 * s) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/Charity token logo.jpg"
                  alt="CT"
                  style={{ width: Math.round(36 * s), height: Math.round(36 * s), borderRadius: Math.round(8 * s), objectFit: 'cover', border: `${Math.max(1, Math.round(1.5 * s))}px solid rgba(0,206,201,0.35)`, flexShrink: 0, display: 'block' }}
                  crossOrigin="anonymous"
                />
                <div style={{ lineHeight: 1 }}>
                  <p style={{ fontSize: Math.round(12 * s), fontWeight: 900, color: '#007B8A', margin: 0, letterSpacing: 1 }}>CHARITY TOKEN</p>
                  <p style={{ fontSize: Math.round(8 * s),  fontWeight: 700, color: '#5eadb5', margin: `${Math.round(2 * s)}px 0 0`, letterSpacing: 0.6 }}>MEMBERSHIP CARD</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: Math.round(8 * s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(1 * s)}px`, letterSpacing: 0.5 }}>MEMBER ID</p>
                <p style={{ fontSize: Math.round(11 * s), fontFamily: 'monospace', fontWeight: 900, color: '#007B8A', margin: 0 }}>{memberId}</p>
              </div>
            </div>

            {/* Thin divider */}
            <div style={{ height: 1, background: 'linear-gradient(to right, rgba(0,206,201,0.25), rgba(0,184,148,0.25))', flexShrink: 0 }} />

            {/* ROW 2: Photo + Details */}
            <div style={{ display: 'flex', gap: Math.round(14 * s), alignItems: 'center', flex: 1, minHeight: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profileImage}
                alt={fullName}
                style={{ width: Math.round(88 * s), height: Math.round(88 * s), borderRadius: Math.round(10 * s), objectFit: 'cover', border: `${Math.max(2, Math.round(2.5 * s))}px solid #00CEC9`, flexShrink: 0, display: 'block' }}
                crossOrigin="anonymous"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: Math.round(8 * s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(1 * s)}px`, letterSpacing: 0.7, textTransform: 'uppercase' }}>Full Name</p>
                <p style={{ fontSize: Math.round(16 * s), fontWeight: 900, color: '#111827', margin: `0 0 ${Math.round(6 * s)}px`, lineHeight: 1.15, wordBreak: 'break-word' }}>
                  {fullName || 'Beneficiary'}
                </p>
                <p style={{ fontSize: Math.round(8 * s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(1 * s)}px`, letterSpacing: 0.7, textTransform: 'uppercase' }}>Email</p>
                <p style={{ fontSize: Math.round(9.5 * s), fontWeight: 700, color: '#0369a1', margin: `0 0 ${Math.round(5 * s)}px`, lineHeight: 1.3, wordBreak: 'break-all', textDecoration: 'none' }}>
                  {email}
                </p>
                {country && (
                  <p style={{ fontSize: Math.round(9.5 * s), fontWeight: 600, color: '#5eadb5', margin: 0 }}>📍 {country}</p>
                )}
              </div>
            </div>

            {/* ROW 3: Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1.5px solid #A7F3D0`, paddingTop: Math.round(7 * s), flexShrink: 0 }}>
              <div>
                <p style={{ fontSize: Math.round(7.5 * s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(1 * s)}px`, letterSpacing: 0.5 }}>MEMBER SINCE</p>
                <p style={{ fontSize: Math.round(12 * s), fontWeight: 900, color: '#111827', margin: 0 }}>
                  {new Date(joinDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: Math.round(7.5 * s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(3 * s)}px`, letterSpacing: 0.5 }}>STATUS</p>
                <div style={{
                  display: 'inline-block',
                  fontSize: Math.round(9 * s), fontWeight: 900,
                  padding: `${Math.round(3 * s)}px ${Math.round(10 * s)}px`,
                  borderRadius: 999, letterSpacing: 0.4,
                  backgroundColor: isActivated ? '#D1FAE5' : '#FEF3C7',
                  color:           isActivated ? '#065F46' : '#92400E',
                  border:          `1.5px solid ${isActivated ? '#6EE7B7' : '#FDE68A'}`,
                }}>
                  {isActivated ? 'ACTIVE' : 'PENDING'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: Math.round(7.5 * s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(1 * s)}px`, letterSpacing: 0.5 }}>MONTHLY</p>
                <p style={{ fontSize: Math.round(17 * s), fontWeight: 900, color: '#065F46', margin: 0, lineHeight: 1 }}>500 CT</p>
              </div>
            </div>
          </div>

          {/* Bottom accent bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: Math.round(5 * s), background: 'linear-gradient(to right, #00B894, #00CEC9, #00B894)', zIndex: 2 }} />
        </div>
      </div>

      {/* Download button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={downloadCard}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 28px', borderRadius: 12,
            background: 'linear-gradient(to right, #00CEC9, #00B894)',
            color: 'white', fontWeight: 700, fontSize: 14, border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            boxShadow: '0 8px 24px rgba(0,206,201,0.25)',
          }}
        >
          <Download style={{ width: 16, height: 16 }} />
          {loading ? 'Generating...' : 'Download ID Card'}
        </button>
      </div>
    </div>
  );
}