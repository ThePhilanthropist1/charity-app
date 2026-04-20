'use client';

import { useState, useEffect } from 'react';
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

// ── Image loader ──────────────────────────────────────────────────────────────
function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image(); i.crossOrigin = 'anonymous';
    i.onload  = () => resolve(i);
    i.onerror = () => {
      const i2 = new Image();
      i2.onload  = () => resolve(i2);
      i2.onerror = () => reject(new Error('Cannot load: ' + src));
      i2.src = src + (src.includes('?') ? '&' : '?') + 'nc=' + Date.now();
    };
    i.src = src;
  });
}

// ── Cover-fit crop ────────────────────────────────────────────────────────────
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number) {
  const ir = img.naturalWidth / img.naturalHeight, br = dw / dh;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (ir > br) { sw = img.naturalHeight * br; sx = (img.naturalWidth - sw) / 2; }
  else          { sh = img.naturalWidth  / br; sy = (img.naturalHeight - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// ── Rounded rect ──────────────────────────────────────────────────────────────
function rrp(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const R = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + R, y); ctx.lineTo(x + w - R, y); ctx.arcTo(x + w, y,     x + w, y + R,     R);
  ctx.lineTo(x + w, y + h - R);                    ctx.arcTo(x + w, y + h, x + w - R, y + h, R);
  ctx.lineTo(x + R, y + h);                        ctx.arcTo(x,     y + h, x,       y + h - R, R);
  ctx.lineTo(x, y + R);                            ctx.arcTo(x,     y,     x + R,   y,         R);
  ctx.closePath();
}
function fillRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) {
  ctx.fillStyle = fill; rrp(ctx, x, y, w, h, r); ctx.fill();
}
function strokeRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string, lw: number) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; rrp(ctx, x, y, w, h, r); ctx.stroke();
}
function clipRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  rrp(ctx, x, y, w, h, r); ctx.clip();
}
function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 2 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

