import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getUserByUsername, supabaseAdmin } from '@/lib/db';
import { hashPassword, verifyPassword, generateToken, generateUsernameFromEmail } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';
import * as crypto from 'crypto';

const MAX_BENEFICIARIES   = 1_000_000;
const MAX_EMAIL_LENGTH    = 254;
const MAX_PASSWORD_LENGTH = 128;
const MAX_USERNAME_LENGTH = 32;
const MAX_BODY_SIZE       = 10_000;
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000;
const APP_URL             = process.env.NEXT_PUBLIC_APP_URL || 'https://www.charitytoken.net';
const RESEND_API_KEY      = process.env.RESEND_API_KEY || '';

// ── Email sender ──────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Charity Token <info@charitytoken.net>', to, subject, html }),
    });
    return res.ok;
  } catch { return false; }
}

function generateSecureToken(): string { return crypto.randomBytes(32).toString('hex'); }

async function storeToken(userId: string, type: 'email_confirm' | 'password_reset'): Promise<string> {
  const token     = generateSecureToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await supabaseAdmin.from('email_verifications').delete().eq('user_id', userId).eq('type', type);
  await supabaseAdmin.from('email_verifications').insert({ user_id: userId, token, type, expires_at: expiresAt.toISOString() });
  return token;
}

function confirmEmailTemplate(name: string, link: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A1628;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#0F1F35;border-radius:16px;overflow:hidden;border:1px solid rgba(0,206,201,0.2);">
<div style="height:6px;background:linear-gradient(to right,#00CEC9,#00B894);"></div>
<div style="padding:40px 36px;">
<p style="font-size:13px;font-weight:700;letter-spacing:2px;color:#00CEC9;margin:0 0 8px;text-align:center;">CHARITY TOKEN PROJECT</p>
<h1 style="font-size:26px;font-weight:900;color:white;margin:0 0 24px;text-align:center;">Confirm Your Email</h1>
<p style="font-size:15px;color:#B0C8D8;line-height:1.7;margin:0 0 24px;">
  Hi ${name || 'there'},<br><br>
  Welcome to the Charity Token Project! Please confirm your email address to activate your account.
</p>
<div style="text-align:center;margin:32px 0;">
  <a href="${link}" style="display:inline-block;padding:16px 40px;background:linear-gradient(to right,#00CEC9,#00B894);color:#020C1B;font-weight:900;font-size:16px;border-radius:12px;text-decoration:none;">
    Confirm Email Address
  </a>
</div>
<p style="font-size:12px;color:#4A5568;margin:24px 0 0;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
  This link expires in 24 hours. If you did not create an account, ignore this email.
</p>
</div>
<div style="height:4px;background:linear-gradient(to right,#00B894,#00CEC9);"></div>
</div></body></html>`;
}

function resetPasswordTemplate(name: string, link: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A1628;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#0F1F35;border-radius:16px;overflow:hidden;border:1px solid rgba(0,206,201,0.2);">
<div style="height:6px;background:linear-gradient(to right,#00CEC9,#00B894);"></div>
<div style="padding:40px 36px;">
<p style="font-size:13px;font-weight:700;letter-spacing:2px;color:#00CEC9;margin:0 0 8px;text-align:center;">CHARITY TOKEN PROJECT</p>
<h1 style="font-size:26px;font-weight:900;color:white;margin:0 0 24px;text-align:center;">Reset Your Password</h1>
<p style="font-size:15px;color:#B0C8D8;line-height:1.7;margin:0 0 24px;">
  Hi ${name || 'there'},<br><br>
  We received a request to reset your password. Click the button below to choose a new one.
</p>
<div style="text-align:center;margin:32px 0;">
  <a href="${link}" style="display:inline-block;padding:16px 40px;background:linear-gradient(to right,#00CEC9,#00B894);color:#020C1B;font-weight:900;font-size:16px;border-radius:12px;text-decoration:none;">
    Reset My Password
  </a>
</div>
<p style="font-size:12px;color:#4A5568;margin:24px 0 0;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
  This link expires in 24 hours. If you did not request this, ignore it — your account is safe.
</p>
</div>
<div style="height:4px;background:linear-gradient(to right,#00B894,#00CEC9);"></div>
</div></body></html>`;
}

// ── Sanitisers ────────────────────────────────────────────────────────────────
function sanitiseEmail(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.toLowerCase().trim();
  if (t.length > MAX_EMAIL_LENGTH) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null;
  return t;
}
function sanitisePassword(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  if (raw.length < 8 || raw.length > MAX_PASSWORD_LENGTH) return null;
  return raw;
}
function sanitiseUsername(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.toLowerCase().trim();
  if (t.length > MAX_USERNAME_LENGTH) return null;
  if (!/^[a-z0-9_]+$/.test(t)) return null;
  return t;
}
function sanitiseText(raw: any, max = 100): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim();
  return t.length > 0 && t.length <= max ? t : null;
}

