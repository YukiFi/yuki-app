"use client";

import Link from "next/link";

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-medium text-white tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm">Last updated: December 2024</p>
      </section>

      {/* Content */}
      <section className="bg-white/[0.03] rounded-lg overflow-hidden mb-8">
        <div className="px-5 py-3 bg-white/[0.02]">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">Data & Privacy</h2>
        </div>
        <div className="p-5 space-y-6">
          <div className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <h3 className="text-white text-base font-medium mb-3">Information We Collect</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              We collect information you provide directly, such as your email address when you create an account. We also collect wallet addresses used to interact with the service.
            </p>
          </div>

          <div className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <h3 className="text-white text-base font-medium mb-3">How We Use Information</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              We use your information to provide and improve our service, communicate with you about your account, and ensure the security of our platform.
            </p>
          </div>

          <div className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <h3 className="text-white text-base font-medium mb-3">Information Sharing</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              We do not sell your personal information. We may share information with service providers who assist in operating our platform, or as required by law.
            </p>
          </div>

          <div className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <h3 className="text-white text-base font-medium mb-3">Data Security</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              We implement appropriate security measures to protect your information. However, no method of transmission over the internet is 100% secure.
            </p>
          </div>

          <div className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <h3 className="text-white text-base font-medium mb-3">Your Rights</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              You may request access to, correction of, or deletion of your personal information by contacting us. You may also opt out of certain communications.
            </p>
          </div>

          <div className="pb-0">
            <h3 className="text-white text-base font-medium mb-3">Cookies</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              We use cookies and similar technologies to improve your experience and analyze usage patterns. You can control cookies through your browser settings.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white/[0.03] rounded-lg p-5">
        <p className="text-sm text-gray-400">
          For privacy inquiries, contact us at{" "}
          <a href="mailto:privacy@yuki.finance" className="text-white hover:text-gray-300 transition-colors">
            privacy@yuki.finance
          </a>
        </p>
      </section>
    </div>
  );
}
