'use client';

export function StatsSection() {
  return (
    <div className="grid md:grid-cols-4 gap-6 mb-20">
      <div className="charity-glow-card p-8 text-center group">
        <div className="text-5xl font-bold charity-text-gradient mb-3 group-hover:scale-110 transition">1M+</div>
        <p className="text-muted-foreground text-sm">Global Beneficiaries</p>
      </div>
      <div className="charity-glow-card p-8 text-center group">
        <div className="text-5xl font-bold charity-text-gradient mb-3 group-hover:scale-110 transition">60B</div>
        <p className="text-muted-foreground text-sm">Tokens Distributed</p>
      </div>
      <div className="charity-glow-card p-8 text-center group">
        <div className="text-5xl font-bold charity-text-gradient mb-3 group-hover:scale-110 transition">10</div>
        <p className="text-muted-foreground text-sm">Year Program</p>
      </div>
      <div className="charity-glow-card p-8 text-center group">
        <div className="text-5xl font-bold charity-text-gradient mb-3 group-hover:scale-110 transition">100B</div>
        <p className="text-muted-foreground text-sm">Total Supply</p>
      </div>
    </div>
  );
}
