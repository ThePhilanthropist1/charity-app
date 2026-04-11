import { NextRequest, NextResponse } from 'next/server';

// ── RATE LIMITER ──────────────────────────────────────────────────────────────
// In-memory store: Map<key, { count, windowStart }>
// Key = IP + route identifier
// Resets after window expires.
// Note: on Netlify each serverless instance has its own memory.
// This limits bursts per-instance which is sufficient for DDoS protection.
// For stricter global rate limiting, use Upstash Redis later.

const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

interface RateLimitConfig {
  windowMs: number;  // time window in ms
  maxRequests: number; // max requests per window
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Login — 10 attempts per 15 minutes per IP
  '/api/auth/login': { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  // Register — 5 registrations per hour per IP
  '/api/auth/register': { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  // Activation — 10 attempts per hour per IP
  '/api/activation': { windowMs: 60 * 60 * 1000, maxRequests: 10 },
  // Stats — 60 requests per minute per IP (public endpoint)
  '/api/stats': { windowMs: 60 * 1000, maxRequests: 60 },
};

function getClientIp(request: NextRequest): string {
  // Netlify passes real IP in x-forwarded-for
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

function checkRateLimit(ip: string, route: string, config: RateLimitConfig): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const key = `${ip}:${route}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || (now - record.windowStart) >= config.windowMs) {
    // New window
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  if (record.count >= config.maxRequests) {
    const resetIn = config.windowMs - (now - record.windowStart);
    return { allowed: false, remaining: 0, resetIn };
  }

  record.count++;
  return { allowed: true, remaining: config.maxRequests - record.count, resetIn: config.windowMs - (now - record.windowStart) };
}

// Cleanup old entries every 10 minutes to prevent memory leak
let lastCleanup = Date.now();
function cleanupStore() {
  const now = Date.now();
  if (now - lastCleanup < 10 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, record] of rateLimitStore.entries()) {
    // Remove entries older than 1 hour
    if (now - record.windowStart > 60 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  cleanupStore();

  // ── RATE LIMITING ──────────────────────────────────────────────────────────
  // Auth route — differentiate login vs register by body action
  // We can't read body in middleware, so rate limit all /api/auth POST equally
  let rateLimitKey: string | null = null;

  if (pathname === '/api/auth' && method === 'POST') {
    rateLimitKey = '/api/auth/login'; // use login limits for all auth POSTs
  } else if (pathname === '/api/activation' && method === 'POST') {
    rateLimitKey = '/api/activation';
  } else if (pathname === '/api/stats' && method === 'GET') {
    rateLimitKey = '/api/stats';
  }

  if (rateLimitKey) {
    const ip = getClientIp(request);
    const config = RATE_LIMITS[rateLimitKey];
    const { allowed, remaining, resetIn } = checkRateLimit(ip, rateLimitKey, config);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please wait a moment before trying again.',
          retryAfter: Math.ceil(resetIn / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(resetIn / 1000)),
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil((Date.now() + resetIn) / 1000)),
          },
        }
      );
    }

    // Add rate limit headers to allowed responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/auth',
    '/api/activation',
    '/api/stats',
  ],
};