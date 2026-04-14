import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

// ── AUTH HELPER ───────────────────────────────────────────────────────────────
function getAuth(request: NextRequest): { userId: string; valid: boolean } {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return { userId: '', valid: false };
  const token = authHeader.replace('Bearer ', '').trim();
  return verifyToken(token);
}

// ── POST — submit KYC ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { userId, valid } = getAuth(request);
    if (!valid || !userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid or expired token. Please log in again.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, government_id_type, government_id_url, face_capture_url } = body;

    if (action === 'submit') {
      if (!government_id_type || !government_id_url || !face_capture_url) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Missing required fields: ID type, ID document, and face capture are all required.' },
          { status: 400 }
        );
      }

      // Check if already has pending or approved submission
      const { data: existing } = await supabaseAdmin
        .from('kyc_submissions')
        .select('id, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.status === 'pending') {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'You already have a pending KYC submission. Please wait for admin review.' },
          { status: 409 }
        );
      }

      if (existing?.status === 'approved') {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Your KYC has already been approved.' },
          { status: 409 }
        );
      }

      const { data: submission, error } = await supabaseAdmin
        .from('kyc_submissions')
        .insert([{
          user_id:            userId,
          government_id_type,
          government_id_url,
          face_capture_url,
          status:             'pending',
          submitted_at:       new Date().toISOString(),
        }])
        .select()
        .single();

      if (error || !submission) {
        console.error('[kyc] Insert error:', error?.message);
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Failed to submit KYC. Please try again.' },
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
        .maybeSingle();

      return NextResponse.json<ApiResponse<typeof submission>>(
        { success: true, data: submission },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[kyc] POST error:', msg);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── GET — admin list pending submissions ──────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { userId, valid } = getAuth(request);
    if (!valid || !userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('id', userId)
      .single();

    const isAdmin = adminUser?.role === 'admin' ||
      adminUser?.email?.toLowerCase() === 'dinfadashe@gmail.com';

    if (!isAdmin) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
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
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[kyc] GET error:', msg);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── PATCH — admin approve / reject ────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const { userId, valid } = getAuth(request);
    if (!valid || !userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: adminUser } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('id', userId)
      .single();

    const isAdmin = adminUser?.role === 'admin' ||
      adminUser?.email?.toLowerCase() === 'dinfadashe@gmail.com';

    if (!isAdmin) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { action, submission_id, rejection_reason } = await request.json();

    if (!submission_id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Submission ID required' },
        { status: 400 }
      );
    }

    // Get the submission to find user_id
    const { data: submission } = await supabaseAdmin
      .from('kyc_submissions')
      .select('user_id')
      .eq('id', submission_id)
      .single();

    if (action === 'approve') {
      const { data: result, error } = await supabaseAdmin
        .from('kyc_submissions')
        .update({
          status:      'approved',
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

      // Promote user to philanthropist
      if (submission?.user_id) {
        await supabaseAdmin
          .from('users')
          .update({
            role:       'philanthropist',
            is_active:  true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', submission.user_id);

        // Create philanthropist record with initial ACT balance
        const { data: existingPhil } = await supabaseAdmin
          .from('philanthropists')
          .select('id')
          .eq('user_id', submission.user_id)
          .maybeSingle();

        if (!existingPhil) {
          await supabaseAdmin.from('philanthropists').insert({
            user_id:     submission.user_id,
            act_balance: 1000,
            created_at:  new Date().toISOString(),
            updated_at:  new Date().toISOString(),
          });
        }
      }

      // Audit log
      await supabaseAdmin.from('admin_audit_logs').insert([{
        admin_user_id:  userId,
        action_type:    'kyc_approved',
        target_user_id: submission?.user_id,
        details:        { submission_id },
      }]);

      return NextResponse.json<ApiResponse<typeof result>>(
        { success: true, data: result },
        { status: 200 }
      );
    }

    if (action === 'reject') {
      if (!rejection_reason?.trim()) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      const { data: result, error } = await supabaseAdmin
        .from('kyc_submissions')
        .update({
          status:           'rejected',
          rejection_reason,
          reviewed_at:      new Date().toISOString(),
          reviewed_by:      userId,
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

      await supabaseAdmin.from('admin_audit_logs').insert([{
        admin_user_id:  userId,
        action_type:    'kyc_rejected',
        target_user_id: submission?.user_id,
        details:        { submission_id, rejection_reason },
      }]);

      return NextResponse.json<ApiResponse<typeof result>>(
        { success: true, data: result },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[kyc] PATCH error:', msg);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}