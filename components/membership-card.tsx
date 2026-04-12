'use client';

import { useRef, useState, useEffect } from 'react';
import { Download, AlertCircle, Share2, X, Copy, Check } from 'lucide-react';

interface MembershipCardProps {
  userId: string;
  fullName: string;
  email: string;
  profileImage?: string;
  joinDate: string;
  country?: string;
  isActivated?: boolean;
}

const SHARE_CAPTION = `🌍 I just joined the Charity Token movement — and I believe in the power of ownership.

💚 Charity Token is making it easier for everyday people to own a share of something truly big. I'm proud to be part of a community that's rewriting what it means to give, grow, and belong.

We're not just receiving tokens — we're building a future together. 500 CT every month, for 10 years. Real ownership. Real impact.

Join me. Your seat at the table is waiting. 👇
🔗 charitytoken.net

#CharityToken #OwnYourFuture #Web3ForGood #CommunityGrowth #500CTMonthly`;

export function MembershipCard({
  userId, fullName, email, profileImage, joinDate, country, isActivated = true
}: MembershipCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cardWidth, setCardWidth] = useState(480);
  const [showShareModal, setShowShareModal] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [generatingShare, setGeneratingShare] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const memberId = 'CT-' + userId.substring(0, 6).toUpperCase() + '-' + new Date(joinDate).getFullYear();
  const RATIO = 1.586;

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

  // Generate canvas from the card element
  const generateCanvas = async () => {
    if (!cardRef.current) throw new Error('Card not found');
    const html2canvas = (await import('html2canvas')).default;
    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 600));
    return html2canvas(cardRef.current, {
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
  };

  const downloadCard = async () => {
    setError(''); setLoading(true);
    try {
      const canvas = await generateCanvas();
      const a = document.createElement('a');
      a.href     = canvas.toDataURL('image/png');
      a.download = 'charity-token-membership-' + userId + '.png';
      a.click();
    } catch (e) {
      console.error('Download error:', e);
      setError('Download failed. Please try again.');
    } finally { setLoading(false); }
  };

  const openShareModal = async () => {
    setShowShareModal(true);
    if (shareImageUrl) return; // already generated
    setGeneratingShare(true);
    try {
      const canvas = await generateCanvas();
      setShareImageUrl(canvas.toDataURL('image/png'));
    } catch (e) {
      console.error('Share image error:', e);
    } finally { setGeneratingShare(false); }
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(SHARE_CAPTION);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2500);
  };

  // Download image then open platform
  const shareToplatform = async (platform: string) => {
    const encodedCaption = encodeURIComponent(SHARE_CAPTION);
    const siteUrl = encodeURIComponent('https://charitytoken.net');

    // Download card image first so user can attach manually on platforms that need it
    if (shareImageUrl) {
      const a = document.createElement('a');
      a.href     = shareImageUrl;
      a.download = 'charity-token-membership-' + userId + '.png';
      a.click();
      await new Promise(r => setTimeout(r, 400));
    }

    const urls: Record<string, string> = {
      twitter:   `https://twitter.com/intent/tweet?text=${encodedCaption}`,
      facebook:  `https://www.facebook.com/sharer/sharer.php?u=${siteUrl}&quote=${encodedCaption}`,
      whatsapp:  `https://wa.me/?text=${encodedCaption}`,
      telegram:  `https://t.me/share/url?url=${siteUrl}&text=${encodedCaption}`,
      linkedin:  `https://www.linkedin.com/sharing/share-offsite/?url=${siteUrl}`,
      instagram: null as any, // Instagram has no web share URL — handled separately
    };

    if (platform === 'instagram') {
      // Instagram doesn't support web share links — copy caption and show instructions
      copyCaption();
      return;
    }

    window.open(urls[platform], '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  // Web Share API — works on mobile (native share sheet)
  const nativeShare = async () => {
    if (shareImageUrl && navigator.share) {
      try {
        // Convert dataURL to blob for native share
        const res  = await fetch(shareImageUrl);
        const blob = await res.blob();
        const file = new File([blob], 'charity-token-membership.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: 'My Charity Token Membership', text: SHARE_CAPTION, files: [file] });
        } else {
          await navigator.share({ title: 'My Charity Token Membership', text: SHARE_CAPTION, url: 'https://charitytoken.net' });
        }
      } catch (e) { /* user cancelled */ }
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

  const s = cardWidth / 480;

  const socialPlatforms = [
    { id: 'native',    label: 'Share',       emoji: '📤', bg: 'linear-gradient(135deg, #00CEC9, #00B894)', color: 'white',   show: typeof navigator !== 'undefined' && !!navigator.share },
    { id: 'whatsapp',  label: 'WhatsApp',    emoji: '💬', bg: '#25D366',                                   color: 'white'  },
    { id: 'telegram',  label: 'Telegram',    emoji: '✈️', bg: '#0088cc',                                   color: 'white'  },
    { id: 'twitter',   label: 'X / Twitter', emoji: '🐦', bg: '#000000',                                   color: 'white'  },
    { id: 'facebook',  label: 'Facebook',    emoji: '👥', bg: '#1877F2',                                   color: 'white'  },
    { id: 'linkedin',  label: 'LinkedIn',    emoji: '💼', bg: '#0A66C2',                                   color: 'white'  },
    { id: 'instagram', label: 'Instagram',   emoji: '📸', bg: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', color: 'white' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <p style={{ fontSize: 12, color: '#ff6b6b', textAlign: 'center', margin: 0 }}>{error}</p>}

      {/* ── SHARE MODAL ── */}
      {showShareModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(8px)', padding: '0 0 0 0' }}>
          <div style={{ width: '100%', maxWidth: 520, backgroundColor: '#0F1F35', borderRadius: '22px 22px 0 0', padding: '28px 24px 40px', boxShadow: '0 -20px 60px rgba(0,0,0,0.5)', maxHeight: '92vh', overflowY: 'auto' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: 0 }}>Share Your Membership</h3>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: '4px 0 0' }}>Invite others to join the movement</p>
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', color: '#8FA3BF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* Card preview */}
            <div style={{ marginBottom: 20, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(0,206,201,0.2)' }}>
              {generatingShare ? (
                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,206,201,0.05)', gap: 10 }}>
                  <div style={{ width: 20, height: 20, border: '2px solid rgba(0,206,201,0.3)', borderTop: '2px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: 13, color: '#8FA3BF', margin: 0 }}>Preparing your card...</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : shareImageUrl ? (
                <img src={shareImageUrl} alt="Your membership card" style={{ width: '100%', display: 'block' }} />
              ) : null}
            </div>

            {/* Caption box */}
            <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 14, backgroundColor: 'rgba(0,206,201,0.05)', border: '1px solid rgba(0,206,201,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#00CEC9', margin: 0 }}>📝 Your Caption</p>
                <button onClick={copyCaption} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, backgroundColor: captionCopied ? 'rgba(0,184,148,0.2)' : 'rgba(0,206,201,0.1)', border: `1px solid ${captionCopied ? 'rgba(0,184,148,0.4)' : 'rgba(0,206,201,0.25)'}`, color: captionCopied ? '#00B894' : '#67e8f9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {captionCopied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                  {captionCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize: 12, color: '#8FA3BF', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line', maxHeight: 140, overflowY: 'auto' }}>{SHARE_CAPTION}</p>
            </div>

            {/* Platform buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
              {socialPlatforms.filter(p => p.id !== 'native').map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => platform.id === 'native' ? nativeShare() : shareToplatform(platform.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: platform.bg, color: platform.color, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: 18 }}>{platform.emoji}</span>
                  <span>{platform.label}</span>
                </button>
              ))}
            </div>

            {/* Instagram note */}
            <div style={{ padding: '12px 14px', borderRadius: 12, backgroundColor: 'rgba(253,29,29,0.06)', border: '1px solid rgba(253,29,29,0.15)', marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#fc8181', margin: 0, lineHeight: 1.6 }}>
                <strong>📸 Instagram:</strong> Your card image is downloaded + caption copied automatically. Open Instagram, create a post, attach the image, paste the caption.
              </p>
            </div>

            {/* Native share button — mobile only */}
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={nativeShare}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,206,201,0.25)' }}
              >
                <Share2 style={{ width: 18, height: 18 }} />
                Share via Phone (Image + Caption)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Wrapper — measures available width */}
      <div ref={wrapperRef} style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
        {/* ── THE CARD ── */}
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

          {/* Top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: Math.round(7 * s), background: 'linear-gradient(to right, #00CEC9, #00B894, #00CEC9)', zIndex: 2 }} />

          {/* Content */}
          <div style={{ position: 'absolute', top: Math.round(7 * s), bottom: Math.round(5 * s), left: 0, right: 0, padding: `${Math.round(10 * s)}px ${Math.round(16 * s)}px`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(8 * s) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Charity token logo.jpg" alt="CT" style={{ width: Math.round(36 * s), height: Math.round(36 * s), borderRadius: Math.round(8 * s), objectFit: 'cover', border: `${Math.max(1, Math.round(1.5 * s))}px solid rgba(0,206,201,0.35)`, flexShrink: 0, display: 'block' }} crossOrigin="anonymous" />
                <div style={{ lineHeight: 1 }}>
                  <p style={{ fontSize: Math.round(12 * s), fontWeight: 900, color: '#007B8A', margin: 0, letterSpacing: 1 }}>CHARITY TOKEN</p>
                  <p style={{ fontSize: Math.round(8 * s), fontWeight: 700, color: '#5eadb5', margin: `${Math.round(2 * s)}px 0 0`, letterSpacing: 0.6 }}>MEMBERSHIP CARD</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: Math.round(8 * s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(1 * s)}px`, letterSpacing: 0.5 }}>MEMBER ID</p>
                <p style={{ fontSize: Math.round(11 * s), fontFamily: 'monospace', fontWeight: 900, color: '#007B8A', margin: 0 }}>{memberId}</p>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'linear-gradient(to right, rgba(0,206,201,0.25), rgba(0,184,148,0.25))', flexShrink: 0 }} />

            {/* Photo + Info */}
            <div style={{ display: 'flex', gap: Math.round(14 * s), alignItems: 'center', flex: 1, minHeight: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profileImage} alt={fullName} style={{ width: Math.round(88 * s), height: Math.round(88 * s), borderRadius: Math.round(10 * s), objectFit: 'cover', border: `${Math.max(2, Math.round(2.5 * s))}px solid #00CEC9`, flexShrink: 0, display: 'block' }} crossOrigin="anonymous" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: Math.round(8 * s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(1 * s)}px`, letterSpacing: 0.7, textTransform: 'uppercase' }}>Full Name</p>
                <p style={{ fontSize: Math.round(16 * s), fontWeight: 900, color: '#111827', margin: `0 0 ${Math.round(6 * s)}px`, lineHeight: 1.15, wordBreak: 'break-word' }}>{fullName || 'Beneficiary'}</p>
                <p style={{ fontSize: Math.round(8 * s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(1 * s)}px`, letterSpacing: 0.7, textTransform: 'uppercase' }}>Email</p>
                <p style={{ fontSize: Math.round(9.5 * s), fontWeight: 700, color: '#0369a1', margin: `0 0 ${Math.round(5 * s)}px`, lineHeight: 1.3, wordBreak: 'break-all', textDecoration: 'none' }}>{email}</p>
                {country && <p style={{ fontSize: Math.round(9.5 * s), fontWeight: 600, color: '#5eadb5', margin: 0 }}>📍 {country}</p>}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #A7F3D0', paddingTop: Math.round(7 * s), flexShrink: 0 }}>
              <div>
                <p style={{ fontSize: Math.round(7.5 * s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(1 * s)}px`, letterSpacing: 0.5 }}>MEMBER SINCE</p>
                <p style={{ fontSize: Math.round(12 * s), fontWeight: 900, color: '#111827', margin: 0 }}>{new Date(joinDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: Math.round(7.5 * s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(3 * s)}px`, letterSpacing: 0.5 }}>STATUS</p>
                <div style={{ display: 'inline-block', fontSize: Math.round(9 * s), fontWeight: 900, padding: `${Math.round(3 * s)}px ${Math.round(10 * s)}px`, borderRadius: 999, letterSpacing: 0.4, backgroundColor: isActivated ? '#D1FAE5' : '#FEF3C7', color: isActivated ? '#065F46' : '#92400E', border: `1.5px solid ${isActivated ? '#6EE7B7' : '#FDE68A'}` }}>
                  {isActivated ? 'ACTIVE' : 'PENDING'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: Math.round(7.5 * s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(1 * s)}px`, letterSpacing: 0.5 }}>MONTHLY</p>
                <p style={{ fontSize: Math.round(17 * s), fontWeight: 900, color: '#065F46', margin: 0, lineHeight: 1 }}>500 CT</p>
              </div>
            </div>
          </div>

          {/* Bottom accent */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: Math.round(5 * s), background: 'linear-gradient(to right, #00B894, #00CEC9, #00B894)', zIndex: 2 }} />
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {/* Download */}
        <button
          onClick={downloadCard}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 22px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 8px 24px rgba(0,206,201,0.25)', flex: 1, maxWidth: 200, justifyContent: 'center' }}
        >
          <Download style={{ width: 16, height: 16 }} />
          {loading ? 'Saving...' : 'Download'}
        </button>

        {/* Share */}
        <button
          onClick={openShareModal}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 22px', borderRadius: 12, background: 'linear-gradient(135deg, #6C3FC8, #9B59B6)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(108,63,200,0.3)', flex: 1, maxWidth: 200, justifyContent: 'center' }}
        >
          <Share2 style={{ width: 16, height: 16 }} />
          Share
        </button>
      </div>
    </div>
  );
}