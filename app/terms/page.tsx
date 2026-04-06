import Image from 'next/image';
import Link from 'next/link';

export default function TermsPage() {
  const lastUpdated = 'April 6, 2026';

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 4, height: 20, backgroundColor: '#00CEC9', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
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
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(0,206,201,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* HEADER */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image src="/Charity token logo.jpg" alt="Charity Token" width={32} height={32} style={{ borderRadius: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>Charity Token</span>
          </Link>
          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
            <Link href="/privacy" style={{ color: '#8FA3BF', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/beneficiary-dashboard" style={{ color: '#67e8f9', textDecoration: 'none' }}>Dashboard</Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px', position: 'relative', zIndex: 10 }}>

        {/* TITLE */}
        <div style={{ marginBottom: 48, paddingBottom: 32, borderBottom: '1px solid rgba(0,206,201,0.15)' }}>
          <p style={{ fontSize: 11, color: '#00CEC9', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Legal</p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, marginBottom: 12, background: 'linear-gradient(to right, white, #8FA3BF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 14, color: '#8FA3BF', lineHeight: 1.7 }}>
            Please read these terms carefully before using the Charity Token platform. By registering or using our services, you agree to be bound by these terms.
          </p>
          <p style={{ fontSize: 12, color: '#4A5568', marginTop: 12 }}>Last updated: {lastUpdated}</p>
        </div>

        <Section title="1. About Charity Token Project">
          {p('Charity Token Project is a global, community-driven humanitarian initiative designed to empower one million beneficiaries with monthly token distributions over a ten-year period starting in 2027. We are not a registered financial institution and do not offer investment products.')}
          {p('The platform is operated on a voluntary, mission-driven basis. Charity Token (CT) is a utility token intended for community participation and does not represent equity, debt, or ownership in any entity.')}
        </Section>

        <Section title="2. Eligibility">
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {[
              'You must be at least 18 years of age to register and use this platform.',
              'You must provide accurate and truthful information during registration.',
              'You must not use the platform for any illegal, fraudulent, or harmful purpose.',
              'You are responsible for maintaining the security of your account credentials.',
              'One account per person is permitted. Duplicate accounts may be removed without notice.',
            ].map(li)}
          </ul>
        </Section>

        <Section title="3. Account Activation">
          {p('To receive monthly token distributions, your account must be activated. Activation requires a one-time payment equivalent to approximately $1 USD, payable via one of the following methods:')}
          <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
            {['USDT (BEP20) transferred directly to our designated wallet address.', 'Payment to a verified regional Philanthropist in your local currency.', 'Pi Network payment (coming soon — subject to pricing system launch).'].map(li)}
          </ul>
          {p('Activation fees are non-refundable. Once activated, your account will be eligible to receive 500 Charity Tokens monthly starting from the first distribution cycle in 2027.')}
        </Section>

        <Section title="4. Philanthropist Programme">
          {p('Philanthropists are approved community members who facilitate account activations for beneficiaries in their region. By applying to become a Philanthropist, you agree to:')}
          <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
            {[
              'Charge beneficiaries no more than $1 USD equivalent in local fiat currency.',
              'Process all activation requests within 24 hours of receiving payment.',
              'Never solicit additional payments beyond the approved activation fee.',
              'Maintain accurate records of all activations you process.',
              'Submit to KYC verification before being granted Philanthropist status.',
            ].map(li)}
          </ul>
          {p('Violation of these obligations — including overcharging beneficiaries — will result in immediate removal of Philanthropist status and forfeiture of any ACT token balance without compensation.')}
        </Section>

        <Section title="5. Token Distribution">
          {p('Monthly distributions of 500 Charity Tokens (CT) are scheduled to begin in 2027, subject to platform readiness and smart contract deployment. Distribution timelines may be adjusted with notice to the community.')}
          {p('Charity Token (CT) is a utility token. Its value is determined by community usage and market forces. We make no guarantees regarding the monetary value of CT tokens at any time.')}
        </Section>

        <Section title="6. Prohibited Conduct">
          {p('You agree not to engage in any of the following:')}
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {[
              'Creating multiple accounts to claim additional token allocations.',
              'Providing false identity information during registration or KYC.',
              'Attempting to exploit, hack, or interfere with platform functionality.',
              'Selling, transferring, or trading activation slots to other users.',
              'Using automated bots or scripts to interact with the platform.',
              'Impersonating Charity Token Project staff or verified Philanthropists.',
            ].map(li)}
          </ul>
        </Section>

        <Section title="7. Intellectual Property">
          {p('All platform content — including logos, designs, text, and code — is the property of Charity Token Project. You may not reproduce, distribute, or create derivative works from our content without prior written permission.')}
        </Section>

        <Section title="8. Disclaimers and Limitation of Liability">
          {p('The platform is provided on an "as is" basis. We do not warrant that the platform will be uninterrupted, error-free, or free of harmful components. To the maximum extent permitted by applicable law, Charity Token Project shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.')}
          {p('We are not responsible for losses resulting from incorrect wallet addresses provided by users, or from transactions made outside of the platform.')}
        </Section>

        <Section title="9. Modifications to Terms">
          {p('We reserve the right to update these Terms of Service at any time. Continued use of the platform after changes are posted constitutes acceptance of the revised terms. We will notify users of significant changes through the platform or via our Telegram community.')}
        </Section>

        <Section title="10. Contact">
          {p('For legal inquiries or questions regarding these terms, please contact us at:')}
          <div style={{ padding: '14px 18px', borderRadius: 12, backgroundColor: 'rgba(0,206,201,0.06)', border: '1px solid rgba(0,206,201,0.2)', marginTop: 8 }}>
            <p style={{ margin: 0, fontSize: 14 }}>
              <strong style={{ color: 'white' }}>Charity Token Project</strong><br />
              <a href="mailto:legal@charitytoken.net" style={{ color: '#67e8f9', textDecoration: 'none' }}>legal@charitytoken.net</a>
            </p>
          </div>
        </Section>

        {/* FOOTER NAV */}
        <div style={{ paddingTop: 32, borderTop: '1px solid rgba(0,206,201,0.15)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ fontSize: 13, color: '#67e8f9', textDecoration: 'none' }}>Privacy Policy →</Link>
          <Link href="/" style={{ fontSize: 13, color: '#8FA3BF', textDecoration: 'none' }}>← Back to Home</Link>
        </div>
      </main>
    </div>
  );
}