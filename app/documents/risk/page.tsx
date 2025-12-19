"use client";

import Link from "next/link";

export default function RiskDisclosurePage() {
  return (
    <div className="w-full mx-auto px-4 pb-24 animate-fade-in">
      {/* Back link */}
      <div className="pt-8 pb-4">
        <Link 
          href="/documents" 
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Documents
        </Link>
      </div>

      {/* Header */}
      <section className="pb-10">
        <h1 className="text-2xl font-medium text-white mb-2">Risk Disclosure</h1>
        <p className="text-gray-500 text-sm">Last updated: December 2024</p>
      </section>

      {/* Content */}
      <section className="prose prose-invert prose-sm max-w-none">
        <div className="space-y-6 text-gray-400 text-sm leading-relaxed">
          <div className="bg-white/[0.02] rounded-xl border border-white/5 p-5">
            <p className="text-white">
              Please read this disclosure carefully before using Yuki. Using our service involves significant risks that may result in the loss of your funds.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">Smart Contract Risk</h2>
            <p>
              Your funds are deployed to smart contracts on public blockchains. Smart contracts may contain bugs, vulnerabilities, or be subject to exploits that could result in partial or total loss of funds.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">Protocol Risk</h2>
            <p>
              Yuki interacts with third-party protocols and platforms. These protocols may experience failures, hacks, or governance decisions that negatively impact your funds.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">Market Risk</h2>
            <p>
              The value of digital assets can be highly volatile. Market conditions can change rapidly and may result in significant losses.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">No Guarantees</h2>
            <p>
              Yuki does not guarantee any returns. Historical yields are not indicative of future performance. You may receive back less than you deposit.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">Regulatory Risk</h2>
            <p>
              The regulatory environment for digital assets is evolving. Changes in laws or regulations may affect your ability to use the service or access your funds.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">Your Responsibility</h2>
            <p>
              Only deposit funds you can afford to lose. You are solely responsible for your investment decisions and for understanding the risks involved.
            </p>
          </div>

          <div className="pt-6 border-t border-white/5">
            <p className="text-gray-500">
              By using Yuki, you acknowledge that you have read and understood these risks.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
