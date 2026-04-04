import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, getUserByUsername, updateUser } from '@/lib/db';
import { hashPassword, verifyPassword, generateToken, generateUsernameFromEmail } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { action, email: rawEmail, password, username, role = 'beneficiary' } = await request.json();

    // Normalize email — always lowercase and trimmed
    const email = rawEmail?.toLowerCase().trim();

    if (action === 'register') {
      if (!email || !password || password.length < 8) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Invalid email or password (min 8 characters)' },
          { status: 400 }
        );
      }

      // Check if user exists (case-insensitive)
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Email already registered' },
          { status: 409 }
        );
      }

      // Generate username if not provided
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
        email, // already lowercased
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

      // Fetch user by lowercased email
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

      await updateUser(user.id, {
        last_login: new Date().toISOString(),
      } as any);

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
    console.error('[v0] Auth error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}