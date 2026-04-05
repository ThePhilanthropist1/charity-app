'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase-client';
import Image from 'next/image';
import {
  Users, CheckCircle, Clock, LogOut, Shield,
  AlertCircle, Home, UserCheck, Mail, MapPin,
  Coins, Copy, RefreshCw, X, Zap, Award, Search
} from 'lucide-react';

const WALLET_ADDRESS = '0x5d5A2B49c3F7AE576D93D3d636b37029b68E7e3e';
const ACT_PER_ACTIVATION = 10;
const ACT_INITIAL_BALANCE = 1000;
const REFILL_COST_USD = 70;
const REFILL_ACT_AMOUNT = 1000;
const USDT_CONTRACT = '0x55d398326f99059ff775485246999027b3197955';

// ── ensure philanthropist record exists ───────────────────────────────────────
async function ensurePhilRecord(userId: string) {
  // Fetch existing record by user_id
  const { data: existing } = await supabase
    .from('philanthropists')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) return existing;

  // Also try fetching by id (since old table uses id = user_id)
  const { data: byId } = await supabase
    .from('philanthropists')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (byId) return byId;

  // Record does not exist — return null, dashboard will show default values
  // Philanthropist records must be created via the admin KYC approval process
  return null;
}

// ── deduct ACT and increment total ───────────────────────────────────────────
async function deductACT(userId: string, currentBalance: number, currentTotal: number) {
  const newBalance = currentBalance - ACT_PER_ACTIVATION;
  const newTotal = currentTotal + 1;
  // Try update by user_id first, fallback to id (old table uses id = user_id)
  const { data: rows } = await supabase
    .from("philanthropists")
    .update({ act_balance: newBalance, total_activated: newTotal, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select("id");
  if (!rows || rows.length === 0) {
    const { error } = await supabase
      .from("philanthropists")
      .update({ act_balance: newBalance, total_activated: newTotal, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;
  }
  return { newBalance, newTotal };
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PhilanthropistDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const [philRecord, setPhilRecord] = useState<any>(null);
  const [actBalance, setActBalance] = useState(ACT_INITIAL_BALANCE);
  const [totalActivated, setTotalActivated] = useState(0);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showRefill, setShowRefill] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    const allowed = user.role === 'philanthropist' || user.role === 'admin' || user.email?.toLowerCase() === 'dinfadashe@gmail.com';
    if (!allowed) { router.push('/beneficiary-dashboard'); return; }
    loadAll();
  }, [user, authLoading]);

  const loadAll = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Ensure record exists — creates with 1000 ACT if new
      const record = await ensurePhilRecord(user.id);
      setPhilRecord(record);
      setActBalance(record?.act_balance ?? ACT_INITIAL_BALANCE);
      setTotalActivated(record?.total_activated ?? 0);

      // Pending activations (users who haven't been activated yet)
      const { data: pending } = await supabase
        .from('beneficiary_activations')
        .select(`*, users:user_id (id, full_name, email, country, profile_picture)`)
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: true });

      setPendingUsers(pending || []);
    } catch (e) { console.error('loadAll error:', e); }
    finally { setLoading(false); }
  };

  const handleActivateFromQueue = async (item: any) => {
    const targetUserId = item.users?.id || item.user_id;
    if (!targetUserId || !user?.id) return;

    if (actBalance < ACT_PER_ACTIVATION) {
      showToast(`❌ Insufficient ACT balance. You need ${ACT_PER_ACTIVATION} ACT to activate. Please refill.`, 'error');
      setShowRefill(true);
      return;
    }

    setActivating(targetUserId);
    try {
      // 1. Activate beneficiary
      const { error: actError } = await supabase
        .from('beneficiary_activations')
        .update({
          payment_status: 'verified',
          activation_method: 'philanthropist',
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', targetUserId);
      if (actError) throw actError;

      // 2. Deduct ACT
      const { newBalance, newTotal } = await deductACT(user.id, actBalance, totalActivated);
      setActBalance(newBalance);
      setTotalActivated(newTotal);

      const name = item.users?.full_name || item.users?.email || 'User';
      showToast(`✅ ${name} activated successfully! −${ACT_PER_ACTIVATION} ACT deducted. Balance: ${newBalance} ACT`, 'success');
      await loadAll();
    } catch (e: any) {
      showToast(`❌ Activation failed: ${e.message}`, 'error');
    } finally { setActivating(null); }
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(0,184,148,0.3)', borderTop: '3px solid #00B894', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#8FA3BF', fontSize: 14 }}>Loading Philanthropist Portal...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const actPct = Math.min(100, (actBalance / ACT_INITIAL_BALANCE) * 100);
  const actColor = actBalance >= 200 ? '#00B894' : actBalance >= 100 ? '#ffc107' : '#ff6b6b';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', color: 'white', fontFamily: 'sans-serif' }}>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, padding: '14px 20px', borderRadius: 14, backgroundColor: toast.type === 'success' ? 'rgba(0,184,148,0.15)' : 'rgba(255,107,107,0.15)', border: `2px solid ${toast.type === 'success' ? 'rgba(0,184,148,0.5)' : 'rgba(255,107,107,0.5)'}`, color: toast.type === 'success' ? '#00B894' : '#ff6b6b', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'flex-start', gap: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', maxWidth: 400, zIndex: 1000 }}>
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            {toast.type === 'success' ? <CheckCircle style={{ width: 18, height: 18 }} /> : <AlertCircle style={{ width: 18, height: 18 }} />}
          </div>
          <p style={{ margin: 0, lineHeight: 1.5 }}>{toast.msg}</p>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, flexShrink: 0, opacity: 0.6 }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}

      {/* REFILL MODAL */}
      {showRefill && (
        <RefillModal
          onClose={() => setShowRefill(false)}
          onSuccess={(newBal) => {
            setActBalance(newBal);
            setShowRefill(false);
            showToast(`✅ ACT balance refilled! +${REFILL_ACT_AMOUNT} ACT. New balance: ${newBal} ACT`, 'success');
            loadAll();
          }}
          userId={user?.id || ''}
          currentBalance={actBalance}
        />
      )}

      {/* BG */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, background: 'radial-gradient(circle, rgba(0,184,148,0.04) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/Charity token logo.jpg" alt="Charity Token" width={32} height={32} style={{ borderRadius: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Charity Token</span>
            <span style={{ fontSize: 11, color: '#00B894', backgroundColor: 'rgba(0,184,148,0.15)', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(0,184,148,0.3)', fontWeight: 700 }}>PHILANTHROPIST</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => router.push('/beneficiary-dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(0,206,201,0.2)', color: '#67e8f9', background: 'transparent', cursor: 'pointer' }}>
              <Home style={{ width: 13, height: 13 }} /> My Dashboard
            </button>
            <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', color: '#8FA3BF', background: 'transparent', cursor: 'pointer' }}>
              <LogOut style={{ width: 13, height: 13 }} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px 80px', position: 'relative', zIndex: 10 }}>

        {/* TITLE */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, color: '#00B894', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Philanthropist Portal</p>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, marginBottom: 6 }}>
            Welcome, {user?.full_name?.split(' ')[0] || 'Philanthropist'} 👐
          </h1>
          <p style={{ fontSize: 13, color: '#8FA3BF' }}>Activate beneficiaries, manage your ACT balance, and grow the Charity Token community.</p>
        </div>

        {/* ACT BALANCE CARD */}
        <div style={{ marginBottom: 20, padding: '24px', borderRadius: 20, background: 'linear-gradient(135deg, #0d2137 0%, #0a1628 60%, #0d2137 100%)', border: `2px solid ${actColor}40`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right, ${actColor}, #00CEC9)` }} />
          <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: `${actColor}06` }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <p style={{ fontSize: 11, color: '#8FA3BF', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Activation Token Balance</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <p style={{ fontSize: 52, fontWeight: 900, color: actColor, lineHeight: 1, margin: 0 }}>{actBalance.toLocaleString()}</p>
                <span style={{ fontSize: 18, color: '#8FA3BF', fontWeight: 600 }}>ACT</span>
              </div>
              <p style={{ fontSize: 12, color: '#8FA3BF', marginTop: 6 }}>
                <strong style={{ color: 'white' }}>{Math.floor(actBalance / ACT_PER_ACTIVATION)}</strong> activations remaining · <strong style={{ color: '#67e8f9' }}>{ACT_PER_ACTIVATION} ACT</strong> per activation
              </p>
            </div>
            <button onClick={() => setShowRefill(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 12, background: `linear-gradient(to right, ${actColor}, #00CEC9)`, color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', flexShrink: 0, boxShadow: `0 4px 16px ${actColor}30` }}>
              <RefreshCw style={{ width: 15, height: 15 }} /> Refill ACT
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 10, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: `${actPct}%`, background: `linear-gradient(to right, ${actColor}, #00CEC9)`, borderRadius: 999, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#8FA3BF' }}>0</span>
            <span style={{ fontSize: 11, color: '#8FA3BF' }}>{ACT_INITIAL_BALANCE} ACT</span>
          </div>

          {actBalance < 100 && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle style={{ width: 14, height: 14, color: '#ff6b6b', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#ff6b6b', margin: 0 }}>
                Low balance! Only <strong>{Math.floor(actBalance / ACT_PER_ACTIVATION)}</strong> activations left.{' '}
                <button onClick={() => setShowRefill(true)} style={{ background: 'none', border: 'none', color: '#ff6b6b', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700, padding: 0, fontSize: 12 }}>Refill now →</button>
              </p>
            </div>
          )}
        </div>

        {/* STATS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Activated', value: totalActivated, color: '#00B894', bg: 'rgba(0,184,148,0.08)', border: 'rgba(0,184,148,0.2)', icon: <UserCheck style={{ width: 18, height: 18, color: '#00B894' }} /> },
            { label: 'Pending Queue', value: pendingUsers.length, color: '#ffc107', bg: 'rgba(255,193,7,0.08)', border: 'rgba(255,193,7,0.2)', icon: <Clock style={{ width: 18, height: 18, color: '#ffc107' }} /> },
            { label: 'ACT per Activation', value: ACT_PER_ACTIVATION, color: '#67e8f9', bg: 'rgba(103,232,249,0.08)', border: 'rgba(103,232,249,0.2)', icon: <Zap style={{ width: 18, height: 18, color: '#67e8f9' }} /> },
          ].map((s) => (
            <div key={s.label} style={{ padding: '18px 16px', borderRadius: 16, border: `1px solid ${s.border}`, backgroundColor: s.bg, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
              <div>
                <p style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1, margin: 0 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: '#8FA3BF', marginTop: 3 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* POLICY */}
        <div style={{ padding: '16px 20px', borderRadius: 14, border: '1px solid rgba(255,193,7,0.2)', backgroundColor: 'rgba(255,193,7,0.05)', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Shield style={{ width: 16, height: 16, color: '#ffc107', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#ffd54f', marginBottom: 4 }}>Philanthropist Policy</p>
              <p style={{ fontSize: 12, color: '#8FA3BF', lineHeight: 1.7, margin: 0 }}>
                You are only permitted to charge beneficiaries <strong style={{ color: 'white' }}>$1 USD equivalent</strong> in local fiat currency.
                Each activation costs <strong style={{ color: '#67e8f9' }}>{ACT_PER_ACTIVATION} ACT</strong> from your balance.
                Refill with <strong style={{ color: 'white' }}>${REFILL_COST_USD} USDT</strong> to receive <strong style={{ color: '#00B894' }}>{REFILL_ACT_AMOUNT} ACT</strong>.
                <strong style={{ color: '#ff6b6b' }}> Overcharging results in immediate removal.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* ACTIVATE BY EMAIL */}
        <ActivateByEmail
          userId={user?.id || ''}
          actBalance={actBalance}
          totalActivated={totalActivated}
          onSuccess={(newBal, newTotal, name) => {
            setActBalance(newBal);
            setTotalActivated(newTotal);
            showToast(`✅ ${name} activated successfully! −${ACT_PER_ACTIVATION} ACT deducted. Balance: ${newBal} ACT`, 'success');
            loadAll();
          }}
          onError={(msg) => showToast(`❌ ${msg}`, 'error')}
          onLowBalance={() => setShowRefill(true)}
        />

        {/* PENDING QUEUE */}
        <div style={{ borderRadius: 18, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden', marginTop: 20 }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users style={{ width: 16, height: 16, color: '#00CEC9' }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>Pending Beneficiaries</h2>
            {pendingUsers.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 12, padding: '3px 10px', borderRadius: 999, backgroundColor: 'rgba(255,193,7,0.15)', color: '#ffc107', fontWeight: 700, border: '1px solid rgba(255,193,7,0.3)' }}>
                {pendingUsers.length} pending
              </span>
            )}
          </div>

          {pendingUsers.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <CheckCircle style={{ width: 44, height: 44, color: '#00B894', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, color: 'white', fontWeight: 600, marginBottom: 4 }}>Queue is empty!</p>
              <p style={{ fontSize: 13, color: '#8FA3BF' }}>No pending beneficiary activations at this time.</p>
            </div>
          ) : (
            <div>
              {pendingUsers.map((item, i) => {
                const u = item.users;
                const name = u?.full_name || 'No name';
                const email = u?.email || '—';
                const country = u?.country || null;
                const uid = u?.id || item.user_id;
                const isActivating = activating === uid;
                const canActivate = actBalance >= ACT_PER_ACTIVATION;
                return (
                  <div key={item.id} style={{ padding: '16px 20px', borderBottom: i < pendingUsers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                    {u?.profile_picture ? (
                      <img src={u.profile_picture} alt={name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,206,201,0.25)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(0,206,201,0.2)' }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#00CEC9' }}>{(name[0] || 'U').toUpperCase()}</span>
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: '#8FA3BF', display: 'flex', alignItems: 'center', gap: 4 }}><Mail style={{ width: 11, height: 11 }} />{email}</span>
                        {country && <span style={{ fontSize: 12, color: '#8FA3BF', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin style={{ width: 11, height: 11 }} />{country}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <button
                        onClick={() => handleActivateFromQueue(item)}
                        disabled={isActivating || !canActivate}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: !canActivate ? 'rgba(255,107,107,0.15)' : isActivating ? 'rgba(0,184,148,0.3)' : 'linear-gradient(to right, #00B894, #00CEC9)', color: !canActivate ? '#ff6b6b' : 'white', fontWeight: 700, fontSize: 13, border: !canActivate ? '1px solid rgba(255,107,107,0.3)' : 'none', cursor: (isActivating || !canActivate) ? 'not-allowed' : 'pointer' }}
                      >
                        {isActivating
                          ? <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          : <CheckCircle style={{ width: 13, height: 13 }} />}
                        {isActivating ? 'Activating...' : canActivate ? 'Activate' : 'No ACT'}
                      </button>
                      {canActivate && <span style={{ fontSize: 10, color: '#8FA3BF' }}>−{ACT_PER_ACTIVATION} ACT</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Activate by Email ─────────────────────────────────────────────────────────
function ActivateByEmail({ userId, actBalance, totalActivated, onSuccess, onError, onLowBalance }: {
  userId: string;
  actBalance: number;
  totalActivated: number;
  onSuccess: (newBal: number, newTotal: number, name: string) => void;
  onError: (msg: string) => void;
  onLowBalance: () => void;
}) {
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [activating, setActivating] = useState(false);
  const [foundUser, setFoundUser] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);

  const searchUser = async () => {
    if (!email.trim()) return;
    setSearching(true); setFoundUser(null); setNotFound(false);
    try {
      const { data: u } = await supabase.from('users').select('*').ilike('email', email.trim()).single();
      if (!u) { setNotFound(true); return; }
      const { data: act } = await supabase.from('beneficiary_activations').select('*').eq('user_id', u.id).maybeSingle();
      setFoundUser({ ...u, activation: act });
    } catch { setNotFound(true); }
    finally { setSearching(false); }
  };

  const handleActivate = async () => {
    if (!foundUser || !userId) return;
    if (foundUser.activation?.payment_status === 'verified') {
      onError('This account is already activated.');
      return;
    }
    if (actBalance < ACT_PER_ACTIVATION) {
      onError(`Insufficient ACT balance. Need ${ACT_PER_ACTIVATION} ACT.`);
      onLowBalance();
      return;
    }

    setActivating(true);
    try {
      // 1. Activate or create activation record
      if (foundUser.activation) {
        const { error } = await supabase
          .from('beneficiary_activations')
          .update({ payment_status: 'verified', activation_method: 'philanthropist', activated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('user_id', foundUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('beneficiary_activations')
          .insert({ user_id: foundUser.id, payment_status: 'verified', activation_method: 'philanthropist', activated_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        if (error) throw error;
      }

      // 2. Deduct ACT — using passed-in live values
      const { newBalance, newTotal } = await deductACT(userId, actBalance, totalActivated);

      const name = foundUser.full_name || foundUser.email;
      onSuccess(newBalance, newTotal, name);
      setFoundUser(null);
      setEmail('');
    } catch (e: any) {
      onError(`Activation failed: ${e.message}`);
    } finally { setActivating(false); }
  };

  return (
    <div style={{ padding: '22px', borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,206,201,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mail style={{ width: 16, height: 16, color: '#00CEC9' }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: 0 }}>Activate by Email</p>
          <p style={{ fontSize: 11, color: '#8FA3BF', margin: 0 }}>Search and activate a specific beneficiary by their registered email</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: foundUser || notFound ? 14 : 0 }}>
        <input
          placeholder="Enter beneficiary's registered email address"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFoundUser(null); setNotFound(false); }}
          onKeyDown={(e) => e.key === 'Enter' && searchUser()}
          style={{ flex: 1, padding: '12px 14px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 13, outline: 'none' }}
        />
        <button onClick={searchUser} disabled={searching || !email.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px', borderRadius: 10, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: (searching || !email.trim()) ? 'not-allowed' : 'pointer', opacity: (searching || !email.trim()) ? 0.6 : 1, whiteSpace: 'nowrap' }}>
          <Search style={{ width: 14, height: 14 }} />
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {notFound && (
        <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)' }}>
          <p style={{ fontSize: 13, color: '#ff6b6b', margin: 0 }}>No account found. The user must register first before they can be activated.</p>
        </div>
      )}

      {foundUser && (
        <div style={{ padding: '16px', borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.04)', border: '1px solid rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', gap: 14 }}>
          {foundUser.profile_picture ? (
            <img src={foundUser.profile_picture} alt={foundUser.full_name} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,206,201,0.3)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#00CEC9' }}>{(foundUser.full_name || foundUser.email || 'U')[0].toUpperCase()}</span>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'white', marginBottom: 2 }}>{foundUser.full_name || 'No name set'}</p>
            <p style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 6 }}>{foundUser.email}</p>
            {foundUser.activation?.payment_status === 'verified' ? (
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, backgroundColor: 'rgba(0,184,148,0.15)', color: '#00B894', border: '1px solid rgba(0,184,148,0.3)', fontWeight: 600 }}>✓ Already Active</span>
            ) : (
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, backgroundColor: 'rgba(255,193,7,0.15)', color: '#ffc107', border: '1px solid rgba(255,193,7,0.3)', fontWeight: 600 }}>Not Activated</span>
            )}
          </div>
          {foundUser.activation?.payment_status !== 'verified' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <button
                onClick={handleActivate}
                disabled={activating || actBalance < ACT_PER_ACTIVATION}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 20px', borderRadius: 10, background: actBalance < ACT_PER_ACTIVATION ? 'rgba(255,107,107,0.15)' : 'linear-gradient(to right, #00B894, #00CEC9)', color: actBalance < ACT_PER_ACTIVATION ? '#ff6b6b' : 'white', fontWeight: 700, fontSize: 13, border: actBalance < ACT_PER_ACTIVATION ? '1px solid rgba(255,107,107,0.3)' : 'none', cursor: (activating || actBalance < ACT_PER_ACTIVATION) ? 'not-allowed' : 'pointer', opacity: activating ? 0.7 : 1 }}
              >
                {activating
                  ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Activating...</>
                  : <><CheckCircle style={{ width: 15, height: 15 }} /> Activate</>}
              </button>
              <span style={{ fontSize: 10, color: '#8FA3BF' }}>costs {ACT_PER_ACTIVATION} ACT</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Refill Modal ──────────────────────────────────────────────────────────────
function RefillModal({ onClose, onSuccess, userId, currentBalance }: {
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
  userId: string;
  currentBalance: number;
}) {
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const copyWallet = () => {
    navigator.clipboard.writeText(WALLET_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    const cleanHash = txHash.trim().toLowerCase();
    if (!cleanHash) { setError('Please paste your transaction hash.'); return; }
    if (!/^0x[a-f0-9]{64}$/.test(cleanHash)) { setError('Invalid hash format. Must start with 0x followed by 64 characters.'); return; }

    setLoading(true); setError('');
    try {
      // Check hash not already used for refill
      const { data: already } = await supabase
        .from('philanthropists')
        .select('id')
        .eq('last_refill_hash', cleanHash)
        .maybeSingle();
      if (already) { setError('This transaction has already been used for a refill.'); setLoading(false); return; }

      // Try multiple BSC RPC endpoints
      const rpcs = [
        'https://bsc-dataseed1.binance.org/',
        'https://bsc-dataseed2.binance.org/',
        'https://bsc-dataseed1.defibit.io/',
      ];

      let receipt = null;
      for (const rpc of rpcs) {
        try {
          const res = await fetch(rpc, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getTransactionReceipt', params: [cleanHash] }),
          });
          const data = await res.json();
          if (data.result) { receipt = data.result; break; }
        } catch { continue; }
      }

      if (!receipt) { setError('Transaction not found. Check the hash and ensure it is confirmed on BSC.'); setLoading(false); return; }
      if (receipt.status !== '0x1') { setError('Transaction failed on blockchain. Use a successful transaction.'); setLoading(false); return; }

      const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
      const YOUR_WALLET = WALLET_ADDRESS.toLowerCase();
      const MIN_AMOUNT = 65;

      let verified = false;
      let foundAmount = 0;
      for (const log of receipt.logs || []) {
        if (
          log.address?.toLowerCase() === USDT_CONTRACT &&
          log.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC &&
          log.topics?.length >= 3
        ) {
          const toAddress = '0x' + log.topics[2].slice(26).toLowerCase();
          if (toAddress === YOUR_WALLET) {
            const rawBig = BigInt(log.data);
            let amount = Number(rawBig) / 1e18;
            if (amount < 0.000001) amount = Number(rawBig) / 1e6;
            foundAmount = amount;
            if (amount >= MIN_AMOUNT) { verified = true; break; }
            else { setError(`Amount too low: ${amount.toFixed(2)} USDT. Required: $${REFILL_COST_USD}.`); setLoading(false); return; }
          }
        }
      }

      if (!verified) { setError(`No USDT transfer of $${REFILL_COST_USD}+ to our wallet found. Check you sent to the correct address.`); setLoading(false); return; }

      // Credit ACT
      const newBalance = currentBalance + REFILL_ACT_AMOUNT;
      const newBalance = currentBalance + REFILL_ACT_AMOUNT;
      // Try user_id first, fallback to id
      const { data: refillRows } = await supabase
        .from("philanthropists")
        .update({ act_balance: newBalance, last_refill_hash: cleanHash, last_refill_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .select("id");
      if (!refillRows || refillRows.length === 0) {
        const { error: dbErr2 } = await supabase
          .from("philanthropists")
          .update({ act_balance: newBalance, last_refill_hash: cleanHash, last_refill_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", userId);
        if (dbErr2) throw dbErr2;
      }

      onSuccess(newBalance);
    } catch (e: any) {
      setError('Verification failed: ' + (e.message || 'Please try again.'));
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 200, backdropFilter: 'blur(6px)' }}>
      <div style={{ width: '100%', maxWidth: 520, backgroundColor: '#0F1F35', border: '1px solid rgba(0,206,201,0.2)', borderRadius: 22, padding: 28, boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(to right, #00B894, #00CEC9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw style={{ width: 18, height: 18, color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'white', margin: 0 }}>Refill ACT Balance</h2>
              <p style={{ fontSize: 11, color: '#8FA3BF', margin: 0 }}>+{REFILL_ACT_AMOUNT} ACT for ${REFILL_COST_USD} USDT · Current: {currentBalance} ACT</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', color: '#8FA3BF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          {/* Step 1 */}
          <div style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.04)', border: '1px solid rgba(0,206,201,0.12)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#00CEC9', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(to right, #00CEC9, #00B894)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'white', flexShrink: 0 }}>1</span>
              Send exactly ${REFILL_COST_USD} USDT (BEP20) to:
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', backgroundColor: '#0A1628', borderRadius: 8, border: '1px solid rgba(0,206,201,0.15)' }}>
              <code style={{ fontSize: 11, color: '#67e8f9', flex: 1, wordBreak: 'break-all' }}>{WALLET_ADDRESS}</code>
              <button onClick={copyWallet} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#00B894' : '#67e8f9', flexShrink: 0, padding: 0 }}>
                {copied ? <CheckCircle style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#ffc107', marginTop: 8, marginBottom: 0 }}>⚠️ Only BNB Smart Chain (BEP20). Other networks = lost funds.</p>
          </div>

          {/* Step 2 */}
          <div style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: 'rgba(0,184,148,0.04)', border: '1px solid rgba(0,184,148,0.12)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#00B894', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(to right, #00B894, #00CEC9)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'white', flexShrink: 0 }}>2</span>
              Paste your BSC transaction hash:
            </p>
            <input
              placeholder="0x... paste transaction hash here"
              value={txHash}
              onChange={(e) => { setTxHash(e.target.value); setError(''); }}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 8, backgroundColor: '#0A1628', border: `1px solid ${error ? 'rgba(255,107,107,0.4)' : 'rgba(0,206,201,0.2)'}`, color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
            {error && <p style={{ fontSize: 12, color: '#ff6b6b', marginTop: 6, marginBottom: 0 }}>{error}</p>}
          </div>
        </div>

        <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: 'rgba(0,184,148,0.06)', border: '1px solid rgba(0,184,148,0.15)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Award style={{ width: 16, height: 16, color: '#00B894', flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#8FA3BF', margin: 0 }}>
            You will receive <strong style={{ color: '#00B894' }}>{REFILL_ACT_AMOUNT} ACT</strong> — enough to activate <strong style={{ color: 'white' }}>{REFILL_ACT_AMOUNT / ACT_PER_ACTIVATION} beneficiaries</strong>. New balance will be <strong style={{ color: '#67e8f9' }}>{currentBalance + REFILL_ACT_AMOUNT} ACT</strong>.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !txHash.trim()}
          style={{ width: '100%', padding: '14px', borderRadius: 12, background: (loading || !txHash.trim()) ? 'rgba(0,206,201,0.15)' : 'linear-gradient(to right, #00B894, #00CEC9)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: (loading || !txHash.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {loading
            ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Verifying on blockchain...</>
            : <><RefreshCw style={{ width: 18, height: 18 }} />Verify & Refill {REFILL_ACT_AMOUNT} ACT</>}
        </button>
      </div>
    </div>
  );
}