"use client";

import Link from "next/link";

const legalDocuments = [
  {
    title: "Terms of Service",
    description: "The rules and guidelines for using Yuki",
    href: "/documents/terms",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: "Privacy Policy",
    description: "How we collect, use, and protect your data",
    href: "/documents/privacy",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: "Risk Disclosure",
    description: "Important information about risks and disclaimers",
    href: "/documents/risk",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
];

export default function LegalPage() {
  return (
    <div className="w-full py-8 animate-fade-in max-w-3xl">
      {/* Header */}
      <section className="mb-10">
        <h1 className="text-4xl font-ttbold text-black tracking-tight mb-2">
          Legal & Privacy
        </h1>
        <p className="text-gray-500">
          Important documents and policies for using Yuki
        </p>
      </section>

      {/* Documents */}
      <section className="space-y-4 mb-10">
        {legalDocuments.map((doc, index) => (
          <Link
            key={index}
            href={doc.href}
            className="block group"
          >
            <div className="p-6 bg-gray-50 rounded-3xl hover:bg-gray-100 transition-all hover:scale-[1.01]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#0F52FB]/10 flex items-center justify-center text-[#0F52FB] group-hover:bg-[#0F52FB] group-hover:text-white transition-colors flex-shrink-0">
                  {doc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-black group-hover:text-[#0F52FB] transition-colors mb-1">
                    {doc.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {doc.description}
                  </p>
                </div>
                <svg 
                  className="w-5 h-5 text-gray-400 group-hover:text-[#0F52FB] transition-colors flex-shrink-0 mt-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* Summary Box */}
      <section className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-200">
        <h2 className="text-lg font-semibold text-black mb-3">In Summary</h2>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#0F52FB] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Your assets are held on-chain, not by Yuki</span>
          </li>
          <li className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#0F52FB] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>We collect minimal personal data and never sell it</span>
          </li>
          <li className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#0F52FB] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>All crypto activity carries risk — use responsibly</span>
          </li>
          <li className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#0F52FB] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>You can delete your account and data anytime</span>
          </li>
        </ul>
      </section>

      {/* Contact */}
      <section className="mt-10">
        <div className="p-5 bg-gray-50 rounded-2xl">
          <p className="text-sm text-gray-600 mb-2">
            Have questions about our policies?
          </p>
          <a 
            href="mailto:legal@yuki.finance"
            className="text-sm font-medium text-[#0F52FB] hover:text-[#0F52FB]/80 transition-colors"
          >
            legal@yuki.finance
          </a>
        </div>
      </section>
    </div>
  );
}

