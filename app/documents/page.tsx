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
    <div className="w-full py-12 animate-fade-in">
      {/* Back link */}
      <div className="mb-6">
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
      <section className="mb-8">
        <p className="text-sm text-gray-500 mb-2 font-medium">Legal</p>
        <h1 className="text-4xl font-medium text-white tracking-tight mb-2">Documents</h1>
        <p className="text-gray-500 text-sm">Legal and compliance documents</p>
      </section>

      {/* Documents List */}
      <section className="bg-white/[0.03] rounded-lg overflow-hidden">
        <div className="px-5 py-3 bg-white/[0.02]">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">Available Documents</h2>
        </div>
        <div className="divide-y divide-white/5">
          {documents.map((doc) => (
            <Link
              key={doc.title}
              href={doc.href}
              className="block px-5 py-4 hover:bg-white/[0.02] transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-base font-medium mb-1">{doc.title}</p>
                  <p className="text-sm text-gray-400">{doc.description}</p>
                </div>
                <svg 
                  className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0 ml-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
