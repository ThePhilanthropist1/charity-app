import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },

          // ── FIXED: camera=self allows camera on your own domain for KYC face capture
          // microphone and geolocation remain blocked
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },

          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              // blob: needed for camera capture and membership card image generation
              "img-src 'self' data: blob: https://*.supabase.co https://supabase.co",
              "font-src 'self' data:",
              // blob: and mediastream: needed for camera/video
              "media-src 'self' blob: mediastream:",
              "connect-src 'self' https://*.supabase.co https://api.resend.com https://api.bscscan.com https://bsc-dataseed1.binance.org https://bsc-dataseed2.binance.org https://bsc-dataseed1.defibit.io https://bsc-dataseed1.ninicoin.io https://api.minepi.com https://t.me",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // ── IMAGES ────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'supabase.co' },
    ],
  },
};

export default nextConfig;