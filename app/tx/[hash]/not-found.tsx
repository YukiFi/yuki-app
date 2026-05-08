import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function TransactionNotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-5">
      <div className="max-w-[420px] text-center">
        <div className="w-12 h-12 mx-auto rounded-[6px] bg-zinc-900 flex items-center justify-center mb-5">
          <FileQuestion className="w-5 h-5 text-white/60" aria-hidden />
        </div>
        <h1 className="text-2xl font-medium tracking-tight">
          Transaction not found
        </h1>
        <p className="mt-2 text-sm text-white/55 leading-relaxed">
          We couldn&apos;t locate this transaction. The hash may be invalid, on
          a different network, or simply not indexed yet.
        </p>
        <Link
          href="/activity"
          className="inline-flex items-center gap-1.5 h-9 px-3 mt-6 rounded-[4px] bg-zinc-800 text-sm font-medium tracking-tight text-white outline-none transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to activity
        </Link>
      </div>
    </div>
  );
}
