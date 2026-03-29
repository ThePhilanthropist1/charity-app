import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, getUserByUsername, updateUser } from '@/lib/db';
import { hashPassword, verifyPassword, generateToken, generateUsernameFromEmail } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { action, email, password, username, role = 'beneficiary' } = await request.json();

    if (action === 'register') {
      // Validate inputs
      if (!email || !password || password.length < 8) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Invalid email or password (min 8 characters)' },
          { status: 400 }
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

      // Generate username if not provided
      let finalUsername = username;
      if (!finalUsername) {
        finalUsername = generateUsernameFromEmail(email);
        // Ensure unique
        let counter = 0;
        let checkUsername = await getUserByUsername(finalUsername);
        while (checkUsername && counter < 10) {
          finalUsername = generateUsernameFromEmail(email);
          checkUsername = await getUserByUsername(finalUsername);
          counter++;
        }
      } else {
        // Check if username exists
        const existingUsername = await getUserByUsername(finalUsername);
        if (existingUsername) {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, error: 'Username already taken' },
            { status: 409 }
          );
        }
      }

      // Hash password
      const passwordHash = hashPassword(password);

      // Create user
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

      // Generate token
      const token = generateToken(newUser.id);

      return NextResponse.json<ApiResponse<{ user: typeof newUser; token: string }>>(
        {
          success: true,
          data: {
            user: newUser,
            token,
          },
        },
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

      // Verify password
      if (!verifyPassword(password, user.password_hash)) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Update last login
      await updateUser(user.id, {
        last_login: new Date().toISOString(),
      } as any);

      // Generate token
      const token = generateToken(user.id);

      return NextResponse.json<ApiResponse<{ user: typeof user; token: string }>>(
        {
          success: true,
          data: {
            user,
            token,
          },
        },
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
