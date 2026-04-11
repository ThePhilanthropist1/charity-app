import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ── SECURITY HEADERS ────────────────────────────────────────────────────────
  // Applied to every response from the app.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking — stops your app being embedded in iframes
          { key: 'X-Frame-Options', value: 'DENY' },

          // Stop browsers guessing content types (MIME sniffing attacks)
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // Force HTTPS for 1 year once visited (HSTS)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },

          // Control what browser features the page can use
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },

          // Referrer policy — don't leak full URLs to third parties
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // Content Security Policy
          // Allows: same origin, Supabase, Telegram, BSC RPCs
          // Blocks: inline scripts from unknown sources, data: URIs for scripts
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-inline needed for Next.js
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://api.bscscan.com https://bsc-dataseed1.binance.org https://bsc-dataseed2.binance.org https://bsc-dataseed1.defibit.io https://bsc-dataseed1.ninicoin.io https://api.minepi.com https://t.me",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // ── IMAGES ──────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'supabase.co' },
    ],
  },
};

export default nextConfig;