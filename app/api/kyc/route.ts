import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || 'https://www.charitytoken.net';
const RESEND_KEY  = process.env.RESEND_API_KEY || '';

// ── EMAIL SENDER ──────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_KEY) { console.warn('[kyc] RESEND_API_KEY not set — skipping email'); return; }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Charity Token <info@charitytoken.net>', to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[kyc] Email send failed:', err);
    }
  } catch (e) { console.error('[kyc] Email error:', e); }
}

// ── EMAIL TEMPLATES ───────────────────────────────────────────────────────────
function approvedEmail(name: string, notes?: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A1628;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#0F1F35;border-radius:16px;overflow:hidden;border:1px solid rgba(0,184,148,0.3);">
  <div style="height:6px;background:linear-gradient(to right,#00CEC9,#00B894);"></div>
  <div style="padding:40px 36px;text-align:center;">
    <div style="width:72px;height:72px;border-radius:50%;background:rgba(0,184,148,0.15);border:2px solid rgba(0,184,148,0.4);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
      <span style="font-size:32px;">✅</span>
    </div>
    <p style="font-size:12px;font-weight:700;letter-spacing:2px;color:#00CEC9;margin:0 0 8px;">CHARITY TOKEN PROJECT</p>
    <h1 style="font-size:26px;font-weight:900;color:white;margin:0 0 16px;">KYC Approved!</h1>
    <p style="font-size:15px;color:#B0C8D8;line-height:1.7;margin:0 0 24px;">
      Hi ${name},<br><br>
      Congratulations! Your identity verification has been <strong style="color:#00B894;">approved</strong>.
      You are now an official <strong style="color:#00CEC9;">Charity Token Philanthropist</strong>.
    </p>
    ${notes ? `<div style="padding:14px 18px;background:rgba(0,206,201,0.06);border:1px solid rgba(0,206,201,0.2);border-radius:12px;margin-bottom:24px;text-align:left;">
      <p style="font-size:12px;font-weight:700;color:#00CEC9;margin:0 0 6px;">Admin Notes:</p>
      <p style="font-size:13px;color:#8FA3BF;margin:0;">${notes}</p>
    </div>` : ''}
    <p style="font-size:14px;color:#B0C8D8;line-height:1.7;margin:0 0 28px;">
      You can now log in to your Philanthropist Dashboard to start activating beneficiaries
      and managing your ACT token balance.
    </p>
    <a href="${APP_URL}/philanthropist/dashboard"
       style="display:inline-block;padding:15px 40px;background:linear-gradient(to right,#00CEC9,#00B894);color:#020C1B;font-weight:900;font-size:15px;border-radius:12px;text-decoration:none;">
      Go to Philanthropist Dashboard
    </a>
    <p style="font-size:12px;color:#4A5568;margin:28px 0 0;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
      Charity Token Project · charitytoken.net
    </p>
  </div>
  <div style="height:4px;background:linear-gradient(to right,#00B894,#00CEC9);"></div>
</div>
</body></html>`;
}

function rejectedEmail(name: string, reason: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A1628;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#0F1F35;border-radius:16px;overflow:hidden;border:1px solid rgba(255,107,107,0.3);">
  <div style="height:6px;background:linear-gradient(to right,#ff6b6b,#ee5a24);"></div>
  <div style="padding:40px 36px;text-align:center;">
    <div style="width:72px;height:72px;border-radius:50%;background:rgba(255,107,107,0.1);border:2px solid rgba(255,107,107,0.3);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
      <span style="font-size:32px;">❌</span>
    </div>
    <p style="font-size:12px;font-weight:700;letter-spacing:2px;color:#00CEC9;margin:0 0 8px;">CHARITY TOKEN PROJECT</p>
    <h1 style="font-size:26px;font-weight:900;color:white;margin:0 0 16px;">KYC Not Approved</h1>
    <p style="font-size:15px;color:#B0C8D8;line-height:1.7;margin:0 0 24px;">
      Hi ${name},<br><br>
      Unfortunately your KYC submission was <strong style="color:#ff6b6b;">not approved</strong> at this time.
    </p>
    <div style="padding:16px 20px;background:rgba(255,107,107,0.06);border:1px solid rgba(255,107,107,0.2);border-radius:12px;margin-bottom:24px;text-align:left;">
      <p style="font-size:12px;font-weight:700;color:#ff6b6b;margin:0 0 8px;">Reason:</p>
      <p style="font-size:14px;color:#B0C8D8;margin:0;line-height:1.7;">${reason}</p>
    </div>
    <p style="font-size:14px;color:#B0C8D8;line-height:1.7;margin:0 0 28px;">
      You may resubmit your KYC after addressing the issue above.
      Please ensure your documents are clear, valid, and match your registered information.
    </p>
    <a href="${APP_URL}/philanthropist/kyc"
       style="display:inline-block;padding:15px 40px;background:linear-gradient(to right,#00CEC9,#00B894);color:#020C1B;font-weight:900;font-size:15px;border-radius:12px;text-decoration:none;">
      Resubmit KYC
    </a>
    <p style="font-size:12px;color:#4A5568;margin:28px 0 0;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
      Questions? Contact us at legal@charitytoken.net
    </p>
  </div>
  <div style="height:4px;background:linear-gradient(to right,#ee5a24,#ff6b6b);"></div>
</div>
</body></html>`;
}

// ── AUTH HELPER ───────────────────────────────────────────────────────────────
function getAuth(request: NextRequest): { userId: string; valid: boolean } {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return { userId: '', valid: false };
  const token = authHeader.replace('Bearer ', '').trim();
  return verifyToken(token);
}

