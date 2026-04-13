import { NextResponse } from 'next/server';

// TEMPORARY DEBUG ROUTE — DELETE AFTER FIXING
// Visit: https://your-site.netlify.app/api/debug-env
// It will tell you exactly what is wrong

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const report = {
    NEXT_PUBLIC_SUPABASE_URL:     supabaseUrl ? '✓ SET' : '✗ MISSING',
    SUPABASE_SERVICE_ROLE_KEY:    serviceKey  ? `✓ SET (${serviceKey.length} chars, starts: ${serviceKey.slice(0,6)})` : '✗ MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey    ? `✓ SET (${anonKey.length} chars)` : '✗ MISSING',
    JWT_SECRET:                   process.env.JWT_SECRET ? `✓ SET (${process.env.JWT_SECRET.length} chars)` : '✗ MISSING',
    NODE_ENV:                     process.env.NODE_ENV || 'unknown',
  };

  // Test if supabaseAdmin can actually query
  let dbTest = 'not tested';
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { count, error } = await admin
      .from('beneficiary_activations')
      .select('*', { count: 'exact', head: true });
    if (error) {
      dbTest = `✗ DB ERROR: ${error.message} (code: ${error.code})`;
    } else {
      dbTest = `✓ DB OK — ${count} activations found`;
    }
  } catch (e: any) {
    dbTest = `✗ EXCEPTION: ${e.message}`;
  }

  return NextResponse.json({ report, dbTest });
}