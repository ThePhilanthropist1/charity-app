'use client';

import { useState } from 'react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { X, Share, Plus, Smartphone, Monitor, Download } from 'lucide-react';

// ── iOS GUIDE MODAL ───────────────────────────────────────────────────────────
function IOSGuide({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)', padding: '0 0 0 0' }}>
      <div style={{ width: '100%', maxWidth: 480, backgroundColor: '#0F1F35', border: '1px solid rgba(0,206,201,0.25)', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', position: 'relative', boxShadow: '0 -20px 60px rgba(0,0,0,0.6)' }}>
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 24px' }} />

        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', color: '#8FA3BF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 14, height: 14 }} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 6 }}>Add to Home Screen</h2>
          <p style={{ fontSize: 13, color: '#8FA3BF', lineHeight: 1.6 }}>Follow these 3 simple steps to install Charity Token on your iPhone or iPad</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { step: '1', icon: <Share style={{ width: 18, height: 18 }} />, title: 'Tap the Share button', desc: 'Find the Share icon at the bottom of Safari (the box with an arrow pointing up)', color: '#00CEC9' },
            { step: '2', icon: <Plus style={{ width: 18, height: 18 }} />, title: 'Select "Add to Home Screen"', desc: 'Scroll down in the share sheet and tap "Add to Home Screen"', color: '#00B894' },
            { step: '3', icon: '✓', title: 'Tap "Add" to confirm', desc: 'The Charity Token app icon will appear on your home screen instantly', color: '#FFD000' },
          ].map((s) => (
            <div key={s.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: `${s.color}18`, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: s.color }}>
                {typeof s.icon === 'string' ? <span style={{ fontSize: 16, fontWeight: 800 }}>{s.icon}</span> : s.icon}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: '0 0 3px' }}>{s.title}</p>
                <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Arrow pointing down to indicate Safari share bar */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ fontSize: 12, color: '#8FA3BF' }}>↓ The share button is at the bottom of your screen ↓</p>
        </div>
      </div>
    </div>
  );
}

