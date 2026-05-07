"use client"

import { AlertTriangle } from "lucide-react"
import { DocumentShell } from "@/components/legal/DocumentShell"

const LAVENDER = "#e1a8f0"

const SECTIONS = [
  {
    id: "smart-contracts",
    title: "Smart Contract Risk",
    body: (
      <p>
        Your funds are deployed to smart contracts on public blockchains. Smart
        contracts may contain bugs, vulnerabilities, or be subject to exploits
        that could result in partial or total loss of funds.
      </p>
    ),
  },
  {
    id: "protocol",
    title: "Protocol Risk",
    body: (
      <p>
        Yuki interacts with third-party protocols and platforms. These protocols
        may experience failures, hacks, or governance decisions that negatively
        impact your funds.
      </p>
    ),
  },
  {
    id: "market",
    title: "Market Risk",
    body: (
      <p>
        The value of digital assets can be highly volatile. Market conditions
        can change rapidly and may result in significant losses.
      </p>
    ),
  },
  {
    id: "no-guarantees",
    title: "No Guarantees",
    body: (
      <p>
        Yuki does not guarantee any returns. Historical yields are not
        indicative of future performance. You may receive back less than you
        deposit.
      </p>
    ),
  },
  {
    id: "regulatory",
    title: "Regulatory Risk",
    body: (
      <p>
        The regulatory environment for digital assets is evolving. Changes in
        laws or regulations may affect your ability to use the service or
        access your funds.
      </p>
    ),
  },
  {
    id: "responsibility",
    title: "Your Responsibility",
    body: (
      <p>
        Only deposit funds you can afford to lose. You are solely responsible
        for your investment decisions and for understanding the risks involved.
      </p>
    ),
  },
]

export default function RiskPage() {
  return (
    <DocumentShell
      slug="risk"
      title="Risk Disclosure"
      lastUpdated="December 2024"
      groupLabel="Risks"
      sections={SECTIONS}
      callout={
        <div className="flex items-start gap-3 px-4 py-4 rounded-[4px] bg-zinc-900">
          <div
            className="shrink-0 w-9 h-9 rounded-[4px] flex items-center justify-center"
            style={{ backgroundColor: "rgba(225,168,240,0.12)" }}
          >
            <AlertTriangle
              className="w-4 h-4"
              style={{ color: LAVENDER }}
              aria-hidden
            />
          </div>
          <p className="text-sm leading-relaxed text-white">
            Please read this disclosure carefully before using Yuki. The service
            involves significant risks that may result in the loss of your
            funds.
          </p>
        </div>
      }
      footer={
        <p className="text-sm leading-relaxed text-white/55">
          By using Yuki, you acknowledge that you have read and understood
          these risks.
        </p>
      }
    />
  )
}
