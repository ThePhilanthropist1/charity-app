import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

const MAX_BENEFICIARIES = 1_000_000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── IN-MEMORY CACHE ───────────────────────────────────────────────────────────
// Stores the last computed stats and a timestamp.
// On each request, if the cache is fresh (< 5 min old), return it instantly
// without hitting the database at all.
// On Netlify, each serverless function instance has its own memory, so the
// cache works per-instance. Under high load with many instances, each may
// do one fresh DB query before caching — this is fine and expected.

let cache: {
  data: {
    totalUsers: number;
    activeBeneficiaries: number;
    remainingSlots: number;
    maxBeneficiaries: number;
    isFull: boolean;
  };
  cachedAt: number;
} | null = null;

async function fetchFreshStats() {
  const [
    { count: activeBeneficiaries },
    { count: totalUsers },
  ] = await Promise.all([
    supabaseAdmin
      .from('beneficiary_activations')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'verified'),
    supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true }),
  ]);

  const active = activeBeneficiaries || 0;
  const total = totalUsers || 0;
  const remaining = Math.max(0, MAX_BENEFICIARIES - active);
  const isFull = active >= MAX_BENEFICIARIES;

  return { totalUsers: total, activeBeneficiaries: active, remainingSlots: remaining, maxBeneficiaries: MAX_BENEFICIARIES, isFull };
}

export async function GET(request: Request) {
  try {
    const now = Date.now();

    // Check for ?fresh=1 query param — allows admin to force a cache bust
    const url = new URL(request.url);
    const forceFresh = url.searchParams.get('fresh') === '1';

    // Return cached data if still fresh
    if (!forceFresh && cache && (now - cache.cachedAt) < CACHE_TTL_MS) {
      return NextResponse.json(
        { success: true, data: cache.data, cached: true, cachedAgo: Math.round((now - cache.cachedAt) / 1000) + 's' },
        {
          headers: {
            // Tell CDN/browser to cache for 60s, but allow stale for 5 min
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        }
      );
    }

    // Cache is stale or missing — fetch fresh from DB
    const data = await fetchFreshStats();

    // Store in memory cache
    cache = { data, cachedAt: now };

    return NextResponse.json(
      { success: true, data, cached: false },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );

  } catch (error) {
    console.error('[stats] Error:', error);

    // If DB fails but we have stale cache, return it rather than an error
    // Users see slightly old numbers instead of a broken progress bar
    if (cache) {
      return NextResponse.json(
        { success: true, data: cache.data, cached: true, stale: true },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}