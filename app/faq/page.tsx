'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';

const BENEFICIARY_FAQS = [
  {
    q: 'What is the Charity Token Project?',
    a: 'The Charity Token Project is a blockchain and artificial intelligence community initiative. We are building a community of one million people who believe in emerging technology and want to own a share of it. Our goal is to build AI and blockchain products that will give real-world utility to the CHARITY Token, which will be issued to one million community members once the token is properly launched with all required licences and regulatory approvals in place.',
  },
  {
    q: 'Is this an investment scheme?',
    a: 'No. This is not an investment scheme, an ICO, or any form of financial product. The $1 USD activation fee is a community support contribution that helps fund the building of the platform and ecosystem. We make no guaranteed financial returns. The CHARITY Token does not currently exist and will only be issued after all required regulatory approvals are obtained. Any future value of the token depends entirely on market demand.',
  },
  {
    q: 'Why do I pay $1 to activate my account?',
    a: 'The $1 USD activation fee is a community support contribution — not a purchase of tokens, shares, or any financial instrument. It helps fund the development of the platform, the onboarding infrastructure, and the building of the AI and blockchain products that will give the CHARITY Token its future utility. One dollar. One community. One mission.',
  },
  {
    q: 'Does the CHARITY Token exist yet?',
    a: 'No. The CHARITY Token does not currently exist and has not been issued, deployed, or circulated in any form. It is a future token that will only come to life once we reach one million community members and after all required licences and regulatory approvals have been obtained. We build first, list later.',
  },
  {
    q: 'What is ACT (Activation Token)?',
    a: 'ACT (Activation Token) is an internal administrative mechanism used only by Philanthropists within the platform. It is non-transferable, has no monetary value, cannot be bought, sold, or traded, and will never be listed on any exchange. It exists solely as an internal record to track beneficiary onboarding activities. It is not a cryptocurrency or financial product of any kind.',
  },
  {
    q: 'How do I register?',
    a: 'Visit our website, click "Get Started", enter your email and create a password. You must read and agree to our Terms of Service and community disclaimer before your account is created. After registering, you will be taken to the activation page to complete your setup.',
  },
  {
    q: 'How do I activate my account?',
    a: 'Two options: (1) Direct — Send exactly $1 USDT on BNB Smart Chain (BEP20) to our wallet address and paste your transaction hash on the activation page. Your account is activated immediately. (2) Via Philanthropist — Find a verified Philanthropist in your region, pay $1 USD equivalent in local fiat currency, and they will activate your account within 24 hours.',
  },
  {
    q: 'When will I start receiving CHARITY tokens?',
    a: 'Monthly token distributions are planned to begin in 2027, subject to the CHARITY Token being successfully deployed on a public blockchain and all required licences being obtained. The exact date will be announced to the community. More details are to be announced as the project progresses.',
  },
  {
    q: 'Are the monthly token distributions guaranteed?',
    a: 'No financial returns are guaranteed. What you will receive is 500 CHARITY tokens per month for 10 years once distributions begin. What those tokens are worth in the market will depend entirely on market demand, community size, and the utility of the products we build. We are transparent about this. We believe in the mission — but we will not make promises we cannot guarantee.',
  },
  {
    q: 'How many tokens will I receive in total?',
    a: '500 tokens × 12 months × 10 years = 60,000 CHARITY tokens per beneficiary over the full programme. Across all one million beneficiaries, this is a total planned distribution of 60 billion CHARITY tokens — the most significant sustained token distribution programme in blockchain history, if we achieve our mission.',
  },
  {
    q: 'What is the total CHARITY Token supply?',
    a: 'The planned maximum supply is 100 billion CHARITY tokens, permanently fixed. 60% (60 billion) is reserved for the one million beneficiaries. The remaining 40% covers investors & liquidity (20%), team (10%), marketing & development (5%), and research & development (5%).',
  },
  {
    q: 'My account shows Pending after paying a Philanthropist. What do I do?',
    a: 'Allow up to 24 hours. If more than 24 hours have passed, message your Philanthropist with your payment receipt and registered email. If there is still no response, contact our admin team at legal@charitytoken.net.',
  },
  {
    q: 'Can I have more than one account?',
    a: 'No. One account per person. Duplicate accounts will be removed and activation contributions will not be refunded.',
  },
  {
    q: 'What happens when all 1,000,000 slots are filled?',
    a: 'Registration and activation will close permanently. The community of one million is complete, and we proceed to Phase 3: obtaining all required licences, deploying the CHARITY Token on a public blockchain, listing on exchanges, and commencing monthly distributions. Anyone who missed out can purchase CT from exchanges after listing.',
  },
  {
    q: 'Is my personal data safe?',
    a: 'Yes. We use encrypted database storage, row-level security, and hashed passwords. We never sell or share your data with third parties. Read our Privacy Policy at the link in the footer.',
  },
];