// ── Generate REAL QR code via Google Charts API ───────────────────────────────
// Falls back to QR Server API if Google fails
async function loadRealQR(url: string, size: number): Promise<HTMLImageElement> {
  // Try multiple QR APIs
  const apis = [
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&format=png&margin=2&color=005F6B&bgcolor=ffffff`,
    `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodeURIComponent(url)}&choe=UTF-8&chld=H|2`,
  ];
  for (const api of apis) {
    try { return await loadImg(api); } catch { continue; }
  }
  throw new Error('All QR APIs failed');
}

// ── CARD BUILDER ──────────────────────────────────────────────────────────────
async function buildCard(
  userId: string, fullName: string, email: string,
  profileImage: string, joinDate: string,
  country: string | undefined, isActivated: boolean
): Promise<HTMLCanvasElement> {
  const W = 1013, H = 638;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Verification URL — scans to beautiful membership verification page
  const verifyUrl = `https://www.charitytoken.net/verify/${userId}`;

  // ── BACKGROUND ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#FFFFFF';
  rrp(ctx, 0, 0, W, H, 30); ctx.fill();

  // Barely-there corner tints
  ctx.save();
  const h1 = ctx.createRadialGradient(0, 0, 0, 0, 0, 350);
  h1.addColorStop(0, 'rgba(0,206,201,0.04)'); h1.addColorStop(1, 'transparent');
  ctx.fillStyle = h1; rrp(ctx, 0, 0, W, H, 30); ctx.fill();
  ctx.restore();

  // ── BORDERS ───────────────────────────────────────────────────────────────
  strokeRR(ctx, 2, 2, W - 4, H - 4, 28, '#00CEC9', 4);

  // Top bar
  ctx.save(); clipRR(ctx, 0, 0, W, H, 28);
  const topG = ctx.createLinearGradient(0, 0, W, 0);
  topG.addColorStop(0, '#00CEC9'); topG.addColorStop(0.5, '#00B894'); topG.addColorStop(1, '#00CEC9');
  ctx.fillStyle = topG; ctx.fillRect(0, 0, W, 20);
  ctx.restore();

  // Bottom bar
  ctx.save(); clipRR(ctx, 0, 0, W, H, 28);
  const botG = ctx.createLinearGradient(0, 0, W, 0);
  botG.addColorStop(0, '#00B894'); botG.addColorStop(0.5, '#00CEC9'); botG.addColorStop(1, '#00B894');
  ctx.fillStyle = botG; ctx.fillRect(0, H - 20, W, 20);
  ctx.restore();

  const PAD = 46, CT = 30, CB = H - 26;

  // ── HEADER ────────────────────────────────────────────────────────────────
  const HDR_TOP = CT + 6, LOGO_SZ = 76;

  try {
    const logo = await loadImg('/Charity token logo.jpg');
    ctx.save(); clipRR(ctx, PAD, HDR_TOP, LOGO_SZ, LOGO_SZ, 14);
    drawCover(ctx, logo, PAD, HDR_TOP, LOGO_SZ, LOGO_SZ);
    ctx.restore();
    strokeRR(ctx, PAD, HDR_TOP, LOGO_SZ, LOGO_SZ, 14, 'rgba(0,206,201,0.6)', 3);
  } catch { /* skip */ }

  ctx.fillStyle = '#005F6B'; ctx.font = 'bold 24px Arial'; ctx.letterSpacing = '3px';
  ctx.fillText('CHARITY TOKEN', PAD + LOGO_SZ + 18, HDR_TOP + 28);
  ctx.fillStyle = '#00A8B5'; ctx.font = 'bold 13px Arial'; ctx.letterSpacing = '2.5px';
  ctx.fillText('MEMBERSHIP CARD', PAD + LOGO_SZ + 18, HDR_TOP + 52);
  ctx.letterSpacing = '0px';

  const memberId = 'CT-' + userId.slice(0, 6).toUpperCase() + '-' + new Date(joinDate).getFullYear();
  ctx.textAlign = 'right';
  ctx.fillStyle = '#9CA3AF'; ctx.font = 'bold 11px Arial'; ctx.letterSpacing = '1.5px';
  ctx.fillText('MEMBER ID', W - PAD, HDR_TOP + 24);
  ctx.fillStyle = '#005F6B'; ctx.font = "bold 20px 'Courier New', monospace"; ctx.letterSpacing = '0px';
  ctx.fillText(memberId, W - PAD, HDR_TOP + 52);
  ctx.textAlign = 'left';

  // ── DIVIDER 1 ─────────────────────────────────────────────────────────────
  const D1 = HDR_TOP + LOGO_SZ + 16;
  const dg1 = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  dg1.addColorStop(0, 'rgba(0,206,201,0.12)'); dg1.addColorStop(0.5, 'rgba(0,184,148,0.5)'); dg1.addColorStop(1, 'rgba(0,206,201,0.12)');
  ctx.strokeStyle = dg1 as any; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD, D1); ctx.lineTo(W - PAD, D1); ctx.stroke();

  // ── PHOTO ─────────────────────────────────────────────────────────────────
  const BODY_TOP = D1 + 16, PH_W = 162, PH_H = 204, PH_X = PAD, PH_Y = BODY_TOP;

  ctx.save();
  ctx.shadowColor = 'rgba(0,150,160,0.22)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#fff'; rrp(ctx, PH_X, PH_Y, PH_W, PH_H, 14); ctx.fill();
  ctx.restore();

  try {
    const prof = await loadImg(profileImage);
    ctx.save(); clipRR(ctx, PH_X, PH_Y, PH_W, PH_H, 14);
    drawCover(ctx, prof, PH_X, PH_Y, PH_W, PH_H);
    ctx.restore();
    strokeRR(ctx, PH_X, PH_Y, PH_W, PH_H, 14, '#00CEC9', 4);
  } catch {
    fillRR(ctx, PH_X, PH_Y, PH_W, PH_H, 14, '#E0F7FA');
    ctx.fillStyle = '#00CEC9'; ctx.font = 'bold 68px Arial'; ctx.textAlign = 'center';
    ctx.fillText((fullName[0] || 'U').toUpperCase(), PH_X + PH_W / 2, PH_Y + PH_H / 2 + 24);
    ctx.textAlign = 'left';
    strokeRR(ctx, PH_X, PH_Y, PH_W, PH_H, 14, '#00CEC9', 3);
  }

  // ── DETAILS ───────────────────────────────────────────────────────────────
  const IX = PH_X + PH_W + 30;
  const QR_SZ = 142;
  const QR_X  = W - PAD - QR_SZ;
  const DETAIL_MAX = QR_X - 20 - IX;

  let iy = PH_Y + 4;
  ctx.fillStyle = '#6B7280'; ctx.font = 'bold 11px Arial'; ctx.letterSpacing = '1.8px';
  ctx.fillText('FULL NAME', IX, iy + 14); ctx.letterSpacing = '0px';
  iy += 20;
  ctx.fillStyle = '#111827'; ctx.font = 'bold 30px Arial';
  ctx.fillText(truncate(ctx, fullName || 'Beneficiary', DETAIL_MAX), IX, iy + 28);
  iy += 40;

  ctx.fillStyle = '#6B7280'; ctx.font = 'bold 11px Arial'; ctx.letterSpacing = '1.8px';
  ctx.fillText('EMAIL ADDRESS', IX, iy + 14); ctx.letterSpacing = '0px';
  iy += 18;
  ctx.fillStyle = '#0369A1'; ctx.font = 'bold 16px Arial';
  ctx.fillText(truncate(ctx, email, DETAIL_MAX), IX, iy + 16);
  iy += 30;

  if (country) {
    ctx.fillStyle = '#6B7280'; ctx.font = 'bold 11px Arial'; ctx.letterSpacing = '1.8px';
    ctx.fillText('COUNTRY', IX, iy + 14); ctx.letterSpacing = '0px';
    iy += 18;
    ctx.fillStyle = '#374151'; ctx.font = 'bold 16px Arial';
    ctx.fillText(country, IX, iy + 16);
  }

  // ── REAL QR CODE ──────────────────────────────────────────────────────────
  const QR_Y = BODY_TOP + (PH_H - QR_SZ) / 2 - 8;

  // QR container with premium styling
  const QR_PADDING = 10;
  const QR_BOX_SZ  = QR_SZ + QR_PADDING * 2;

  // White container with teal border
  ctx.save();
  ctx.shadowColor = 'rgba(0,150,160,0.18)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
  ctx.fillStyle   = '#FFFFFF';
  rrp(ctx, QR_X - QR_PADDING, QR_Y - QR_PADDING, QR_BOX_SZ, QR_BOX_SZ + 30, 12);
  ctx.fill();
  ctx.restore();
  strokeRR(ctx, QR_X - QR_PADDING, QR_Y - QR_PADDING, QR_BOX_SZ, QR_BOX_SZ + 30, 12, '#00CEC9', 2.5);

  // Try to load real QR
  try {
    const qrImg = await loadRealQR(verifyUrl, 400);
    ctx.save(); clipRR(ctx, QR_X, QR_Y, QR_SZ, QR_SZ, 6);
    ctx.drawImage(qrImg, QR_X, QR_Y, QR_SZ, QR_SZ);
    ctx.restore();
  } catch {
    // Fallback: draw a simple pattern
    ctx.fillStyle = '#005F6B';
    const cell = QR_SZ / 10;
    const pat  = [1,0,1,1,0,1,0,1,1,0, 0,1,0,1,1,0,1,0,1,1,
                  1,1,1,0,0,1,1,1,0,0, 0,0,1,1,0,0,1,1,1,0,
                  1,0,0,1,1,1,0,0,1,1, 0,1,1,0,0,1,0,1,0,1,
                  1,0,1,1,1,0,1,0,1,0, 0,1,0,0,1,1,0,1,1,1,
                  1,1,0,1,0,1,1,0,0,1, 0,0,1,0,1,0,1,1,0,0];
    pat.forEach((v, i) => {
      if (v) {
        const r = Math.floor(i / 10), c = i % 10;
        ctx.fillRect(QR_X + c * cell + 1, QR_Y + r * cell + 1, cell - 2, cell - 2);
      }
    });
  }

  // "SCAN TO VERIFY" label inside QR box
  ctx.fillStyle    = '#005F6B';
  ctx.font         = 'bold 10px Arial';
  ctx.letterSpacing = '0.5px';
  ctx.textAlign    = 'center';
  ctx.fillText('SCAN TO VERIFY', QR_X + QR_SZ / 2, QR_Y + QR_SZ + 18);
  ctx.textAlign    = 'left';
  ctx.letterSpacing = '0px';

  // ── DIVIDER 2 ─────────────────────────────────────────────────────────────
  const D2 = BODY_TOP + PH_H + 18;
  const dg2 = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  dg2.addColorStop(0, 'rgba(0,206,201,0.12)'); dg2.addColorStop(0.5, 'rgba(0,184,148,0.5)'); dg2.addColorStop(1, 'rgba(0,206,201,0.12)');
  ctx.strokeStyle = dg2 as any; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD, D2); ctx.lineTo(W - PAD, D2); ctx.stroke();

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const FY = D2 + 14, FOOT_H = CB - FY;

  // Member Since
  ctx.fillStyle = '#6B7280'; ctx.font = 'bold 11px Arial'; ctx.letterSpacing = '1.8px';
  ctx.fillText('MEMBER SINCE', PAD, FY + 16); ctx.letterSpacing = '0px';
  ctx.fillStyle = '#111827'; ctx.font = 'bold 26px Arial';
  ctx.fillText(new Date(joinDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase(), PAD, FY + 48);

  // Status badge (centre)
  const sBg = isActivated ? '#DCFCE7' : '#FEF9C3';
  const sFg = isActivated ? '#14532D' : '#713F12';
  const sBdr = isActivated ? '#86EFAC' : '#FDE047';
  const sDot = isActivated ? '#16A34A' : '#CA8A04';
  const sLabel = isActivated ? 'ACTIVE MEMBER' : 'PENDING';
  ctx.font = 'bold 15px Arial';
  const sTW = ctx.measureText(sLabel).width;
  const sBW = sTW + 52, sBH = 38;
  const sBX = W / 2 - sBW / 2, sBY = FY + FOOT_H / 2 - sBH / 2 - 2;
  fillRR(ctx, sBX, sBY, sBW, sBH, 999, sBg);
  strokeRR(ctx, sBX, sBY, sBW, sBH, 999, sBdr, 2);
  ctx.fillStyle = sDot; ctx.beginPath(); ctx.arc(sBX + 22, sBY + sBH / 2, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = sFg; ctx.font = 'bold 15px Arial'; ctx.letterSpacing = '1px';
  ctx.textAlign = 'center'; ctx.fillText(sLabel, W / 2 + 8, sBY + sBH / 2 + 6);
  ctx.textAlign = 'left'; ctx.letterSpacing = '0px';

  // Monthly
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6B7280'; ctx.font = 'bold 11px Arial'; ctx.letterSpacing = '1.8px';
  ctx.fillText('MONTHLY REWARD', W - PAD, FY + 16); ctx.letterSpacing = '0px';
  ctx.fillStyle = '#064E3B'; ctx.font = 'bold 38px Arial';
  ctx.fillText('500 CT', W - PAD, FY + 52);
  ctx.fillStyle = '#6EE7B7'; ctx.font = 'bold 12px Arial'; ctx.letterSpacing = '0.5px';
  ctx.fillText('10 YEARS · STARTING 2027', W - PAD, FY + 72);
  ctx.textAlign = 'left'; ctx.letterSpacing = '0px';

  // Watermark
  ctx.fillStyle = 'rgba(0,150,160,0.20)'; ctx.font = '10px Arial'; ctx.textAlign = 'center';
  ctx.fillText('charitytoken.net  ·  Official Membership Card  ·  Charity Token Project', W / 2, H - 26);
  ctx.textAlign = 'left';

  return cv;
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export function MembershipCard({
  userId, fullName, email, profileImage,
  joinDate, country, isActivated = true,
}: MembershipCardProps) {
  const [loading,       setLoading]       = useState(false);
  const [sharing,       setSharing]       = useState(false);
  const [error,         setError]         = useState('');
  const [showModal,     setShowModal]     = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [previewSrc,    setPreviewSrc]    = useState('');
  const [genLoading,    setGenLoading]    = useState(true);

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
      const a    = Object.assign(document.createElement('a'), { href: url, download: `charity-token-${userId.slice(0, 6)}.png` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch { setError('Download failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const printCard = async () => {
    setError(''); setLoading(true);
    try {
      const blob = await getBlob();
      const url  = URL.createObjectURL(blob);
      const w    = window.open('', '_blank')!;
      w.document.write(`<!DOCTYPE html><html><head><title>Charity Token ID Card</title>
        <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh}
        img{max-width:100%;width:1013px;height:auto;display:block;margin:auto}
        @media print{@page{size:3.375in 2.125in;margin:0}body{width:3.375in;height:2.125in}img{width:100%;height:auto}}</style>
        </head><body><img src="${url}" onload="window.print()"/></body></html>`);
      w.document.close();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch { setError('Print failed. Please download instead.'); }
    finally { setLoading(false); }
  };

  const shareCard = async () => {
    setSharing(true); setError('');
    try {
      const blob = await getBlob();
      const file = new File([blob], 'charity-token-membership.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Charity Token Membership', text: SHARE_CAPTION }); return;
      }
      if (navigator.share) {
        await navigator.share({ title: 'Charity Token Membership', text: SHARE_CAPTION, url: 'https://charitytoken.net' }); return;
      }
      setShowModal(true);
    } catch (e: any) { if (e?.name !== 'AbortError') setShowModal(true); }
    finally { setSharing(false); }
  };

  const copyCaption = () => { navigator.clipboard.writeText(SHARE_CAPTION); setCaptionCopied(true); setTimeout(() => setCaptionCopied(false), 2500); };

  const sharePlatform = async (platform: string) => {
    setSharing(true);
    try {
      const blob = await getBlob();
      const file = new File([blob], 'charity-token-membership.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Charity Token Membership', text: SHARE_CAPTION });
        setShowModal(false); return;
      }
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: 'charity-token-membership.png' });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1200);
      await new Promise(r => setTimeout(r, 900));
      const t = encodeURIComponent(SHARE_CAPTION), u = encodeURIComponent('https://charitytoken.net');
      const urls: Record<string, string> = {
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
    { id: 'whatsapp',  label: 'WhatsApp',    bg: '#25D366', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
    { id: 'telegram',  label: 'Telegram',    bg: '#0088cc', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.008 9.456c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.09 14.99l-2.94-.92c-.64-.204-.652-.64.136-.948l11.49-4.43c.533-.194 1-.12.786.556z"/></svg> },
    { id: 'twitter',   label: 'X (Twitter)', bg: '#000000', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { id: 'facebook',  label: 'Facebook',    bg: '#1877F2', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
    { id: 'instagram', label: 'Instagram',   bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  ];

  const busy = loading || sharing || genLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {error && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)' }}>
          <AlertCircle style={{ width: 14, height: 14, color: '#ff6b6b', flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#ff6b6b', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* SHARE MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ width: '100%', maxWidth: 520, backgroundColor: '#0F1F35', borderRadius: '22px 22px 0 0', padding: '28px 24px 44px', boxShadow: '0 -20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: 0 }}>Share Your Membership 🚀</h3>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: '4px 0 0' }}>Image saves automatically then the app opens</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', color: '#8FA3BF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.05)', border: '1px solid rgba(0,206,201,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#00CEC9', margin: 0 }}>📝 Caption</p>
                <button onClick={copyCaption} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, backgroundColor: captionCopied ? 'rgba(0,184,148,0.2)' : 'rgba(0,206,201,0.1)', border: `1px solid ${captionCopied ? 'rgba(0,184,148,0.4)' : 'rgba(0,206,201,0.25)'}`, color: captionCopied ? '#00B894' : '#67e8f9', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {captionCopied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                  {captionCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize: 11.5, color: '#8FA3BF', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line', maxHeight: 80, overflowY: 'auto' }}>{SHARE_CAPTION}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {platforms.map(p => (
                <button key={p.id} onClick={() => sharePlatform(p.id)} disabled={sharing}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 14, background: p.bg, color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: sharing ? 'not-allowed' : 'pointer', opacity: sharing ? 0.6 : 1, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                  {p.icon}<span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CARD PREVIEW */}
      <div style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,206,201,0.18)', border: '1px solid rgba(0,206,201,0.12)' }}>
          {genLoading ? (
            <div style={{ width: '100%', aspectRatio: '1.586', backgroundColor: '#071828', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, border: '3px solid rgba(0,206,201,0.2)', borderTop: '3px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>Building your ID card…</p>
              </div>
            </div>
          ) : previewSrc ? (
            <img src={previewSrc} alt="Charity Token Membership Card" style={{ width: '100%', display: 'block' }} />
          ) : null}
        </div>
        {!genLoading && previewSrc && (
          <p style={{ fontSize: 11, color: 'rgba(143,163,191,0.45)', textAlign: 'center', marginTop: 7 }}>
            CR80 standard · 3.375 × 2.125 in · 300 DPI · QR links to your verification page
          </p>
        )}
      </div>

      {/* BUTTONS */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', maxWidth: 520, margin: '0 auto', width: '100%', flexWrap: 'wrap' }}>
        <button onClick={downloadCard} disabled={busy}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 20px', borderRadius: 12, background: 'linear-gradient(to right,#00CEC9,#00B894)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 6px 20px rgba(0,206,201,0.3)', flex: 1, minWidth: 110, justifyContent: 'center' }}>
          <Download style={{ width: 16, height: 16 }} />
          {loading ? 'Saving…' : 'Download'}
        </button>
        <button onClick={printCard} disabled={busy}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 20px', borderRadius: 12, background: 'linear-gradient(to right,#0369a1,#0284c7)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', boxShadow: '0 6px 20px rgba(3,105,161,0.25)', flex: 1, minWidth: 110, justifyContent: 'center' }}>
          <Printer style={{ width: 16, height: 16 }} />
          Print
        </button>
        <button onClick={shareCard} disabled={busy}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 20px', borderRadius: 12, background: 'linear-gradient(135deg,#6C3FC8,#9B59B6)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', opacity: sharing ? 0.7 : 1, boxShadow: '0 6px 20px rgba(108,63,200,0.25)', flex: 1, minWidth: 110, justifyContent: 'center' }}>
          <Share2 style={{ width: 16, height: 16 }} />
          {sharing ? 'Preparing…' : 'Share'}
        </button>
      </div>
    </div>
  );
}