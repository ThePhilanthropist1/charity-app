import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // ── AUTH ────────────────────────────────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { userId, valid } = verifyToken(authHeader.replace('Bearer ', '').trim());
    if (!valid || !userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // ── VERIFY CALLER IS A PHILANTHROPIST ───────────────────────────────────
    const { data: caller } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('id', userId)
      .single();

    const isPhilanthropist =
      caller?.role === 'philanthropist' ||
      caller?.role === 'admin' ||
      caller?.email?.toLowerCase() === 'dinfadashe@gmail.com';

    if (!isPhilanthropist) {
      return NextResponse.json({ success: false, error: 'Not authorized as philanthropist' }, { status: 403 });
    }

    // ── PARSE BODY ──────────────────────────────────────────────────────────
    const { targetUserId, action } = await request.json();

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ success: false, error: 'targetUserId is required' }, { status: 400 });
    }

    // ── REJECT ACTION ───────────────────────────────────────────────────────
    if (action === 'reject') {
      const { error } = await supabaseAdmin
        .from('beneficiary_activations')
        .update({
          payment_status: 'rejected',
          philanthropist_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', targetUserId);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // ── ACTIVATE ACTION ─────────────────────────────────────────────────────

    // Check if target user exists
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('id', targetUserId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check if already activated
    const { data: existing } = await supabaseAdmin
      .from('beneficiary_activations')
      .select('id, payment_status')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existing?.payment_status === 'verified') {
      return NextResponse.json({ success: false, error: 'already_active' }, { status: 409 });
    }

    // Check beneficiary cap
    const { count } = await supabaseAdmin
      .from('beneficiary_activations')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'verified');

    if ((count ?? 0) >= 1_000_000) {
      return NextResponse.json({
        success: false,
        error: 'All 1,000,000 beneficiary slots have been filled.',
      }, { status: 403 });
    }

    // Insert or update activation using supabaseAdmin (bypasses RLS)
    if (existing) {
      const { error } = await supabaseAdmin
        .from('beneficiary_activations')
        .update({
          payment_status: 'verified',
          activation_method: 'philanthropist',
          philanthropist_id: userId,
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', targetUserId);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } else {
      const { error } = await supabaseAdmin
        .from('beneficiary_activations')
        .insert({
          user_id: targetUserId,
          payment_status: 'verified',
          activation_method: 'philanthropist',
          philanthropist_id: userId,
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[philanthropist-activate] Error:', msg);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}