const PHILANTHROPIST_FAQS = [
  {
    q: 'What is a Philanthropist in this project?',
    a: 'A Philanthropist is a KYC-verified community member who helps onboard beneficiaries in their local region. They collect the $1 USD community support contribution in local fiat currency and activate beneficiary accounts on the platform. Philanthropists are community builders — the human face of this project in every city and village where our beneficiaries live.',
  },
  {
    q: 'How do I become a Philanthropist?',
    a: 'Log into your account, go to your Dashboard, and click "Become a Philanthropist". Complete the KYC application by uploading your government-issued ID and a face photo. Once our admin team approves your application, you will receive Philanthropist status and 1,000 ACT as a welcome allocation to begin onboarding beneficiaries.',
  },
  {
    q: 'What is ACT and what is it used for?',
    a: 'ACT (Activation Token) is an internal non-monetary administrative mechanism used exclusively within the Philanthropist workflow. It tracks and confirms beneficiary onboarding actions. Each beneficiary activation costs 10 ACT. ACT has no monetary value, cannot be traded or transferred, and will never be listed on any exchange. It is not a cryptocurrency or financial product — it is purely an internal system record.',
  },
  {
    q: 'How much can I charge beneficiaries?',
    a: 'Exactly $1 USD equivalent in local fiat. This is strictly enforced. Overcharging beneficiaries is an immediate and permanent violation that results in revocation of Philanthropist status without compensation.',
  },
  {
    q: 'How do I refill my ACT balance when it runs out?',
    a: 'Click "Refill ACT" on your Philanthropist Dashboard. Send $70 USDT (BEP20) to our wallet address. This is a platform service fee that covers operational and administrative costs of processing your continued onboarding activity. It is not a token purchase or investment. Upon verification of your transaction, 1,000 ACT will be credited to your account.',
  },
  {
    q: 'Is the $70 USDT refill fee a purchase of tokens?',
    a: 'No. The $70 USDT is a platform service fee covering operational costs of maintaining your philanthropist onboarding activity. The ACT you receive in return carries no financial value, cannot be resold or transferred, and is not redeemable for any asset. It is an internal administrative allocation only.',
  },
  {
    q: 'How long do I have to activate someone after receiving their payment?',
    a: '24 hours. Consistent failure to activate within this window will result in removal from the Philanthropist programme.',
  },
  {
    q: 'How do I activate a beneficiary?',
    a: 'Two ways on your Philanthropist Dashboard: (1) By Email — Enter the beneficiary\'s registered email and click Activate. (2) From Queue — Beneficiaries who chose "Via Philanthropist" appear in your Pending Queue. Click Activate next to their name.',
  },
  {
    q: 'What if I try to activate someone already activated?',
    a: 'The system detects this automatically and shows "Already Activated". No ACT is deducted from your balance.',
  },
  {
    q: 'Will Philanthropists receive CHARITY tokens in the future?',
    a: 'The whitepaper states that any future entitlements relating to the CHARITY Token for philanthropists will be governed separately, subject to regulatory compliance and applicable law. No CHARITY tokens are issued, promised, or allocated to Philanthropists during Phase 1 or Phase 2. Any future entitlements will be announced when Phase 3 is ready.',
  },
  {
    q: 'Can my Philanthropist status be revoked?',
    a: 'Yes — for overcharging beneficiaries, failing to process activations within 24 hours, fraudulent activity, providing false KYC information, or any other policy violation.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(0,206,201,0.1)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', textAlign: 'left', padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: open ? '#00CEC9' : 'white', lineHeight: 1.5, flex: 1, transition: 'color 0.2s' }}>{q}</span>
        <span style={{ flexShrink: 0, marginTop: 2, color: '#00CEC9' }}>
          {open ? <ChevronUp style={{ width: 18, height: 18 }} /> : <ChevronDown style={{ width: 18, height: 18 }} />}
        </span>
      </button>
      {open && (
        <div style={{ paddingBottom: 18, paddingRight: 8 }}>
          <p style={{ fontSize: 13, color: '#8FA3BF', lineHeight: 1.8, margin: 0 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState<'beneficiary' | 'philanthropist'>('beneficiary');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A1628', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(0,206,201,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image src="/Charity token logo.jpg" alt="Charity Token" width={32} height={32} style={{ borderRadius: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>Charity Token</span>
          </Link>
          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
            <Link href="/terms" style={{ color: '#8FA3BF', textDecoration: 'none' }}>Terms</Link>
            <Link href="/privacy" style={{ color: '#8FA3BF', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/beneficiary-dashboard" style={{ color: '#67e8f9', textDecoration: 'none' }}>Dashboard</Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px', position: 'relative', zIndex: 10 }}>

        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#00CEC9', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Help Center</p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, marginBottom: 14, background: 'linear-gradient(to right, white, #8FA3BF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: 14, color: '#8FA3BF', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 20px' }}>
            Everything you need to know about the Charity Token community, account activation, and the Philanthropist programme.
          </p>

          {/* DISCLAIMER BANNER */}
          <div style={{ padding: '14px 18px', borderRadius: 14, backgroundColor: 'rgba(255,193,7,0.07)', border: '1px solid rgba(255,193,7,0.25)', textAlign: 'left', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#ffd54f', fontWeight: 700, marginBottom: 4 }}>⚠️ Important Disclaimer</p>
            <p style={{ fontSize: 12, color: '#8FA3BF', lineHeight: 1.7, margin: 0 }}>
              This project is <strong style={{ color: 'white' }}>not an investment scheme, ICO, or financial product</strong>. The $1 activation fee is a community support contribution. The CHARITY Token does not currently exist. No financial returns are guaranteed. Any future token value depends entirely on market demand. Participation should be based on belief in the mission, not expectation of profit.
            </p>
          </div>

          <a href="https://shimmering-cassata-c25449.netlify.app/whitepaper.pdf" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 999, border: '1px solid rgba(0,206,201,0.3)', backgroundColor: 'rgba(0,206,201,0.08)', color: '#67e8f9', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            📄 Read the Full Whitepaper
          </a>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
          <button onClick={() => setActiveTab('beneficiary')} style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, backgroundColor: activeTab === 'beneficiary' ? '#0F1F35' : 'transparent', color: activeTab === 'beneficiary' ? '#00CEC9' : '#8FA3BF', transition: 'all 0.2s' }}>
            👤 For Beneficiaries
          </button>
          <button onClick={() => setActiveTab('philanthropist')} style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, backgroundColor: activeTab === 'philanthropist' ? '#0F1F35' : 'transparent', color: activeTab === 'philanthropist' ? '#00CEC9' : '#8FA3BF', transition: 'all 0.2s' }}>
            🤝 For Philanthropists
          </button>
        </div>

        <div style={{ padding: '8px 24px', borderRadius: 18, border: '1px solid rgba(0,206,201,0.15)', backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: 36 }}>
          {activeTab === 'beneficiary'
            ? BENEFICIARY_FAQS.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)
            : PHILANTHROPIST_FAQS.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)
          }
        </div>

        <div style={{ padding: '28px', borderRadius: 18, border: '1px solid rgba(0,136,204,0.25)', backgroundColor: 'rgba(0,136,204,0.05)', textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>Still have questions?</p>
          <p style={{ fontSize: 13, color: '#8FA3BF', lineHeight: 1.7, marginBottom: 20 }}>
            Join our Telegram community for real-time support, verified Philanthropist contacts, and the latest project updates.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://t.me/CharityTokenProject1" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, background: 'linear-gradient(to right, #0088cc, #00CEC9)', color: 'white', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.008 9.456c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.09 14.99l-2.94-.92c-.64-.204-.652-.64.136-.948l11.49-4.43c.533-.194 1-.12.786.556z"/></svg>
              Community Group
            </a>
            <a href="mailto:legal@charitytoken.net" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, border: '1px solid rgba(0,206,201,0.3)', color: '#67e8f9', fontWeight: 600, fontSize: 13, textDecoration: 'none', backgroundColor: 'rgba(0,206,201,0.06)' }}>
              ✉️ Email Support
            </a>
          </div>
        </div>

        <div style={{ paddingTop: 28, borderTop: '1px solid rgba(0,206,201,0.15)', display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/terms" style={{ fontSize: 13, color: '#8FA3BF', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/privacy" style={{ fontSize: 13, color: '#8FA3BF', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/" style={{ fontSize: 13, color: '#67e8f9', textDecoration: 'none' }}>← Back to Home</Link>
        </div>
      </main>
    </div>
  );
}