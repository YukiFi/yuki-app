"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// Visual representation of non-custodial architecture
function CustodyDiagram() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="py-10"
    >
      <div className="relative flex items-center justify-center gap-8 sm:gap-16">
        {/* Your Keys */}
        <div className="flex flex-col items-center">
          <motion.div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </motion.div>
          <p className="text-white font-medium text-sm">Your Keys</p>
          <p className="text-white/40 text-xs mt-1">On your device</p>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            className="w-12 sm:w-24 h-px bg-gradient-to-r from-white/20 via-white/10 to-white/20"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          />
          <p className="text-white/20 text-xs">Signs</p>
        </div>

        {/* Smart Contract */}
        <div className="flex flex-col items-center">
          <motion.div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          </motion.div>
          <p className="text-white font-medium text-sm">Vault Contract</p>
          <p className="text-white/40 text-xs mt-1">On-chain</p>
        </div>
      </div>

      {/* Explanation */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-white/40 text-sm mt-8 max-w-md mx-auto"
      >
        Only you can authorize transactions. Yuki never has access to your funds.
      </motion.p>
    </motion.div>
  );
}

// Section component
function Section({
  title,
  description,
  children,
  delay = 0,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mb-12"
    >
      <h2 className="text-white font-medium text-lg mb-1">{title}</h2>
      {description && (
        <p className="text-white/40 text-sm mb-6">{description}</p>
      )}
      <div className="space-y-3">
        {children}
      </div>
    </motion.section>
  );
}

// Action card component
function ActionCard({
  icon,
  title,
  description,
  action,
  actionLabel,
  variant = "default",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
  variant?: "default" | "warning" | "link";
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative py-5 px-5 rounded-2xl cursor-pointer overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={action}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
          <div className="text-white/50">{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium mb-0.5">{title}</p>
          <p className="text-white/40 text-sm">{description}</p>
        </div>
        {actionLabel && (
          <motion.span
            className={`
              text-sm font-medium flex-shrink-0
              ${variant === "warning" ? "text-red-400/80" : "text-white/40"}
            `}
            animate={{ x: isHovered ? 4 : 0 }}
          >
            {actionLabel}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

// Session item
function SessionItem({
  device,
  location,
  lastActive,
  isCurrent,
}: {
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}) {
  return (
    <div className="py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
          <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-white font-medium text-sm">{device}</p>
            {isCurrent && (
              <span className="text-xs text-emerald-400/80 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                Current
              </span>
            )}
          </div>
          <p className="text-white/40 text-xs">{location} · {lastActive}</p>
        </div>
      </div>
      {!isCurrent && (
        <button className="text-white/30 hover:text-red-400/80 text-sm transition-colors cursor-pointer">
          Revoke
        </button>
      )}
    </div>
  );
}

export default function SecurityPage() {
  const { user } = useUser();
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-4 sm:px-8 lg:px-16 py-12 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-4"
      >
        <Link 
          href="/settings" 
          className="text-white/40 hover:text-white/60 text-sm flex items-center gap-2 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Settings
        </Link>
        <h1 className="text-4xl font-medium text-white">Security</h1>
      </motion.div>

      {/* Non-custodial explanation */}
      <CustodyDiagram />

      {/* Wallet Control */}
      <Section 
        title="Wallet Control" 
        description="Manage your self-custodial wallet"
        delay={0.3}
      >
        <ActionCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          }
          title="Export Private Key"
          description="Back up your wallet recovery phrase"
          actionLabel="Export"
          action={() => setShowExportModal(true)}
        />

        <ActionCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
            </svg>
          }
          title="Passkey Authentication"
          description="Use biometrics to sign transactions"
          actionLabel="Enabled"
        />
      </Section>

      {/* Session Management */}
      <Section 
        title="Active Sessions" 
        description="Devices signed into your account"
        delay={0.35}
      >
        <div className="rounded-2xl bg-white/[0.02] px-5 divide-y divide-white/[0.04]">
          <SessionItem
            device="Chrome on macOS"
            location="San Francisco, CA"
            lastActive="Now"
            isCurrent={true}
          />
          <SessionItem
            device="Safari on iPhone"
            location="San Francisco, CA"
            lastActive="2 hours ago"
            isCurrent={false}
          />
        </div>
      </Section>

      {/* Smart Contract Transparency */}
      <Section 
        title="Vault Verification" 
        description="On-chain contract details"
        delay={0.4}
      >
        <ActionCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          }
          title="View Contract on Etherscan"
          description="0x742d...8f44 · Verified source code"
          actionLabel="Open"
        />

        <ActionCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          }
          title="Security Audits"
          description="Audited by Trail of Bits, OpenZeppelin"
          actionLabel="View Reports"
        />
      </Section>

      {/* Transaction Simulation */}
      <Section 
        title="Transaction Safety" 
        delay={0.45}
      >
        <div className="rounded-2xl bg-white/[0.02] p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium mb-1">Transaction Simulation</p>
              <p className="text-white/40 text-sm">
                Every transaction is simulated before signing to show you exactly 
                what will happen. No hidden approvals or unexpected transfers.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Danger Zone */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-16 pt-8"
      >
        <h2 className="text-white/30 text-xs uppercase tracking-wider mb-4">
          Danger Zone
        </h2>
        <ActionCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
          title="Sign Out All Devices"
          description="Revoke access from all other sessions"
          actionLabel="Sign Out"
          variant="warning"
        />
      </motion.section>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowExportModal(false)}
          >
            <div className="absolute inset-0 bg-black/80" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-[#121215] rounded-3xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Export Private Key</h3>
                <p className="text-white/50 text-sm">
                  Your private key gives complete access to your funds. 
                  Never share it with anyone.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  className="w-full py-4 rounded-2xl bg-red-500/10 text-red-400 font-medium hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  I Understand, Show Key
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full py-4 rounded-2xl bg-white/[0.04] text-white/60 font-medium hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
