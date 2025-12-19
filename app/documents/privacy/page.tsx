"use client";

import Link from "next/link";

export default function PrivacyPage() {
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
        <h1 className="text-2xl font-medium text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm">Last updated: December 2024</p>
      </section>

      {/* Content */}
      <section className="prose prose-invert prose-sm max-w-none">
        <div className="space-y-6 text-gray-400 text-sm leading-relaxed">
          <div>
            <h2 className="text-white text-base font-medium mb-3">Information We Collect</h2>
            <p>
              We collect information you provide directly, such as your email address when you create an account. We also collect wallet addresses used to interact with the service.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">How We Use Information</h2>
            <p>
              We use your information to provide and improve our service, communicate with you about your account, and ensure the security of our platform.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share information with service providers who assist in operating our platform, or as required by law.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">Data Security</h2>
            <p>
              We implement appropriate security measures to protect your information. However, no method of transmission over the internet is 100% secure.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal information by contacting us. You may also opt out of certain communications.
            </p>
          </div>

          <div>
            <h2 className="text-white text-base font-medium mb-3">Cookies</h2>
            <p>
              We use cookies and similar technologies to improve your experience and analyze usage patterns. You can control cookies through your browser settings.
            </p>
          </div>

          <div className="pt-6 border-t border-white/5">
            <p className="text-gray-500">
              For privacy inquiries, contact us at{" "}
              <a href="mailto:privacy@yuki.finance" className="text-white hover:text-gray-300">
                privacy@yuki.finance
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
