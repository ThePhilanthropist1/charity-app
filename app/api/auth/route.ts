import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, getUserByUsername, updateUser, supabaseAdmin } from '@/lib/db';
import { hashPassword, verifyPassword, generateToken, generateUsernameFromEmail } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';
import * as crypto from 'crypto';

const MAX_BENEFICIARIES = 1_000_000;
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
const MAX_USERNAME_LENGTH = 32;
const MAX_BODY_SIZE = 10_000;

// ── ACCOUNT LOCKOUT ───────────────────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 3;           // lock after 3 wrong passwords
const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.charitytoken.net';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

// ── EMAIL SENDER ──────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Charity Token <info@charitytoken.net>',
        to,
        subject,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── GENERATE SECURE TOKEN ─────────────────────────────────────────────────────
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ── STORE VERIFICATION TOKEN ──────────────────────────────────────────────────
async function storeToken(userId: string, type: 'email_confirm' | 'password_reset'): Promise<string> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Delete any existing token of same type for this user
  await supabaseAdmin
    .from('email_verifications')
    .delete()
    .eq('user_id', userId)
    .eq('type', type);

  await supabaseAdmin
    .from('email_verifications')
    .insert({ user_id: userId, token, type, expires_at: expiresAt.toISOString() });

  return token;
}

// ── EMAIL TEMPLATES ───────────────────────────────────────────────────────────
function confirmEmailTemplate(name: string, link: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0A1628;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#0F1F35;border-radius:16px;overflow:hidden;border:1px solid rgba(0,206,201,0.2);">
    <div style="height:6px;background:linear-gradient(to right,#00CEC9,#00B894);"></div>
    <div style="padding:40px 36px;">
      <div style="text-align:center;margin-bottom:32px;">
        <p style="font-size:13px;font-weight:700;letter-spacing:2px;color:#00CEC9;margin:0 0 8px;">CHARITY TOKEN PROJECT</p>
        <h1 style="font-size:26px;font-weight:900;color:white;margin:0;">Confirm Your Email</h1>
      </div>
      <p style="font-size:15px;color:#B0C8D8;line-height:1.7;margin:0 0 24px;">
        Hi ${name || 'there'},<br><br>
        Welcome to the Charity Token Project! You are one step away from securing your beneficiary slot.
        Please confirm your email address to activate your account.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${link}" style="display:inline-block;padding:16px 40px;background:linear-gradient(to right,#00CEC9,#00B894);color:#020C1B;font-weight:900;font-size:16px;border-radius:12px;text-decoration:none;letter-spacing:0.5px;">
          Confirm Email Address
        </a>
      </div>
      <p style="font-size:13px;color:#8FA3BF;line-height:1.6;margin:0 0 16px;">
        Or copy and paste this link into your browser:<br>
        <span style="color:#00CEC9;word-break:break-all;">${link}</span>
      </p>
      <p style="font-size:12px;color:#4A5568;margin:24px 0 0;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
        This link expires in 24 hours. If you did not create an account, ignore this email.
      </p>
    </div>
    <div style="height:4px;background:linear-gradient(to right,#00B894,#00CEC9);"></div>
  </div>
</body>
</html>`;
}

function resetPasswordTemplate(name: string, link: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0A1628;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#0F1F35;border-radius:16px;overflow:hidden;border:1px solid rgba(0,206,201,0.2);">
    <div style="height:6px;background:linear-gradient(to right,#00CEC9,#00B894);"></div>
    <div style="padding:40px 36px;">
      <div style="text-align:center;margin-bottom:32px;">
        <p style="font-size:13px;font-weight:700;letter-spacing:2px;color:#00CEC9;margin:0 0 8px;">CHARITY TOKEN PROJECT</p>
        <h1 style="font-size:26px;font-weight:900;color:white;margin:0;">Reset Your Password</h1>
      </div>
      <p style="font-size:15px;color:#B0C8D8;line-height:1.7;margin:0 0 24px;">
        Hi ${name || 'there'},<br><br>
        We received a request to reset your password. Click the button below to choose a new password.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${link}" style="display:inline-block;padding:16px 40px;background:linear-gradient(to right,#00CEC9,#00B894);color:#020C1B;font-weight:900;font-size:16px;border-radius:12px;text-decoration:none;letter-spacing:0.5px;">
          Reset My Password
        </a>
      </div>
      <p style="font-size:13px;color:#8FA3BF;line-height:1.6;margin:0 0 16px;">
        Or copy and paste this link into your browser:<br>
        <span style="color:#00CEC9;word-break:break-all;">${link}</span>
      </p>
      <p style="font-size:12px;color:#4A5568;margin:24px 0 0;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
        This link expires in 24 hours. If you did not request a password reset, ignore this email — your account is safe.
      </p>
    </div>
    <div style="height:4px;background:linear-gradient(to right,#00B894,#00CEC9);"></div>
  </div>
</body>
</html>`;
}

// ── INPUT SANITISATION ────────────────────────────────────────────────────────
function sanitiseEmail(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.toLowerCase().trim();
  if (trimmed.length > MAX_EMAIL_LENGTH) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

function sanitisePassword(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  if (raw.length < 8) return null;
  if (raw.length > MAX_PASSWORD_LENGTH) return null;
  return raw;
}

function sanitiseUsername(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.toLowerCase().trim();
  if (trimmed.length > MAX_USERNAME_LENGTH) return null;
  if (!/^[a-z0-9_]+$/.test(trimmed)) return null;
  return trimmed;
}

async function isBeneficiaryCapReached(): Promise<boolean> {
  try {
    const { count } = await supabaseAdmin
      .from('beneficiary_activations')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'verified');
    return (count ?? 0) >= MAX_BENEFICIARIES;
  } catch {
    return false;
  }
}

// ── COOKIE HELPERS ────────────────────────────────────────────────────────────
function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
  return response;
}

