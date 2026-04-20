'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function VerifyPage() {
  const params  = useParams();
  const userId  = params?.userId as string;

  const [status, setStatus]   = useState<'loading' | 'found' | 'notfound'>('loading');
  const [user,   setUser]     = useState<any>(null);
  const [active, setActive]   = useState(false);
  const [activation, setActivation] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: u } = await sb
          .from('users')
          .select('id, full_name, email, country, created_at, role, profile_picture')
          .eq('id', userId)
          .single();

        if (!u) { setStatus('notfound'); return; }
        setUser(u);

        const { data: act } = await sb
          .from('beneficiary_activations')
          .select('payment_status, activated_at, activation_method')
          .eq('user_id', userId)
          .eq('payment_status', 'verified')
          .maybeSingle();

        setActive(!!act);
        setActivation(act || null);
        setStatus('found');
      } catch {
        setStatus('notfound');
      }
    };
    load();
  }, [userId]);

  const memberId = user
    ? 'CT-' + userId.slice(0, 6).toUpperCase() + '-' + new Date(user.created_at).getFullYear()
    : '';

  const scanTime = new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const C = active ? '#00B894' : '#ffc107';
  const Cbg = active ? 'rgba(0,184,148,0.12)' : 'rgba(255,193,7,0.1)';
  const Cbdr = active ? 'rgba(0,184,148,0.3)' : 'rgba(255,193,7,0.3)';
  const bar = active
    ? 'linear-gradient(to right,#00CEC9,#00B894)'
    : 'linear-gradient(to right,#ffc107,#f59e0b)';

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (status === 'loading') return (
    <div style={{ minHeight:'100vh', backgroundColor:'#020C1B', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:44, height:44, border:'3px solid rgba(0,206,201,0.2)', borderTop:'3px solid #00CEC9', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' }} />
        <p style={{ color:'#8FA3BF', fontSize:14 }}>Verifying membership...</p>
      </div>
    </div>
  );

  // ── NOT FOUND ─────────────────────────────────────────────────────────────
  if (status === 'notfound') return (
    <div style={{ minHeight:'100vh', backgroundColor:'#020C1B', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:360 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>❌</div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'white', marginBottom:10 }}>Member Not Found</h1>
        <p style={{ fontSize:14, color:'#8FA3BF', lineHeight:1.7, marginBottom:24 }}>
          This QR code does not match any registered member in the Charity Token Project.
        </p>
        <a href="https://www.charitytoken.net" style={{ display:'inline-block', padding:'13px 32px', borderRadius:12, background:'linear-gradient(to right,#00CEC9,#00B894)', color:'#020C1B', fontWeight:800, fontSize:14, textDecoration:'none' }}>
          Visit charitytoken.net
        </a>
      </div>
    </div>
  );

  // ── FOUND ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#020C1B', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', color:'white' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>

      {/* Glow blobs */}
      <div style={{ position:'fixed', top:-100, left:-100, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,206,201,0.07) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:-100, right:-100, width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,184,148,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:420, display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>

        {/* Logo */}
        <div style={{ textAlign:'center' }}>
          <img src="/Charity token logo.jpg" alt="Charity Token"
            style={{ width:68, height:68, borderRadius:16, border:'2px solid rgba(0,206,201,0.45)', boxShadow:'0 0 28px rgba(0,206,201,0.2)' }} />
          <p style={{ marginTop:8, fontSize:11, fontWeight:700, letterSpacing:'3px', color:'#00CEC9', textTransform:'uppercase' }}>
            Charity Token Project
          </p>
        </div>

        {/* Card */}
        <div style={{ width:'100%', background:'#0F1F35', borderRadius:22, overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.5)', border:`1px solid ${Cbdr}` }}>

          {/* Top bar */}
          <div style={{ height:5, background:bar }} />

          {/* Status */}
          <div style={{ padding:'28px 24px 22px', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width:76, height:76, borderRadius:'50%', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, background:Cbg, border:`2px solid ${Cbdr}` }}>
              {active ? '✅' : '⏳'}
            </div>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'2px', color:C, textTransform:'uppercase', marginBottom:6 }}>
              {active ? 'Verified Member' : 'Not Yet Activated'}
            </p>
            <h1 style={{ fontSize:22, fontWeight:900, color:'white', marginBottom:6, lineHeight:1.2 }}>
              {active ? 'Membership Confirmed ✓' : 'Account Registered'}
            </h1>
            <p style={{ fontSize:13, color:'#8FA3BF', lineHeight:1.6 }}>
              {active
                ? 'This is an authentic Charity Token membership card.'
                : 'This account is registered but not yet activated.'}
            </p>
          </div>

          {/* Profile */}
          <div style={{ padding:'20px 24px', display:'flex', alignItems:'center', gap:16, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            {user.profile_picture ? (
              <img src={user.profile_picture} alt={user.full_name}
                style={{ width:72, height:72, borderRadius:14, objectFit:'cover', border:'3px solid rgba(0,206,201,0.4)', flexShrink:0 }} />
            ) : (
              <div style={{ width:72, height:72, borderRadius:14, flexShrink:0, background:'rgba(0,206,201,0.12)', border:'3px solid rgba(0,206,201,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:900, color:'#00CEC9' }}>
                {(user.full_name || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <p style={{ fontSize:20, fontWeight:800, color:'white', marginBottom:4 }}>{user.full_name || 'No name'}</p>
              <p style={{ fontSize:13, color:'#8FA3BF', marginBottom:4 }}>{user.email}</p>
              {user.country && <p style={{ fontSize:13, color:'#8FA3BF' }}>📍 {user.country}</p>}
            </div>
          </div>

          {/* Details grid */}
          <div style={{ padding:'18px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { label:'Member ID', value:memberId, color:'#00CEC9', mono:true },
              { label:'Member Since', value:new Date(user.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}), color:'white' },
              { label:'Status', value:active ? '● Active Member' : '○ Pending', color:C },
              { label:'Monthly Reward', value:'500 CT × 10 years', color:'#00B894' },
              ...(activation?.activated_at ? [{
                label:'Activated On',
                value:new Date(activation.activated_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}),
                color:'white', span:true,
              }] : []),
            ].map((item:any) => (
              <div key={item.label} style={{ padding:'12px 14px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', gridColumn:item.span ? '1/-1' : 'auto' }}>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'#8FA3BF', marginBottom:4 }}>{item.label}</p>
                <p style={{ fontSize:13, fontWeight:700, color:item.color, fontFamily:item.mono ? 'monospace' : 'inherit' }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Verified badge */}
          <div style={{ padding:'0 24px 20px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:12, background:'rgba(0,206,201,0.05)', border:'1px solid rgba(0,206,201,0.15)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#00CEC9', flexShrink:0, boxShadow:'0 0 8px rgba(0,206,201,0.6)', animation:'pulse 2s infinite' }} />
              <p style={{ fontSize:12, color:'#8FA3BF', lineHeight:1.5 }}>
                Verified by Charity Token Project · Official Registry<br />
                Scanned {scanTime}
              </p>
            </div>
            <a href="https://www.charitytoken.net" style={{ display:'block', textAlign:'center', padding:13, borderRadius:12, background:'linear-gradient(to right,#00CEC9,#00B894)', color:'#020C1B', fontWeight:800, fontSize:14, textDecoration:'none' }}>
              🌍 Visit charitytoken.net
            </a>
          </div>

          {/* Bottom bar */}
          <div style={{ height:5, background:bar }} />
        </div>

        <p style={{ textAlign:'center', fontSize:11, color:'rgba(143,163,191,0.45)', lineHeight:1.8 }}>
          Auto-generated from the Charity Token membership registry.<br />
          <a href="https://www.charitytoken.net" style={{ color:'#00CEC9', textDecoration:'none' }}>charitytoken.net</a>
          {' · '}Official Member Verification
        </p>

      </div>
    </div>
  );
}