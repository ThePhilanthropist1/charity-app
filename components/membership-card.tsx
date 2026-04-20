'use client';

import { useRef, useState, useEffect } from 'react';
import { Download, AlertCircle, Share2, X, Copy, Check, Printer } from 'lucide-react';

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

// ─── helpers ────────────────────────────────────────────────────────────────
function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => {
      const img2 = new Image();
      img2.onload  = () => resolve(img2);
      img2.onerror = () => reject(new Error('Cannot load: ' + src));
      img2.src = src + '?nc=' + Date.now();
    };
    img.src = src;
  });
}

function rrPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,      y + h, x,       y + h - r, r);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x,      y,     x + r,   y,         r);
  ctx.closePath();
}

function fillRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string | CanvasGradient) {
  ctx.fillStyle = color; rrPath(ctx, x, y, w, h, r); ctx.fill();
}

function strokeRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string, lw: number) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; rrPath(ctx, x, y, w, h, r); ctx.stroke();
}

function clipRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  rrPath(ctx, x, y, w, h, r); ctx.clip();
}

function drawImageFit(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ir = img.naturalWidth / img.naturalHeight;
  const br = w / h;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (ir > br) { sw = img.naturalHeight * br; sx = (img.naturalWidth - sw) / 2; }
  else          { sh = img.naturalWidth / br;  sy = (img.naturalHeight - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  while (text.length > 2 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
  return text + '…';
}

function hLine(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number, color: string, lw = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
}

// ─── QR code (simple URL display as fallback) ────────────────────────────────
function drawQRPlaceholder(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  // Draw a small decorative "scan me" box since real QR needs a library
  const s = size;
  ctx.strokeStyle = '#00CEC9'; ctx.lineWidth = 2;
  // Outer border
  ctx.strokeRect(cx - s/2, cy - s/2, s, s);
  // Corner marks
  const cm = s * 0.22;
  const cw = s * 0.06;
  [[0,0],[1,0],[0,1],[1,1]].forEach(([xi,yi]) => {
    const px = cx - s/2 + xi * (s - cm);
    const py = cy - s/2 + yi * (s - cm);
    ctx.fillStyle = '#00CEC9';
    ctx.fillRect(px, py, cm, cw);
    ctx.fillRect(px, py, cw, cm);
  });
  // Inner grid dots (decorative)
  ctx.fillStyle = 'rgba(0,206,201,0.35)';
  const cols = 5; const cell = (s * 0.56) / cols;
  const ox = cx - (s*0.56)/2; const oy = cy - (s*0.56)/2;
  for (let r = 0; r < cols; r++) for (let c = 0; c < cols; c++) {
    if (Math.random() > 0.4) ctx.fillRect(ox + c*cell + 1, oy + r*cell + 1, cell-2, cell-2);
  }
  ctx.fillStyle = '#007B8A';
  ctx.font = `bold ${s * 0.12}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('charitytoken.net', cx, cy + s/2 + s*0.16);
  ctx.textAlign = 'left';
}

// ─── MAIN GENERATOR ──────────────────────────────────────────────────────────
async function buildCard(
  userId: string, fullName: string, email: string,
  profileImage: string, joinDate: string,
  country: string | undefined, isActivated: boolean
): Promise<HTMLCanvasElement> {
  // CR80 card ratio 3.375 × 2.125 inch → scale to 1012 × 638 px at 300dpi
  const W = 1012, H = 638;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;

  // ── BACKGROUND ────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,    '#f0fdfc');
  bg.addColorStop(0.5,  '#ffffff');
  bg.addColorStop(1,    '#f0fdf4');
  fillRR(ctx, 0, 0, W, H, 28, bg);

  // Subtle teal circle top-right
  ctx.save();
  ctx.globalAlpha = 0.06;
  const g1 = ctx.createRadialGradient(W*0.9, H*0.1, 0, W*0.9, H*0.1, 320);
  g1.addColorStop(0, '#00CEC9'); g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
  // Subtle green circle bottom-left
  const g2 = ctx.createRadialGradient(W*0.1, H*0.9, 0, W*0.1, H*0.9, 280);
  g2.addColorStop(0, '#00B894'); g2.addColorStop(1, 'transparent');
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // ── CARD BORDER ───────────────────────────────────────────────────────────
  strokeRR(ctx, 2, 2, W-4, H-4, 26, '#00CEC9', 4);

  // ── TOP ACCENT BAR (14px) ─────────────────────────────────────────────────
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, '#00CEC9'); topBar.addColorStop(0.5, '#00B894'); topBar.addColorStop(1, '#00CEC9');
  ctx.save(); clipRR(ctx, 0, 0, W, H, 28);
  ctx.fillStyle = topBar; ctx.fillRect(0, 0, W, 18); ctx.restore();

  // ── BOTTOM ACCENT BAR (14px) ──────────────────────────────────────────────
  const botBar = ctx.createLinearGradient(0, 0, W, 0);
  botBar.addColorStop(0, '#00B894'); botBar.addColorStop(0.5, '#00CEC9'); botBar.addColorStop(1, '#00B894');
  ctx.save(); clipRR(ctx, 0, 0, W, H, 28);
  ctx.fillStyle = botBar; ctx.fillRect(0, H-18, W, 18); ctx.restore();

  // ── LAYOUT CONSTANTS ─────────────────────────────────────────────────────
  const PAD  = 44;
  const COL1 = PAD;               // left edge of content
  const COL2 = PAD + 160 + 32;   // right of photo column
  const RPAD = W - PAD;           // right edge

  // ── SECTION 1: HEADER ROW ─────────────────────────────────────────────────
  const HDR_Y = 30;

  // Logo
  try {
    const logo = await loadImg('/Charity token logo.jpg');
    ctx.save(); clipRR(ctx, COL1, HDR_Y, 80, 80, 14);
    drawImageFit(ctx, logo, COL1, HDR_Y, 80, 80);
    ctx.restore();
    strokeRR(ctx, COL1, HDR_Y, 80, 80, 14, 'rgba(0,206,201,0.5)', 3);
  } catch { /* skip */ }

  // Title
  ctx.fillStyle = '#006B7A';
  ctx.font      = 'bold 26px Arial';
  ctx.letterSpacing = '3px';
  ctx.fillText('CHARITY TOKEN', COL1 + 94, HDR_Y + 30);
  ctx.font      = 'bold 14px Arial';
  ctx.letterSpacing = '2px';
  ctx.fillStyle = '#00A0A8';
  ctx.fillText('MEMBERSHIP CARD', COL1 + 94, HDR_Y + 54);
  ctx.letterSpacing = '0px';

  // Member ID (top right)
  const memberId = 'CT-' + userId.slice(0, 6).toUpperCase() + '-' + new Date(joinDate).getFullYear();
  ctx.textAlign  = 'right';
  ctx.fillStyle  = '#9CA3AF';
  ctx.font       = 'bold 12px Arial';
  ctx.letterSpacing = '1px';
  ctx.fillText('MEMBER ID', RPAD, HDR_Y + 26);
  ctx.letterSpacing = '0px';
  ctx.fillStyle  = '#006B7A';
  ctx.font       = "bold 22px 'Courier New', monospace";
  ctx.fillText(memberId, RPAD, HDR_Y + 54);
  ctx.textAlign  = 'left';

  // ── DIVIDER 1 ─────────────────────────────────────────────────────────────
  const DIV1 = HDR_Y + 96;
  const div1Grad = ctx.createLinearGradient(COL1, 0, RPAD, 0);
  div1Grad.addColorStop(0, 'rgba(0,206,201,0.1)');
  div1Grad.addColorStop(0.5, 'rgba(0,184,148,0.5)');
  div1Grad.addColorStop(1, 'rgba(0,206,201,0.1)');
  hLine(ctx, COL1, DIV1, RPAD, div1Grad as any, 1.5);

  // ── SECTION 2: PHOTO + DETAILS ────────────────────────────────────────────
  const PHOTO_Y = DIV1 + 18;
  const PHOTO_W = 160;
  const PHOTO_H = 200;

  // Photo box shadow
  ctx.save();
  ctx.shadowColor   = 'rgba(0,206,201,0.25)';
  ctx.shadowBlur    = 18;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle     = '#ffffff';
  rrPath(ctx, COL1, PHOTO_Y, PHOTO_W, PHOTO_H, 16);
  ctx.fill();
  ctx.restore();

  // Photo
  try {
    const prof = await loadImg(profileImage);
    ctx.save(); clipRR(ctx, COL1, PHOTO_Y, PHOTO_W, PHOTO_H, 16);
    drawImageFit(ctx, prof, COL1, PHOTO_Y, PHOTO_W, PHOTO_H);
    ctx.restore();
    strokeRR(ctx, COL1, PHOTO_Y, PHOTO_W, PHOTO_H, 16, '#00CEC9', 4);
  } catch {
    fillRR(ctx, COL1, PHOTO_Y, PHOTO_W, PHOTO_H, 16, '#e0f7fa');
    ctx.fillStyle = '#00CEC9'; ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText((fullName[0] || 'U').toUpperCase(), COL1 + PHOTO_W/2, PHOTO_Y + PHOTO_H/2 + 22);
    ctx.textAlign = 'left';
    strokeRR(ctx, COL1, PHOTO_Y, PHOTO_W, PHOTO_H, 16, '#00CEC9', 3);
  }

  // ── DETAILS (right of photo) ──────────────────────────────────────────────
  const DX   = COL2;
  const DMaxW = RPAD - DX - 160; // leave space for QR on far right

  // Full Name label
  ctx.fillStyle = '#9CA3AF'; ctx.font = 'bold 12px Arial'; ctx.letterSpacing = '1.5px';
  ctx.fillText('FULL NAME', DX, PHOTO_Y + 18);
  ctx.letterSpacing = '0px';

  // Full Name value
  ctx.fillStyle = '#111827'; ctx.font = 'bold 36px Arial';
  const nameDisplay = truncate(ctx, fullName || 'Beneficiary', DMaxW);
  ctx.fillText(nameDisplay, DX, PHOTO_Y + 58);

  // Email label
  ctx.fillStyle = '#9CA3AF'; ctx.font = 'bold 12px Arial'; ctx.letterSpacing = '1.5px';
  ctx.fillText('EMAIL ADDRESS', DX, PHOTO_Y + 88);
  ctx.letterSpacing = '0px';

  // Email value
  ctx.fillStyle = '#0369a1'; ctx.font = 'bold 18px Arial';
  const emailDisplay = truncate(ctx, email, DMaxW);
  ctx.fillText(emailDisplay, DX, PHOTO_Y + 114);

  // Country
  if (country) {
    ctx.fillStyle = '#9CA3AF'; ctx.font = 'bold 12px Arial'; ctx.letterSpacing = '1.5px';
    ctx.fillText('COUNTRY', DX, PHOTO_Y + 144);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = '#374151'; ctx.font = 'bold 18px Arial';
    ctx.fillText(country, DX, PHOTO_Y + 168);
  }

  // ── QR PLACEHOLDER (far right, aligned with photo section) ───────────────
  const QR_SIZE = 130;
  const QR_CX   = RPAD - QR_SIZE/2;
  const QR_CY   = PHOTO_Y + PHOTO_H/2 - 10;
  // Seed random for consistent dots
  const savedRand = Math.random;
  let seed = 42;
  Math.random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  drawQRPlaceholder(ctx, QR_CX, QR_CY, QR_SIZE);
  Math.random = savedRand;

  // ── DIVIDER 2 ─────────────────────────────────────────────────────────────
  const DIV2 = PHOTO_Y + PHOTO_H + 24;
  hLine(ctx, COL1, DIV2, RPAD, 'rgba(0,206,201,0.35)', 1.5);

  // ── SECTION 3: FOOTER ROW ─────────────────────────────────────────────────
  const FOOT_Y = DIV2 + 16;
  const FOOT_H = H - FOOT_Y - 26;

  // ── BOX 1: Member Since ───────────────────────────────────────────────────
  const B1X = COL1;
  ctx.fillStyle = '#9CA3AF'; ctx.font = 'bold 11px Arial'; ctx.letterSpacing = '1.5px';
  ctx.fillText('MEMBER SINCE', B1X, FOOT_Y + 18);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = '#111827'; ctx.font = 'bold 28px Arial';
  ctx.fillText(new Date(joinDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase(), B1X, FOOT_Y + 52);

  // ── BOX 2: Status (center) ────────────────────────────────────────────────
  const statusLabel = isActivated ? 'ACTIVE MEMBER' : 'PENDING';
  const sBg  = isActivated ? '#DCFCE7' : '#FEF9C3';
  const sFg  = isActivated ? '#14532D' : '#713F12';
  const sBdr = isActivated ? '#86EFAC' : '#FDE047';
  ctx.font = 'bold 16px Arial';
  const sW = ctx.measureText(statusLabel).width + 56;
  const sH = 40;
  const sX = W/2 - sW/2;
  const sY = FOOT_Y + 14;
  fillRR(ctx, sX, sY, sW, sH, 999, sBg);
  strokeRR(ctx, sX, sY, sW, sH, 999, sBdr, 2);
  // Status dot
  ctx.fillStyle = isActivated ? '#16A34A' : '#CA8A04';
  ctx.beginPath(); ctx.arc(sX + 22, sY + sH/2, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = sFg; ctx.font = 'bold 16px Arial'; ctx.letterSpacing = '1px';
  ctx.textAlign = 'center';
  ctx.fillText(statusLabel, W/2 + 8, sY + sH/2 + 6);
  ctx.textAlign = 'left'; ctx.letterSpacing = '0px';

  // ── BOX 3: Monthly tokens (right) ────────────────────────────────────────
  ctx.textAlign  = 'right';
  ctx.fillStyle  = '#9CA3AF'; ctx.font = 'bold 11px Arial'; ctx.letterSpacing = '1.5px';
  ctx.fillText('MONTHLY REWARD', RPAD, FOOT_Y + 18);
  ctx.letterSpacing = '0px';
  ctx.fillStyle  = '#064E3B'; ctx.font = 'bold 40px Arial';
  ctx.fillText('500 CT', RPAD, FOOT_Y + 58);
  ctx.fillStyle  = '#6EE7B7'; ctx.font = 'bold 13px Arial';
  ctx.fillText('FOR 10 YEARS · STARTING 2027', RPAD, FOOT_Y + 78);
  ctx.textAlign  = 'left';

  // ── FINE PRINT / watermark strip ─────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,150,160,0.18)';
  ctx.font      = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('charitytoken.net  ·  This card is the official record of membership in the Charity Token Project', W/2, H - 24);
  ctx.textAlign = 'left';

  return cv;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export function MembershipCard({
  userId, fullName, email, profileImage, joinDate, country, isActivated = true
}: MembershipCardProps) {
  const [loading, setLoading]               = useState(false);
  const [sharing, setSharing]               = useState(false);
  const [error, setError]                   = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [captionCopied, setCaptionCopied]   = useState(false);
  const [previewSrc, setPreviewSrc]         = useState('');
  const [genLoading, setGenLoading]         = useState(true);

  useEffect(() => {
    if (!profileImage) return;
    let cancelled = false;
    setGenLoading(true);
    buildCard(userId, fullName, email, profileImage, joinDate, country, isActivated)
      .then(cv => { if (!cancelled) { setPreviewSrc(cv.toDataURL('image/png')); setGenLoading(false); } })
      .catch(() => { if (!cancelled) setGenLoading(false); });
    return () => { cancelled = true; };
  }, [userId, fullName, email, profileImage, joinDate, country, isActivated]);

  const getBlob = async (): Promise<Blob> => {
    const cv = await buildCard(userId, fullName, email, profileImage!, joinDate, country, isActivated);
    return new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png', 1));
  };

  const downloadCard = async () => {
    setError(''); setLoading(true);
    try {
      const blob = await getBlob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href: url, download: `charity-token-${userId.slice(0,6)}.png` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (e: any) { setError('Download failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const printCard = async () => {
    setError(''); setLoading(true);
    try {
      const blob = await getBlob();
      const url  = URL.createObjectURL(blob);
      const w = window.open('', '_blank')!;
      w.document.write(`<!DOCTYPE html><html><head><title>Charity Token ID Card</title>
        <style>*{margin:0;padding:0;box-sizing:border-box}
        body{background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh}
        img{max-width:100%;width:1012px;height:auto;display:block;margin:auto}
        @media print{
          @page{size:3.375in 2.125in;margin:0}
          body{width:3.375in;height:2.125in}
          img{width:100%;height:auto}
        }</style></head>
        <body><img src="${url}" onload="window.print()"/></body></html>`);
      w.document.close();
      URL.revokeObjectURL(url);
    } catch (e: any) { setError('Print failed. Please try downloading instead.'); }
    finally { setLoading(false); }
  };

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
    } catch (e: any) { if (e?.name !== 'AbortError') setShowShareModal(true); }
    finally { setSharing(false); }
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(SHARE_CAPTION);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2500);
  };

  const sharePlatform = async (platform: string) => {
    setSharing(true);
    try {
      const blob = await getBlob();
      const file = new File([blob], 'charity-token-membership.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Charity Token Membership', text: SHARE_CAPTION });
        setShowShareModal(false); return;
      }
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: 'charity-token-membership.png' }).click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      await new Promise(r => setTimeout(r, 900));
      const t = encodeURIComponent(SHARE_CAPTION), u = encodeURIComponent('https://charitytoken.net');
      const urls: Record<string,string> = {
        whatsapp: `https://wa.me/?text=${t}`, telegram: `https://t.me/share/url?url=${u}&text=${t}`,
        twitter: `https://twitter.com/intent/tweet?text=${t}`, facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
        instagram: 'https://www.instagram.com/',
      };
      if (urls[platform]) window.open(urls[platform], '_blank', 'noopener');
    } catch (e: any) { if (e?.name !== 'AbortError') setError('Share failed. Please download and share manually.'); }
    finally { setSharing(false); }
  };

  if (!profileImage) {
    return (
      <div style={{ padding: 18, borderRadius: 14, border: '1px solid rgba(255,193,7,0.3)', backgroundColor: 'rgba(255,193,7,0.06)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertCircle style={{ width: 18, height: 18, color: '#ffc107', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontWeight: 700, color: 'white', marginBottom: 4, fontSize: 13 }}>Upload a Profile Picture to Generate Your ID Card</p>
          <p style={{ fontSize: 12, color: '#8FA3BF', lineHeight: 1.6 }}>Your printable membership card will appear once you add a profile photo.</p>
        </div>
      </div>
    );
  }

  const platforms = [
    { id: 'whatsapp',  label: 'WhatsApp',    bg: '#25D366',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
    { id: 'telegram',  label: 'Telegram',    bg: '#0088cc',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.008 9.456c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.09 14.99l-2.94-.92c-.64-.204-.652-.64.136-.948l11.49-4.43c.533-.194 1-.12.786.556z"/></svg> },
    { id: 'twitter',   label: 'X (Twitter)', bg: '#000000',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { id: 'facebook',  label: 'Facebook',    bg: '#1877F2',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
    { id: 'instagram', label: 'Instagram',   bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  ];

  const busy = loading || sharing || genLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {error && (
        <div style={{ display:'flex', gap:8, alignItems:'center', padding:'10px 14px', borderRadius:10, backgroundColor:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)' }}>
          <AlertCircle style={{ width:14, height:14, color:'#ff6b6b', flexShrink:0 }} />
          <p style={{ fontSize:12, color:'#ff6b6b', margin:0 }}>{error}</p>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:300, backdropFilter:'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowShareModal(false); }}>
          <div style={{ width:'100%', maxWidth:520, backgroundColor:'#0F1F35', borderRadius:'22px 22px 0 0', padding:'28px 24px 44px', boxShadow:'0 -20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ width:40, height:4, borderRadius:999, backgroundColor:'rgba(255,255,255,0.15)', margin:'0 auto 20px' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div>
                <h3 style={{ fontSize:18, fontWeight:800, color:'white', margin:0 }}>Share Your Membership 🚀</h3>
                <p style={{ fontSize:12, color:'#8FA3BF', margin:'4px 0 0' }}>Image auto-saves then the app opens</p>
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ width:34, height:34, borderRadius:'50%', backgroundColor:'rgba(255,255,255,0.08)', border:'none', color:'#8FA3BF', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X style={{ width:16, height:16 }} />
              </button>
            </div>
            <div style={{ marginBottom:14, padding:'12px 14px', borderRadius:12, backgroundColor:'rgba(0,206,201,0.05)', border:'1px solid rgba(0,206,201,0.15)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <p style={{ fontSize:12, fontWeight:700, color:'#00CEC9', margin:0 }}>📝 Caption to copy</p>
                <button onClick={copyCaption} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:8, backgroundColor: captionCopied ? 'rgba(0,184,148,0.2)' : 'rgba(0,206,201,0.1)', border:`1px solid ${captionCopied ? 'rgba(0,184,148,0.4)' : 'rgba(0,206,201,0.25)'}`, color: captionCopied ? '#00B894' : '#67e8f9', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  {captionCopied ? <Check style={{ width:12, height:12 }} /> : <Copy style={{ width:12, height:12 }} />}
                  {captionCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize:11.5, color:'#8FA3BF', lineHeight:1.7, margin:0, whiteSpace:'pre-line', maxHeight:80, overflowY:'auto' }}>{SHARE_CAPTION}</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {platforms.map(p => (
                <button key={p.id} onClick={() => sharePlatform(p.id)} disabled={sharing}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 16px', borderRadius:14, background:p.bg, color:'white', fontWeight:700, fontSize:14, border:'none', cursor:sharing ? 'not-allowed' : 'pointer', opacity:sharing ? 0.6 : 1, boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>
                  {p.icon}<span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CARD PREVIEW */}
      <div style={{ width:'100%', maxWidth:520, margin:'0 auto' }}>
        <div style={{ borderRadius:16, overflow:'hidden', boxShadow:'0 8px 40px rgba(0,206,201,0.2)', border:'1px solid rgba(0,206,201,0.15)' }}>
          {genLoading ? (
            <div style={{ width:'100%', aspectRatio:'1.586', backgroundColor:'#071828', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ width:32, height:32, border:'3px solid rgba(0,206,201,0.2)', borderTop:'3px solid #00CEC9', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 10px' }} />
                <p style={{ fontSize:12, color:'#8FA3BF', margin:0 }}>Building your ID card...</p>
              </div>
            </div>
          ) : previewSrc ? (
            <img src={previewSrc} alt="Charity Token Membership Card" style={{ width:'100%', display:'block' }} />
          ) : null}
        </div>

        {/* Print hint */}
        {!genLoading && previewSrc && (
          <p style={{ fontSize:11, color:'rgba(143,163,191,0.5)', textAlign:'center', marginTop:8 }}>
            CR80 card size (3.375 × 2.125 in) · Print-ready 300dpi
          </p>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display:'flex', gap:8, justifyContent:'center', maxWidth:520, margin:'0 auto', width:'100%', flexWrap:'wrap' }}>
        <button onClick={downloadCard} disabled={busy}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'12px 20px', borderRadius:12, background:'linear-gradient(to right,#00CEC9,#00B894)', color:'white', fontWeight:700, fontSize:14, border:'none', cursor:busy ? 'not-allowed' : 'pointer', opacity:loading ? 0.7 : 1, boxShadow:'0 6px 20px rgba(0,206,201,0.3)', flex:1, minWidth:120, justifyContent:'center' }}>
          <Download style={{ width:16, height:16 }} />
          {loading ? 'Saving…' : 'Download'}
        </button>

        <button onClick={printCard} disabled={busy}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'12px 20px', borderRadius:12, background:'linear-gradient(to right,#0369a1,#0284c7)', color:'white', fontWeight:700, fontSize:14, border:'none', cursor:busy ? 'not-allowed' : 'pointer', boxShadow:'0 6px 20px rgba(3,105,161,0.3)', flex:1, minWidth:120, justifyContent:'center' }}>
          <Printer style={{ width:16, height:16 }} />
          Print
        </button>

        <button onClick={shareCard} disabled={busy}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'12px 20px', borderRadius:12, background:'linear-gradient(135deg,#6C3FC8,#9B59B6)', color:'white', fontWeight:700, fontSize:14, border:'none', cursor:busy ? 'not-allowed' : 'pointer', opacity:sharing ? 0.7 : 1, boxShadow:'0 6px 20px rgba(108,63,200,0.3)', flex:1, minWidth:120, justifyContent:'center' }}>
          <Share2 style={{ width:16, height:16 }} />
          {sharing ? 'Preparing…' : 'Share'}
        </button>
      </div>
    </div>
  );
}