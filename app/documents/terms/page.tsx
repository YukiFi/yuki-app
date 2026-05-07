"use client"

import { DocumentShell } from "@/components/legal/DocumentShell"

const SECTIONS = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    body: (
      <p>
        By accessing or using Yuki, you agree to be bound by these Terms of
        Service. If you do not agree to these terms, please do not use the
        service.
      </p>
    ),
  },
  {
    id: "description",
    title: "Description of Service",
    body: (
      <p>
        Yuki provides a platform for users to allocate digital assets to on-chain
        yield-generating strategies. The service is provided on a non-custodial
        basis, meaning users retain control of their assets at all times.
      </p>
    ),
  },
  {
    id: "responsibilities",
    title: "User Responsibilities",
    body: (
      <p>
        You are responsible for maintaining the security of your account
        credentials and wallet access. You acknowledge that you understand the
        risks associated with digital assets and decentralized finance.
      </p>
    ),
  },
  {
    id: "no-guarantees",
    title: "No Guarantees",
    body: (
      <p>
        Yuki does not guarantee any specific returns or outcomes. Past
        performance is not indicative of future results. All investments carry
        risk, including the potential loss of principal.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    body: (
      <p>
        To the maximum extent permitted by law, Yuki shall not be liable for any
        indirect, incidental, special, consequential, or punitive damages
        resulting from your use of the service.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to Terms",
    body: (
      <p>
        We reserve the right to modify these terms at any time. Continued use of
        the service after changes constitutes acceptance of the modified terms.
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <DocumentShell
      slug="terms"
      title="Terms of Service"
      lastUpdated="December 2024"
      groupLabel="Agreement"
      sections={SECTIONS}
      footer={
        <p className="text-sm leading-relaxed text-white/55">
          For questions about these terms, contact us at{" "}
          <a
            href="mailto:legal@yuki.finance"
            className="text-white rounded-sm outline-none transition-colors hover:text-[#e1a8f0] focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
          >
            legal@yuki.finance
          </a>
          .
        </p>
      }
    />
  )
}