// ── BANNER VARIANT (shown at top of pages) ────────────────────────────────────
export function PWAInstallBanner() {
  const { install, canInstall, isInstalled, isIOS, showIOSGuide, setShowIOSGuide } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('pwa_banner_dismissed') === 'true';
  });

  if (!canInstall || isInstalled || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem('pwa_banner_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <>
      {showIOSGuide && <IOSGuide onClose={() => setShowIOSGuide(false)} />}
      <div style={{ position: 'relative', background: 'linear-gradient(135deg, rgba(0,206,201,0.12) 0%, rgba(0,184,148,0.08) 50%, rgba(255,208,0,0.06) 100%)', borderBottom: '1px solid rgba(0,206,201,0.2)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 40 }}>
        {/* Animated pulse dot */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #00CEC9, #00B894)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            📱
          </div>
          <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FFD000', border: '2px solid #020C1B', animation: 'pulse 2s infinite' }} />
          <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.3);opacity:0.7} }`}</style>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0 }}>
            Install Charity Token App
          </p>
          <p style={{ fontSize: 11, color: '#8FA3BF', margin: 0 }}>
            {isIOS ? 'Add to your Home Screen for the best experience' : 'Install for instant access — works offline too'}
          </p>
        </div>

        <button
          onClick={install}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg, #00CEC9, #00B894)', color: '#020C1B', fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,206,201,0.3)' }}
        >
          <Download style={{ width: 13, height: 13 }} />
          {isIOS ? 'How to Install' : 'Install'}
        </button>

        <button onClick={dismiss} style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', color: '#8FA3BF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </>
  );
}

// ── FLOATING BUTTON (bottom-right corner, all pages) ─────────────────────────
export function PWAInstallFAB() {
  const { install, canInstall, isInstalled, isIOS, showIOSGuide, setShowIOSGuide } = usePWAInstall();
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (!canInstall || isInstalled || hidden) return null;

  return (
    <>
      {showIOSGuide && <IOSGuide onClose={() => setShowIOSGuide(false)} />}
      <style>{`
        @keyframes fab-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
      `}</style>

      <div style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>

        {/* Expanded card */}
        {expanded && (
          <div style={{ width: 280, backgroundColor: '#0F1F35', border: '1px solid rgba(0,206,201,0.25)', borderRadius: 20, padding: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', animation: 'fadeUp 0.2s ease' }}>
            <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* Top bar */}
            <div style={{ height: 2, background: 'linear-gradient(to right, #00CEC9, #00B894, #FFD000)', borderRadius: 1, marginBottom: 16 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #00CEC9, #00B894)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                💚
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'white', margin: 0 }}>Charity Token</p>
                <p style={{ fontSize: 11, color: '#00CEC9', margin: 0, fontWeight: 600 }}>Free App · No App Store Needed</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
              {[
                { icon: '⚡', text: 'Instant access from your home screen' },
                { icon: '📶', text: 'Works offline — no internet needed' },
                { icon: '🔔', text: 'Get notified about your CT tokens' },
                { icon: '🔒', text: 'Safe, secure, no app store required' },
              ].map((f) => (
                <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13 }}>{f.icon}</span>
                  <span style={{ fontSize: 12, color: '#8FA3BF' }}>{f.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => { install(); setExpanded(false); }}
              style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg, #00CEC9, #00B894)', backgroundSize: '200% auto', color: '#020C1B', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 24px rgba(0,206,201,0.35)', animation: 'shimmer 3s linear infinite' }}
            >
              {isIOS ? (
                <><Share style={{ width: 16, height: 16 }} /> How to Add to Home Screen</>
              ) : (
                <><Download style={{ width: 16, height: 16 }} /> Install Free App</>
              )}
            </button>

            <button onClick={() => setHidden(true)} style={{ width: '100%', marginTop: 8, padding: '8px', borderRadius: 10, background: 'transparent', border: 'none', color: '#4A5568', fontSize: 11, cursor: 'pointer' }}>
              Don't show again
            </button>
          </div>
        )}

        {/* FAB Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'flex', alignItems: 'center', gap: expanded ? 0 : 10,
            padding: expanded ? '14px' : '14px 20px',
            borderRadius: 999,
            background: 'linear-gradient(135deg, #00CEC9, #00B894)',
            color: '#020C1B',
            fontWeight: 800, fontSize: 14,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0,206,201,0.45)',
            animation: expanded ? 'none' : 'fab-bounce 3s ease-in-out infinite',
            transition: 'all 0.2s ease',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Shimmer overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', backgroundSize: '200% auto', animation: 'shimmer 2s linear infinite', borderRadius: 999 }} />

          {expanded ? (
            <X style={{ width: 18, height: 18, position: 'relative', zIndex: 1 }} />
          ) : (
            <>
              <span style={{ fontSize: 18, position: 'relative', zIndex: 1 }}>📲</span>
              <span style={{ position: 'relative', zIndex: 1 }}>Install App</span>
              {/* Notification dot */}
              <div style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FFD000', border: '2px solid #020C1B', animation: 'pulse 2s infinite', zIndex: 2 }} />
            </>
          )}
        </button>
      </div>
    </>
  );
}

// ── INLINE CARD (for homepage / landing sections) ─────────────────────────────
export function PWAInstallCard() {
  const { install, canInstall, isInstalled, isIOS, isAndroid, showIOSGuide, setShowIOSGuide } = usePWAInstall();

  if (isInstalled) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderRadius: 14, backgroundColor: 'rgba(0,184,148,0.08)', border: '1px solid rgba(0,184,148,0.2)' }}>
        <span style={{ fontSize: 20 }}>✅</span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#00B894', margin: 0 }}>App Installed!</p>
          <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>Charity Token is on your home screen</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showIOSGuide && <IOSGuide onClose={() => setShowIOSGuide(false)} />}
      <div style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #071828 0%, #0A1F38 100%)', border: '1px solid rgba(0,206,201,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        {/* Gradient top bar */}
        <div style={{ height: 3, background: 'linear-gradient(to right, #00CEC9, #00B894, #FFD000)' }} />

        {/* Glow */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,206,201,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ padding: '28px 28px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #00CEC9, #00B894)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 8px 24px rgba(0,206,201,0.3)', flexShrink: 0 }}>
              💚
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#00CEC9', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 3px' }}>Free Download</p>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: 'white', margin: 0 }}>Install Charity Token</h3>
              <p style={{ fontSize: 12, color: '#8FA3BF', margin: '2px 0 0' }}>Add to {isIOS ? 'Home Screen' : isAndroid ? 'Home Screen' : 'Desktop'} — No App Store</p>
            </div>
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
            {[
              { icon: '⚡', label: 'Instant Access' },
              { icon: '📶', label: 'Works Offline' },
              { icon: '🔔', label: 'Notifications' },
              { icon: '🔒', label: '100% Secure' },
              { icon: '🆓', label: 'Completely Free' },
            ].map((f) => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 999, backgroundColor: 'rgba(0,206,201,0.07)', border: '1px solid rgba(0,206,201,0.15)' }}>
                <span style={{ fontSize: 12 }}>{f.icon}</span>
                <span style={{ fontSize: 11, color: '#8FA3BF', fontWeight: 600 }}>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Platform steps preview */}
          <div style={{ padding: '12px 16px', borderRadius: 12, backgroundColor: 'rgba(255,208,0,0.05)', border: '1px solid rgba(255,208,0,0.15)', marginBottom: 18 }}>
            <p style={{ fontSize: 12, color: '#FFD000', fontWeight: 600, margin: '0 0 6px' }}>
              {isIOS ? '📱 iPhone/iPad:' : isAndroid ? '📱 Android:' : '💻 Desktop:'}
            </p>
            <p style={{ fontSize: 11, color: '#8FA3BF', margin: 0, lineHeight: 1.7 }}>
              {isIOS
                ? 'Tap Share (↑) in Safari → "Add to Home Screen" → Add'
                : isAndroid
                ? 'Tap the button below → "Install" in the prompt'
                : 'Click Install below → confirm in the browser popup'
              }
            </p>
          </div>

          {/* Install button */}
          <button
            onClick={install}
            style={{
              width: '100%', padding: '15px',
              borderRadius: 14,
              background: canInstall
                ? 'linear-gradient(135deg, #00CEC9 0%, #00B894 100%)'
                : 'rgba(0,206,201,0.15)',
              color: canInstall ? '#020C1B' : '#00CEC9',
              fontWeight: 900, fontSize: 15,
              border: canInstall ? 'none' : '1px solid rgba(0,206,201,0.3)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: canInstall ? '0 8px 32px rgba(0,206,201,0.35)' : 'none',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', backgroundSize: '200% auto', animation: 'shimmer 2s linear infinite' }} />
            <style>{`@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}`}</style>
            {isIOS ? (
              <><span style={{ fontSize: 18, position: 'relative', zIndex: 1 }}>📲</span><span style={{ position: 'relative', zIndex: 1 }}>How to Add to Home Screen</span></>
            ) : (
              <><Download style={{ width: 18, height: 18, position: 'relative', zIndex: 1 }} /><span style={{ position: 'relative', zIndex: 1 }}>{canInstall ? 'Install App — It\'s Free' : 'Open in Browser to Install'}</span></>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#4A5568', margin: '10px 0 0' }}>
            No sign-up required to install · Works on all devices
          </p>
        </div>
      </div>
    </>
  );
}