async function isBeneficiaryCapReached(): Promise<boolean> {
  try {
    const { count } = await supabaseAdmin
      .from('beneficiary_activations')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'verified');
    return (count ?? 0) >= MAX_BENEFICIARIES;
  } catch { return false; }
}

function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set('auth_token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' });
  return response;
}
function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set('auth_token', '', { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 0, path: '/' });
  return response;
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE)
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Request too large' }, { status: 413 });

    let body: any;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY_SIZE)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Request too large' }, { status: 413 });
      body = JSON.parse(text);
    } catch {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const { action, email: rawEmail, password: rawPassword, username: rawUsername,
            role = 'beneficiary', token: bodyToken, newPassword } = body;

    // ── REGISTER ──────────────────────────────────────────────────────────────
    if (action === 'register') {
      const email = sanitiseEmail(rawEmail);
      if (!email)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid email address' }, { status: 400 });

      const password = sanitisePassword(rawPassword);
      if (!password)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Password must be between 8 and 128 characters' }, { status: 400 });

      // Validate required profile fields
      const fullName = sanitiseText(body.full_name, 150);
      if (!fullName)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Full name is required' }, { status: 400 });

      const phone = sanitiseText(body.phone, 30);
      if (!phone)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Phone number is required' }, { status: 400 });

      const country = sanitiseText(body.country, 100);
      if (!country)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Country is required' }, { status: 400 });

      const state = sanitiseText(body.state, 100);
      if (!state)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'State/Region is required' }, { status: 400 });

      const city = sanitiseText(body.city, 100);
      if (!city)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'City is required' }, { status: 400 });

      const gender = sanitiseText(body.gender, 30);
      if (!gender)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Gender is required' }, { status: 400 });

      // Optional fields
      const occupation    = sanitiseText(body.occupation, 100) || null;
      const date_of_birth = body.date_of_birth || null;

      const capReached = await isBeneficiaryCapReached();
      if (capReached)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Registration is now closed. All 1,000,000 slots have been filled.' }, { status: 403 });

      const existingUser = await getUserByEmail(email);
      if (existingUser)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'An account with this email already exists' }, { status: 409 });

      // Generate username
      let finalUsername: string | null = rawUsername ? sanitiseUsername(rawUsername) : null;
      if (!finalUsername) {
        finalUsername = generateUsernameFromEmail(email);
        let counter = 0;
        while (await getUserByUsername(finalUsername) && counter < 10) {
          finalUsername = generateUsernameFromEmail(email);
          counter++;
        }
      } else {
        if (await getUserByUsername(finalUsername))
          return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Username already taken' }, { status: 409 });
      }

      const passwordHash = hashPassword(password);

      // ── INSERT user with ALL profile fields ──────────────────────────────
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          email,
          username:       finalUsername,
          password_hash:  passwordHash,
          role:           'beneficiary',
          full_name:      fullName,
          phone,
          country,
          state,
          city,
          gender,
          date_of_birth,
          occupation,
          is_active:      false,
          email_verified: false,
          created_at:     new Date().toISOString(),
          updated_at:     new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError || !newUser) {
        console.error('[auth register] insert error:', insertError);
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Failed to create account. Please try again.' }, { status: 500 });
      }

      // Send confirmation email (non-blocking)
      try {
        const confirmToken = await storeToken(newUser.id, 'email_confirm');
        const confirmLink  = `${APP_URL}/verify-email?token=${confirmToken}`;
        await sendEmail(email, 'Confirm your Charity Token account', confirmEmailTemplate(fullName, confirmLink));
      } catch { /* email failure should not block registration */ }

      const jwtToken = generateToken(newUser.id);
      const response = NextResponse.json<ApiResponse<any>>(
        { success: true, data: { user: newUser, token: jwtToken } },
        { status: 201 }
      );
      return setAuthCookie(response, jwtToken);
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    if (action === 'login') {
      const email = sanitiseEmail(rawEmail);
      if (!email)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid email or password' }, { status: 400 });

      const password = sanitisePassword(rawPassword);
      if (!password)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid email or password' }, { status: 400 });

      const user = await getUserByEmail(email);
      if (!user)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid email or password' }, { status: 401 });

      // Lockout check
      if (user.locked_until) {
        const lockedUntil = new Date(user.locked_until);
        if (lockedUntil > new Date()) {
          const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
          const hoursLeft   = minutesLeft >= 60 ? Math.ceil(minutesLeft / 60) : null;
          const timeMsg     = hoursLeft ? `${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}` : `${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}`;
          return NextResponse.json<ApiResponse<null>>(
            { success: false, error: `Account locked due to too many failed attempts. Try again in ${timeMsg}.` },
            { status: 429 }
          );
        } else {
          await supabaseAdmin.from('users').update({ locked_until: null, failed_login_attempts: 0, last_failed_at: null }).eq('id', user.id);
          user.locked_until = null; user.failed_login_attempts = 0;
        }
      }

      // Wrong password
      if (!verifyPassword(password, user.password_hash)) {
        const newAttempts = (user.failed_login_attempts || 0) + 1;
        const updates: Record<string, any> = { failed_login_attempts: newAttempts, last_failed_at: new Date().toISOString() };
        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
          updates.locked_until = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
          await supabaseAdmin.from('users').update(updates).eq('id', user.id);
          return NextResponse.json<ApiResponse<null>>(
            { success: false, error: 'Too many failed attempts. Your account has been locked for 24 hours. Use "Forgot password" to reset.' },
            { status: 429 }
          );
        }
        const attemptsLeft = MAX_FAILED_ATTEMPTS - newAttempts;
        await supabaseAdmin.from('users').update(updates).eq('id', user.id);
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: `Invalid email or password. ${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} remaining before lockout.` },
          { status: 401 }
        );
      }

      // Success — reset failed attempts
      await supabaseAdmin.from('users').update({ last_login: new Date().toISOString(), failed_login_attempts: 0, locked_until: null, last_failed_at: null }).eq('id', user.id);
      const jwtToken = generateToken(user.id);
      const response = NextResponse.json<ApiResponse<any>>({ success: true, data: { user, token: jwtToken } }, { status: 200 });
      return setAuthCookie(response, jwtToken);
    }

    // ── LOGOUT ────────────────────────────────────────────────────────────────
    if (action === 'logout') {
      return clearAuthCookie(NextResponse.json({ success: true }));
    }

    // ── FORGOT PASSWORD ───────────────────────────────────────────────────────
    if (action === 'forgot_password') {
      const email = sanitiseEmail(rawEmail);
      if (!email)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid email address' }, { status: 400 });
      const user = await getUserByEmail(email);
      if (user) {
        try {
          const resetToken = await storeToken(user.id, 'password_reset');
          await sendEmail(email, 'Reset your Charity Token password', resetPasswordTemplate(user.full_name || '', `${APP_URL}/reset-password?token=${resetToken}`));
        } catch { /* silent */ }
      }
      return NextResponse.json<ApiResponse<null>>({ success: true, error: null });
    }

    // ── VERIFY EMAIL ──────────────────────────────────────────────────────────
    if (action === 'verify_email') {
      if (!bodyToken)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Token required' }, { status: 400 });
      const { data: record } = await supabaseAdmin.from('email_verifications').select('*').eq('token', bodyToken).eq('type', 'email_confirm').is('used_at', null).single();
      if (!record)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid or expired link.' }, { status: 400 });
      if (new Date(record.expires_at) < new Date())
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Link has expired. Request a new one.' }, { status: 400 });
      await supabaseAdmin.from('email_verifications').update({ used_at: new Date().toISOString() }).eq('id', record.id);
      await supabaseAdmin.from('users').update({ email_verified: true }).eq('id', record.user_id);
      return NextResponse.json<ApiResponse<null>>({ success: true, error: null });
    }

    // ── RESET PASSWORD ────────────────────────────────────────────────────────
    if (action === 'reset_password') {
      if (!bodyToken)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Token required' }, { status: 400 });
      const newPass = sanitisePassword(newPassword);
      if (!newPass)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Password must be 8–128 characters' }, { status: 400 });
      const { data: record } = await supabaseAdmin.from('email_verifications').select('*').eq('token', bodyToken).eq('type', 'password_reset').is('used_at', null).single();
      if (!record)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid or expired link.' }, { status: 400 });
      if (new Date(record.expires_at) < new Date())
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Link expired. Request a new reset.' }, { status: 400 });
      await supabaseAdmin.from('email_verifications').update({ used_at: new Date().toISOString() }).eq('id', record.id);
      await supabaseAdmin.from('users').update({ password_hash: hashPassword(newPass) }).eq('id', record.user_id);
      return NextResponse.json<ApiResponse<null>>({ success: true, error: null });
    }

    // ── RESEND VERIFICATION ───────────────────────────────────────────────────
    if (action === 'resend_verification') {
      const email = sanitiseEmail(rawEmail);
      if (!email)
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid email' }, { status: 400 });
      const user = await getUserByEmail(email);
      if (user && !user.email_verified) {
        try {
          const confirmToken = await storeToken(user.id, 'email_confirm');
          await sendEmail(email, 'Confirm your Charity Token account', confirmEmailTemplate(user.full_name || '', `${APP_URL}/verify-email?token=${confirmToken}`));
        } catch { /* silent */ }
      }
      return NextResponse.json<ApiResponse<null>>({ success: true, error: null });
    }

    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('[auth] Unhandled error:', error instanceof Error ? error.message : error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}