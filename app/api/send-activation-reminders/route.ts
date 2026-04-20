import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

const RESEND_KEY = process.env.RESEND_API_KEY || '';
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL || 'https://www.charitytoken.net';
const TELEGRAM   = 'https://t.me/Tribe_Visionary';

// Simple auth — only allow calls with the correct secret
// Set CRON_SECRET in Netlify env vars to any random string
async function sendEmail(to: string, name: string): Promise<boolean> {
  if (!RESEND_KEY) return false;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A1628;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#0F1F35;border-radius:16px;overflow:hidden;border:1px solid rgba(0,206,201,0.25);">
  <div style="height:5px;background:linear-gradient(to right,#00CEC9,#00B894);"></div>
  <div style="padding:40px 36px;text-align:center;">
    <img src="${APP_URL}/Charity token logo.jpg" alt="Charity Token" style="width:64px;height:64px;border-radius:14px;border:2px solid rgba(0,206,201,0.4);margin-bottom:20px;">
    <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:#00CEC9;margin:0 0 10px;text-transform:uppercase;">Charity Token Project</p>
    <h1 style="font-size:24px;font-weight:900;color:white;margin:0 0 14px;line-height:1.3;">
      Hi ${name}, your account is not yet activated 👋
    </h1>
    <p style="font-size:15px;color:#B0C8D8;line-height:1.8;margin:0 0 28px;">
      You are registered on the Charity Token Project but your account has not been activated yet.
      Once activated, you will receive <strong style="color:#00CEC9;">500 Charity Tokens every month for 10 years</strong> starting 2027.
    </p>

    <!-- Telegram Button -->
    <a href="${TELEGRAM}"
       style="display:inline-flex;align-items:center;gap:10px;padding:15px 36px;border-radius:13px;background:linear-gradient(135deg,#0088cc,#229ED9);color:white;font-weight:900;font-size:15px;text-decoration:none;margin-bottom:14px;box-shadow:0 8px 24px rgba(0,136,204,0.35);">
      💬 Contact Philanthropist on Telegram
    </a>

    <p style="font-size:13px;color:#8FA3BF;margin:0 0 28px;line-height:1.7;">
      Click the button above to contact a Charity Token Philanthropist on Telegram.<br>
      They will guide you and collect the <strong style="color:white;">$1 activation fee</strong> in your local currency (fiat money — no crypto needed).
    </p>

    <div style="padding:16px 20px;background:rgba(0,206,201,0.05);border:1px solid rgba(0,206,201,0.15);border-radius:12px;margin-bottom:28px;text-align:left;">
      <p style="font-size:13px;color:#B0C8D8;margin:0 0 8px;font-weight:700;">How to activate:</p>
      <ol style="font-size:13px;color:#8FA3BF;line-height:1.9;margin:0;padding-left:20px;">
        <li>Click the Telegram button above</li>
        <li>Message the philanthropist to request activation</li>
        <li>Pay <strong style="color:white;">$1 equivalent</strong> in your local currency (naira, cedis, etc.)</li>
        <li>Your account is activated instantly ✅</li>
      </ol>
    </div>

    <a href="${APP_URL}/login"
       style="display:inline-block;padding:13px 32px;border-radius:12px;background:linear-gradient(to right,#00CEC9,#00B894);color:#020C1B;font-weight:800;font-size:14px;text-decoration:none;">
      Sign In to Your Account
    </a>

    <p style="font-size:11px;color:#4A5568;margin:28px 0 0;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
      Charity Token Project · charitytoken.net<br>
      You received this because you registered but have not yet activated your account.
    </p>
  </div>
  <div style="height:4px;background:linear-gradient(to right,#00B894,#00CEC9);"></div>
</div>
</body></html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Charity Token <info@charitytoken.net>',
        to,
        subject: `${name}, activate your Charity Token account today 🌍`,
        html,
      }),
    });
    return res.ok;
  } catch { return false; }
}

export async function POST(request: NextRequest) {
  // Auth check — must be admin
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '').trim();

  // Dynamically import to avoid circular deps
  const { verifyToken } = await import('@/lib/auth');
  const { userId, valid } = verifyToken(token);
  if (!valid || !userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { data: adminUser } = await supabaseAdmin
    .from('users').select('role, email').eq('id', userId).single();
  const isAdmin = adminUser?.role === 'admin' || adminUser?.email?.toLowerCase() === 'dinfadashe@gmail.com';
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    // Get all users who registered but never activated
    const { data: unactivated, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, created_at')
      .eq('role', 'beneficiary')
      .eq('is_active', false);

    if (error) throw error;

    if (!unactivated || unactivated.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No unactivated users' });
    }

    // Filter out users who already have a verified activation
    const { data: activated } = await supabaseAdmin
      .from('beneficiary_activations')
      .select('user_id')
      .eq('payment_status', 'verified');

    const activatedIds = new Set((activated || []).map(a => a.user_id));
    const toNotify = unactivated.filter(u => !activatedIds.has(u.id));

    let sent = 0, failed = 0;

    // Send emails in batches of 10 to avoid rate limits
    const BATCH = 10;
    for (let i = 0; i < toNotify.length; i += BATCH) {
      const batch = toNotify.slice(i, i + BATCH);
      await Promise.all(batch.map(async (u) => {
        const name = u.full_name?.split(' ')[0] || 'there';
        const ok = await sendEmail(u.email, name);
        if (ok) sent++; else failed++;
      }));
      // Small delay between batches
      if (i + BATCH < toNotify.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`[reminders] Sent: ${sent}, Failed: ${failed}, Total: ${toNotify.length}`);
    return NextResponse.json({ success: true, sent, failed, total: toNotify.length });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[reminders] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}