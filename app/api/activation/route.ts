import { NextRequest, NextResponse } from 'next/server';
import { createBeneficiaryActivation, updateBeneficiaryActivation } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { userId, valid } = verifyToken(token);

    if (!valid) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const {
      action,
      activation_method,
      transaction_hash,
      philanthropist_username,
      payment_id,
      txid,
      amount_pi,
    } = await request.json();

    if (action === 'pi_payment') {
      // Verify Pi payment (in production, verify with Pi Network API)
      if (!payment_id || !txid || !amount_pi) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Missing payment details' },
          { status: 400 }
        );
      }

      // Create activation record
      const activation = await createBeneficiaryActivation({
        user_id: userId,
        activation_method: 'pi_payment',
        payment_status: 'verified', // In production, verify first
        transaction_hash: txid,
        activated_at: new Date().toISOString(),
      });

      if (!activation) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Failed to create activation' },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse<typeof activation>>(
        { success: true, data: activation },
        { status: 201 }
      );
    } else if (action === 'wallet_transfer') {
      // Create pending wallet transfer verification
      if (!transaction_hash) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Transaction hash required' },
          { status: 400 }
        );
      }

      const activation = await createBeneficiaryActivation({
        user_id: userId,
        activation_method: 'wallet_transfer',
        payment_status: 'pending',
        transaction_hash,
      });

      if (!activation) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Failed to create activation record' },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse<typeof activation>>(
        { success: true, data: activation },
        { status: 201 }
      );
    } else if (action === 'philanthropist') {
      // Create philanthropist activation
      if (!philanthropist_username) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Philanthropist username required' },
          { status: 400 }
        );
      }

      const activation = await createBeneficiaryActivation({
        user_id: userId,
        activation_method: 'philanthropist',
        payment_status: 'pending',
        philanthropist_username,
      });

      if (!activation) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Failed to create activation' },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse<typeof activation>>(
        { success: true, data: activation },
        { status: 201 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Invalid activation method' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[v0] Activation error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
