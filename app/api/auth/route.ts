import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, getUserByUsername, updateUser } from '@/lib/db';
import { hashPassword, verifyPassword, generateToken, generateUsernameFromEmail } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

const MAX_BENEFICIARIES = 1_000_000;

// ── INPUT LIMITS ──────────────────────────────────────────────────────────────
const MAX_EMAIL_LENGTH = 254;      // RFC 5321 max email length
const MAX_PASSWORD_LENGTH = 128;   // Prevent PBKDF2 DoS attacks
const MAX_USERNAME_LENGTH = 32;
const MAX_BODY_SIZE = 10_000;      // 10KB max body — blocks oversized payloads

// ── BENEFICIARY CAP CHECK ─────────────────────────────────────────────────────
async function isBeneficiaryCapReached(): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import('@/lib/db');
    const { count } = await supabaseAdmin
      .from('beneficiary_activations')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'verified');
    return (count ?? 0) >= MAX_BENEFICIARIES;
  } catch {
    return false;
  }
}

// ── INPUT SANITISATION ────────────────────────────────────────────────────────
function sanitiseEmail(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.toLowerCase().trim();
  if (trimmed.length > MAX_EMAIL_LENGTH) return null;
  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

function sanitisePassword(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  if (raw.length < 8) return null;
  // Block absurdly long passwords to prevent PBKDF2 DoS
  if (raw.length > MAX_PASSWORD_LENGTH) return null;
  return raw;
}

function sanitiseUsername(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.toLowerCase().trim();
  if (trimmed.length > MAX_USERNAME_LENGTH) return null;
  // Only allow alphanumeric and underscores
  if (!/^[a-z0-9_]+$/.test(trimmed)) return null;
  return trimmed;
}

export async function POST(request: NextRequest) {
  try {
    // ── BODY SIZE CHECK ──────────────────────────────────────────────────────
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Request too large' },
        { status: 413 }
      );
    }

    let body: any;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY_SIZE) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Request too large' },
          { status: 413 }
        );
      }
      body = JSON.parse(text);
    } catch {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { action, email: rawEmail, password: rawPassword, username: rawUsername, role = 'beneficiary' } = body;

    // ── REGISTER ─────────────────────────────────────────────────────────────
    if (action === 'register') {

      const email = sanitiseEmail(rawEmail);
      if (!email) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Invalid email address' },
          { status: 400 }
        );
      }

      const password = sanitisePassword(rawPassword);
      if (!password) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Password must be between 8 and 128 characters' },
          { status: 400 }
        );
      }

      // ── CAP CHECK ──────────────────────────────────────────────────────────
      const capReached = await isBeneficiaryCapReached();
      if (capReached) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Registration is now closed. All 1,000,000 beneficiary slots have been filled.' },
          { status: 403 }
        );
      }

      // ── DUPLICATE CHECK ────────────────────────────────────────────────────
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        // Generic message — don't reveal whether email exists
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Unable to create account with this email address' },
          { status: 409 }
        );
      }

      // ── USERNAME ───────────────────────────────────────────────────────────
      let finalUsername: string | null = rawUsername ? sanitiseUsername(rawUsername) : null;
      if (!finalUsername) {
        // Auto-generate if not provided or invalid
        finalUsername = generateUsernameFromEmail(email);
        let counter = 0;
        while (await getUserByUsername(finalUsername) && counter < 10) {
          finalUsername = generateUsernameFromEmail(email);
          counter++;
        }
      } else {
        const existingUsername = await getUserByUsername(finalUsername);
        if (existingUsername) {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, error: 'Username already taken' },
            { status: 409 }
          );
        }
      }

      const passwordHash = hashPassword(password);
      const newUser = await createUser({
        email,
        username: finalUsername,
        password_hash: passwordHash,
        role,
      });

      if (!newUser) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Failed to create account. Please try again.' },
          { status: 500 }
        );
      }

      const token = generateToken(newUser.id);
      return NextResponse.json<ApiResponse<{ user: typeof newUser; token: string }>>(
        { success: true, data: { user: newUser, token } },
        { status: 201 }
      );
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    if (action === 'login') {

      const email = sanitiseEmail(rawEmail);
      if (!email) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Invalid email or password' },
          { status: 400 }
        );
      }

      const password = sanitisePassword(rawPassword);
      if (!password) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Invalid email or password' },
          { status: 400 }
        );
      }

      const user = await getUserByEmail(email);
      if (!user) {
        // Generic message — don't reveal whether email exists
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      if (!verifyPassword(password, user.password_hash)) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      await updateUser(user.id, { last_login: new Date().toISOString() } as any);
      const token = generateToken(user.id);

      return NextResponse.json<ApiResponse<{ user: typeof user; token: string }>>(
        { success: true, data: { user, token } },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[auth] Unhandled error:', typeof error === 'object' ? 'Internal error' : error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}