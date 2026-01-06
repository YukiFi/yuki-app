"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Is my money safe?",
    answer: "Your money is held in smart contracts on the blockchain — not by Yuki. We prioritize liquidity and access over maximum returns. That said, all on-chain activity carries risk. Only use Yuki with funds you're comfortable having at some risk.",
  },
  {
    question: "Can I always access my money?",
    answer: "Yes. There are no lockups, no waiting periods, and no penalties. You can send or withdraw your entire balance at any time. Your money stays usable — that's a core principle.",
  },
  {
    question: "What does changing my comfort level do?",
    answer: "It adjusts how your money behaves going forward — more stability or more growth exposure. Changes don't affect your past. There's no penalty for switching, and you can change back anytime.",
  },
  {
    question: "Where does yield come from?",
    answer: "From decentralized finance — lending, liquidity provision, and similar on-chain activities. Yield fluctuates with market conditions and can sometimes drop to zero. Yuki intentionally avoids high-risk strategies that promise bigger returns.",
  },
  {
    question: "Can my balance go down?",
    answer: "In extreme circumstances, yes. While uncommon, market conditions can cause temporary negative performance. Yuki prioritizes protecting your access to funds over protecting yield. Your money remains withdrawable regardless.",
  },
  {
    question: "Do I need to understand crypto?",
    answer: "No. You don't need a wallet, seed phrases, or any blockchain knowledge. Sign in with your email or phone and use Yuki like any other app. Everything technical happens behind the scenes.",
  },
  {
    question: "What fees does Yuki charge?",
    answer: "Yuki takes a percentage of the yield you earn — not your deposits, withdrawals, or balance. No hidden fees. When you earn, we earn. When yields are low, our revenue is low too.",
  },
  {
    question: "What should I use Yuki for?",
    answer: "Idle balances and flexible funds — money you want accessible but also working for you. Not for retirement savings or money you can't afford to risk. Think of it as the middle ground between checking and long-term savings.",
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
            HELP CENTER
          </h1>
          <p className="text-white/40">
            Answers to help you feel confident about using Yuki.
          </p>
        </motion.section>

        {/* Quick Links */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 gap-3 mb-10"
        >
          <a
            href="mailto:support@yuki.finance"
            className="p-5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#004BAD]/20 flex items-center justify-center group-hover:bg-[#004BAD]/30 transition-colors">
                <svg className="w-5 h-5 text-[#004BAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-white transition-colors">Email Support</p>
                <p className="text-xs text-white/40">support@yuki.finance</p>
              </div>
            </div>
          </a>

          <a
            href="https://discord.gg/yuki"
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#004BAD]/20 flex items-center justify-center group-hover:bg-[#004BAD]/30 transition-colors">
                <svg className="w-5 h-5 text-[#004BAD]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-white transition-colors">Join Discord</p>
                <p className="text-xs text-white/40">Community chat</p>
              </div>
            </div>
          </a>
        </motion.section>

        {/* FAQ Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-white/40 text-sm uppercase tracking-widest mb-4">Frequently Asked Questions</h2>
          
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.03, duration: 0.5 }}
                className="bg-white/5 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <span className="text-sm font-medium text-white group-hover:text-white/80 transition-colors">
                    {faq.question}
                  </span>
                  <svg 
                    className={`w-5 h-5 text-white/30 transition-transform flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === index && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="px-5 pb-5"
                  >
                    <p className="text-sm text-white/50 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Still need help */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 p-6 bg-[#004BAD]/20 rounded-2xl"
        >
          <h3 className="text-lg font-semibold text-white mb-2">Still need help?</h3>
          <p className="text-white/50 text-sm mb-4">
            Our support team typically responds within 24 hours. We're here to help.
          </p>
          <a
            href="mailto:support@yuki.finance"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Support
          </a>
        </motion.section>
      </div>
    </div>
  );
}
