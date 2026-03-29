import { NextRequest, NextResponse } from 'next/server';

const CACHE_DURATION = 60; // seconds

const cache = new Map<string, { data: any; timestamp: number }>();

export function withCache(duration: number = CACHE_DURATION) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest) => {
      const cacheKey = `${req.method}:${req.nextUrl.pathname}`;
      const cachedEntry = cache.get(cacheKey);
      const now = Date.now();

      // Return cached response if valid
      if (cachedEntry && now - cachedEntry.timestamp < duration * 1000) {
        return new NextResponse(JSON.stringify(cachedEntry.data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'Cache-Control': `public, max-age=${duration}`,
          },
        });
      }

      // Call handler and cache response
      const response = await handler(req);
      
      if (response.status === 200) {
        try {
          const data = await response.clone().json();
          cache.set(cacheKey, { data, timestamp: now });
        } catch (e) {
          // Skip caching if response is not JSON
        }
      }

      return response;
    };
  };
}

export function clearCache(pattern?: string) {
  if (!pattern) {
    cache.clear();
  } else {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  }
}

export const apiCache = {
  // Cache different API endpoints with appropriate durations
  strategies: {
    user: 5 * 60, // 5 minutes
    distributions: 10 * 60, // 10 minutes
    kyc: 60 * 60, // 1 hour
    stats: 30 * 60, // 30 minutes
  },
};
