"use client";

import Link from "next/link";

export default function TermsPage() {
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
        <h1 className="text-4xl font-medium text-white tracking-tight mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm">Last updated: December 2024</p>
      </section>

      {/* Content */}
      <section className="bg-white/[0.03] rounded-lg overflow-hidden mb-8">
        <div className="px-5 py-3 bg-white/[0.02]">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">Agreement</h2>
        </div>
        <div className="p-5 space-y-6">
          <div className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <h3 className="text-white text-base font-medium mb-3">1. Acceptance of Terms</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              By accessing or using Yuki, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </div>

          <div className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <h3 className="text-white text-base font-medium mb-3">2. Description of Service</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Yuki provides a platform for users to allocate digital assets to on-chain yield-generating strategies. The service is provided on a non-custodial basis, meaning users retain control of their assets at all times.
            </p>
          </div>

          <div className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <h3 className="text-white text-base font-medium mb-3">3. User Responsibilities</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              You are responsible for maintaining the security of your account credentials and wallet access. You acknowledge that you understand the risks associated with digital assets and decentralized finance.
            </p>
          </div>

          <div className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <h3 className="text-white text-base font-medium mb-3">4. No Guarantees</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Yuki does not guarantee any specific returns or outcomes. Past performance is not indicative of future results. All investments carry risk, including the potential loss of principal.
            </p>
          </div>

          <div className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <h3 className="text-white text-base font-medium mb-3">5. Limitation of Liability</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              To the maximum extent permitted by law, Yuki shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
            </p>
          </div>

          <div className="pb-0">
            <h3 className="text-white text-base font-medium mb-3">6. Changes to Terms</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white/[0.03] rounded-lg p-5">
        <p className="text-sm text-gray-400">
          For questions about these terms, contact us at{" "}
          <a href="mailto:legal@yuki.finance" className="text-white hover:text-gray-300 transition-colors">
            legal@yuki.finance
          </a>
        </p>
      </section>
    </div>
  );
}
