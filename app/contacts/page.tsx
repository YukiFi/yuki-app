"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSmartAccountClient } from "@account-kit/react";
import { useTransactionHistory } from "@/lib/hooks/useTransactionHistory";

const BRAND_LAVENDER = "#e1a8f0";

interface SavedContact {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  walletAddress: string | null;
  nickname: string | null;
  addedAt: string;
}

interface TransactionContact {
  address: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  lastTransaction: Date;
  totalSent: number;
  totalReceived: number;
  transactionCount: number;
  isSaved?: boolean;
}

// Extract unique contacts from transactions
function extractContacts(transactions: { counterparty?: string; amount: number; timestamp: Date; type: string }[]): TransactionContact[] {
  const contactMap = new Map<string, TransactionContact>();
  
  transactions.forEach(tx => {
    if (!tx.counterparty) return;
    
    const address = tx.counterparty.toLowerCase();
    const existing = contactMap.get(address);
    
    if (existing) {
      existing.transactionCount++;
      if (tx.type === 'sent') {
        existing.totalSent += Math.abs(tx.amount);
      } else {
        existing.totalReceived += tx.amount;
      }
      if (tx.timestamp > existing.lastTransaction) {
        existing.lastTransaction = tx.timestamp;
      }
    } else {
      contactMap.set(address, {
        address: tx.counterparty,
        lastTransaction: tx.timestamp,
        totalSent: tx.type === 'sent' ? Math.abs(tx.amount) : 0,
        totalReceived: tx.type === 'received' ? tx.amount : 0,
        transactionCount: 1,
      });
    }
  });
  
  // Sort by most recent transaction
  return Array.from(contactMap.values())
    .sort((a, b) => b.lastTransaction.getTime() - a.lastTransaction.getTime());
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function ContactRow({ contact, index }: { contact: TransactionContact; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [resolvedUser, setResolvedUser] = useState<{
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  } | null>(null);
  
  // Try to resolve the address to a user
  useEffect(() => {
    async function resolveUser() {
      try {
        const response = await fetch(`/api/user/by-address?address=${contact.address}`);
        if (response.ok) {
          const data = await response.json();
          setResolvedUser(data);
        }
      } catch {
        // Ignore - user might not be in our system
      }
    }
    resolveUser();
  }, [contact.address]);
  
  const displayName = resolvedUser?.displayName || resolvedUser?.username?.replace('@', '') || 
    `${contact.address.slice(0, 6)}...${contact.address.slice(-4)}`;
  const username = resolvedUser?.username;
  const profileUrl = username ? `/${username.replace('@', '')}` : undefined;
  
  const netAmount = contact.totalReceived - contact.totalSent;
  
  const content = (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative py-4 sm:py-5 cursor-pointer"
    >
      {/* Hover background */}
      <motion.div
        className="absolute inset-x-0 inset-y-0 -mx-4 sm:-mx-5 rounded-2xl"
        initial={false}
        animate={{
          backgroundColor: isHovered ? "rgba(255,255,255,0.03)" : "transparent",
        }}
        transition={{ duration: 0.2 }}
      />
      
      <div className="relative flex items-center gap-3 sm:gap-4">
        {/* Avatar */}
        <motion.div
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{
            backgroundColor: resolvedUser?.avatarUrl ? "transparent" : "rgba(255,255,255,0.08)",
          }}
          animate={{
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {resolvedUser?.avatarUrl ? (
            <img 
              src={resolvedUser.avatarUrl} 
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white/60 text-sm font-medium">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-medium text-sm sm:text-base truncate">
              {displayName}
            </p>
            {username && (
              <span className="text-white/30 text-xs sm:text-sm truncate">
                {username}
              </span>
            )}
          </div>
          <p className="text-white/30 text-xs sm:text-sm mt-0.5">
            {contact.transactionCount} transaction{contact.transactionCount !== 1 ? 's' : ''} · {formatRelativeTime(contact.lastTransaction)}
          </p>
        </div>

        {/* Net amount */}
        <motion.div
          className="text-sm sm:text-base font-medium tabular-nums flex-shrink-0 text-right"
          style={{ 
            color: netAmount >= 0 ? "white" : "rgba(255,255,255,0.5)",
            fontFeatureSettings: "'tnum' 1"
          }}
          animate={{
            x: isHovered ? -4 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          <div>
            {netAmount >= 0 ? "+" : "-"}${Math.abs(netAmount).toLocaleString("en-US", { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </div>
          <div className="text-white/30 text-xs font-normal">
            net
          </div>
        </motion.div>

        {/* Arrow on hover */}
        <motion.div
          className="text-white/20 hidden sm:block"
          initial={{ opacity: 0, x: -10 }}
          animate={{ 
            opacity: isHovered ? 1 : 0, 
            x: isHovered ? 0 : -10 
          }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
  
  if (profileUrl) {
    return <Link href={profileUrl}>{content}</Link>;
  }
  
  return content;
}

function SavedContactRow({ contact, onRemove }: { contact: SavedContact; onRemove: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const displayName = contact.displayName || contact.username?.replace('@', '') || 'Unknown';
  const profileUrl = contact.username ? `/${contact.username.replace('@', '')}` : undefined;
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative py-4 sm:py-5"
    >
      {/* Hover background */}
      <motion.div
        className="absolute inset-x-0 inset-y-0 -mx-4 sm:-mx-5 rounded-2xl"
        initial={false}
        animate={{
          backgroundColor: isHovered ? "rgba(255,255,255,0.03)" : "transparent",
        }}
        transition={{ duration: 0.2 }}
      />
      
      <div className="relative flex items-center gap-3 sm:gap-4">
        {/* Avatar */}
        <Link href={profileUrl || "#"} className="flex-shrink-0">
          <motion.div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center overflow-hidden cursor-pointer"
            style={{
              backgroundColor: contact.avatarUrl ? "transparent" : "rgba(255,255,255,0.08)",
            }}
            animate={{
              scale: isHovered ? 1.05 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {contact.avatarUrl ? (
              <img 
                src={contact.avatarUrl} 
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white/60 text-sm font-medium">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </motion.div>
        </Link>

        {/* Content */}
        <Link href={profileUrl || "#"} className="flex-1 min-w-0 cursor-pointer">
          <div className="flex items-center gap-2">
            <p className="text-white font-medium text-sm sm:text-base truncate">
              {contact.nickname || displayName}
            </p>
            {contact.username && (
              <span className="text-white/30 text-xs sm:text-sm truncate">
                {contact.username}
              </span>
            )}
          </div>
          {contact.nickname && (
            <p className="text-white/30 text-xs sm:text-sm mt-0.5 truncate">
              {displayName}
            </p>
          )}
        </Link>

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          className="text-white/30 hover:text-red-400 transition-colors p-2 -mr-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Add Contact Modal
function AddContactModal({ 
  open, 
  onClose, 
  onAdd,
  walletAddress 
}: { 
  open: boolean; 
  onClose: () => void;
  onAdd: (contact: SavedContact) => void;
  walletAddress: string;
}) {
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [foundUser, setFoundUser] = useState<{ username: string; displayName: string | null; avatarUrl: string | null } | null>(null);

  // Check if username exists
  useEffect(() => {
    if (username.length < 3) {
      setUserExists(null);
      setFoundUser(null);
      return;
    }

    setIsChecking(true);
    const timeout = setTimeout(async () => {
      try {
        const cleanUsername = username.startsWith("@") ? username : `@${username}`;
        const response = await fetch("/api/user/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: cleanUsername, type: "username" }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserExists(data.exists);
          if (data.exists && data.user) {
            setFoundUser({
              username: data.user.username,
              displayName: data.user.displayName,
              avatarUrl: data.user.avatarUrl,
            });
          } else {
            setFoundUser(null);
          }
        }
      } catch {
        setUserExists(null);
        setFoundUser(null);
      } finally {
        setIsChecking(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || username.length < 3 || !userExists) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": walletAddress,
        },
        body: JSON.stringify({
          username: username.startsWith("@") ? username : `@${username}`,
          nickname: nickname || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add contact");
      }

      const data = await response.json();
      onAdd(data.contact);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add contact");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUsername("");
    setNickname("");
    setError(null);
    setUserExists(null);
    setFoundUser(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={handleClose}
        >
          <motion.div 
            className="absolute inset-0 bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full sm:max-w-[440px] mx-0 sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black sm:bg-white/[0.03] rounded-t-3xl sm:rounded-3xl overflow-hidden">
              {/* Header */}
              <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/50 text-sm font-medium">Add Contact</p>
                  <button
                    onClick={handleClose}
                    className="text-white/30 hover:text-white/50 transition-colors cursor-pointer p-1 -mr-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Username input */}
                <div className="px-6 sm:px-8 pb-4">
                  <p className="text-white/40 text-sm font-medium mb-3">Username</p>
                  <div className="flex items-center gap-1">
                    <span style={{ color: BRAND_LAVENDER }} className="text-lg font-medium">@</span>
                    <input
                      type="text"
                      value={username.replace(/^@/, "")}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                      placeholder="username"
                      className="flex-1 bg-transparent text-white text-lg focus:outline-none placeholder:text-white/25"
                      autoFocus
                    />
                  </div>
                  
                  {/* Status */}
                  <div className="mt-3 min-h-[20px]">
                    {isChecking && username.length >= 3 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-white/40 text-xs"
                      >
                        <span className="w-3 h-3 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
                        Searching...
                      </motion.div>
                    )}
                    {!isChecking && userExists === true && foundUser && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2"
                      >
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                          {foundUser.avatarUrl ? (
                            <img src={foundUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white/60 text-xs">{(foundUser.displayName || foundUser.username)?.[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <span className="text-emerald-400 text-xs">
                          {foundUser.displayName || foundUser.username}
                        </span>
                      </motion.div>
                    )}
                    {!isChecking && userExists === false && username.length >= 3 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-xs"
                      >
                        User not found
                      </motion.p>
                    )}
                  </div>
                </div>

                {/* Nickname input (optional) */}
                <div className="px-6 sm:px-8 pb-4">
                  <p className="text-white/40 text-sm font-medium mb-3">Nickname (optional)</p>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="e.g. Mom, Best Friend"
                    className="w-full bg-transparent text-white text-lg focus:outline-none placeholder:text-white/25"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="px-6 sm:px-8 pb-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Action */}
                <div className="px-6 sm:px-8 pb-8 pt-4">
                  <button
                    type="submit"
                    disabled={!userExists || isLoading}
                    className={`
                      w-full py-4 rounded-xl sm:rounded-2xl text-base font-medium transition-all duration-150 cursor-pointer touch-manipulation
                      ${userExists && !isLoading
                        ? "bg-white text-black active:scale-[0.98]" 
                        : "bg-white/[0.05] text-white/30"
                      }
                    `}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Adding...
                      </span>
                    ) : (
                      "Add Contact"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ContactsPage() {
  const { client } = useSmartAccountClient({});
  const [filter, setFilter] = useState<"saved" | "recent">("saved");
  const [showAddModal, setShowAddModal] = useState(false);
  const [savedContacts, setSavedContacts] = useState<SavedContact[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  // Get wallet address from smart account client
  const walletAddress = client?.account?.address as `0x${string}` | undefined;
  const { transactions, isLoading: isLoadingRecent } = useTransactionHistory(walletAddress, { enabled: !!walletAddress, limit: 100 });

  // Fetch saved contacts
  const fetchSavedContacts = useCallback(async () => {
    if (!walletAddress) return;
    
    setIsLoadingSaved(true);
    try {
      const response = await fetch("/api/contacts", {
        headers: { "x-wallet-address": walletAddress },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedContacts(data.contacts || []);
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setIsLoadingSaved(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchSavedContacts();
  }, [fetchSavedContacts]);

  // Extract contacts from transactions
  const recentContacts = useMemo(() => extractContacts(transactions), [transactions]);

  const handleAddContact = (contact: SavedContact) => {
    setSavedContacts(prev => [contact, ...prev.filter(c => c.userId !== contact.userId)]);
  };

  const handleRemoveContact = async (contactUserId: string) => {
    if (!walletAddress) return;
    
    try {
      const response = await fetch(`/api/contacts?userId=${contactUserId}`, {
        method: "DELETE",
        headers: { "x-wallet-address": walletAddress },
      });
      
      if (response.ok) {
        setSavedContacts(prev => prev.filter(c => c.userId !== contactUserId));
      }
    } catch (error) {
      console.error("Failed to remove contact:", error);
    }
  };

  const isLoading = filter === "saved" ? isLoadingSaved : isLoadingRecent;
  const isEmpty = filter === "saved" ? savedContacts.length === 0 : recentContacts.length === 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full flex flex-col items-center px-4 sm:px-8 lg:px-16 py-8 sm:py-12">
      <div className="w-full max-w-[1100px]">
        {/* Header */}
        <div className="mb-8 sm:mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Contacts</h1>
            <p className="text-white/40 text-sm sm:text-base">
              <span style={{ color: BRAND_LAVENDER }}>{savedContacts.length}</span> saved contact{savedContacts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer"
            style={{ 
              backgroundColor: `${BRAND_LAVENDER}20`,
              color: BRAND_LAVENDER
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-8 sm:mb-10">
          {[
            { key: "saved", label: "Saved" },
            { key: "recent", label: "Recent" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: filter === key ? `${BRAND_LAVENDER}20` : "transparent",
                color: filter === key ? BRAND_LAVENDER : "rgba(255,255,255,0.4)"
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Contacts list */}
        <div className="space-y-4 sm:space-y-6">
          {isLoading ? (
            <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-4 py-8 sm:px-5 sm:py-12 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : isEmpty ? (
            <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-4 py-8 sm:px-5 sm:py-12 text-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${BRAND_LAVENDER}15` }}
              >
                <svg 
                  className="w-6 h-6" 
                  style={{ color: BRAND_LAVENDER }}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <p className="text-white/40 text-sm">
                {filter === "saved" ? "No saved contacts yet" : "No recent transactions"}
              </p>
              <p className="text-white/25 text-xs mt-1">
                {filter === "saved" 
                  ? "Add contacts by username to send money quickly" 
                  : "Send or receive money to see your contacts here"
                }
              </p>
              {filter === "saved" && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer"
                  style={{ 
                    backgroundColor: `${BRAND_LAVENDER}20`,
                    color: BRAND_LAVENDER
                  }}
                >
                  Add your first contact
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white/[0.03] rounded-2xl sm:rounded-3xl px-4 py-2 sm:px-5 sm:py-3">
              <div className="divide-y divide-white/[0.04]">
                {filter === "saved" ? (
                  savedContacts.map((contact) => (
                    <SavedContactRow 
                      key={contact.id} 
                      contact={contact}
                      onRemove={() => handleRemoveContact(contact.userId)}
                    />
                  ))
                ) : (
                  recentContacts.map((contact, index) => (
                    <ContactRow 
                      key={contact.address} 
                      contact={contact} 
                      index={index}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      {walletAddress && (
        <AddContactModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddContact}
          walletAddress={walletAddress}
        />
      )}
    </div>
  );
}
