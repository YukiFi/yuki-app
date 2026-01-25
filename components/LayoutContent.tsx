"use client"

import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

/**
 * LayoutContent - Layout shell pattern
 * 
 * Key performance principles:
 * 1. Pre-allocate sidebar space to prevent layout shift
 * 2. Render layout structure immediately, even before auth resolves
 * 3. Use opacity transitions instead of conditional mounting
 * 4. No flash of different layout during hydration
 */
export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isSignedIn, isLoaded } = useUser()
  
  // Pages that should NOT show the sidebar (full-bleed layouts)
  const isLoginPage = pathname === "/login" || pathname?.startsWith("/login/")
  const isOnboardingPage = pathname === "/onboarding"
  const isSetupPage = pathname === "/setup" || pathname?.startsWith("/setup/")
  const isFullBleedPage = isLoginPage || isOnboardingPage || isSetupPage

  // Full-bleed layout for login/onboarding - no sidebar shell needed
  if (isFullBleedPage) {
    return (
      <div className="relative z-10">
        <main>{children}</main>
      </div>
    )
  }

  // App layout with sidebar shell
  // Key: Render the sidebar structure IMMEDIATELY, even before auth resolves
  // This prevents layout shift when auth completes
  return (
    <SidebarProvider>
      {/* Sidebar - always rendered to prevent layout shift */}
      {/* Visibility controlled by opacity, not mount/unmount */}
      <div 
        className="transition-opacity duration-150"
        style={{ opacity: isLoaded && isSignedIn ? 1 : 0 }}
      >
        <AppSidebar />
      </div>
      
      <SidebarInset>
        {/* Header - always visible, provides visual stability */}
        <header 
          className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.04] bg-black px-4 transition-opacity duration-150"
          style={{ opacity: isLoaded && isSignedIn ? 1 : 0 }}
        >
          <SidebarTrigger className="-ml-1 text-white/50 hover:text-white/80 hover:bg-white/[0.04]" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-white/[0.06]" />
          <div className="flex-1" />
        </header>
        
        {/* Main content area - always has consistent padding */}
        <div className="flex-1">
          {/* Show content when auth is resolved, or show immediately if loading takes too long */}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
