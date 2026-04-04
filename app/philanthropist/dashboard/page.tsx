'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase-client';
import Image from 'next/image';
import {
  Users, CheckCircle, Clock, LogOut, ArrowLeft,
  Shield, AlertCircle, Home, UserCheck, Mail, MapPin, Phone
} from 'lucide-react';

export default function PhilanthropistDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut, refreshUser } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [activatedCount, setActivatedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'philanthropist' && user.email?.toLowerCase() !== 'dinfadashe@gmail.com') {
      router.push('/beneficiary-dashboard');
      return;
    }
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load pending beneficiary activations (payment_status = pending, via philanthropist)
      const { data: pending } = await supabase
        .from('beneficiary_activations')
        .select(`*, users:user_id (id, full_name, email, country, phone, profile_picture, created_at)`)
        .eq('payment_status', 'pending')
        .eq('activation_method', 'wallet_transfer')
        .order('created_at', { ascending: true });

      // Also get via_philanthropist pending ones
      const { data: pendingPhil } = await supabase
        .from('beneficiary_activations')
        .select(`*, users:user_id (id, full_name, email, country, phone, profile_picture, created_at)`)
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: true });

      setPendingUsers(pendingPhil || []);

      // Count how many this philanthropist has activated
      const { count } = await supabase
        .from('beneficiary_activations')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'verified')
        .eq('activation_method', 'philanthropist');

      setActivatedCount(count || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleActivate = async (activation: any) => {
    const userId = activation.users?.id || activation.user_id;
    if (!userId) return;
    setActivating(userId);
    try {
      const { error } = await supabase
        .from('beneficiary_activations')
        .update({
          payment_status: 'verified',
          activation_method: 'philanthropist',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
      showToast(`${activation.users?.full_name || activation.users?.email} activated successfully!`, 'success');
      await loadData();
    } catch (e: any) {
      showToast('Failed to activate: ' + e.message, 'error');
    } finally { setActivating(null); }
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(0,206,201,0.3)', borderTop: '3px solid #00CEC9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#8FA3BF', fontSize: 14 }}>Loading Philanthropist Dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', color: 'white', fontFamily: 'sans-serif' }}>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, padding: '12px 20px', borderRadius: 12, backgroundColor: toast.type === 'success' ? 'rgba(0,184,148,0.15)' : 'rgba(255,107,107,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(0,184,148,0.4)' : 'rgba(255,107,107,0.4)'}`, color: toast.type === 'success' ? '#00B894' : '#ff6b6b', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          {toast.type === 'success' ? <CheckCircle style={{ width: 16, height: 16 }} /> : <AlertCircle style={{ width: 16, height: 16 }} />}
          {toast.msg}
        </div>
      )}

      {/* BACKGROUND */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(0,206,201,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/Charity token logo.jpg" alt="Charity Token" width={32} height={32} style={{ borderRadius: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>Charity Token</span>
            <span style={{ fontSize: 11, color: '#00B894', backgroundColor: 'rgba(0,184,148,0.15)', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(0,184,148,0.3)', fontWeight: 600 }}>PHILANTHROPIST</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => router.push('/beneficiary-dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(0,206,201,0.2)', color: '#67e8f9', background: 'transparent', cursor: 'pointer' }}>
              <Home style={{ width: 13, height: 13 }} /> My Dashboard
            </button>
            <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', color: '#8FA3BF', background: 'transparent', cursor: 'pointer' }}>
              <LogOut style={{ width: 13, height: 13 }} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '28px 20px 60px', position: 'relative', zIndex: 10 }}>

        {/* TITLE */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, marginBottom: 6 }}>
            Philanthropist Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#8FA3BF' }}>
            Welcome, {user?.full_name?.split(' ')[0] || 'Philanthropist'}. Activate beneficiaries who have paid you and submitted their email.
          </p>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
          <div style={{ padding: '20px', borderRadius: 16, border: '1px solid rgba(255,193,7,0.2)', backgroundColor: 'rgba(255,193,7,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,193,7,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock style={{ width: 20, height: 20, color: '#ffc107' }} />
            </div>
            <div>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#ffc107', lineHeight: 1 }}>{pendingUsers.length}</p>
              <p style={{ fontSize: 12, color: '#8FA3BF', marginTop: 3 }}>Pending Activations</p>
            </div>
          </div>
          <div style={{ padding: '20px', borderRadius: 16, border: '1px solid rgba(0,184,148,0.2)', backgroundColor: 'rgba(0,184,148,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,184,148,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck style={{ width: 20, height: 20, color: '#00B894' }} />
            </div>
            <div>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#00B894', lineHeight: 1 }}>{activatedCount}</p>
              <p style={{ fontSize: 12, color: '#8FA3BF', marginTop: 3 }}>Total Activated</p>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ padding: '16px 20px', borderRadius: 14, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(0,206,201,0.04)', marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield style={{ width: 14, height: 14, color: '#00CEC9' }} /> How to activate a beneficiary
          </p>
          <p style={{ fontSize: 12, color: '#8FA3BF', lineHeight: 1.8, margin: 0 }}>
            When a user pays you $1 equivalent and sends you their email on Telegram, find their account below and click <strong style={{ color: 'white' }}>Activate</strong>. You must activate all submissions within <strong style={{ color: '#ffc107' }}>24 hours</strong>. You can also search for a specific user by their email address.
          </p>
        </div>

        {/* SEARCH + ACTIVATE BY EMAIL */}
        <ManualActivation onActivated={loadData} showToast={showToast} />

        {/* PENDING LIST */}
        <div style={{ borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden', marginTop: 20 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users style={{ width: 16, height: 16, color: '#00CEC9' }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>Pending Beneficiaries</h2>
            {pendingUsers.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 12, padding: '3px 10px', borderRadius: 999, backgroundColor: 'rgba(255,193,7,0.15)', color: '#ffc107', fontWeight: 700, border: '1px solid rgba(255,193,7,0.3)' }}>
                {pendingUsers.length} pending
              </span>
            )}
          </div>

          {pendingUsers.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <CheckCircle style={{ width: 44, height: 44, color: '#00B894', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, color: 'white', fontWeight: 600, marginBottom: 4 }}>All clear!</p>
              <p style={{ fontSize: 13, color: '#8FA3BF' }}>No pending beneficiary activations at this time.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {pendingUsers.map((item, i) => {
                const u = item.users;
                const name = u?.full_name || 'No name';
                const email = u?.email || '—';
                const country = u?.country || '—';
                const isActivating = activating === (u?.id || item.user_id);
                return (
                  <div key={item.id} style={{ padding: '16px 20px', borderBottom: i < pendingUsers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                    {u?.profile_picture ? (
                      <img src={u.profile_picture} alt={name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,206,201,0.3)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(0,206,201,0.2)' }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#00CEC9' }}>{name[0]?.toUpperCase() || 'U'}</span>
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 3 }}>{name}</p>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: '#8FA3BF', display: 'flex', alignItems: 'center', gap: 4 }}><Mail style={{ width: 11, height: 11 }} />{email}</span>
                        {country !== '—' && <span style={{ fontSize: 12, color: '#8FA3BF', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin style={{ width: 11, height: 11 }} />{country}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleActivate(item)}
                      disabled={isActivating}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: isActivating ? 'rgba(0,184,148,0.3)' : 'linear-gradient(to right, #00B894, #00CEC9)', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: isActivating ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                    >
                      {isActivating ? (
                        <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <CheckCircle style={{ width: 14, height: 14 }} />
                      )}
                      {isActivating ? 'Activating...' : 'Activate'}
                    </button>
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

// ── Manual activation by email ────────────────────────────────────────────────
function ManualActivation({ onActivated, showToast }: { onActivated: () => void; showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activating, setActivating] = useState(false);

  const searchUser = async () => {
    if (!email.trim()) return;
    setSearching(true);
    setFoundUser(null);
    setNotFound(false);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email.trim())
        .single();

      if (!userData) { setNotFound(true); return; }

      // Check activation status
      const { data: activation } = await supabase
        .from('beneficiary_activations')
        .select('*')
        .eq('user_id', userData.id)
        .single();

      setFoundUser({ ...userData, activation });
    } catch (e) {
      setNotFound(true);
    } finally { setSearching(false); }
  };

  const handleActivate = async () => {
    if (!foundUser) return;
    setActivating(true);
    try {
      if (foundUser.activation) {
        if (foundUser.activation.payment_status === 'verified') {
          showToast('This account is already activated.', 'error');
          return;
        }
        const { error } = await supabase
          .from('beneficiary_activations')
          .update({ payment_status: 'verified', activation_method: 'philanthropist', updated_at: new Date().toISOString() })
          .eq('user_id', foundUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('beneficiary_activations')
          .insert({ user_id: foundUser.id, payment_status: 'verified', activation_method: 'philanthropist', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        if (error) throw error;
      }
      showToast(`${foundUser.full_name || foundUser.email} activated successfully! ✓`, 'success');
      setFoundUser(null);
      setEmail('');
      onActivated();
    } catch (e: any) {
      showToast('Activation failed: ' + e.message, 'error');
    } finally { setActivating(false); }
  };

  return (
    <div style={{ padding: '20px', borderRadius: 18, border: '1px solid rgba(0,206,201,0.2)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 4 }}>Activate by Email</p>
      <p style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 14 }}>Search for a user by their registered email address to activate them.</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: foundUser || notFound ? 14 : 0 }}>
        <input
          placeholder="Enter user's email address"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFoundUser(null); setNotFound(false); }}
          onKeyDown={(e) => e.key === 'Enter' && searchUser()}
          style={{ flex: 1, padding: '11px 14px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 13, outline: 'none' }}
        />
        <button onClick={searchUser} disabled={searching || !email.trim()} style={{ padding: '11px 20px', borderRadius: 10, background: 'linear-gradient(to right, #00CEC9, #00B894)', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: searching ? 'not-allowed' : 'pointer', opacity: searching ? 0.7 : 1, whiteSpace: 'nowrap' }}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {notFound && (
        <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)' }}>
          <p style={{ fontSize: 13, color: '#ff6b6b', margin: 0 }}>No account found with that email. The user must register first.</p>
        </div>
      )}

      {foundUser && (
        <div style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.04)', border: '1px solid rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', gap: 14 }}>
          {foundUser.profile_picture ? (
            <img src={foundUser.profile_picture} alt={foundUser.full_name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,206,201,0.3)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#00CEC9' }}>{(foundUser.full_name || foundUser.email || 'U')[0].toUpperCase()}</span>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 2 }}>{foundUser.full_name || 'No name'}</p>
            <p style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 2 }}>{foundUser.email}</p>
            {foundUser.activation?.payment_status === 'verified' ? (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, backgroundColor: 'rgba(0,184,148,0.15)', color: '#00B894', border: '1px solid rgba(0,184,148,0.3)', fontWeight: 600 }}>Already Active</span>
            ) : (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, backgroundColor: 'rgba(255,193,7,0.15)', color: '#ffc107', border: '1px solid rgba(255,193,7,0.3)', fontWeight: 600 }}>Not Activated</span>
            )}
          </div>
          {foundUser.activation?.payment_status !== 'verified' && (
            <button onClick={handleActivate} disabled={activating} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(to right, #00B894, #00CEC9)', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: activating ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: activating ? 0.7 : 1 }}>
              {activating ? 'Activating...' : <><CheckCircle style={{ width: 14, height: 14 }} /> Activate</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}