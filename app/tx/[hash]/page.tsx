import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTransactionByHash } from "@/lib/transactions/getTransaction";
import { TransactionView } from "./TransactionView";

type Params = Promise<{ hash: string }>;

function shortAddress(a: string) {
  if (!a) return "Unknown";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function partyLabel(party: {
  username: string | null;
  displayName: string | null;
  address: string;
}) {
  if (party.username) return `@${party.username}`;
  if (party.displayName) return party.displayName;
  return shortAddress(party.address);
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { hash } = await params;
  const tx = await getTransactionByHash(hash).catch(() => null);
  if (!tx) {
    return {
      title: "Transaction not found · Yuki",
      description: "We couldn't find this transaction.",
    };
  }
  const fromName = partyLabel(tx.from);
  const toName = partyLabel(tx.to);
  const amount = tx.amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const title = `${fromName} → ${toName} · $${amount} · Yuki`;
  const description =
    tx.status === "success"
      ? `${fromName} sent $${amount} ${tx.tokenSymbol} to ${toName} on ${tx.network}.`
      : tx.status === "pending"
        ? `Pending: ${fromName} → ${toName} · $${amount} ${tx.tokenSymbol}`
        : `Failed transfer: ${fromName} → ${toName}`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function TransactionPage({
  params,
}: {
  params: Params;
}) {
  const { hash } = await params;
  const tx = await getTransactionByHash(hash);
  if (!tx) notFound();
  return <TransactionView tx={tx} />;
}
