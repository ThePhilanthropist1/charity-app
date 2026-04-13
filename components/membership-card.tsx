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

#CharityToken #OwnYourFuture #Web3ForGood #CommunityGrowth`;

export function MembershipCard({
  userId, fullName, email, profileImage, joinDate, country, isActivated = true
}: MembershipCardProps) {
  const [loading, setLoading]               = useState(false);
  const [sharing, setSharing]               = useState(false);
  const [error, setError]                   = useState('');
  const [cardWidth, setCardWidth]           = useState(480);
  const [showShareModal, setShowShareModal] = useState(false);
  const [captionCopied, setCaptionCopied]   = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef    = useRef<HTMLDivElement>(null);

  const memberId = 'CT-' + userId.substring(0, 6).toUpperCase() + '-' + new Date(joinDate).getFullYear();
  const RATIO    = 1.586;

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

  // ── Generate canvas at fixed 480×302 for consistent output ───────────────
  const generateCanvas = async () => {
    if (!cardRef.current) throw new Error('Card not found');
    const html2canvas = (await import('html2canvas')).default;
    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 600));

    const CARD_W = 480;
    const CARD_H = 302;

    // Clone at fixed size so html2canvas doesn't depend on screen width
    const clone = cardRef.current.cloneNode(true) as HTMLElement;
    clone.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: ${CARD_W}px;
      height: ${CARD_H}px;
      border-radius: 16px;
      overflow: hidden;
      font-family: Arial, Helvetica, sans-serif;
    `;
    document.body.appendChild(clone);
    await new Promise(r => setTimeout(r, 150));

    const canvas = await html2canvas(clone, {
      backgroundColor: '#ffffff',
      scale:           3,
      logging:         false,
      useCORS:         true,
      allowTaint:      true,
      width:           CARD_W,
      height:          CARD_H,
    });

    document.body.removeChild(clone);
    return canvas;
  };

  // ── Get PNG blob from canvas ──────────────────────────────────────────────
  const getImageBlob = async (): Promise<Blob> => {
    const canvas = await generateCanvas();
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create image blob'));
      }, 'image/png', 1.0);
    });
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const downloadCard = async () => {
    setError(''); setLoading(true);
    try {
      const blob = await getImageBlob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'charity-token-membership-' + userId + '.png';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error:', e);
      setError('Download failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Copy caption ──────────────────────────────────────────────────────────
  const copyCaption = () => {
    navigator.clipboard.writeText(SHARE_CAPTION);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2500);
  };

  // ── Native share with image file attached ────────────────────────────────
  // This is the key fix: share as a File so WhatsApp, Telegram etc receive
  // the actual image, not just a link.
  const nativeShareWithImage = async () => {
    setSharing(true); setError('');
    try {
      const blob = await getImageBlob();
      const file = new File([blob], 'charity-token-membership.png', { type: 'image/png' });

      // Check if browser supports sharing files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files:  [file],
          title:  'My Charity Token Membership',
          text:   SHARE_CAPTION,
        });
        return; // success — native share sheet opened with image
      }

      // Fallback: share without image (text + URL only)
      if (navigator.share) {
        await navigator.share({
          title: 'My Charity Token Membership',
          text:  SHARE_CAPTION,
          url:   'https://charitytoken.net',
        });
        return;
      }

      // No Web Share API — open modal for manual platform selection
      setShowShareModal(true);
    } catch (e: any) {
      // User cancelled share — not an error
      if (e?.name === 'AbortError') return;
      console.error('Share error:', e);
      // Fall back to modal
      setShowShareModal(true);
    } finally { setSharing(false); }
  };

  // ── Platform share with image: download first, then open platform ─────────
  // Strategy: generate image → save to device → open platform
  // For platforms that accept images via URL we use the Web Share API above.
  // For manual fallback in modal, we download the image first then open app.
  const shareToPlatformWithImage = async (
    platform: 'whatsapp' | 'telegram' | 'twitter' | 'facebook' | 'instagram'
  ) => {
    setSharing(true); setError('');
    try {
      // Step 1: Generate and download the image automatically
      const blob = await getImageBlob();
      const file = new File([blob], 'charity-token-membership.png', { type: 'image/png' });

      // Step 2: Try native share with file for this specific platform
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Charity Token Membership', text: SHARE_CAPTION });
        return;
      }

      // Step 3: Auto-download image so user has it ready to attach manually
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = 'charity-token-membership.png';
      a.click();
      URL.revokeObjectURL(url);

      // Step 4: Open platform after short delay (image should be in gallery now)
      await new Promise(r => setTimeout(r, 800));

      const text    = encodeURIComponent(SHARE_CAPTION);
      const siteUrl = encodeURIComponent('https://charitytoken.net');

      const urls: Record<string, string> = {
        whatsapp:  `https://wa.me/?text=${text}`,
        telegram:  `https://t.me/share/url?url=${siteUrl}&text=${text}`,
        twitter:   `https://twitter.com/intent/tweet?text=${text}`,
        facebook:  `https://www.facebook.com/sharer/sharer.php?u=${siteUrl}&quote=${encodeURIComponent(SHARE_CAPTION)}`,
        instagram: `https://www.instagram.com/`,  // Instagram has no web share URL — image saved to camera roll
      };

      window.open(urls[platform], '_blank', 'noopener,noreferrer');

    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.error('Share error:', e);
        setError('Could not share. Please download the image and share manually.');
      }
    } finally { setSharing(false); }
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

  const platforms = [
    {
      id: 'whatsapp' as const, label: 'WhatsApp', bg: '#25D366',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
    },
    {
      id: 'telegram' as const, label: 'Telegram', bg: '#0088cc',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.008 9.456c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.09 14.99l-2.94-.92c-.64-.204-.652-.64.136-.948l11.49-4.43c.533-.194 1-.12.786.556z"/></svg>,
    },
    {
      id: 'twitter' as const, label: 'X (Twitter)', bg: '#000000',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    },
    {
      id: 'facebook' as const, label: 'Facebook', bg: '#1877F2',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    },
    {
      id: 'instagram' as const, label: 'Instagram', bg: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <p style={{ fontSize: 12, color: '#ff6b6b', textAlign: 'center', margin: 0 }}>{error}</p>}

      {/* ── SHARE MODAL ── */}
      {showShareModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowShareModal(false); }}
        >
          <div style={{ width: '100%', maxWidth: 520, backgroundColor: '#0F1F35', borderRadius: '22px 22px 0 0', padding: '28px 24px 44px', boxShadow: '0 -20px 60px rgba(0,0,0,0.5)' }}>

            <div style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: 0 }}>Share Your Membership 🚀</h3>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: '4px 0 0' }}>Image will be saved to your device then the app opens</p>
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', color: '#8FA3BF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* How to attach note */}
            <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 12, backgroundColor: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.2)' }}>
              <p style={{ fontSize: 12, color: '#ffc107', margin: 0, lineHeight: 1.6 }}>
                <strong>How it works:</strong> Tapping a platform below saves your ID card image to your device and opens the app. Then attach the image from your gallery when composing your post.
              </p>
            </div>

            {/* Caption */}
            <div style={{ marginBottom: 18, padding: '14px 16px', borderRadius: 14, backgroundColor: 'rgba(0,206,201,0.05)', border: '1px solid rgba(0,206,201,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#00CEC9', margin: 0 }}>📝 Caption</p>
                <button
                  onClick={copyCaption}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, backgroundColor: captionCopied ? 'rgba(0,184,148,0.2)' : 'rgba(0,206,201,0.1)', border: `1px solid ${captionCopied ? 'rgba(0,184,148,0.4)' : 'rgba(0,206,201,0.25)'}`, color: captionCopied ? '#00B894' : '#67e8f9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  {captionCopied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                  {captionCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize: 11.5, color: '#8FA3BF', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line', maxHeight: 100, overflowY: 'auto' }}>
                {SHARE_CAPTION}
              </p>
            </div>

            {/* Platform grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => shareToPlatformWithImage(p.id)}
                  disabled={sharing}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 14, background: p.bg, color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: sharing ? 'not-allowed' : 'pointer', opacity: sharing ? 0.6 : 1, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
                >
                  {p.icon}
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            <p style={{ fontSize: 11, color: '#4A5568', textAlign: 'center', marginTop: 16, marginBottom: 0, lineHeight: 1.6 }}>
              {sharing ? '⏳ Generating your card image...' : 'Your ID card image is saved automatically before each share.'}
            </p>
          </div>
        </div>
      )}

      {/* Wrapper */}
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
          <div style={{ position: 'absolute', top: -50*s, right: -50*s, width: 180*s, height: 180*s, borderRadius: '50%', background: 'rgba(0,206,201,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40*s, left: -40*s, width: 150*s, height: 150*s, borderRadius: '50%', background: 'rgba(0,184,148,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: Math.round(7*s), background: 'linear-gradient(to right, #00CEC9, #00B894, #00CEC9)', zIndex: 2 }} />

          <div style={{ position: 'absolute', top: Math.round(7*s), bottom: Math.round(5*s), left: 0, right: 0, padding: `${Math.round(10*s)}px ${Math.round(16*s)}px`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(8*s) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Charity token logo.jpg" alt="CT" style={{ width: Math.round(36*s), height: Math.round(36*s), borderRadius: Math.round(8*s), objectFit: 'cover', border: `${Math.max(1, Math.round(1.5*s))}px solid rgba(0,206,201,0.35)`, flexShrink: 0, display: 'block' }} crossOrigin="anonymous" />
                <div style={{ lineHeight: 1 }}>
                  <p style={{ fontSize: Math.round(12*s), fontWeight: 900, color: '#007B8A', margin: 0, letterSpacing: 1 }}>CHARITY TOKEN</p>
                  <p style={{ fontSize: Math.round(8*s), fontWeight: 700, color: '#5eadb5', margin: `${Math.round(2*s)}px 0 0`, letterSpacing: 0.6 }}>MEMBERSHIP CARD</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: Math.round(8*s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(1*s)}px`, letterSpacing: 0.5 }}>MEMBER ID</p>
                <p style={{ fontSize: Math.round(11*s), fontFamily: 'monospace', fontWeight: 900, color: '#007B8A', margin: 0 }}>{memberId}</p>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'linear-gradient(to right, rgba(0,206,201,0.25), rgba(0,184,148,0.25))', flexShrink: 0 }} />

            {/* Photo + Info */}
            <div style={{ display: 'flex', gap: Math.round(14*s), alignItems: 'center', flex: 1, minHeight: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profileImage} alt={fullName} style={{ width: Math.round(88*s), height: Math.round(88*s), borderRadius: Math.round(10*s), objectFit: 'cover', border: `${Math.max(2, Math.round(2.5*s))}px solid #00CEC9`, flexShrink: 0, display: 'block' }} crossOrigin="anonymous" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: Math.round(8*s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(1*s)}px`, letterSpacing: 0.7, textTransform: 'uppercase' }}>Full Name</p>
                <p style={{ fontSize: Math.round(16*s), fontWeight: 900, color: '#111827', margin: `0 0 ${Math.round(6*s)}px`, lineHeight: 1.15, wordBreak: 'break-word' }}>{fullName || 'Beneficiary'}</p>
                <p style={{ fontSize: Math.round(8*s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(1*s)}px`, letterSpacing: 0.7, textTransform: 'uppercase' }}>Email</p>
                <p style={{ fontSize: Math.round(9.5*s), fontWeight: 700, color: '#0369a1', margin: `0 0 ${Math.round(5*s)}px`, lineHeight: 1.3, wordBreak: 'break-all', textDecoration: 'none' }}>{email}</p>
                {country && <p style={{ fontSize: Math.round(9.5*s), fontWeight: 600, color: '#5eadb5', margin: 0 }}>📍 {country}</p>}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #A7F3D0', paddingTop: Math.round(7*s), flexShrink: 0 }}>
              <div>
                <p style={{ fontSize: Math.round(7.5*s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(1*s)}px`, letterSpacing: 0.5 }}>MEMBER SINCE</p>
                <p style={{ fontSize: Math.round(12*s), fontWeight: 900, color: '#111827', margin: 0 }}>{new Date(joinDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: Math.round(7.5*s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(3*s)}px`, letterSpacing: 0.5 }}>STATUS</p>
                <div style={{ display: 'inline-block', fontSize: Math.round(9*s), fontWeight: 900, padding: `${Math.round(3*s)}px ${Math.round(10*s)}px`, borderRadius: 999, letterSpacing: 0.4, backgroundColor: isActivated ? '#D1FAE5' : '#FEF3C7', color: isActivated ? '#065F46' : '#92400E', border: `1.5px solid ${isActivated ? '#6EE7B7' : '#FDE68A'}` }}>
                  {isActivated ? 'ACTIVE' : 'PENDING'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: Math.round(7.5*s), fontWeight: 700, color: '#9CA3AF', margin: `0 0 ${Math.round(1*s)}px`, letterSpacing: 0.5 }}>MONTHLY</p>
                <p style={{ fontSize: Math.round(17*s), fontWeight: 900, color: '#065F46', margin: 0, lineHeight: 1 }}>500 CT</p>
              </div>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: Math.round(5*s), background: 'linear-gradient(to right, #00B894, #00CEC9, #00B894)', zIndex: 2 }} />
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button
          onClick={downloadCard}
          disabled={loading || sharing}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 22px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: (loading || sharing) ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 8px 24px rgba(0,206,201,0.25)', flex: 1, maxWidth: 200, justifyContent: 'center' }}
        >
          <Download style={{ width: 16, height: 16 }} />
          {loading ? 'Saving...' : 'Download'}
        </button>

        <button
          onClick={nativeShareWithImage}
          disabled={loading || sharing}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 22px', borderRadius: 12, background: 'linear-gradient(135deg, #6C3FC8, #9B59B6)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: (loading || sharing) ? 'not-allowed' : 'pointer', opacity: sharing ? 0.7 : 1, boxShadow: '0 8px 24px rgba(108,63,200,0.3)', flex: 1, maxWidth: 200, justifyContent: 'center' }}
        >
          <Share2 style={{ width: 16, height: 16 }} />
          {sharing ? 'Preparing...' : 'Share'}
        </button>
      </div>
    </div>
  );
}