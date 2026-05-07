"use client"

import { usePathname } from "next/navigation"
import { useSignerStatus } from "@account-kit/react"
import { Sidebar, SidebarProvider, SidebarTrigger } from "@/components/Sidebar"
import { SiteNav } from "@/components/SiteNav"
import { StatusProvider } from "@/lib/context/StatusContext"
import { ArrivalListener } from "@/components/ArrivalListener"

// Routes that unauthenticated visitors can preview without being redirected
// to /login. Mirror this with BROWSEABLE_ROUTES in OnboardingGuard.
const BROWSEABLE_ROUTES = ["/"]

// Sub-phase 2a feature flag. When off (the default), the dashboard shell
// renders unchanged from pre-2a behavior — StatusProvider mounts but stays
// inert (its internal gates short-circuit on demo + walletAddress checks),
// and ArrivalListener doesn't subscribe to anything.
const INBOUND_V2 = process.env.NEXT_PUBLIC_INBOUND_V2 === "1"

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isConnected, isInitializing } = useSignerStatus()

  const isLoaded = !isInitializing

  // Pages that should NOT show the sidebar (full-bleed layouts)
  const isLoginPage = pathname === "/login" || pathname?.startsWith("/login/")
  const isOnboardingPage = pathname === "/onboarding"
  const isSetupPage = pathname === "/setup" || pathname?.startsWith("/setup/")
  // Transaction receipt pages render their own chrome — full-bleed so the
  // shared link looks the same for everyone (signed-in or not).
  const isTxPage = pathname?.startsWith("/tx/")
  // Request pages (Phase 3) — same shared-link rationale.
  const isRequestPage = pathname?.startsWith("/r/")
  const isFullBleedPage = isLoginPage || isOnboardingPage || isSetupPage || isTxPage || isRequestPage

  if (isFullBleedPage) {
    return (
      <div className="relative z-10">
        <main>{children}</main>
      </div>
    )
  }

  // Public preview shell - unauthenticated visitor browsing a browseable route.
  const isBrowseableRoute = pathname ? BROWSEABLE_ROUTES.includes(pathname) : false
  if (isLoaded && !isConnected && isBrowseableRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-950">
        <SiteNav />
        <main className="flex-1">{children}</main>
      </div>
    )
  }

  // Authenticated app shell. StatusProvider wraps everything so any
  // dashboard page can call useStatusContext() without a defensive check.
  // ArrivalListener mounts as a sibling render-nothing component — its
  // job is purely subscribing to chain events and updating the context
  // cache + DB on USDC arrivals. Gated on INBOUND_V2: when the flag is
  // off the listener doesn't subscribe to anything (useDeposits handles
  // enabled=false cleanly).
  const showShell = isLoaded && isConnected
  return (
    <SidebarProvider>
      <StatusProvider>
        <ArrivalListener enabled={INBOUND_V2} />
        <div className="flex min-h-screen bg-zinc-950">
          {/* shrink-0 keeps the sidebar's track from collapsing when main
              content has wide intrinsic width (tables, code blocks, etc). */}
          <div
            className="shrink-0 transition-opacity duration-150"
            style={{ opacity: showShell ? 1 : 0 }}
          >
            <Sidebar />
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <header
              className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 px-4 sm:px-6 bg-zinc-950 transition-opacity duration-150 shadow-[0_1px_0_0_rgba(255,255,255,0.03),0_12px_32px_-16px_rgba(0,0,0,0.7)]"
              style={{ opacity: showShell ? 1 : 0 }}
            >
              <SidebarTrigger />
              <div className="flex-1" />
            </header>

            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </StatusProvider>
    </SidebarProvider>
  )
}
