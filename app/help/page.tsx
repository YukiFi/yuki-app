"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Is my money safe?",
    answer: "Your money is held in smart contracts on the blockchain — not by Yuki. We prioritize liquidity and access over maximum returns. That said, all on-chain activity carries risk. Only use Yuki with funds you're comfortable having at some risk. If Yuki as a company disappeared tomorrow, your assets would still exist on the blockchain.",
  },
  {
    question: "Can I always access my money?",
    answer: "Yes. There are no lockups, no waiting periods, and no penalties. You can send or withdraw your entire balance at any time. Your money stays usable — that's a core principle.",
  },
  {
    question: "What does changing my comfort level do?",
    answer: "It adjusts how your money behaves going forward — more stability or more growth exposure. Changes don't affect your past. There's no penalty for switching, and you can change back anytime. Most people set it once and forget about it.",
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
    answer: "No. You don't need a wallet, seed phrases, or any blockchain knowledge. Sign in with your email and use Yuki like any other app. Everything technical happens behind the scenes.",
  },
  {
    question: "What fees does Yuki charge?",
    answer: "Yuki takes a percentage of the yield you earn — not your deposits, withdrawals, or balance. No hidden fees. When you earn, we earn. When yields are low, our revenue is low too.",
  },
  {
    question: "What should I use Yuki for?",
    answer: "Idle balances and flexible funds — money you want accessible but also working for you. Not for retirement savings or money you can't afford to risk. Think of it as the middle ground between checking and long-term savings.",
  },
  {
    question: "What if something goes wrong?",
    answer: "Check your activity history first — it shows everything that affected your balance. If something still seems off, email support@yuki.finance and we'll respond within 24 hours.",
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="w-full py-12 animate-fade-in">
      {/* Header */}
      <section className="mb-10">
        <h1 className="text-2xl font-medium text-white mb-2">Help</h1>
        <p className="text-gray-500 text-sm">
          Answers to help you feel confident.
        </p>
      </section>

      {/* FAQ */}
      <div className="space-y-1">
        {faqs.map((faq, index) => (
          <div 
            key={index}
            className="border-b border-white/5 last:border-0"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full py-4 text-left flex items-center justify-between gap-4 cursor-pointer group"
            >
              <span className="text-white text-sm group-hover:text-gray-300 transition-colors">
                {faq.question}
              </span>
              <svg 
                className={`w-4 h-4 text-gray-600 transition-transform flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIndex === index && (
              <div className="pb-5 pr-8">
                <p className="text-sm text-gray-500 leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact */}
      <section className="mt-12 pt-8 border-t border-white/5">
        <p className="text-sm text-gray-600">
          Still have questions?{" "}
          <a 
            href="mailto:support@yuki.finance"
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            support@yuki.finance
          </a>
        </p>
      </section>
    </div>
  );
}
