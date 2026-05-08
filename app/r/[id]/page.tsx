import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock } from "lucide-react";

// Placeholder while Phase 3 lands. The route is reserved so /r/<id> links
// minted by Phase 2 SendModal callbacks resolve to *something*, and so the
// API surface (DB schema, public-route allowlist) doesn't need a migration
// when the real flow ships.

export const metadata: Metadata = {
  title: "Request · Yuki",
  description: "Yuki payment request",
};

export default async function RequestPagePlaceholder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="px-5 sm:px-8 pt-6">
        <div className="max-w-[480px] mx-auto flex items-center justify-between">
          <Link
            href="/"
            aria-label="Yuki home"
            className="inline-flex items-center rounded-[4px] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
          >
            <Image src="/images/applet.svg" alt="Yuki" width={24} height={24} priority />
          </Link>
        </div>
      </header>

      <main className="flex-1 px-5 sm:px-8 flex items-center justify-center pb-16">
        <section className="w-full max-w-[420px] bg-zinc-900 rounded-md p-7 sm:p-9 text-center shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
          <div
            className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(225,168,240,0.12)" }}
          >
            <Clock className="w-5 h-5" style={{ color: "#e1a8f0" }} />
          </div>
          <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-white/45 mb-1">
            Request
          </p>
          <h1 className="text-xl font-medium tracking-tight text-white">
            Coming soon
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Payment request links are launching shortly. This link will resolve
            once requests are live.
          </p>
          <p className="mt-3 text-[11px] tabular-nums text-white/30 break-all">
            {id}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 h-9 px-3 rounded-[4px] bg-zinc-800 text-sm font-medium tracking-tight text-white outline-none transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Yuki
          </Link>
        </section>
      </main>
    </div>
  );
}
