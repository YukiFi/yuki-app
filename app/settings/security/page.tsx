"use client";

import { useState } from "react";
import { useSignerStatus, useSmartAccountClient } from "@account-kit/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const BRAND_LAVENDER = "#e1a8f0";

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
          <p className="text-white font-medium text-sm">Passkey</p>
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
          <p className="text-white font-medium text-sm">Smart Wallet</p>
          <p className="text-white/40 text-xs mt-1">On-chain</p>
        </div>
      </div>

      {/* Explanation */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="text-white/40 text-sm text-center mt-8 max-w-md mx-auto"
      >
        Your passkey never leaves your device. It signs transactions locally, 
        and only the signature is sent to the blockchain.
      </motion.p>
    </motion.div>
  );
}

// Security feature card
function SecurityFeature({ 
  title, 
  description, 
  status, 
  icon 
}: { 
  title: string; 
  description: string; 
  status: 'enabled' | 'optional' | 'info';
  icon: React.ReactNode;
}) {
  const statusStyles = {
    enabled: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Enabled' },
    optional: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Optional' },
    info: { bg: 'bg-white/[0.03]', text: 'text-white/40', label: 'Info' },
  };

  const style = statusStyles[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-white/[0.02] rounded-2xl border border-white/[0.04] hover:border-white/[0.08] transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-white font-medium">{title}</h3>
            {status !== 'info' && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                {style.label}
              </span>
            )}
          </div>
          <p className="text-white/50 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function SecurityPage() {
  const { isConnected, isInitializing } = useSignerStatus();
  const { client } = useSmartAccountClient({});
  
  // Get wallet address from smart account client
  const walletAddress = client?.account?.address;

  if (isInitializing) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link 
          href="/settings" 
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Settings</span>
        </Link>
        <h1 className="text-3xl font-semibold text-white">Security</h1>
        <p className="text-white/50 mt-2">
          Your wallet is secured by Alchemy Smart Wallets with passkey authentication.
        </p>
      </motion.div>

      {/* Non-Custodial Diagram */}
      <div className="mb-10 p-6 bg-white/[0.02] rounded-3xl border border-white/[0.04]">
        <h2 className="text-white font-medium text-center mb-2">Non-Custodial Architecture</h2>
        <p className="text-white/40 text-sm text-center">
          Only you control your funds. Yuki never has access to your keys.
        </p>
        <CustodyDiagram />
      </div>

      {/* Security Features */}
      <div className="space-y-4">
        <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
          Security Features
        </h2>

        <SecurityFeature
          title="Passkey Authentication"
          description="Your wallet is protected by biometric authentication (Face ID, Touch ID, or Windows Hello). This hardware-level security is resistant to phishing attacks."
          status="enabled"
          icon={
            <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
            </svg>
          }
        />

        <SecurityFeature
          title="Smart Contract Wallet"
          description="Your funds are held in an on-chain smart contract wallet (ERC-4337). This provides enhanced security and enables features like gas sponsorship."
          status="enabled"
          icon={
            <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          }
        />

        <SecurityFeature
          title="Sponsored Gas Fees"
          description="Yuki pays all transaction fees for you. You never need ETH to send money, reducing friction and preventing failed transactions."
          status="enabled"
          icon={
            <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <SecurityFeature
          title="Base Network"
          description="Built on Base, an Ethereum Layer 2 network. Transactions are secured by Ethereum's consensus and inherit its security guarantees."
          status="info"
          icon={
            <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          }
        />
      </div>

      {/* Wallet Address */}
      {walletAddress && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-5 bg-white/[0.02] rounded-2xl border border-white/[0.04]"
        >
          <h3 className="text-white/60 text-sm font-medium mb-2">Wallet Address</h3>
          <p className="text-white font-mono text-sm break-all">{walletAddress}</p>
          <a
            href={`https://basescan.org/address/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs mt-3 inline-block hover:underline"
            style={{ color: BRAND_LAVENDER }}
          >
            View on Basescan →
          </a>
        </motion.div>
      )}
    </div>
  );
}
