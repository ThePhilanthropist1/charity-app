'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, UserPlus, Eye, EyeOff, ChevronDown, Search } from 'lucide-react';

// ── All countries of the world ────────────────────────────────────────────────
const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda',
  'Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain',
  'Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia',
  'Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso',
  'Burundi','Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic',
  'Chad','Chile','China','Colombia','Comoros','Congo (Brazzaville)',
  'Congo (Kinshasa)','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic',
  'Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt',
  'El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia',
  'Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana',
  'Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti',
  'Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland',
  'Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati',
  'Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya',
  'Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia',
  'Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico',
  'Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique',
  'Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua',
  'Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan',
  'Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines',
  'Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis',
  'Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino',
  'Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles',
  'Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia',
  'South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan',
  'Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania',
  'Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia',
  'Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates',
  'United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City',
  'Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

// ── Country selector component ────────────────────────────────────────────────
function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState('');

  const filtered = COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: 10, backgroundColor: '#0A1628', border: `1px solid ${open ? 'rgba(0,206,201,0.5)' : 'rgba(0,206,201,0.2)'}`, color: value ? 'white' : '#4A5568', fontSize: 14, cursor: 'pointer', userSelect: 'none', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{value || 'Select your country'}</span>
        <ChevronDown style={{ width: 16, height: 16, color: '#8FA3BF', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, backgroundColor: '#0F1F35', border: '1px solid rgba(0,206,201,0.25)', borderRadius: 12, marginTop: 4, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
          {/* Search */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search style={{ width: 14, height: 14, color: '#8FA3BF', flexShrink: 0 }} />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search country..."
              onClick={e => e.stopPropagation()}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: 13 }}
            />
          </div>
          {/* List */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <p style={{ padding: '12px 16px', fontSize: 13, color: '#8FA3BF', margin: 0 }}>No country found</p>
            ) : filtered.map(c => (
              <div key={c}
                onClick={() => { onChange(c); setOpen(false); setSearch(''); }}
                style={{ padding: '10px 16px', fontSize: 14, color: value === c ? '#00CEC9' : 'white', cursor: 'pointer', backgroundColor: value === c ? 'rgba(0,206,201,0.08)' : 'transparent', fontWeight: value === c ? 700 : 400 }}
                onMouseEnter={e => { if (value !== c) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (value !== c) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}>
                {c}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Input component ───────────────────────────────────────────────────────────
function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#ff6b6b' }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: '#8FA3BF', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', required }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <input
      type={type} value={value} required={required}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: '100%', padding: '12px 16px', borderRadius: 10, backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
      onFocus={e => (e.target.style.borderColor = 'rgba(0,206,201,0.5)')}
      onBlur={e  => (e.target.style.borderColor = 'rgba(0,206,201,0.2)')}
    />
  );
}

// ── MAIN FORM ─────────────────────────────────────────────────────────────────
export function RegistrationForm({ defaultRole = 'beneficiary' }: { defaultRole?: string }) {
  const router = useRouter();

  // Personal info
  const [fullName,   setFullName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [country,    setCountry]    = useState('');
  const [state,      setState]      = useState('');
  const [city,       setCity]       = useState('');
  const [dob,        setDob]        = useState('');
  const [gender,     setGender]     = useState('');
  const [occupation, setOccupation] = useState('');
  const [password,   setPassword]   = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [showCPw,    setShowCPw]    = useState(false);
  const [agreed,     setAgreed]     = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [step,       setStep]       = useState(1); // 1 = personal, 2 = account

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    backgroundColor: '#0A1628', border: '1px solid rgba(0,206,201,0.2)',
    color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  };

  const validateStep1 = () => {
    if (!fullName.trim())   { setError('Please enter your full name.'); return false; }
    if (!phone.trim())      { setError('Please enter your phone number.'); return false; }
    if (!country)           { setError('Please select your country.'); return false; }
    if (!state.trim())      { setError('Please enter your state or region.'); return false; }
    if (!city.trim())       { setError('Please enter your city.'); return false; }
    if (!gender)            { setError('Please select your gender.'); return false; }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStep1()) setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreed) { setError('You must agree to the Terms of Service before registering.'); return; }
    if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    if (password.length < 8)   { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email,
          password,
          role: 'beneficiary',
          full_name:  fullName.trim(),
          phone:      phone.trim(),
          country,
          state:      state.trim(),
          city:       city.trim(),
          date_of_birth: dob || null,
          gender:     gender || null,
          occupation: occupation.trim() || null,
        }),
      });
      const result = await response.json();
      if (result.success) {
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('auth_user', JSON.stringify(result.data.user));
        router.push('/beneficiary/activation');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Progress indicator
  const Progress = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
      {[1, 2].map((s) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: s < 2 ? 1 : 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, backgroundColor: step >= s ? (step > s ? '#00B894' : '#00CEC9') : 'rgba(255,255,255,0.06)', color: step >= s ? '#020C1B' : '#8FA3BF', border: step >= s ? 'none' : '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s', flexShrink: 0 }}>
            {step > s ? '✓' : s}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: step >= s ? 'white' : '#4A5568' }}>
            {s === 1 ? 'Personal Info' : 'Account Setup'}
          </span>
          {s < 2 && <div style={{ flex: 1, height: 2, backgroundColor: step > s ? '#00B894' : 'rgba(255,255,255,0.08)', borderRadius: 1, transition: 'all 0.2s' }} />}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 4 }}>Create Account</h1>
        <p style={{ fontSize: 13, color: '#8FA3BF' }}>Join the Charity Token community</p>
      </div>

      <Progress />

      {/* DISCLAIMER */}
      <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.2)', marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: '#ffd54f', fontWeight: 700, marginBottom: 4 }}>⚠️ Important Notice</p>
        <p style={{ fontSize: 11, color: '#8FA3BF', lineHeight: 1.7, margin: 0 }}>
          This is <strong style={{ color: 'white' }}>not an investment scheme</strong>. The $1 activation fee is a community support contribution. Charity Token does not yet exist and will only be issued after all required licences are obtained. No returns are guaranteed.
        </p>
      </div>

      {error && (
        <div style={{ display: 'flex', gap: 10, padding: '12px 14px', backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, marginBottom: 16 }}>
          <AlertCircle style={{ width: 16, height: 16, color: '#ff6b6b', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#ffb3b3', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* ── STEP 1: PERSONAL INFO ── */}
      {step === 1 && (
        <div>
          <Field label="Full Name" required hint="Enter your legal name as it will appear on your ID card">
            <TextInput value={fullName} onChange={setFullName} placeholder="e.g. Amaka Okonkwo" required />
          </Field>

          <Field label="Phone Number" required hint="Include country code e.g. +234 801 234 5678">
            <TextInput value={phone} onChange={setPhone} placeholder="+234 801 234 5678" type="tel" required />
          </Field>

          <Field label="Country" required>
            <CountrySelect value={country} onChange={setCountry} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="State / Region" required>
              <TextInput value={state} onChange={setState} placeholder="e.g. Lagos" required />
            </Field>
            <Field label="City / Town" required>
              <TextInput value={city} onChange={setCity} placeholder="e.g. Ikeja" required />
            </Field>
          </div>

          <Field label="Gender" required>
            <select
              value={gender} onChange={e => setGender(e.target.value)} required
              style={{ ...inputStyle, appearance: 'none' as any, cursor: 'pointer' }}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Date of Birth" hint="Optional">
              <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }} />
            </Field>
            <Field label="Occupation" hint="Optional">
              <TextInput value={occupation} onChange={setOccupation} placeholder="e.g. Teacher" />
            </Field>
          </div>

          <button type="button" onClick={handleNext}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(to right,#00CEC9,#00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,206,201,0.25)', marginTop: 4 }}>
            Next — Account Setup →
          </button>
        </div>
      )}

      {/* ── STEP 2: ACCOUNT SETUP ── */}
      {step === 2 && (
        <form onSubmit={handleRegister}>

          <Field label="Email Address" required>
            <TextInput value={email} onChange={setEmail} placeholder="you@example.com" type="email" required />
          </Field>

          <Field label="Password" required hint="Minimum 8 characters">
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={e => (e.target.style.borderColor = 'rgba(0,206,201,0.5)')}
                onBlur={e  => (e.target.style.borderColor = 'rgba(0,206,201,0.2)')} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8FA3BF', padding: 0 }}>
                {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </Field>

          <Field label="Confirm Password" required>
            <div style={{ position: 'relative' }}>
              <input type={showCPw ? 'text' : 'password'} value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" required
                style={{ ...inputStyle, paddingRight: 44, borderColor: confirmPw && confirmPw !== password ? 'rgba(255,107,107,0.5)' : 'rgba(0,206,201,0.2)' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(0,206,201,0.5)')}
                onBlur={e  => (e.target.style.borderColor = confirmPw !== password ? 'rgba(255,107,107,0.5)' : 'rgba(0,206,201,0.2)')} />
              <button type="button" onClick={() => setShowCPw(v => !v)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8FA3BF', padding: 0 }}>
                {showCPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
            {confirmPw && confirmPw !== password && (
              <p style={{ fontSize: 11, color: '#ff6b6b', marginTop: 4 }}>Passwords do not match</p>
            )}
          </Field>

          {/* Summary of personal info */}
          <div style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.04)', border: '1px solid rgba(0,206,201,0.15)', marginBottom: 18 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#00CEC9', margin: '0 0 10px' }}>📋 Your Details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                ['Name', fullName], ['Phone', phone], ['Country', country],
                ['State', state], ['City', city], ['Gender', gender],
              ].map(([k, v]) => (
                <div key={k}>
                  <span style={{ fontSize: 11, color: '#4A5568' }}>{k}: </span>
                  <span style={{ fontSize: 11, color: '#8FA3BF', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => { setStep(1); setError(''); }}
              style={{ fontSize: 11, color: '#00CEC9', background: 'none', border: 'none', cursor: 'pointer', marginTop: 8, padding: 0, textDecoration: 'underline' }}>
              ← Edit personal info
            </button>
          </div>

          {/* Terms */}
          <div
            onClick={() => setAgreed(v => !v)}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 12, backgroundColor: agreed ? 'rgba(0,184,148,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${agreed ? 'rgba(0,184,148,0.3)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', marginBottom: 20, userSelect: 'none' }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${agreed ? '#00B894' : 'rgba(255,255,255,0.2)'}`, backgroundColor: agreed ? '#00B894' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              {agreed && <span style={{ color: 'white', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </div>
            <p style={{ fontSize: 12, color: '#8FA3BF', lineHeight: 1.7, margin: 0 }}>
              I have read and agree to the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#67e8f9', textDecoration: 'underline' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#67e8f9', textDecoration: 'underline' }}>Privacy Policy</a>.
              {' '}I understand the $1 activation fee is a <strong style={{ color: 'white' }}>community support contribution</strong>, not an investment. No returns are guaranteed.
            </p>
          </div>

          <button type="submit" disabled={loading || !agreed}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: (!agreed || loading) ? 'rgba(0,206,201,0.2)' : 'linear-gradient(to right,#00CEC9,#00B894)', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: (!agreed || loading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: agreed ? '0 8px 24px rgba(0,206,201,0.25)' : 'none', transition: 'all 0.2s' }}>
            {loading
              ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Creating account...</>
              : <><UserPlus style={{ width: 18, height: 18 }} /> Create Account</>
            }
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </form>
      )}

      <div style={{ borderTop: '1px solid rgba(0,206,201,0.15)', marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#8FA3BF' }}>
          Already have an account?{' '}
          <button onClick={() => router.push('/login')} style={{ color: '#67e8f9', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}