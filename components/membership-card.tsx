'use client';

import { useRef, useState } from 'react';
import { Download, AlertCircle } from 'lucide-react';

interface MembershipCardProps {
  userId: string;
  fullName: string;
  email: string;
  profileImage?: string;
  joinDate: string;
}

export function MembershipCard({ userId, fullName, email, profileImage, joinDate }: MembershipCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const memberId = 'CT-' + userId.substring(0, 6).toUpperCase() + '-' + new Date(joinDate).getFullYear();
  const hasProfileImage = !!profileImage && profileImage.length > 0;

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setError('');
    setLoading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a1628',
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'charity-token-membership-' + userId + '.png';
      link.click();
    } catch (err) {
      setError('Failed to download. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasProfileImage) {
    return (
      <div style={{ padding: '20px', borderRadius: 14, border: '1px solid rgba(255,193,7,0.3)', backgroundColor: 'rgba(255,193,7,0.06)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <AlertCircle style={{ width: 20, height: 20, color: '#ffc107', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontWeight: 700, color: 'white', marginBottom: 4, fontSize: 14 }}>Upload Profile Picture First</p>
          <p style={{ fontSize: 12, color: '#8FA3BF', lineHeight: 1.6 }}>Upload your profile picture above to generate and download your membership card.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10 }}>
          <AlertCircle style={{ width: 16, height: 16, color: '#ff6b6b', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#ffb3b3' }}>{error}</p>
        </div>
      )}

      {/* ID Card - standard CR80 aspect ratio 85.6mm x 53.98mm = 1.586:1 */}
      <div
        ref={cardRef}
        style={{
          width: '100%',
          maxWidth: 480,
          aspectRatio: '1.586',
          margin: '0 auto',
          borderRadius: 16,
          overflow: 'hidden',
          position: 'relative',
          fontFamily: 'Arial, Helvetica, sans-serif',
          background: 'linear-gradient(135deg, #0d2137 0%, #0a1628 50%, #0d2137 100%)',
          border: '2px solid rgba(0,206,201,0.4)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,206,201,0.1)',
        }}
      >
        {/* Background decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(0,206,201,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,184,148,0.05)', pointerEvents: 'none' }} />

        {/* Top stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(to right, #00CEC9, #00B894)' }} />

        <div style={{ padding: '20px 24px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #00CEC9, #00B894)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'white' }}>CT</span>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#00CEC9', margin: 0, letterSpacing: 1 }}>CHARITY TOKEN</p>
                <p style={{ fontSize: 9, color: 'rgba(207,250,254,0.6)', margin: 0, letterSpacing: 0.5 }}>MEMBERSHIP CARD</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 9, color: 'rgba(207,250,254,0.5)', margin: 0 }}>MEMBER ID</p>
              <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#00CEC9', fontWeight: 700, margin: 0 }}>{memberId}</p>
            </div>
          </div>

          {/* Body */}
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <img
              src={profileImage}
              alt={fullName}
              style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', border: '2px solid rgba(0,206,201,0.5)', flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 9, color: 'rgba(207,250,254,0.5)', margin: '0 0 3px', letterSpacing: 0.5 }}>FULL NAME</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: '0 0 10px', lineHeight: 1.2 }}>{fullName}</p>
              <p style={{ fontSize: 9, color: 'rgba(207,250,254,0.5)', margin: '0 0 3px', letterSpacing: 0.5 }}>EMAIL</p>
              <p style={{ fontSize: 11, color: '#67e8f9', margin: 0 }}>{email}</p>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(0,206,201,0.2)', paddingTop: 12 }}>
            <div>
              <p style={{ fontSize: 9, color: 'rgba(207,250,254,0.5)', margin: '0 0 3px', letterSpacing: 0.5 }}>MEMBER SINCE</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'white', margin: 0 }}>{new Date(joinDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 9, color: 'rgba(207,250,254,0.5)', margin: '0 0 3px', letterSpacing: 0.5 }}>STATUS</p>
              <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 999, backgroundColor: 'rgba(0,184,148,0.2)', color: '#00B894', fontWeight: 700, border: '1px solid rgba(0,184,148,0.4)' }}>ACTIVE</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 9, color: 'rgba(207,250,254,0.5)', margin: '0 0 3px', letterSpacing: 0.5 }}>MONTHLY BENEFIT</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#00B894', margin: 0 }}>500 CT</p>
            </div>
          </div>

        </div>

        {/* Bottom stripe */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(to right, #00B894, #00CEC9)' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={downloadCard}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 8px 24px rgba(0,206,201,0.25)' }}
        >
          <Download style={{ width: 18, height: 18 }} />
          {loading ? 'Generating...' : 'Download ID Card'}
        </button>
      </div>

      <p style={{ fontSize: 11, color: '#8FA3BF', textAlign: 'center' }}>
        Member ID: {memberId}
      </p>
    </div>
  );
}