// ── POST — submit / get ───────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { userId, valid } = getAuth(request);
    if (!valid || !userId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid or expired token. Please log in again.' },
        { status: 401 }
      );
    }

    let body: any;
    try { body = await request.json(); }
    catch { return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid request body.' }, { status: 400 }); }

    const { action, government_id_type, government_id_url, face_capture_url } = body;

    if (action === 'get') {
      const { data: submission } = await supabaseAdmin
        .from('kyc_submissions').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      return NextResponse.json<ApiResponse<typeof submission>>({ success: true, data: submission }, { status: 200 });
    }

    if (action === 'submit') {
      if (!government_id_type || !government_id_url || !face_capture_url) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Missing required fields: ID type, ID document, and face capture are all required.' },
          { status: 400 }
        );
      }

      const { data: existing } = await supabaseAdmin
        .from('kyc_submissions').select('id, status').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();

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

      const { data: submission, error: insertError } = await supabaseAdmin
        .from('kyc_submissions')
        .insert([{ user_id: userId, government_id_type, government_id_url, face_capture_url, status: 'pending', submitted_at: new Date().toISOString() }])
        .select().single();

      if (insertError) {
        console.error('[kyc] Insert failed:', insertError.code, insertError.message);
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: `DB error (${insertError.code}): ${insertError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse<typeof submission>>({ success: true, data: submission }, { status: 201 });
    }

    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[kyc] POST error:', msg);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Server error: ' + msg }, { status: 500 });
  }
}

// ── GET — admin list pending ──────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { userId, valid } = getAuth(request);
    if (!valid || !userId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabaseAdmin.from('users').select('role, email').eq('id', userId).single();
    const isAdmin = adminUser?.role === 'admin' || adminUser?.email?.toLowerCase() === 'dinfadashe@gmail.com';
    if (!isAdmin) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Admin access required' }, { status: 403 });

    const { data: submissions, error } = await supabaseAdmin
      .from('kyc_submissions')
      .select('*, users(full_name, email, username, country, phone_number)')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });

    if (error) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Failed to fetch: ' + error.message }, { status: 500 });
    return NextResponse.json<ApiResponse<typeof submissions>>({ success: true, data: submissions || [] }, { status: 200 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[kyc] GET error:', msg);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH — admin approve / reject (with email notifications) ─────────────────
export async function PATCH(request: NextRequest) {
  try {
    const { userId, valid } = getAuth(request);
    if (!valid || !userId) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabaseAdmin.from('users').select('role, email').eq('id', userId).single();
    const isAdmin = adminUser?.role === 'admin' || adminUser?.email?.toLowerCase() === 'dinfadashe@gmail.com';
    if (!isAdmin) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Admin access required' }, { status: 403 });

    const { action, submission_id, rejection_reason, review_notes } = await request.json();
    if (!submission_id) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Submission ID required' }, { status: 400 });

    // Get submission + applicant details for email
    const { data: submission } = await supabaseAdmin
      .from('kyc_submissions')
      .select('*, users:user_id(full_name, email)')
      .eq('id', submission_id)
      .single();

    if (!submission) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Submission not found' }, { status: 404 });

    const applicantName  = (submission as any).users?.full_name || 'Applicant';
    const applicantEmail = (submission as any).users?.email || '';

    // ── APPROVE ───────────────────────────────────────────────────────────────
    if (action === 'approve') {
      const { data: result, error } = await supabaseAdmin
        .from('kyc_submissions')
        .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: userId, updated_at: new Date().toISOString() })
        .eq('id', submission_id).select().single();

      if (error) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Failed to approve: ' + error.message }, { status: 500 });

      // Promote to philanthropist
      if (submission.user_id) {
        await supabaseAdmin.from('users')
          .update({ role: 'philanthropist', is_active: true, updated_at: new Date().toISOString() })
          .eq('id', submission.user_id);

        const { data: existingPhil } = await supabaseAdmin.from('philanthropists').select('id').eq('user_id', submission.user_id).maybeSingle();
        if (!existingPhil) {
          await supabaseAdmin.from('philanthropists').insert({
            user_id: submission.user_id, act_balance: 1000,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          });
        } else {
          await supabaseAdmin.from('philanthropists').update({ updated_at: new Date().toISOString() }).eq('user_id', submission.user_id);
        }
      }

      // Audit log
      await supabaseAdmin.from('admin_audit_logs').insert([{
        admin_user_id: userId, action_type: 'kyc_approved',
        target_user_id: submission.user_id, details: { submission_id, review_notes },
      }]);

      // Send approval email (non-blocking)
      if (applicantEmail) {
        sendEmail(applicantEmail, '🎉 Your Charity Token KYC has been Approved!', approvedEmail(applicantName, review_notes));
      }

      return NextResponse.json<ApiResponse<typeof result>>({ success: true, data: result }, { status: 200 });
    }

    // ── REJECT ────────────────────────────────────────────────────────────────
    if (action === 'reject') {
      if (!rejection_reason?.trim()) {
        return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Rejection reason is required' }, { status: 400 });
      }

      const { data: result, error } = await supabaseAdmin
        .from('kyc_submissions')
        .update({
          status: 'rejected',
          rejection_reason: rejection_reason.trim(),
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission_id).select().single();

      if (error) return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Failed to reject: ' + error.message }, { status: 500 });

      // Audit log
      await supabaseAdmin.from('admin_audit_logs').insert([{
        admin_user_id: userId, action_type: 'kyc_rejected',
        target_user_id: submission.user_id, details: { submission_id, rejection_reason },
      }]);

      // Send rejection email (non-blocking)
      if (applicantEmail) {
        sendEmail(applicantEmail, 'Your Charity Token KYC Application Update', rejectedEmail(applicantName, rejection_reason));
      }

      return NextResponse.json<ApiResponse<typeof result>>({ success: true, data: result }, { status: 200 });
    }

    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[kyc] PATCH error:', msg);
    return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}