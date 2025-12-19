"use client";

import { useRouter } from "next/navigation";

const savingsProfiles = [
  {
    id: "yuki-stable",
    name: "Stable",
    description: "Designed to preserve capital with steady, conservative yield.",
    yieldRange: "Historically ~3–6%",
    volatility: "Low",
    audience: "For users who want minimal surprises",
    isMostCommon: true,
  },
  {
    id: "eth-yield",
    name: "Balanced",
    description: "A middle ground between stability and growth potential.",
    yieldRange: "Historically ~5–9%",
    volatility: "Moderate",
    audience: "For users comfortable with some variability",
    isMostCommon: false,
  },
  {
    id: "sol-turbo",
    name: "Growth",
    description: "Prioritizes higher returns with increased volatility.",
    yieldRange: "Historically ~8–15%",
    volatility: "Higher",
    audience: "For users who can accept short-term fluctuations",
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
      <div className="p-8">
        {/* Top: Name + Description */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-medium text-white">{profile.name}</h2>
            {profile.isMostCommon && (
              <span className="px-2.5 py-1 text-xs text-gray-400 bg-white/5 rounded-full">
                Most common
              </span>
            )}
          </div>
          <p className="text-gray-500 leading-relaxed">{profile.description}</p>
        </div>

        {/* Middle: Decision Zone */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Expected yield</span>
            <span className="text-sm text-white">{profile.yieldRange}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Volatility</span>
            <span className="text-sm text-white">{profile.volatility}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Best for</span>
            <span className="text-sm text-gray-400">{profile.audience}</span>
          </div>
        </div>

        {/* Bottom: CTA + Trust signals */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>Non-custodial</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>On-chain</span>
          </div>
          <button className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-white transition-colors cursor-pointer">
            View details
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SavingsProfiles() {
  const router = useRouter();

  return (
    <div className="w-full mx-auto px-4 pb-24 animate-fade-in">
      {/* Header */}
      <section className="pt-12 pb-10">
        <h1 className="text-3xl font-medium text-white mb-3">Savings Profiles</h1>
        <p className="text-gray-500">
          Choose how conservatively or aggressively you want your savings managed.
        </p>
      </section>

      {/* Profile Cards - Stacked Vertically */}
      <section className="space-y-4">
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