function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Request too large' }, { status: 413 });
    }

    let body: any;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY_SIZE) {
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Request too large' }, { status: 413 });
      }
      body = JSON.parse(text);
    } catch {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const { action, email: rawEmail, password: rawPassword, username: rawUsername, role = 'beneficiary', token: bodyToken, newPassword } = body;

    // ── REGISTER ─────────────────────────────────────────────────────────────
    if (action === 'register') {
      const email = sanitiseEmail(rawEmail);
      if (!email) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid email address' }, { status: 400 });

      const password = sanitisePassword(rawPassword);
      if (!password) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Password must be between 8 and 128 characters' }, { status: 400 });

      const capReached = await isBeneficiaryCapReached();
      if (capReached) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Registration is now closed. All 1,000,000 beneficiary slots have been filled.' }, { status: 403 });

      const existingUser = await getUserByEmail(email);
      if (existingUser) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Unable to create account with this email address' }, { status: 409 });

      let finalUsername: string | null = rawUsername ? sanitiseUsername(rawUsername) : null;
      if (!finalUsername) {
        finalUsername = generateUsernameFromEmail(email);
        let counter = 0;
        while (await getUserByUsername(finalUsername) && counter < 10) {
          finalUsername = generateUsernameFromEmail(email);
          counter++;
        }
      } else {
        const existingUsername = await getUserByUsername(finalUsername);
        if (existingUsername) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Username already taken' }, { status: 409 });
      }

      const passwordHash = hashPassword(password);
      const newUser = await createUser({ email, username: finalUsername, password_hash: passwordHash, role });
      if (!newUser) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Failed to create account. Please try again.' }, { status: 500 });

      // Send confirmation email (non-blocking)
      try {
        const confirmToken = await storeToken(newUser.id, 'email_confirm');
        const confirmLink = `${APP_URL}/verify-email?token=${confirmToken}`;
        await sendEmail(
          email,
          'Confirm your Charity Token account',
          confirmEmailTemplate(newUser.full_name || '', confirmLink)
        );
      } catch { /* email failure should not block registration */ }

      const jwtToken = generateToken(newUser.id);
      const response = NextResponse.json<ApiResponse<{ user: typeof newUser; token: string }>>(
        { success: true, data: { user: newUser, token: jwtToken } },
        { status: 201 }
      );
      return setAuthCookie(response, jwtToken);
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    if (action === 'login') {
      const email = sanitiseEmail(rawEmail);
      if (!email) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid email or password' }, { status: 400 });

      const password = sanitisePassword(rawPassword);
      if (!password) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid email or password' }, { status: 400 });

      const user = await getUserByEmail(email);
      if (!user) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid email or password' }, { status: 401 });

      // ── LOCKOUT CHECK ────────────────────────────────────────────────────
      if (user.locked_until) {
        const lockedUntil = new Date(user.locked_until);
        const now = new Date();
        if (lockedUntil > now) {
          const minutesLeft = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
          const hoursLeft   = minutesLeft >= 60 ? Math.ceil(minutesLeft / 60) : null;
          const timeMsg     = hoursLeft
            ? `${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}`
            : `${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}`;
          return NextResponse.json<ApiResponse<null>>(
            { success: false, error: `Account temporarily locked due to too many failed login attempts. Please try again in ${timeMsg}.` },
            { status: 429 }
          );
        } else {
          // Lockout expired — clear it
          await supabaseAdmin
            .from('users')
            .update({ locked_until: null, failed_login_attempts: 0, last_failed_at: null })
            .eq('id', user.id);
          user.locked_until          = null;
          user.failed_login_attempts = 0;
        }
      }

      // ── WRONG PASSWORD ───────────────────────────────────────────────────
      if (!verifyPassword(password, user.password_hash)) {
        const newAttempts = (user.failed_login_attempts || 0) + 1;
        const updates: Record<string, any> = {
          failed_login_attempts: newAttempts,
          last_failed_at: new Date().toISOString(),
        };

        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
          // Lock the account for 24 hours
          updates.locked_until = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
          await supabaseAdmin.from('users').update(updates).eq('id', user.id);
          return NextResponse.json<ApiResponse<null>>(
            { success: false, error: `Too many failed attempts. Your account has been locked for 24 hours. Please try again tomorrow or use "Forgot password" to reset your password.` },
            { status: 429 }
          );
        }

        const attemptsLeft = MAX_FAILED_ATTEMPTS - newAttempts;
        await supabaseAdmin.from('users').update(updates).eq('id', user.id);
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: `Invalid email or password. ${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} remaining before your account is locked.` },
          { status: 401 }
        );
      }

      // ── SUCCESS — reset failed attempts ──────────────────────────────────
      await supabaseAdmin
        .from('users')
        .update({
          last_login:            new Date().toISOString(),
          failed_login_attempts: 0,
          locked_until:          null,
          last_failed_at:        null,
        })
        .eq('id', user.id);

      const jwtToken = generateToken(user.id);
      const response = NextResponse.json<ApiResponse<{ user: typeof user; token: string }>>(
        { success: true, data: { user, token: jwtToken } },
        { status: 200 }
      );
      return setAuthCookie(response, jwtToken);
    }

    // ── LOGOUT ────────────────────────────────────────────────────────────────
    if (action === 'logout') {
      const response = NextResponse.json({ success: true });
      return clearAuthCookie(response);
    }

    // ── FORGOT PASSWORD ───────────────────────────────────────────────────────
    if (action === 'forgot_password') {
      const email = sanitiseEmail(rawEmail);
      if (!email) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid email address' }, { status: 400 });

      // Always return success — don't reveal whether email exists
      const user = await getUserByEmail(email);
      if (user) {
        try {
          const resetToken = await storeToken(user.id, 'password_reset');
          const resetLink = `${APP_URL}/reset-password?token=${resetToken}`;
          await sendEmail(
            email,
            'Reset your Charity Token password',
            resetPasswordTemplate(user.full_name || '', resetLink)
          );
        } catch { /* silent */ }
      }

      return NextResponse.json<ApiResponse<null>>(
        { success: true, error: null },
        { status: 200 }
      );
    }

    // ── VERIFY EMAIL ──────────────────────────────────────────────────────────
    if (action === 'verify_email') {
      if (!bodyToken) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Token required' }, { status: 400 });

      const { data: record } = await supabaseAdmin
        .from('email_verifications')
        .select('*')
        .eq('token', bodyToken)
        .eq('type', 'email_confirm')
        .is('used_at', null)
        .single();

      if (!record) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid or expired link. Please request a new one.' }, { status: 400 });
      if (new Date(record.expires_at) < new Date()) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'This link has expired. Please request a new confirmation email.' }, { status: 400 });

      // Mark token used and verify user
      await supabaseAdmin.from('email_verifications').update({ used_at: new Date().toISOString() }).eq('id', record.id);
      await supabaseAdmin.from('users').update({ email_verified: true }).eq('id', record.user_id);

      return NextResponse.json<ApiResponse<null>>({ success: true, error: null });
    }

    // ── RESET PASSWORD ────────────────────────────────────────────────────────
    if (action === 'reset_password') {
      if (!bodyToken) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Token required' }, { status: 400 });

      const newPass = sanitisePassword(newPassword);
      if (!newPass) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Password must be between 8 and 128 characters' }, { status: 400 });

      const { data: record } = await supabaseAdmin
        .from('email_verifications')
        .select('*')
        .eq('token', bodyToken)
        .eq('type', 'password_reset')
        .is('used_at', null)
        .single();

      if (!record) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid or expired link. Please request a new one.' }, { status: 400 });
      if (new Date(record.expires_at) < new Date()) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'This link has expired. Please request a new password reset.' }, { status: 400 });

      // Mark token used and update password
      const newHash = hashPassword(newPass);
      await supabaseAdmin.from('email_verifications').update({ used_at: new Date().toISOString() }).eq('id', record.id);
      await supabaseAdmin.from('users').update({ password_hash: newHash }).eq('id', record.user_id);

      return NextResponse.json<ApiResponse<null>>({ success: true, error: null });
    }

    // ── RESEND VERIFICATION EMAIL ─────────────────────────────────────────────
    if (action === 'resend_verification') {
      const email = sanitiseEmail(rawEmail);
      if (!email) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid email' }, { status: 400 });

      const user = await getUserByEmail(email);
      if (user && !user.email_verified) {
        try {
          const confirmToken = await storeToken(user.id, 'email_confirm');
          const confirmLink = `${APP_URL}/verify-email?token=${confirmToken}`;
          await sendEmail(email, 'Confirm your Charity Token account', confirmEmailTemplate(user.full_name || '', confirmLink));
        } catch { /* silent */ }
      }
      return NextResponse.json<ApiResponse<null>>({ success: true, error: null });
    }

    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('[auth] Unhandled error:', error instanceof Error ? error.message : 'Internal error');
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}