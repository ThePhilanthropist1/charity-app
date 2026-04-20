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

// ── Load image as HTMLImageElement with CORS ──────────────────────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => {
      // Retry without crossOrigin as fallback
      const img2 = new Image();
      img2.onload  = () => resolve(img2);
      img2.onerror = () => reject(new Error('Failed to load image: ' + src));
      img2.src = src + (src.includes('?') ? '&' : '?') + '_t=' + Date.now();
    };
    img.src = src;
  });
}

// ── Rounded rect helper ───────────────────────────────────────────────────────
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── Draw circular clip ────────────────────────────────────────────────────────
function drawRoundedImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, r: number) {
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

// ── MAIN CARD GENERATOR using Canvas API ─────────────────────────────────────
async function generateCardCanvas(
  userId: string,
  fullName: string,
  email: string,
  profileImage: string,
  joinDate: string,
  country: string | undefined,
  isActivated: boolean,
  logoUrl: string
): Promise<HTMLCanvasElement> {
  const W = 960; const H = 605; // 2x resolution for sharp output
  const S = 2;   // scale factor

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── BACKGROUND ──
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0,   '#e6faf8');
  bgGrad.addColorStop(0.45,'#ffffff');
  bgGrad.addColorStop(1,   '#e6faf8');
  ctx.fillStyle = bgGrad;
  roundRect(ctx, 0, 0, W, H, 32 * S);
  ctx.fill();

  // ── BORDER ──
  ctx.strokeStyle = '#00CEC9';
  ctx.lineWidth   = 5 * S;
  roundRect(ctx, 2.5*S, 2.5*S, W - 5*S, H - 5*S, 30*S);
  ctx.stroke();

  // ── TOP BAR ──
  const topGrad = ctx.createLinearGradient(0, 0, W, 0);
  topGrad.addColorStop(0,   '#00CEC9');
  topGrad.addColorStop(0.5, '#00B894');
  topGrad.addColorStop(1,   '#00CEC9');
  ctx.fillStyle = topGrad;
  ctx.beginPath();
  ctx.moveTo(30*S, 0);
  ctx.lineTo(W - 30*S, 0);
  ctx.arcTo(W, 0, W, 30*S, 30*S);
  ctx.lineTo(W, 14*S);
  ctx.lineTo(0, 14*S);
  ctx.lineTo(0, 30*S);
  ctx.arcTo(0, 0, 30*S, 0, 30*S);
  ctx.closePath();
  ctx.fill();

  // ── BOTTOM BAR ──
  const botGrad = ctx.createLinearGradient(0, 0, W, 0);
  botGrad.addColorStop(0,   '#00B894');
  botGrad.addColorStop(0.5, '#00CEC9');
  botGrad.addColorStop(1,   '#00B894');
  ctx.fillStyle = botGrad;
  ctx.beginPath();
  ctx.moveTo(0, H - 10*S);
  ctx.lineTo(W, H - 10*S);
  ctx.lineTo(W, H - 30*S);
  ctx.arcTo(W, H, W - 30*S, H, 30*S);
  ctx.lineTo(30*S, H);
  ctx.arcTo(0, H, 0, H - 30*S, 30*S);
  ctx.closePath();
  ctx.fill();

  // ── SUBTLE CIRCLES ──
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle   = '#00CEC9';
  ctx.beginPath(); ctx.arc(W - 100*S, -50*S, 180*S, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(-40*S, H + 40*S, 150*S, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  const PAD = 32 * S;
  const TOP = 24 * S; // below top bar

  // ── LOGO ──
  try {
    const logoImg = await loadImage(logoUrl);
    const LW = 72 * S; const LH = 72 * S;
    drawRoundedImage(ctx, logoImg, PAD, TOP, LW, LH, 16*S);
    // Logo border
    ctx.strokeStyle = 'rgba(0,206,201,0.35)';
    ctx.lineWidth   = 3*S;
    roundRect(ctx, PAD, TOP, LW, LH, 16*S);
    ctx.stroke();
  } catch { /* skip logo if fails */ }

  // ── CHARITY TOKEN TEXT next to logo ──
  ctx.fillStyle = '#007B8A';
  ctx.font      = `900 ${24*S}px Arial, sans-serif`;
  ctx.letterSpacing = String(2*S) + 'px';
  ctx.fillText('CHARITY TOKEN', PAD + 80*S, TOP + 26*S);
  ctx.font        = `700 ${16*S}px Arial, sans-serif`;
  ctx.fillStyle   = '#5eadb5';
  ctx.letterSpacing = String(1.2*S) + 'px';
  ctx.fillText('MEMBERSHIP CARD', PAD + 80*S, TOP + 50*S);
  ctx.letterSpacing = '0px';

  // ── MEMBER ID (top right) ──
  const memberId = 'CT-' + userId.substring(0, 6).toUpperCase() + '-' + new Date(joinDate).getFullYear();
  ctx.textAlign = 'right';
  ctx.fillStyle = '#9CA3AF';
  ctx.font      = `700 ${14*S}px Arial, sans-serif`;
  ctx.fillText('MEMBER ID', W - PAD, TOP + 22*S);
  ctx.fillStyle = '#007B8A';
  ctx.font      = `900 ${22*S}px 'Courier New', monospace`;
  ctx.fillText(memberId, W - PAD, TOP + 50*S);
  ctx.textAlign = 'left';

  // ── DIVIDER ──
  const divY = TOP + 90*S;
  const divGrad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  divGrad.addColorStop(0,   'rgba(0,206,201,0.25)');
  divGrad.addColorStop(0.5, 'rgba(0,184,148,0.35)');
  divGrad.addColorStop(1,   'rgba(0,206,201,0.25)');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth   = 2*S;
  ctx.beginPath(); ctx.moveTo(PAD, divY); ctx.lineTo(W - PAD, divY); ctx.stroke();

  // ── PROFILE PHOTO ──
  const photoY  = divY + 14*S;
  const photoW  = 176 * S;
  const photoH  = 176 * S;
  try {
    const profImg = await loadImage(profileImage);
    drawRoundedImage(ctx, profImg, PAD, photoY, photoW, photoH, 20*S);
    ctx.strokeStyle = '#00CEC9';
    ctx.lineWidth   = 5*S;
    roundRect(ctx, PAD, photoY, photoW, photoH, 20*S);
    ctx.stroke();
  } catch {
    // Placeholder if photo fails
    ctx.fillStyle   = '#e0f7fa';
    roundRect(ctx, PAD, photoY, photoW, photoH, 20*S);
    ctx.fill();
    ctx.fillStyle   = '#00CEC9';
    ctx.font        = `900 ${60*S}px Arial`;
    ctx.textAlign   = 'center';
    ctx.fillText((fullName[0] || 'U').toUpperCase(), PAD + photoW/2, photoY + photoH/2 + 20*S);
    ctx.textAlign   = 'left';
  }

  // ── NAME & DETAILS (right of photo) ──
  const infoX = PAD + photoW + 28*S;
  const infoY = photoY;

  ctx.fillStyle = '#9CA3AF';
  ctx.font      = `700 ${14*S}px Arial`;
  ctx.fillText('FULL NAME', infoX, infoY + 16*S);

  // Name (possibly long — truncate)
  ctx.fillStyle = '#111827';
  ctx.font      = `900 ${32*S}px Arial`;
  const maxNameW = W - infoX - PAD;
  let displayName = fullName || 'Beneficiary';
  while (ctx.measureText(displayName).width > maxNameW && displayName.length > 4) {
    displayName = displayName.slice(0, -4) + '...';
  }
  ctx.fillText(displayName, infoX, infoY + 50*S);

  ctx.fillStyle = '#9CA3AF';
  ctx.font      = `700 ${14*S}px Arial`;
  ctx.fillText('EMAIL', infoX, infoY + 80*S);

  ctx.fillStyle = '#0369a1';
  ctx.font      = `700 ${19*S}px Arial`;
  let displayEmail = email;
  while (ctx.measureText(displayEmail).width > maxNameW && displayEmail.length > 8) {
    displayEmail = displayEmail.slice(0, -4) + '...';
  }
  ctx.fillText(displayEmail, infoX, infoY + 106*S);

  if (country) {
    ctx.fillStyle = '#5eadb5';
    ctx.font      = `600 ${19*S}px Arial`;
    ctx.fillText('📍 ' + country, infoX, infoY + 138*S);
  }

  // ── FOOTER DIVIDER ──
  const footDivY = photoY + photoH + 18*S;
  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth   = 3*S;
  ctx.beginPath(); ctx.moveTo(PAD, footDivY); ctx.lineTo(W - PAD, footDivY); ctx.stroke();

  // ── FOOTER: MEMBER SINCE | STATUS | MONTHLY ──
  const footY = footDivY + 18*S;

  // Member Since
  ctx.fillStyle = '#9CA3AF';
  ctx.font      = `700 ${14*S}px Arial`;
  ctx.fillText('MEMBER SINCE', PAD, footY);
  ctx.fillStyle = '#111827';
  ctx.font      = `900 ${24*S}px Arial`;
  ctx.fillText(new Date(joinDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }), PAD, footY + 30*S);

  // Status (centered)
  const statusLabel = isActivated ? 'ACTIVE' : 'PENDING';
  const statusBg    = isActivated ? '#D1FAE5' : '#FEF3C7';
  const statusFg    = isActivated ? '#065F46' : '#92400E';
  const statusBdr   = isActivated ? '#6EE7B7' : '#FDE68A';
  ctx.font          = `900 ${18*S}px Arial`;
  const statusW     = ctx.measureText(statusLabel).width + 40*S;
  const statusX     = W/2 - statusW/2;
  const statusY     = footY - 8*S;
  const statusH     = 38*S;
  ctx.fillStyle     = statusBg;
  roundRect(ctx, statusX, statusY, statusW, statusH, 999);
  ctx.fill();
  ctx.strokeStyle   = statusBdr;
  ctx.lineWidth     = 3*S;
  roundRect(ctx, statusX, statusY, statusW, statusH, 999);
  ctx.stroke();
  ctx.fillStyle     = statusFg;
  ctx.textAlign     = 'center';
  ctx.font          = `900 ${18*S}px Arial`;
  ctx.fillText(statusLabel, W/2, statusY + 26*S);
  ctx.textAlign     = 'left';

  // Monthly (right aligned)
  ctx.textAlign     = 'right';
  ctx.fillStyle     = '#9CA3AF';
  ctx.font          = `700 ${14*S}px Arial`;
  ctx.fillText('MONTHLY', W - PAD, footY);
  ctx.fillStyle     = '#065F46';
  ctx.font          = `900 ${34*S}px Arial`;
  ctx.fillText('500 CT', W - PAD, footY + 34*S);
  ctx.textAlign     = 'left';

  return canvas;
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export function MembershipCard({
  userId, fullName, email, profileImage, joinDate, country, isActivated = true
}: MembershipCardProps) {
  const [loading, setLoading]               = useState(false);
  const [sharing, setSharing]               = useState(false);
  const [error, setError]                   = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [captionCopied, setCaptionCopied]   = useState(false);
  const [previewSrc, setPreviewSrc]         = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(true);

  const memberId  = 'CT-' + userId.substring(0, 6).toUpperCase() + '-' + new Date(joinDate).getFullYear();
  const logoUrl   = '/Charity token logo.jpg';

  // Generate preview on mount / when props change
  useEffect(() => {
    if (!profileImage) return;
    let cancelled = false;
    setPreviewLoading(true);
    generateCardCanvas(userId, fullName, email, profileImage, joinDate, country, isActivated, logoUrl)
      .then(canvas => {
        if (!cancelled) {
          setPreviewSrc(canvas.toDataURL('image/png'));
          setPreviewLoading(false);
        }
      })
      .catch(err => {
        console.error('Preview error:', err);
        if (!cancelled) setPreviewLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, fullName, email, profileImage, joinDate, country, isActivated]);

  // ── Get blob ──────────────────────────────────────────────────────────────
  const getBlob = async (): Promise<Blob> => {
    const canvas = await generateCardCanvas(userId, fullName, email, profileImage!, joinDate, country, isActivated, logoUrl);
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')), 'image/png', 1.0);
    });
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const downloadCard = async () => {
    setError(''); setLoading(true);
    try {
      const blob = await getBlob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), {
        href: url, download: `charity-token-card-${userId.slice(0,6)}.png`
      });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      console.error('Download error:', e);
      setError('Download failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Native share ──────────────────────────────────────────────────────────
  const shareCard = async () => {
    setSharing(true); setError('');
    try {
      const blob = await getBlob();
      const file = new File([blob], 'charity-token-membership.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Charity Token Membership', text: SHARE_CAPTION });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: 'My Charity Token Membership', text: SHARE_CAPTION, url: 'https://charitytoken.net' });
        return;
      }
      setShowShareModal(true);
    } catch (e: any) {
      if (e?.name !== 'AbortError') setShowShareModal(true);
    } finally { setSharing(false); }
  };

  // ── Copy caption ──────────────────────────────────────────────────────────
  const copyCaption = () => {
    navigator.clipboard.writeText(SHARE_CAPTION);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2500);
  };

  // ── Platform share ────────────────────────────────────────────────────────
  const shareToPlatform = async (platform: string) => {
    setSharing(true);
    try {
      const blob = await getBlob();
      const file = new File([blob], 'charity-token-membership.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Charity Token Membership', text: SHARE_CAPTION });
        setShowShareModal(false);
        return;
      }

      // Download image first then open platform
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: 'charity-token-membership.png' });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      await new Promise(r => setTimeout(r, 800));

      const text = encodeURIComponent(SHARE_CAPTION);
      const site = encodeURIComponent('https://charitytoken.net');
      const urls: Record<string, string> = {
        whatsapp:  `https://wa.me/?text=${text}`,
        telegram:  `https://t.me/share/url?url=${site}&text=${text}`,
        twitter:   `https://twitter.com/intent/tweet?text=${text}`,
        facebook:  `https://www.facebook.com/sharer/sharer.php?u=${site}`,
        instagram: `https://www.instagram.com/`,
      };
      if (urls[platform]) window.open(urls[platform], '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError('Could not share. Please download and share manually.');
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

  const platforms = [
    { id: 'whatsapp',  label: 'WhatsApp',   bg: '#25D366',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
    { id: 'telegram',  label: 'Telegram',   bg: '#0088cc',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.008 9.456c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.09 14.99l-2.94-.92c-.64-.204-.652-.64.136-.948l11.49-4.43c.533-.194 1-.12.786.556z"/></svg> },
    { id: 'twitter',   label: 'X (Twitter)', bg: '#000000',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { id: 'facebook',  label: 'Facebook',   bg: '#1877F2',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
    { id: 'instagram', label: 'Instagram',  bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)' }}>
          <AlertCircle style={{ width: 14, height: 14, color: '#ff6b6b', flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#ff6b6b', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowShareModal(false); }}>
          <div style={{ width: '100%', maxWidth: 520, backgroundColor: '#0F1F35', borderRadius: '22px 22px 0 0', padding: '28px 24px 44px', boxShadow: '0 -20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: 0 }}>Share Your Membership 🚀</h3>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: '4px 0 0' }}>Image downloads automatically then the app opens</p>
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', color: '#8FA3BF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 12, backgroundColor: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.2)' }}>
              <p style={{ fontSize: 12, color: '#ffc107', margin: 0, lineHeight: 1.6 }}>
                <strong>How it works:</strong> Tap a platform — your card image is saved to your device automatically, then the app opens. Attach it from your gallery when posting.
              </p>
            </div>
            <div style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 14, backgroundColor: 'rgba(0,206,201,0.05)', border: '1px solid rgba(0,206,201,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#00CEC9', margin: 0 }}>📝 Caption</p>
                <button onClick={copyCaption} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, backgroundColor: captionCopied ? 'rgba(0,184,148,0.2)' : 'rgba(0,206,201,0.1)', border: `1px solid ${captionCopied ? 'rgba(0,184,148,0.4)' : 'rgba(0,206,201,0.25)'}`, color: captionCopied ? '#00B894' : '#67e8f9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {captionCopied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                  {captionCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize: 11.5, color: '#8FA3BF', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line', maxHeight: 90, overflowY: 'auto' }}>{SHARE_CAPTION}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {platforms.map(p => (
                <button key={p.id} onClick={() => shareToPlatform(p.id)} disabled={sharing}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 14, background: p.bg, color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: sharing ? 'not-allowed' : 'pointer', opacity: sharing ? 0.6 : 1, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                  {p.icon}<span>{p.label}</span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#4A5568', textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
              {sharing ? '⏳ Generating card...' : 'Your ID card saves automatically before each share.'}
            </p>
          </div>
        </div>
      )}

      {/* CARD PREVIEW — rendered from canvas */}
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,206,201,0.18)' }}>
        {previewLoading ? (
          <div style={{ width: '100%', aspectRatio: '1.586', backgroundColor: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16, border: '1px solid rgba(0,206,201,0.2)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid rgba(0,206,201,0.2)', borderTop: '3px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>Generating card...</p>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          </div>
        ) : previewSrc ? (
          <img src={previewSrc} alt="Membership Card" style={{ width: '100%', display: 'block', borderRadius: 16 }} />
        ) : null}
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <button onClick={downloadCard} disabled={loading || sharing || previewLoading}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 22px', borderRadius: 12, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: (loading || sharing || previewLoading) ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 8px 24px rgba(0,206,201,0.25)', flex: 1, justifyContent: 'center' }}>
          <Download style={{ width: 16, height: 16 }} />
          {loading ? 'Saving...' : 'Download'}
        </button>
        <button onClick={shareCard} disabled={loading || sharing || previewLoading}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 22px', borderRadius: 12, background: 'linear-gradient(135deg, #6C3FC8, #9B59B6)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: (loading || sharing || previewLoading) ? 'not-allowed' : 'pointer', opacity: sharing ? 0.7 : 1, boxShadow: '0 8px 24px rgba(108,63,200,0.3)', flex: 1, justifyContent: 'center' }}>
          <Share2 style={{ width: 16, height: 16 }} />
          {sharing ? 'Preparing...' : 'Share'}
        </button>
      </div>
    </div>
  );
}