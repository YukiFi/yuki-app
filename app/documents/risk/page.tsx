"use client";

import Link from "next/link";

export default function RiskDisclosurePage() {
  return (
    <div className="w-full py-12 animate-fade-in">
      {/* Back link */}
      <div className="mb-6">
        <Link 
          href="/documents" 
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Documents
        </Link>
      </div>

      {/* Header */}
      <section className="mb-8">
        <p className="text-sm text-gray-500 mb-2 font-medium">Legal</p>
        <h1 className="text-4xl font-medium text-white tracking-tight mb-2">Risk Disclosure</h1>
        <p className="text-gray-500 text-sm">Last updated: December 2024</p>
      </section>

      {/* Warning Banner */}
      <section className="mb-8">
        <div className="bg-white/[0.03] rounded-lg border border-white/5 p-5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-white text-sm leading-relaxed">
              Please read this disclosure carefully before using Yuki. Using our service involves significant risks that may result in the loss of your funds.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white/[0.03] rounded-lg overflow-hidden mb-8">
        <div className="px-5 py-3 bg-white/[0.02]">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">Risks</h2>
        </div>
        <div className="p-5 space-y-6">
          <div className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <h3 className="text-white text-base font-medium mb-3">Smart Contract Risk</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your funds are deployed to smart contracts on public blockchains. Smart contracts may contain bugs, vulnerabilities, or be subject to exploits that could result in partial or total loss of funds.
            </p>
          </div>

          <div className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <h3 className="text-white text-base font-medium mb-3">Protocol Risk</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Yuki interacts with third-party protocols and platforms. These protocols may experience failures, hacks, or governance decisions that negatively impact your funds.
            </p>
          </div>

          <div className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <h3 className="text-white text-base font-medium mb-3">Market Risk</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              The value of digital assets can be highly volatile. Market conditions can change rapidly and may result in significant losses.
            </p>
          </div>

          <div className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <h3 className="text-white text-base font-medium mb-3">No Guarantees</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Yuki does not guarantee any returns. Historical yields are not indicative of future performance. You may receive back less than you deposit.
            </p>
          </div>

          <div className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <h3 className="text-white text-base font-medium mb-3">Regulatory Risk</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              The regulatory environment for digital assets is evolving. Changes in laws or regulations may affect your ability to use the service or access your funds.
            </p>
          </div>

          <div className="pb-0">
            <h3 className="text-white text-base font-medium mb-3">Your Responsibility</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Only deposit funds you can afford to lose. You are solely responsible for your investment decisions and for understanding the risks involved.
            </p>
          </div>
        </div>
      </section>

      {/* Acknowledgment */}
      <section className="bg-white/[0.03] rounded-lg p-5">
        <p className="text-sm text-gray-400">
          By using Yuki, you acknowledge that you have read and understood these risks.
        </p>
      </section>
    </div>
  );
}
