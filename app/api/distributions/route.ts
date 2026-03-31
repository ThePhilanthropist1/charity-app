import { NextRequest, NextResponse } from 'next/server';
import { getTokenDistributions, getPendingDistributions, getUser, logAdminAction, supabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import type { ApiResponse, TokenDistribution } from '@/lib/types';

export async function GET(request: NextRequest) {
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

    const distributions = await getTokenDistributions(userId);
    return NextResponse.json<ApiResponse<typeof distributions>>(
      { success: true, data: distributions },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Distribution GET error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Verify admin role
    const admin = await getUser(userId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { action, month_year } = await request.json();

    if (action === 'process_monthly') {
      if (!month_year) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Month/year required (YYYY-MM format)' },
          { status: 400 }
        );
      }

      // Get all active beneficiaries
      const { data: activeBeneficiaries, error: beneficiaryError } = await supabase
        .from('beneficiary_activations')
        .select('user_id')
        .eq('payment_status', 'verified');

      if (beneficiaryError) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Failed to fetch beneficiaries' },
          { status: 500 }
        );
      }

      if (!activeBeneficiaries || activeBeneficiaries.length === 0) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'No active beneficiaries found' },
          { status: 400 }
        );
      }

      // Create distribution records for each beneficiary
      const distributions = activeBeneficiaries.map((beneficiary: any) => ({
        user_id: beneficiary.user_id,
        month_year,
        amount_tokens: 500,
        distribution_status: 'pending',
      }));

      const { data: createdDistributions, error: insertError } = await supabase
        .from('token_distributions')
        .insert(distributions)
        .select();

      if (insertError) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Failed to create distributions' },
          { status: 500 }
        );
      }

      // Log admin action
      await logAdminAction({
        admin_user_id: userId,
        action_type: 'distribution_processed',
        details: {
          month_year,
          total_beneficiaries: activeBeneficiaries.length,
          total_tokens: activeBeneficiaries.length * 500,
        },
      });

      return NextResponse.json<ApiResponse<{ message: string; count: number }>>(
        {
          success: true,
          data: {
            message: 'Distributions created successfully',
            count: createdDistributions?.length || 0,
          },
        },
        { status: 201 }
      );
    } else if (action === 'get_pending') {
      const pending = await getPendingDistributions();
      return NextResponse.json<ApiResponse<typeof pending>>(
        { success: true, data: pending },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[v0] Distribution POST error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
