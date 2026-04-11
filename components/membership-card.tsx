'use client';

import { useRef, useState } from 'react';
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
  const cardRef = useRef<HTMLDivElement>(null);

  const memberId = 'CT-' + userId.substring(0, 6).toUpperCase() + '-' + new Date(joinDate).getFullYear();

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setError('');
    setLoading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;

      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 500));

      const W = 960;
      const H = 605;

      const clone = cardRef.current.cloneNode(true) as HTMLElement;
      Object.assign(clone.style, {
        position:    'fixed',
        top:         '-99999px',
        left:        '-99999px',
        width:       W + 'px',
        height:      H + 'px',
        aspectRatio: 'unset',
        margin:      '0',
        borderRadius:'16px',
        overflow:    'hidden',
      });
      document.body.appendChild(clone);
      await new Promise(r => setTimeout(r, 150));

      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff',
        scale:           2,
        logging:         false,
        useCORS:         true,
        allowTaint:      true,
        width:           W,
        height:          H,
      });
      document.body.removeChild(clone);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <p style={{ fontSize: 12, color: '#ff6b6b', textAlign: 'center', margin: 0 }}>{error}</p>}

      {/* ── THE CARD ── */}
      <div
        ref={cardRef}
        style={{
          width:        '100%',
          maxWidth:     480,
          aspectRatio:  '1.586',
          margin:       '0 auto',
          borderRadius: 16,
          overflow:     'hidden',
          position:     'relative',
          fontFamily:   'Arial, Helvetica, sans-serif',
          background:   'linear-gradient(135deg, #e6faf8 0%, #ffffff 45%, #e6faf8 100%)',
          border:       '2.5px solid #00CEC9',
          boxShadow:    '0 8px 32px rgba(0,206,201,0.18)',
          boxSizing:    'border-box',
        }}
      >
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(0,206,201,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(0,184,148,0.06)', pointerEvents: 'none' }} />

        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 7, background: 'linear-gradient(to right, #00CEC9, #00B894, #00CEC9)', zIndex: 2 }} />

        {/* Content area — fills between top and bottom bars */}
        <div style={{
          position:       'absolute',
          top:            7,
          bottom:         5,
          left:           0,
          right:          0,
          padding:        '10px 16px',
          display:        'flex',
          flexDirection:  'column',
          justifyContent: 'space-between',
          boxSizing:      'border-box',
        }}>

          {/* ROW 1: Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Charity token logo.jpg"
                alt="CT"
                style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1.5px solid rgba(0,206,201,0.35)', flexShrink: 0, display: 'block' }}
                crossOrigin="anonymous"
              />
              <div style={{ lineHeight: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 900, color: '#007B8A', margin: 0, letterSpacing: 1 }}>CHARITY TOKEN</p>
                <p style={{ fontSize: 8,  fontWeight: 700, color: '#5eadb5', margin: '2px 0 0', letterSpacing: 0.6 }}>MEMBERSHIP CARD</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 8, fontWeight: 700, color: '#9CA3AF', margin: '0 0 1px', letterSpacing: 0.5 }}>MEMBER ID</p>
              <p style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 900, color: '#007B8A', margin: 0 }}>{memberId}</p>
            </div>
          </div>

          {/* Thin divider */}
          <div style={{ height: 1, background: 'linear-gradient(to right, rgba(0,206,201,0.25), rgba(0,184,148,0.25))', flexShrink: 0 }} />

          {/* ROW 2: Photo + Details */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1, minHeight: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profileImage}
              alt={fullName}
              style={{ width: 88, height: 88, borderRadius: 10, objectFit: 'cover', border: '2.5px solid #00CEC9', flexShrink: 0, display: 'block' }}
              crossOrigin="anonymous"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 8, fontWeight: 700, color: '#9CA3AF', margin: '0 0 1px', letterSpacing: 0.7, textTransform: 'uppercase' }}>Full Name</p>
              <p style={{ fontSize: 16, fontWeight: 900, color: '#111827', margin: '0 0 6px', lineHeight: 1.15, wordBreak: 'break-word' }}>
                {fullName || 'Beneficiary'}
              </p>
              <p style={{ fontSize: 8, fontWeight: 700, color: '#9CA3AF', margin: '0 0 1px', letterSpacing: 0.7, textTransform: 'uppercase' }}>Email</p>
              <p style={{ fontSize: 9.5, fontWeight: 700, color: '#0369a1', margin: '0 0 5px', lineHeight: 1.3, wordBreak: 'break-all', textDecoration: 'none' }}>
                {email}
              </p>
              {country && (
                <p style={{ fontSize: 9.5, fontWeight: 600, color: '#5eadb5', margin: 0 }}>📍 {country}</p>
              )}
            </div>
          </div>

          {/* ROW 3: Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #A7F3D0', paddingTop: 7, flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: 7.5, fontWeight: 700, color: '#9CA3AF', margin: '0 0 1px', letterSpacing: 0.5 }}>MEMBER SINCE</p>
              <p style={{ fontSize: 12, fontWeight: 900, color: '#111827', margin: 0 }}>
                {new Date(joinDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 7.5, fontWeight: 700, color: '#9CA3AF', margin: '0 0 3px', letterSpacing: 0.5 }}>STATUS</p>
              <div style={{
                display: 'inline-block', fontSize: 9, fontWeight: 900,
                padding: '3px 10px', borderRadius: 999, letterSpacing: 0.4,
                backgroundColor: isActivated ? '#D1FAE5' : '#FEF3C7',
                color:           isActivated ? '#065F46' : '#92400E',
                border:          `1.5px solid ${isActivated ? '#6EE7B7' : '#FDE68A'}`,
              }}>
                {isActivated ? 'ACTIVE' : 'PENDING'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 7.5, fontWeight: 700, color: '#9CA3AF', margin: '0 0 1px', letterSpacing: 0.5 }}>MONTHLY</p>
              <p style={{ fontSize: 17, fontWeight: 900, color: '#065F46', margin: 0, lineHeight: 1 }}>500 CT</p>
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(to right, #00B894, #00CEC9, #00B894)', zIndex: 2 }} />
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