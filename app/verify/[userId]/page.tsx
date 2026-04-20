import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

// Server component — runs on the server, reads DB directly
export default async function VerifyPage({
  params,
}: {
  params: { userId: string };
}) {
  const { userId } = params;

  // Validate userId format to prevent injection
  if (!userId || userId.length < 10) return notFound();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch user
  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, country, created_at, role, profile_picture, is_active')
    .eq('id', userId)
    .single();

  if (error || !user) return notFound();

  // Fetch activation status
  const { data: activation } = await supabase
    .from('beneficiary_activations')
    .select('payment_status, activated_at, activation_method')
    .eq('user_id', userId)
    .eq('payment_status', 'verified')
    .maybeSingle();

  const isActive  = !!activation;
  const memberId  = 'CT-' + userId.slice(0, 6).toUpperCase() + '-' + new Date(user.created_at).getFullYear();
  const joinDate  = new Date(user.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const scanTime  = new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const statusColor  = isActive ? '#00B894' : '#ffc107';
  const statusBg     = isActive ? 'rgba(0,184,148,0.12)' : 'rgba(255,193,7,0.1)';
  const statusBorder = isActive ? 'rgba(0,184,148,0.3)' : 'rgba(255,193,7,0.3)';
  const barColor     = isActive
    ? 'linear-gradient(to right, #00CEC9, #00B894)'
    : 'linear-gradient(to right, #ffc107, #f59e0b)';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>Charity Token · Member Verification</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #020C1B;
            color: #fff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
          }
          .glow-tl {
            position: fixed; top: -100px; left: -100px;
            width: 400px; height: 400px; border-radius: 50%;
            background: radial-gradient(circle, rgba(0,206,201,0.07) 0%, transparent 70%);
            pointer-events: none;
          }
          .glow-br {
            position: fixed; bottom: -100px; right: -100px;
            width: 350px; height: 350px; border-radius: 50%;
            background: radial-gradient(circle, rgba(0,184,148,0.06) 0%, transparent 70%);
            pointer-events: none;
          }
          .wrap {
            position: relative; z-index: 1;
            width: 100%; max-width: 420px;
            display: flex; flex-direction: column; align-items: center; gap: 20px;
          }
          .logo-area { text-align: center; }
          .logo-area img {
            width: 68px; height: 68px; border-radius: 16px;
            border: 2px solid rgba(0,206,201,0.45);
            box-shadow: 0 0 28px rgba(0,206,201,0.2);
          }
          .logo-area p {
            margin-top: 8px; font-size: 11px; font-weight: 700;
            letter-spacing: 3px; color: #00CEC9; text-transform: uppercase;
          }
          .card {
            width: 100%;
            background: #0F1F35;
            border-radius: 22px;
            overflow: hidden;
            box-shadow: 0 24px 80px rgba(0,0,0,0.5);
          }
          .card-bar { height: 5px; }
          .card-status {
            padding: 28px 24px 22px;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          .status-icon {
            width: 76px; height: 76px; border-radius: 50%;
            margin: 0 auto 14px;
            display: flex; align-items: center; justify-content: center;
            font-size: 34px;
          }
          .status-label {
            font-size: 11px; font-weight: 700; letter-spacing: 2px;
            text-transform: uppercase; margin-bottom: 6px;
          }
          .status-title {
            font-size: 22px; font-weight: 900; color: white;
            margin-bottom: 6px; line-height: 1.2;
          }
          .status-sub { font-size: 13px; color: #8FA3BF; line-height: 1.6; }
          .profile-row {
            padding: 20px 24px;
            display: flex; align-items: center; gap: 16px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          .avatar {
            width: 72px; height: 72px; border-radius: 14px;
            object-fit: cover; border: 3px solid rgba(0,206,201,0.4); flex-shrink: 0;
          }
          .avatar-placeholder {
            width: 72px; height: 72px; border-radius: 14px; flex-shrink: 0;
            background: rgba(0,206,201,0.12); border: 3px solid rgba(0,206,201,0.3);
            display: flex; align-items: center; justify-content: center;
            font-size: 28px; font-weight: 900; color: #00CEC9;
          }
          .profile-name { font-size: 20px; font-weight: 800; color: white; margin-bottom: 4px; }
          .profile-email { font-size: 13px; color: #8FA3BF; margin-bottom: 4px; }
          .profile-country { font-size: 13px; color: #8FA3BF; }
          .details-grid {
            padding: 18px 24px;
            display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
          }
          .detail-box {
            padding: 12px 14px; border-radius: 12px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
          }
          .detail-label {
            font-size: 10px; font-weight: 700; letter-spacing: 1px;
            text-transform: uppercase; color: #8FA3BF; margin-bottom: 4px;
          }
          .detail-value { font-size: 13px; font-weight: 700; color: white; }
          .footer-row {
            padding: 0 24px 24px;
            display: flex; flex-direction: column; gap: 10px;
          }
          .verify-badge {
            display: flex; align-items: center; gap: 8; padding: 12px 16px;
            border-radius: 12px; background: rgba(0,206,201,0.05);
            border: 1px solid rgba(0,206,201,0.15);
          }
          .verify-dot {
            width: 8px; height: 8px; border-radius: 50%;
            background: #00CEC9; flex-shrink: 0;
            box-shadow: 0 0 8px rgba(0,206,201,0.6);
            animation: pulse 2s infinite;
          }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
          .verify-text { font-size: 12px; color: #8FA3BF; line-height: 1.5; }
          .home-link {
            display: block; text-align: center; padding: 13px;
            border-radius: 12px; background: linear-gradient(to right, #00CEC9, #00B894);
            color: #020C1B; font-weight: 800; font-size: 14px;
            text-decoration: none;
          }
          .scan-footer {
            text-align: center; font-size: 11px; color: rgba(143,163,191,0.45);
            line-height: 1.8;
          }
          .scan-footer a { color: #00CEC9; text-decoration: none; }
        ` }} />
      </head>
      <body>
        <div className="glow-tl" />
        <div className="glow-br" />

        <div className="wrap">

          {/* Logo */}
          <div className="logo-area">
            <img src="/Charity token logo.jpg" alt="Charity Token" />
            <p>Charity Token Project</p>
          </div>

          {/* Main Card */}
          <div className="card">
            <div className="card-bar" style={{ background: barColor }} />

            {/* Status banner */}
            <div className="card-status">
              <div className="status-icon" style={{ background: statusBg, border: `2px solid ${statusBorder}` }}>
                {isActive ? '✅' : '⏳'}
              </div>
              <p className="status-label" style={{ color: statusColor }}>
                {isActive ? 'Verified Member' : 'Not Yet Activated'}
              </p>
              <h1 className="status-title">
                {isActive ? 'Membership Confirmed ✓' : 'Account Registered'}
              </h1>
              <p className="status-sub">
                {isActive
                  ? 'This is an authentic Charity Token membership card.'
                  : 'This account is registered but not yet activated.'}
              </p>
            </div>

            {/* Profile */}
            <div className="profile-row">
              {user.profile_picture ? (
                <img src={user.profile_picture} alt={user.full_name} className="avatar" />
              ) : (
                <div className="avatar-placeholder">
                  {(user.full_name || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="profile-name">{user.full_name || 'No name'}</p>
                <p className="profile-email">{user.email}</p>
                {user.country && <p className="profile-country">📍 {user.country}</p>}
              </div>
            </div>

            {/* Details grid */}
            <div className="details-grid">
              <div className="detail-box">
                <p className="detail-label">Member ID</p>
                <p className="detail-value" style={{ fontFamily: 'monospace', color: '#00CEC9', fontSize: 12 }}>{memberId}</p>
              </div>
              <div className="detail-box">
                <p className="detail-label">Member Since</p>
                <p className="detail-value">{joinDate}</p>
              </div>
              <div className="detail-box">
                <p className="detail-label">Status</p>
                <p className="detail-value" style={{ color: statusColor }}>
                  {isActive ? '● Active Member' : '○ Pending'}
                </p>
              </div>
              <div className="detail-box">
                <p className="detail-label">Monthly Reward</p>
                <p className="detail-value" style={{ color: '#00B894' }}>500 CT × 10 yrs</p>
              </div>
              {activation?.activated_at && (
                <div className="detail-box" style={{ gridColumn: '1 / -1' }}>
                  <p className="detail-label">Activated On</p>
                  <p className="detail-value">
                    {new Date(activation.activated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {activation.activation_method ? ` · ${activation.activation_method.replace(/_/g, ' ')}` : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="footer-row">
              <div className="verify-badge">
                <div className="verify-dot" />
                <p className="verify-text">
                  Verified by Charity Token Project · Official Registry<br />
                  Scanned {scanTime}
                </p>
              </div>
              <a href="https://www.charitytoken.net" className="home-link">
                🌍 Visit charitytoken.net
              </a>
            </div>

            <div className="card-bar" style={{ background: barColor }} />
          </div>

          <p className="scan-footer">
            This page is auto-generated from the Charity Token membership registry.<br />
            <a href="https://www.charitytoken.net">charitytoken.net</a>
            {' · '}Official Member Verification
          </p>

        </div>
      </body>
    </html>
  );
}