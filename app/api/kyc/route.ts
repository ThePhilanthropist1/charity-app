import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { userId, valid } = verifyToken(token);
    if (!valid) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { action, government_id_type, government_id_url, face_capture_url } = await request.json();

    if (action === 'submit') {
      if (!government_id_type || !government_id_url || !face_capture_url) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Missing required fields: ID type, ID document, and face capture are all required' },
          { status: 400 }
        );
      }

      // Check existing submission
      const { data: existing } = await supabaseAdmin
        .from('kyc_submissions')
        .select('id, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing?.status === 'pending') {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'You already have a pending KYC submission. Please wait for review.' },
          { status: 409 }
        );
      }

      const { data: submission, error } = await supabaseAdmin
        .from('kyc_submissions')
        .insert([{
          user_id: userId,
          government_id_type,
          government_id_url,
          face_capture_url,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error || !submission) {
        console.error('KYC insert error:', error);
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Failed to submit KYC: ' + (error?.message || 'Unknown error') },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse<typeof submission>>(
        { success: true, data: submission },
        { status: 201 }
      );
    }

    if (action === 'get') {
      const { data: submission } = await supabaseAdmin
        .from('kyc_submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return NextResponse.json<ApiResponse<typeof submission>>(
        { success: true, data: submission },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[v0] KYC POST error:', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { userId, valid } = verifyToken(token);
    if (!valid) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (adminUser?.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { data: submissions, error } = await supabaseAdmin
      .from('kyc_submissions')
      .select('*, users(full_name, email, username, country, phone_number)')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<typeof submissions>>(
      { success: true, data: submissions || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] KYC GET error:', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { userId, valid } = verifyToken(token);
    if (!valid) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin
    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (adminUser?.role !== 'admin') {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { action, submission_id, rejection_reason } = await request.json();

    if (!submission_id) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Submission ID required' }, { status: 400 });
    }

    if (action === 'approve') {
      const { data: submission } = await supabaseAdmin
        .from('kyc_submissions')
        .select('user_id')
        .eq('id', submission_id)
        .single();

      const { data: result, error } = await supabaseAdmin
        .from('kyc_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
        })
        .eq('id', submission_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Failed to approve: ' + error.message },
          { status: 500 }
        );
      }

      // Update user role to philanthropist and activate
      if (submission?.user_id) {
        await supabaseAdmin
          .from('users')
          .update({ role: 'philanthropist', is_active: true, updated_at: new Date().toISOString() })
          .eq('id', submission.user_id);
      }

      // Log admin action
      await supabaseAdmin.from('admin_audit_logs').insert([{
        admin_user_id: userId,
        action_type: 'kyc_approved',
        target_user_id: submission?.user_id,
        details: { submission_id },
      }]);

      return NextResponse.json<ApiResponse<typeof result>>(
        { success: true, data: result },
        { status: 200 }
      );

    } else if (action === 'reject') {
      if (!rejection_reason?.trim()) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      const { data: submission } = await supabaseAdmin
        .from('kyc_submissions')
        .select('user_id')
        .eq('id', submission_id)
        .single();

      const { data: result, error } = await supabaseAdmin
        .from('kyc_submissions')
        .update({
          status: 'rejected',
          rejection_reason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
        })
        .eq('id', submission_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Failed to reject: ' + error.message },
          { status: 500 }
        );
      }

      // Log admin action
      await supabaseAdmin.from('admin_audit_logs').insert([{
        admin_user_id: userId,
        action_type: 'kyc_rejected',
        target_user_id: submission?.user_id,
        details: { submission_id, rejection_reason },
      }]);

      return NextResponse.json<ApiResponse<typeof result>>(
        { success: true, data: result },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[v0] KYC PATCH error:', error);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
