"use client";

import Link from "next/link";

export default function TermsPage() {
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
        <h1 className="text-2xl font-medium text-white mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm">Last updated: December 2024</p>
      </section>

      {/* Content */}
      <section className="prose prose-invert prose-sm max-w-none">
        <div className="space-y-6 text-gray-400 text-sm leading-relaxed">
          <div>
            <h2 className="text-white text-base font-medium mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Yuki, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">2. Description of Service</h2>
            <p>
              Yuki provides a platform for users to allocate digital assets to on-chain yield-generating strategies. The service is provided on a non-custodial basis, meaning users retain control of their assets at all times.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">3. User Responsibilities</h2>
            <p>
              You are responsible for maintaining the security of your account credentials and wallet access. You acknowledge that you understand the risks associated with digital assets and decentralized finance.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">4. No Guarantees</h2>
            <p>
              Yuki does not guarantee any specific returns or outcomes. Past performance is not indicative of future results. All investments carry risk, including the potential loss of principal.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Yuki shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">6. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
            </p>
          </div>

          <div className="pt-6 border-t border-white/5">
            <p className="text-gray-500">
              For questions about these terms, contact us at{" "}
              <a href="mailto:legal@yuki.finance" className="text-white hover:text-gray-300">
                legal@yuki.finance
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
