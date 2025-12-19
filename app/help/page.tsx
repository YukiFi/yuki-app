"use client";

import { useState } from "react";
import Link from "next/link";

const faqs = [
  {
    question: "What is Yuki?",
    answer: "Yuki is a savings platform that helps you earn yield on your digital assets. Your funds are deployed across carefully selected on-chain strategies that generate returns over time.",
  },
  {
    question: "How does Yuki work?",
    answer: "When you deposit funds, they're allocated to one of our savings profiles based on your preference. Each profile has a different risk/reward balance. Your funds remain non-custodial and can be withdrawn anytime.",
  },
  {
    question: "Are my funds safe?",
    answer: "Your funds remain in smart contracts on the blockchain. Yuki never has direct custody of your assets. However, all on-chain activity carries inherent smart contract risk. We recommend only depositing what you can afford to have at risk.",
  },
  {
    question: "How do I withdraw?",
    answer: "You can withdraw your funds at any time from the dashboard or from any savings profile page. Withdrawals are processed immediately and returned to your wallet.",
  },
  {
    question: "What are the fees?",
    answer: "Yuki charges no deposit fees. A small performance fee may apply to earnings, depending on the savings profile. All fees are disclosed before you deposit.",
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
        <h1 className="text-2xl font-medium text-white mb-2">Help</h1>
        <p className="text-gray-500 text-sm">Answers to common questions</p>
      </section>

      {/* How Yuki Works - Brief */}
      <section className="mb-10">
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6">
          <h2 className="text-white font-medium mb-3">How Yuki works</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Yuki connects your savings to on-chain yield opportunities. Choose a savings profile that matches your comfort level, deposit funds, and watch your balance grow over time. Your funds stay in your control and can be withdrawn anytime.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Frequently asked questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-white text-sm">{faq.question}</span>
                <svg 
                  className={`w-4 h-4 text-gray-500 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Still have questions?</h2>
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6">
          <p className="text-sm text-gray-400 mb-4">
            We&apos;re here to help. Reach out and we&apos;ll get back to you as soon as possible.
          </p>
          <a 
            href="mailto:support@yuki.finance"
            className="inline-block text-sm text-white hover:text-gray-300 transition-colors"
          >
            support@yuki.finance
          </a>
        </div>
      </section>
    </div>
  );
}
