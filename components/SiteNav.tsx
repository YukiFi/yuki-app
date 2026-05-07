"use client"

import Image from "next/image"
import Link from "next/link"

const LAVENDER = "#e1a8f0"

export function SiteNav() {
  return (
    <header
      className="sticky top-0 z-30 bg-zinc-950 shadow-[0_1px_0_0_rgba(255,255,255,0.03),0_12px_32px_-16px_rgba(0,0,0,0.7)]"
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 sm:px-10">
        <Link
          href="/"
          aria-label="Yuki home"
          className="inline-flex items-center rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
        >
          <Image
            src="/images/applet.svg"
            alt="Yuki"
            width={28}
            height={28}
            priority
          />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/login"
            className="hidden sm:inline-flex h-9 items-center rounded-md px-3 text-sm font-medium tracking-tight text-white/70 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            style={{ backgroundColor: LAVENDER }}
            className="inline-flex h-9 items-center rounded-md px-4 text-sm font-semibold tracking-tight text-black outline-none transition-[box-shadow,transform,filter] duration-150 hover:brightness-105 hover:shadow-[0_0_28px_-4px_rgba(225,168,240,0.55)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#e1a8f0] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  )
}
