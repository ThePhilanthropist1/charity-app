import Image from 'next/image';
import Link from 'next/link';

export default function PrivacyPage() {
  const lastUpdated = 'April 6, 2026';

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 4, height: 20, backgroundColor: '#00B894', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
        {title}
      </h2>
      <div style={{ fontSize: 14, color: '#8FA3BF', lineHeight: 1.8 }}>{children}</div>
    </div>
  );

  const p = (text: string) => <p style={{ marginBottom: 10 }}>{text}</p>;
  const li = (text: string, i: number) => (
    <li key={i} style={{ marginBottom: 8, paddingLeft: 8 }}>{text}</li>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(0,184,148,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* HEADER */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image src="/Charity token logo.jpg" alt="Charity Token" width={32} height={32} style={{ borderRadius: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>Charity Token</span>
          </Link>
          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
            <Link href="/terms" style={{ color: '#8FA3BF', textDecoration: 'none' }}>Terms of Service</Link>
            <Link href="/beneficiary-dashboard" style={{ color: '#67e8f9', textDecoration: 'none' }}>Dashboard</Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px', position: 'relative', zIndex: 10 }}>

        {/* TITLE */}
        <div style={{ marginBottom: 48, paddingBottom: 32, borderBottom: '1px solid rgba(0,184,148,0.15)' }}>
          <p style={{ fontSize: 11, color: '#00B894', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Legal</p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, marginBottom: 12, background: 'linear-gradient(to right, white, #8FA3BF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: '#8FA3BF', lineHeight: 1.7 }}>
            Your privacy matters to us. This policy explains what data we collect, how we use it, and the rights you have over your personal information.
          </p>
          <p style={{ fontSize: 12, color: '#4A5568', marginTop: 12 }}>Last updated: {lastUpdated}</p>
        </div>

        <Section title="1. Information We Collect">
          {p('When you register and use the Charity Token platform, we collect the following categories of information:')}
          <p style={{ fontWeight: 600, color: '#67e8f9', marginBottom: 6, marginTop: 12 }}>Information you provide directly:</p>
          <ul style={{ paddingLeft: 20, margin: '0 0 14px' }}>
            {['Email address', 'Full name', 'Country and phone number (optional)', 'Profile picture (optional)', 'Government-issued ID and face capture (for Philanthropist KYC only)'].map(li)}
          </ul>
          <p style={{ fontWeight: 600, color: '#67e8f9', marginBottom: 6 }}>Information collected automatically:</p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {['Browser and device type', 'IP address and approximate location', 'Pages visited and time spent on the platform', 'Blockchain transaction hashes you submit for verification'].map(li)}
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          {p('We use the information we collect for the following purposes:')}
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {[
              'To create and manage your account.',
              'To verify your identity and process account activation.',
              'To review and approve Philanthropist KYC applications.',
              'To distribute monthly Charity Token allocations to verified beneficiaries.',
              'To communicate important platform updates and announcements.',
              'To detect and prevent fraud, abuse, and policy violations.',
              'To improve platform performance and user experience.',
            ].map(li)}
          </ul>
        </Section>

        <Section title="3. Data Storage and Security">
          {p('Your data is stored securely using Supabase, a cloud database provider with enterprise-grade encryption at rest and in transit. We implement industry-standard security measures including:')}
          <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
            {['HTTPS encryption for all data transmissions.', 'Row-level security (RLS) to ensure users can only access their own data.', 'Hashed password storage — we never store your password in plain text.', 'Authentication tokens with expiration to limit session risk.'].map(li)}
          </ul>
          {p('While we take all reasonable measures to protect your data, no system is completely impenetrable. We encourage you to use a strong, unique password for your account.')}
        </Section>

        <Section title="4. Sharing Your Information">
          {p('We do not sell, rent, or trade your personal information to third parties. We may share your information only in the following limited circumstances:')}
          <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
            {[
              'With Philanthropists — your registered email address is visible to Philanthropists when they process your activation request.',
              'With service providers — such as Supabase (database) and Netlify (hosting), who process data on our behalf under strict confidentiality obligations.',
              'When required by law — if we are legally compelled to disclose information by a court order or regulatory authority.',
            ].map(li)}
          </ul>
          {p('We will never share your government ID or face capture documents with any third party outside of the internal KYC review process.')}
        </Section>

        <Section title="5. Cookies and Tracking">
          {p('We use minimal cookies and local browser storage strictly for platform functionality, including maintaining your login session and remembering your preferences (such as whether you have dismissed the Telegram community popup).')}
          {p('We do not use advertising cookies, third-party tracking pixels, or analytics tools that share your data with advertisers.')}
        </Section>

        <Section title="6. Your Rights">
          {p('Regardless of where you are located, you have the following rights over your personal data:')}
          <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
            {[
              'Right to access — you can request a copy of the personal data we hold about you.',
              'Right to correction — you can update your personal information at any time via your profile settings.',
              'Right to deletion — you can request that your account and associated data be permanently deleted.',
              'Right to data portability — you can request your data in a readable format.',
              'Right to withdraw consent — where processing is based on consent, you may withdraw it at any time.',
            ].map(li)}
          </ul>
          {p('To exercise any of these rights, please contact us at legal@charitytoken.net. We will respond within 30 days.')}
        </Section>

        <Section title="7. Data Retention">
          {p('We retain your personal information for as long as your account is active or as needed to provide our services. If you request account deletion, we will remove your personal data within 30 days, except where retention is required by law.')}
          {p('KYC documents (government ID and face capture) are retained for the minimum period required to fulfill our verification obligations, after which they are permanently deleted.')}
        </Section>

        <Section title="8. Children's Privacy">
          {p('The Charity Token platform is not directed at individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has registered on our platform, please contact us immediately and we will remove the account.')}
        </Section>

        <Section title="9. Changes to This Policy">
          {p('We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. For significant changes, we will notify users through the platform or via our Telegram community channel. Continued use of the platform after changes constitutes acceptance of the revised policy.')}
        </Section>

        <Section title="10. Contact Us">
          {p('If you have any questions, concerns, or requests related to this Privacy Policy or your personal data, please reach out to us:')}
          <div style={{ padding: '14px 18px', borderRadius: 12, backgroundColor: 'rgba(0,184,148,0.06)', border: '1px solid rgba(0,184,148,0.2)', marginTop: 8 }}>
            <p style={{ margin: 0, fontSize: 14 }}>
              <strong style={{ color: 'white' }}>Charity Token Project — Privacy Team</strong><br />
              <a href="mailto:legal@charitytoken.net" style={{ color: '#67e8f9', textDecoration: 'none' }}>legal@charitytoken.net</a>
            </p>
          </div>
        </Section>

        {/* FOOTER NAV */}
        <div style={{ paddingTop: 32, borderTop: '1px solid rgba(0,184,148,0.15)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/terms" style={{ fontSize: 13, color: '#67e8f9', textDecoration: 'none' }}>Terms of Service →</Link>
          <Link href="/" style={{ fontSize: 13, color: '#8FA3BF', textDecoration: 'none' }}>← Back to Home</Link>
        </div>
      </main>
    </div>
  );
}