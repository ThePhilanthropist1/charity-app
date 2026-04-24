import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

const ACT_PER_ACTIVATION = 10;
const MAX_BENEFICIARIES  = 1_000_000;

export async function POST(request: NextRequest) {
  try {
    // ── AUTH ──────────────────────────────────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer '))
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { userId, valid } = verifyToken(authHeader.replace('Bearer ', '').trim());
    if (!valid || !userId)
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    // ── VERIFY CALLER ─────────────────────────────────────────────────────────
    const { data: caller } = await supabaseAdmin
      .from('users').select('role, email').eq('id', userId).single();

    const isAdmin = caller?.role === 'admin' ||
                    caller?.email?.toLowerCase() === 'dinfadashe@gmail.com';
    const isPhilanthropist = caller?.role === 'philanthropist' || isAdmin;

    if (!isPhilanthropist)
      return NextResponse.json({ success: false, error: 'Not authorized as philanthropist' }, { status: 403 });

    // ── PARSE BODY ────────────────────────────────────────────────────────────
    const { targetUserId, action } = await request.json();

    if (!targetUserId || typeof targetUserId !== 'string')
      return NextResponse.json({ success: false, error: 'targetUserId is required' }, { status: 400 });

    // ── REJECT ────────────────────────────────────────────────────────────────
    if (action === 'reject') {
      const { error } = await supabaseAdmin
        .from('beneficiary_activations')
        .update({ payment_status: 'rejected', philanthropist_id: userId, updated_at: new Date().toISOString() })
        .eq('user_id', targetUserId);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // ── CHECK TARGET USER ─────────────────────────────────────────────────────
    const { data: targetUser } = await supabaseAdmin
      .from('users').select('id, email, full_name').eq('id', targetUserId).single();
    if (!targetUser)
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    // ── CHECK ALREADY ACTIVATED ───────────────────────────────────────────────
    const { data: existing } = await supabaseAdmin
      .from('beneficiary_activations')
      .select('id, payment_status').eq('user_id', targetUserId).maybeSingle();
    if (existing?.payment_status === 'verified')
      return NextResponse.json({ success: false, error: 'already_active' }, { status: 409 });

    // ── CHECK CAP ─────────────────────────────────────────────────────────────
    const { count } = await supabaseAdmin
      .from('beneficiary_activations')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'verified');
    if ((count ?? 0) >= MAX_BENEFICIARIES)
      return NextResponse.json({ success: false, error: 'All 1,000,000 slots have been filled.' }, { status: 403 });

    // ── FIND PHILANTHROPIST RECORD ────────────────────────────────────────────
    // Always look up by user_id first, then by id — works for all record types
    let philRecord: any = null;
    const { data: byUserId } = await supabaseAdmin
      .from('philanthropists').select('*').eq('user_id', userId).maybeSingle();
    if (byUserId) {
      philRecord = byUserId;
    } else {
      const { data: byId } = await supabaseAdmin
        .from('philanthropists').select('*').eq('id', userId).maybeSingle();
      philRecord = byId || null;
    }

    // ── DEDUCT ACT ────────────────────────────────────────────────────────────
    // Everyone with a philanthropist record gets deducted — including admin-philanthropists
    // Only pure admins with NO philanthropist record skip deduction
    let newActBalance = 0;

    if (philRecord) {
      const currentBalance = philRecord.act_balance ?? 0;

      if (currentBalance < ACT_PER_ACTIVATION)
        return NextResponse.json({
          success: false,
          error: `Insufficient ACT balance. You have ${currentBalance} ACT but need ${ACT_PER_ACTIVATION} ACT to activate.`,
        }, { status: 402 });

      newActBalance = currentBalance - ACT_PER_ACTIVATION;

      // Deduct ACT — use whichever id field matches
      const { error: deductError } = await supabaseAdmin
        .from('philanthropists')
        .update({ act_balance: newActBalance, updated_at: new Date().toISOString() })
        .eq('id', philRecord.id);

      if (deductError) {
        console.error('[phil-activate] ACT deduction failed:', deductError.message);
        return NextResponse.json({ success: false, error: 'Failed to deduct ACT balance. Please try again.' }, { status: 500 });
      }

      console.log(`[phil-activate] Deducted ${ACT_PER_ACTIVATION} ACT from ${userId}. New balance: ${newActBalance}`);

    } else if (!isAdmin) {
      // Non-admin with no record — block them
      return NextResponse.json({
        success: false,
        error: 'Philanthropist record not found. Please contact support.',
      }, { status: 404 });
    }
    // isAdmin with no philRecord — pure admin action, no deduction needed

    // ── ACTIVATE ──────────────────────────────────────────────────────────────
    let activationError: any = null;

    if (existing) {
      const { error } = await supabaseAdmin
        .from('beneficiary_activations')
        .update({
          payment_status:    'verified',
          activation_method: 'philanthropist',
          philanthropist_id: userId,
          activated_at:      new Date().toISOString(),
          updated_at:        new Date().toISOString(),
        })
        .eq('user_id', targetUserId);
      activationError = error;
    } else {
      const { error } = await supabaseAdmin
        .from('beneficiary_activations')
        .insert({
          user_id:           targetUserId,
          payment_status:    'verified',
          activation_method: 'philanthropist',
          philanthropist_id: userId,
          activated_at:      new Date().toISOString(),
          updated_at:        new Date().toISOString(),
        });
      activationError = error;
    }

    // ── REFUND IF ACTIVATION FAILED ───────────────────────────────────────────
    if (activationError) {
      console.error('[phil-activate] Activation failed:', activationError.message);

      if (philRecord) {
        await supabaseAdmin
          .from('philanthropists')
          .update({ act_balance: philRecord.act_balance, updated_at: new Date().toISOString() })
          .eq('id', philRecord.id);
        console.log('[phil-activate] ACT refunded after failed activation');
      }

      return NextResponse.json({
        success: false,
        error: 'Activation failed. Your ACT balance has been restored.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success:    true,
      newBalance: philRecord ? newActBalance : null,
      deducted:   philRecord ? ACT_PER_ACTIVATION : 0,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[phil-activate] Error:', msg);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}