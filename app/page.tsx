'use client';

import { useRouter } from 'next/navigation';
import { Coins, Users } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0A1628] text-white font-sans relative overflow-hidden">

      {/* HEADER */}
      <header className="flex justify-between items-center px-4 py-4 border-b border-white/10 backdrop-blur">
        <div className="flex items-center gap-2">
          <Image
            src="/Charity token logo.jpg"
            alt="Charity Token"
            width={36}
            height={36}
            className="rounded-md"
          />
          <span className="font-semibold text-sm text-[#F0F4F8]">
            Charity Token
          </span>
        </div>

        <button
          onClick={() => router.push('/login')}
          className="text-xs px-4 py-2 rounded-full border border-teal-400 text-teal-300"
        >
          Sign In
        </button>
      </header>

      {/* HERO */}
      <section className="px-5 pt-10 pb-6 text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/Charity token logo.jpg"
            alt="Charity Token Logo"
            width={100}
            height={100}
            className="rounded-xl shadow-lg shadow-teal-500/30"
          />
        </div>

        <h1 className="text-3xl font-bold leading-tight mb-3">
          Empowering Lives <br />
          <span className="bg-gradient-to-r from-[#00CEC9] to-[#00B894] bg-clip-text text-transparent">
            Through Impact
          </span>
        </h1>

        <p className="text-sm text-gray-400 mb-6">
          Receive monthly tokens and build a better future with a global
          humanitarian network.
        </p>

        <button
          onClick={() => router.push('/register?role=beneficiary')}
          className="w-full py-3 rounded-full bg-gradient-to-r from-[#00CEC9] to-[#00B894] font-semibold shadow-lg shadow-teal-500/20"
        >
          Get Started
        </button>
      </section>

      {/* DASHBOARD CARDS */}
      <section className="px-4 py-6 space-y-4">

        <div className="p-4 rounded-2xl border border-teal-400/30 bg-white/5 backdrop-blur shadow-[0_0_20px_rgba(0,206,201,0.15)]">
          <div className="flex items-center gap-3 mb-2">
            <Coins className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-semibold">Monthly Reward</h3>
          </div>
          <p className="text-2xl font-bold text-[#F0F4F8]">500 Tokens</p>
          <p className="text-xs text-gray-400">Every month for 10 years</p>
        </div>

        <div className="p-4 rounded-2xl border border-teal-400/30 bg-white/5 backdrop-blur shadow-[0_0_20px_rgba(0,206,201,0.15)]">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-semibold">Global Community</h3>
          </div>
          <p className="text-2xl font-bold">1M+ Users</p>
          <p className="text-xs text-gray-400">Worldwide impact network</p>
        </div>

      </section>

      {/* ACTION BUTTONS */}
      <section className="px-4 py-6 space-y-3">
        <button
          onClick={() => router.push('/register?role=beneficiary')}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00CEC9] to-[#00B894] font-semibold shadow-lg shadow-teal-500/20"
        >
          Become a Beneficiary
        </button>

        <button
          onClick={() => router.push('/register?role=philanthropist')}
          className="w-full py-3 rounded-xl border border-teal-400 text-teal-300"
        >
          Join as Philanthropist
        </button>
      </section>

      {/* FOOTER */}
      <footer className="text-center text-xs text-gray-500 py-6">
        © 2026 Charity Token Project
      </footer>

      {/* DECORATIVE BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-10 left-5 w-40 h-40 bg-gradient-to-br from-teal-400 to-emerald-400 blur-3xl rounded-full" />
        <div className="absolute bottom-10 right-5 w-40 h-40 bg-gradient-to-br from-cyan-400 to-green-400 blur-3xl rounded-full" />
      </div>

    </div>
  );
}