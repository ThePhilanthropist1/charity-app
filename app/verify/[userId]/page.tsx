import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function VerifyPage({ params }: { params: { userId: string } }) {
  const { userId } = params;

  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, email, country, created_at, role, profile_picture')
    .eq('id', userId)
    .single();

  if (!user) return notFound();

  const { data: activation } = await supabase
    .from('beneficiary_activations')
    .select('payment_status, activated_at')
    .eq('user_id', userId)
    .eq('payment_status', 'verified')
    .maybeSingle();

  const isActive  = !!activation;
  const memberId  = 'CT-' + userId.slice(0, 6).toUpperCase() + '-' + new Date(user.created_at).getFullYear();
  const joinDate  = new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const verifyDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Charity Token · Member Verification</title>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap');
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:'Outfit',sans-serif;background:#020C1B;color:white;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}
          .stars{position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at 20% 50%,rgba(0,206,201,0.07) 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,rgba(0,184,148,0.06) 0%,transparent 50%)}
        ` }} />
      </head>
      <body>
        <div className="stars" />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

          {/* Logo */}
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <img src="/Charity token logo.jpg" alt="Charity Token" style={{ width: 72, height: 72, borderRadius: 18, border: '2px solid rgba(0,206,201,0.5)', boxShadow: '0 0 32px rgba(0,206,201,0.25)' }} />
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '3px', color: '#00CEC9', marginTop: 10, textTransform: 'uppercase' }}>Charity Token Project</p>
          </div>

          {/* Main card */}
          <div style={{ width: '100%', background: '#0F1F35', border: `2px solid ${isActive ? 'rgba(0,184,148,0.4)' : 'rgba(255,193,7,0.3)'}`, borderRadius: 24, overflow: 'hidden', boxShadow: `0 24px 80px ${isActive ? 'rgba(0,184,148,0.15)' : 'rgba(255,193,7,0.1)'}` }}>

            {/* Top bar */}
            <div style={{ height: 5, background: isActive ? 'linear-gradient(to right,#00CEC9,#00B894)' : 'linear-gradient(to right,#ffc107,#f59e0b)' }} />

            {/* Status banner */}
            <div style={{ padding: '28px 28px 24px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, background: isActive ? 'rgba(0,184,148,0.12)' : 'rgba(255,193,7,0.1)', border: `2px solid ${isActive ? 'rgba(0,184,148,0.3)' : 'rgba(255,193,7,0.25)'}` }}>
                {isActive ? '✅' : '⏳'}
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', color: isActive ? '#00CEC9' : '#ffc107', textTransform: 'uppercase', marginBottom: 6 }}>
                {isActive ? 'Verified Member' : 'Registration Pending'}
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 6 }}>
                {isActive ? 'Membership Confirmed ✓' : 'Account Not Yet Activated'}
              </h1>
              <p style={{ fontSize: 13, color: '#8FA3BF' }}>
                {isActive ? 'This is an authentic Charity Token membership card.' : 'This account is registered but not yet activated.'}
              </p>
            </div>

            {/* Profile section */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 18 }}>
              {user.profile_picture ? (
                <img src={user.profile_picture} alt={user.full_name} style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'cover', border: '3px solid rgba(0,206,201,0.4)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: 'rgba(0,206,201,0.12)', border: '3px solid rgba(0,206,201,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: '#00CEC9' }}>{(user.full_name || 'U')[0].toUpperCase()}</span>
                </div>
              )}
              <div>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 4 }}>{user.full_name}</p>
                <p style={{ fontSize: 13, color: '#8FA3BF', marginBottom: 6 }}>{user.email}</p>
                {user.country && <p style={{ fontSize: 13, color: '#8FA3BF' }}>📍 {user.country}</p>}
              </div>
            </div>

            {/* Details grid */}
            <div style={{ padding: '20px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Member ID',     value: memberId,   mono: true },
                { label: 'Member Since',  value: joinDate,   mono: false },
                { label: 'Status',        value: isActive ? 'Active Member' : 'Pending', color: isActive ? '#00B894' : '#ffc107' },
                { label: 'Monthly CT',    value: '500 CT × 10 years', color: '#00CEC9' },
              ].map(item => (
                <div key={item.label} style={{ padding: '12px 14px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#8FA3BF', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: (item as any).color || 'white', fontFamily: (item as any).mono ? 'monospace' : 'inherit' }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div style={{ height: 4, background: isActive ? 'linear-gradient(to right,#00B894,#00CEC9)' : 'linear-gradient(to right,#f59e0b,#ffc107)' }} />
          </div>

          {/* Verified by footer */}
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'rgba(143,163,191,0.5)', lineHeight: 1.8 }}>
              Verification generated {verifyDate}<br />
              <a href="https://www.charitytoken.net" style={{ color: '#00CEC9', textDecoration: 'none', fontWeight: 600 }}>charitytoken.net</a>
              {' · '}Official Membership Registry
            </p>
          </div>

        </div>
      </body>
    </html>
  );
}