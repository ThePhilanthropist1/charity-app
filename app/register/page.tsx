'use client';

import { RegistrationForm } from '@/components/registration-form';
import { useSearchParams } from 'next/navigation';
import { Leaf } from 'lucide-react';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'beneficiary';

  return (
    <main className="charity-bg min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Decorative Elements */}
      <div className="network-node w-96 h-96 -top-20 -left-20" />
      <div className="network-node w-72 h-72 -bottom-10 -right-10" />

      {/* Content */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold charity-text-gradient">Charity Token</h1>
        </div>

        <RegistrationForm defaultRole={role} />
      </div>
    </main>
  );
}
