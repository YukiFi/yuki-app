"use client"

import { DocumentShell } from "@/components/legal/DocumentShell"

const SECTIONS = [
  {
    id: "collection",
    title: "Information We Collect",
    body: (
      <p>
        We collect information you provide directly, such as your email address
        when you create an account. We also collect wallet addresses used to
        interact with the service.
      </p>
    ),
  },
  {
    id: "usage",
    title: "How We Use Information",
    body: (
      <p>
        We use your information to provide and improve the service, communicate
        with you about your account, and ensure the security of our platform.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "Information Sharing",
    body: (
      <p>
        We do not sell your personal information. We may share information with
        service providers who assist in operating our platform, or as required
        by law.
      </p>
    ),
  },
  {
    id: "security",
    title: "Data Security",
    body: (
      <p>
        We implement appropriate security measures to protect your information.
        However, no method of transmission over the internet is 100% secure.
      </p>
    ),
  },
  {
    id: "rights",
    title: "Your Rights",
    body: (
      <p>
        You may request access to, correction of, or deletion of your personal
        information by contacting us. You may also opt out of certain
        communications.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <p>
        We use cookies and similar technologies to improve your experience and
        analyze usage patterns. You can control cookies through your browser
        settings.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <DocumentShell
      slug="privacy"
      title="Privacy Policy"
      lastUpdated="December 2024"
      groupLabel="Data &amp; privacy"
      sections={SECTIONS}
      footer={
        <p className="text-sm leading-relaxed text-white/55">
          For privacy inquiries, contact us at{" "}
          <a
            href="mailto:privacy@yuki.finance"
            className="text-white rounded-sm outline-none transition-colors hover:text-[#e1a8f0] focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
          >
            privacy@yuki.finance
          </a>
          .
        </p>
      }
    />
  )
}
