import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, getUserByUsername, updateUser } from '@/lib/db';
import { hashPassword, verifyPassword, generateToken, generateUsernameFromEmail } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

const MAX_BENEFICIARIES = 1_000_000;

// ── Check if beneficiary cap has been reached ─────────────────────────────────
async function isBeneficiaryCapReached(): Promise<boolean> {
  try {
    const { supabase } = await import('@/lib/db');
    const { count } = await supabase
      .from('beneficiary_activations')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'verified');
    return (count ?? 0) >= MAX_BENEFICIARIES;
  } catch {
    // If check fails, don't block — fail open
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, email: rawEmail, password, username, role = 'beneficiary' } = await request.json();

    // Normalize email
    const email = rawEmail?.toLowerCase().trim();

    if (action === 'register') {
      if (!email || !password || password.length < 8) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Invalid email or password (min 8 characters)' },
          { status: 400 }
        );
      }

      // ── CAP CHECK — block registration when 1M activated ──────────────────
      const capReached = await isBeneficiaryCapReached();
      if (capReached) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: 'Registration is now closed. All 1,000,000 beneficiary slots have been filled. Thank you for your interest in the Charity Token Project.',
          },
          { status: 403 }
        );
      }

      // Check if user exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Email already registered' },
          { status: 409 }
        );
      }

      // Generate username
      let finalUsername = username?.toLowerCase().trim();
      if (!finalUsername) {
        finalUsername = generateUsernameFromEmail(email);
        let counter = 0;
        let checkUsername = await getUserByUsername(finalUsername);
        while (checkUsername && counter < 10) {
          finalUsername = generateUsernameFromEmail(email);
          checkUsername = await getUserByUsername(finalUsername);
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
          { success: false, error: 'Failed to create user' },
          { status: 500 }
        );
      }

      const token = generateToken(newUser.id);
      return NextResponse.json<ApiResponse<{ user: typeof newUser; token: string }>>(
        { success: true, data: { user: newUser, token } },
        { status: 201 }
      );

    } else if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Email and password required' },
          { status: 400 }
        );
      }

      const user = await getUserByEmail(email);
      if (!user) {
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
    console.error('[auth] Error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}