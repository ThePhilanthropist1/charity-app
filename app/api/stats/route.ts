import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

const MAX_BENEFICIARIES = 1000000;

export async function GET() {
  try {
    // Get total registered users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get active beneficiaries (verified payment)
    const { count: activeBeneficiaries } = await supabase
      .from('beneficiary_activations')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'verified');

    const active = activeBeneficiaries || 0;
    const total = totalUsers || 0;
    const remaining = Math.max(0, MAX_BENEFICIARIES - active);
    const isFull = active >= MAX_BENEFICIARIES;

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: total,
        activeBeneficiaries: active,
        remainingSlots: remaining,
        maxBeneficiaries: MAX_BENEFICIARIES,
        isFull,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}