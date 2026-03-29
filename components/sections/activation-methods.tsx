'use client';

import { Coins, TrendingUp, Users } from 'lucide-react';

export function ActivationMethods() {
  return (
    <div className="charity-glow-card p-12 mb-20">
      <h3 className="text-4xl font-bold mb-12 text-center text-foreground">Flexible Activation Methods</h3>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card/50 border border-cyan-500/30 rounded-lg p-8 text-center group hover:bg-card transition">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:from-cyan-500/40 group-hover:to-emerald-500/40 transition">
            <Coins className="w-8 h-8 text-cyan-400" />
          </div>
          <h4 className="font-semibold mb-2 text-foreground text-lg">Pi Network</h4>
          <p className="text-sm text-muted-foreground mb-4">Direct payment for instant activation</p>
          <p className="text-3xl font-bold charity-text-gradient">6.0 Pi</p>
        </div>
        <div className="bg-card/50 border border-cyan-500/30 rounded-lg p-8 text-center group hover:bg-card transition">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:from-cyan-500/40 group-hover:to-emerald-500/40 transition">
            <TrendingUp className="w-8 h-8 text-cyan-400" />
          </div>
          <h4 className="font-semibold mb-2 text-foreground text-lg">Wallet Transfer</h4>
          <p className="text-sm text-muted-foreground mb-4">Transfer USDT to designated wallet</p>
          <p className="text-3xl font-bold charity-text-gradient">1 USDT</p>
        </div>
        <div className="bg-card/50 border border-cyan-500/30 rounded-lg p-8 text-center group hover:bg-card transition">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:from-cyan-500/40 group-hover:to-emerald-500/40 transition">
            <Users className="w-8 h-8 text-cyan-400" />
          </div>
          <h4 className="font-semibold mb-2 text-foreground text-lg">Via Philanthropist</h4>
          <p className="text-sm text-muted-foreground mb-4">Contact regional Philanthropist</p>
          <p className="text-3xl font-bold charity-text-gradient">1 USDT</p>
        </div>
      </div>
    </div>
  );
}
