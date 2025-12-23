"use client";

import { useRouter } from "next/navigation";

const savingsProfiles = [
  {
    id: "yuki-stable",
    name: "Stable",
    description: "Preserve capital with steady yield.",
    yieldRange: "~4–6%",
    volatility: "Low",
    audience: "Conservative",
    isMostCommon: true,
  },
  {
    id: "eth-yield",
    name: "Balanced",
    description: "Balance between stability and growth.",
    yieldRange: "~6–9%",
    volatility: "Moderate",
    audience: "Balanced",
    isMostCommon: false,
  },
  {
    id: "sol-turbo",
    name: "Growth",
    description: "Higher returns with increased volatility.",
    yieldRange: "~8–12%",
    volatility: "Higher",
    audience: "Aggressive",
    isMostCommon: false,
  },
];

function ProfileCard({ 
  profile, 
  onClick 
}: { 
  profile: typeof savingsProfiles[0];
  onClick: () => void;
}) {
  return (
    <div 
      className="bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-medium text-white">{profile.name}</h2>
              {profile.isMostCommon && (
                <span className="px-2 py-0.5 text-[10px] text-gray-400 bg-white/5 rounded-full uppercase tracking-wider">
                  Popular
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{profile.description}</p>
          </div>
          <div className="text-right">
             <span className="text-sm text-emerald-500/80">{profile.yieldRange}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 text-xs text-gray-600">
             <span>{profile.volatility} volatility</span>
          </div>
          <button className="text-xs text-gray-400 group-hover:text-white transition-colors flex items-center gap-1">
            Configure
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AllocationStrategy() {
  const router = useRouter();

  return (
    <div className="w-full max-w-xl mx-auto px-4 pb-24 animate-fade-in">
      {/* Header */}
      <section className="pt-12 pb-8">
        <h1 className="text-2xl font-medium text-white mb-2">Allocation Strategy</h1>
        <p className="text-gray-500 text-sm">
          Configure how your balance behaves.
        </p>
      </section>

      {/* Profile Cards */}
      <section className="space-y-3">
        {savingsProfiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onClick={() => router.push(`/vaults/${profile.id}`)}
          />
        ))}
      </section>
    </div>
  );
}
