"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const legalDocuments = [
  {
    title: "Terms of Service",
    description: "The rules and guidelines for using Yuki",
    href: "/documents/terms",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: "Privacy Policy",
    description: "How we collect, use, and protect your data",
    href: "/documents/privacy",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: "Risk Disclosure",
    description: "Important information about risks and disclaimers",
    href: "/documents/risk",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
];

export default function LegalPage() {
  return (
    <div className="w-full min-h-screen pt-24 pb-12 relative">
      {/* Ambient glow */}
      <motion.div
        animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#004BAD]/15 rounded-full blur-[150px] pointer-events-none"
      />

      <div className="max-w-[800px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <h1 
            className="font-display text-4xl sm:text-5xl text-white tracking-tight mb-3"
            style={{ 
              WebkitFontSmoothing: "antialiased",
              textRendering: "geometricPrecision",
            }}
          >
            LEGAL & PRIVACY
          </h1>
          <p className="text-white/40">
            Important documents and policies for using Yuki
          </p>
        </motion.section>

        {/* Documents */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3 mb-10"
        >
          {legalDocuments.map((doc, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05, duration: 0.5 }}
            >
              <Link
                href={doc.href}
                className="block group"
              >
                <div className="p-5 sm:p-6 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white/60 group-hover:bg-white group-hover:text-black transition-all flex-shrink-0">
                      {doc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white group-hover:text-white/90 transition-colors mb-1">
                        {doc.title}
                      </h3>
                      <p className="text-sm text-white/40">
                        {doc.description}
                      </p>
                    </div>
                    <svg 
                      className="w-5 h-5 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0 mt-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.section>

        {/* Summary Box */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="p-6 bg-white/5 rounded-2xl"
        >
          <h2 className="text-white/40 text-sm uppercase tracking-widest mb-4">In Summary</h2>
          <ul className="space-y-3 text-sm text-white/50">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Your assets are held on-chain, not by Yuki</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>We collect minimal personal data and never sell it</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>All crypto activity carries risk — use responsibly</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>You can delete your account and data anytime</span>
            </li>
          </ul>
        </motion.section>

        {/* Contact */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10"
        >
          <div className="p-5 bg-white/5 rounded-2xl">
            <p className="text-sm text-white/40 mb-2">
              Have questions about our policies?
            </p>
            <a 
              href="mailto:legal@yuki.finance"
              className="text-sm font-medium text-white hover:text-white/80 transition-colors"
            >
              legal@yuki.finance
            </a>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
