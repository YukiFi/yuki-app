"use client";

import Link from "next/link";

const documents = [
  {
    title: "Terms of Service",
    description: "The agreement governing your use of Yuki",
    href: "/documents/terms",
  },
  {
    title: "Privacy Policy",
    description: "How we collect, use, and protect your information",
    href: "/documents/privacy",
  },
  {
    title: "Risk Disclosure",
    description: "Important information about the risks of using Yuki",
    href: "/documents/risk",
  },
];

export default function DocumentsPage() {
  return (
    <div className="w-full mx-auto px-4 pb-24 animate-fade-in">
      {/* Back link */}
      <div className="pt-8 pb-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      {/* Header */}
      <section className="pb-10">
        <h1 className="text-2xl font-medium text-white mb-2">Documents</h1>
        <p className="text-gray-500 text-sm">Legal and compliance documents</p>
      </section>

      {/* Documents List */}
      <section className="space-y-3">
        {documents.map((doc) => (
          <Link
            key={doc.title}
            href={doc.href}
            className="block bg-white/[0.02] rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white mb-1">{doc.title}</p>
                <p className="text-xs text-gray-500">{doc.description}</p>
              </div>
              <svg 
                className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
