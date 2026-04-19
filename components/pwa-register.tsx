'use client';
// Add this component to your root layout.tsx
// It registers the service worker silently in the background

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('[PWA] SW registered:', reg.scope))
          .catch((err) => console.log('[PWA] SW registration failed:', err));
      });
    }
  }, []);
  return null;
}