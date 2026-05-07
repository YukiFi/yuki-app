"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Activity,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  PieChart,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { useLogout } from "@account-kit/react"
import { useAuth } from "@/lib/hooks/useAuth"

const LAVENDER = "#e1a8f0"

type NavItem = { label: string; href: string; icon: LucideIcon }

const PRIMARY_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Allocations", href: "/allocations", icon: PieChart },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Contacts", href: "/contacts", icon: Users },
]

// ────────────────────────────────────────────────────────────────────────────
// Context — drives mobile drawer + desktop compact mode.
// ────────────────────────────────────────────────────────────────────────────

type SidebarContextValue = {
  // Mobile drawer
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  // Desktop compact (icon-only) mode
  isCollapsed: boolean
  toggleCollapsed: () => void
}

const COLLAPSE_STORAGE_KEY = "yuki:sidebar-collapsed"

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((o) => !o), [])

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "true" : "false")
      } catch {
        // ignore — preference just won't persist this session
      }
      return next
    })
  }, [])

  // Restore the persisted collapse preference on mount
  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true") {
        setIsCollapsed(true)
      }
    } catch {
      // ignore
    }
  }, [])

  // Close the mobile drawer whenever the route changes
  const pathname = usePathname()
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Auto-close the mobile drawer when crossing into the lg breakpoint, so
  // the open state doesn't silently persist after the layout switches to
  // the persistent desktop sidebar (and vice versa on the way back).
  useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia("(min-width: 1024px)")
    const onChange = () => setIsOpen(false)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  return (
    <SidebarContext.Provider
      value={{ isOpen, open, close, toggle, isCollapsed, toggleCollapsed }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>")
  return ctx
}

// ────────────────────────────────────────────────────────────────────────────
// Mobile trigger — sits in the top header on small screens
// ────────────────────────────────────────────────────────────────────────────

export function SidebarTrigger() {
  const { toggle, isOpen } = useSidebar()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-[4px] text-white/70 outline-none transition-colors hover:bg-zinc-900 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
    >
      {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
    </button>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Nav row
// ────────────────────────────────────────────────────────────────────────────

function NavRow({
  item,
  active,
  collapsed,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
}) {
  const Icon = item.icon
  const disabled = item.href === "#"
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      title={collapsed ? item.label : undefined}
      className={`group relative flex items-center h-9 rounded-[4px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#e1a8f0] ${
        collapsed ? "justify-center" : "px-3 gap-3 text-[13px] tracking-tight"
      } ${
        active
          ? "bg-zinc-900 text-white font-medium"
          : "text-white/55 hover:bg-zinc-900 hover:text-white"
      } ${disabled ? "opacity-40 pointer-events-none" : ""}`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1.5 bottom-1.5 w-[2px]"
          style={{ backgroundColor: LAVENDER }}
        />
      )}
      <Icon
        className="w-4 h-4 shrink-0 transition-colors"
        style={active ? { color: LAVENDER } : undefined}
        aria-hidden
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Sidebar
// ────────────────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { isOpen, close, isCollapsed, toggleCollapsed } = useSidebar()
  const pathname = usePathname() ?? ""
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { logout } = useLogout()

  // Track whether we're at the lg breakpoint. The collapsed (icon-only)
  // layout is a desktop-only affordance — on mobile the drawer must always
  // render in its full-width form, regardless of the persisted collapse
  // preference. Default to false so the first paint matches the SSR markup
  // and never shows icon-only on a narrow viewport.
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia("(min-width: 1024px)")
    const apply = () => setIsDesktop(mql.matches)
    apply()
    mql.addEventListener("change", apply)
    return () => mql.removeEventListener("change", apply)
  }, [])

  // Only honour the collapsed flag on desktop. Mobile drawer is never icon-only.
  const effectiveCollapsed = isDesktop && isCollapsed

  // Suppress the width/transform transition while the window is being
  // resized — otherwise the responsive lg: width class changes mid-resize
  // and the sidebar visibly snaps/animates as the browser is dragged.
  const [isResizing, setIsResizing] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    let timer: ReturnType<typeof setTimeout> | null = null
    const onResize = () => {
      setIsResizing(true)
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setIsResizing(false), 120)
    }
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      if (timer) clearTimeout(timer)
    }
  }, [])

  const secondaryItems: NavItem[] = [
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Help", href: "/help", icon: HelpCircle },
    { label: "Legal", href: "/legal", icon: FileText },
  ]

  const isActive = (href: string) => {
    if (href === "#") return false
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }

  const handleSignOut = async () => {
    try {
      await logout()
    } finally {
      router.push("/")
    }
  }

  const initial = (() => {
    const source =
      user?.username?.replace(/^@/, "") ||
      user?.displayName ||
      user?.email ||
      ""
    return source.charAt(0).toUpperCase() || "U"
  })()

  const displayUsername = user?.username
    ? user.username.startsWith("@")
      ? user.username
      : `@${user.username}`
    : "@user"

  return (
    <>
      {/* Mobile scrim */}
      <div
        aria-hidden
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/70 lg:hidden transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        aria-label="Primary navigation"
        className={`
          fixed lg:sticky top-0 left-0 z-50
          h-screen h-dvh w-[240px] shrink-0
          ${isCollapsed ? "lg:w-[64px]" : "lg:w-[240px]"}
          flex flex-col bg-zinc-950
          transform-gpu ${isResizing ? "" : "transition-[width,transform] duration-200 ease-out"}
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo + (mobile-only) close. The collapsed visual only kicks in
            at lg+ — below lg we always render the full mobile-drawer layout. */}
        <div
          className={`flex items-center pt-5 pb-4 shrink-0 px-5 justify-between ${
            effectiveCollapsed ? "lg:justify-center lg:px-0" : ""
          }`}
        >
          {/* Mobile: home link (no collapse on mobile, the drawer just closes) */}
          <Link
            href="/"
            aria-label="Yuki home"
            className="lg:hidden inline-flex items-center rounded-[4px] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
          >
            <Image
              src="/images/applet.svg"
              alt="Yuki"
              width={28}
              height={28}
              priority
            />
          </Link>

          {/* Desktop: logo doubles as the collapse toggle */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:inline-flex items-center rounded-[4px] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
          >
            <Image
              src="/images/applet.svg"
              alt="Yuki"
              width={28}
              height={28}
              priority
            />
          </button>

          {/* Mobile close */}
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-white/60 outline-none transition-colors hover:bg-zinc-900 hover:text-white focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable middle — primary + secondary nav. Takes the remaining
            vertical space and scrolls internally on short viewports so the
            footer is always reachable. */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <nav className="px-3 pt-2 space-y-0.5">
            {PRIMARY_ITEMS.map((item) => (
              <NavRow
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={effectiveCollapsed}
              />
            ))}
          </nav>

          {/* Separator via background shade band, no border */}
          <div className="px-3 mt-5 mb-4">
            <div className="h-px bg-zinc-900" />
          </div>

          <nav className="px-3 space-y-0.5">
            {secondaryItems.map((item) => (
              <NavRow
                key={item.label}
                item={item}
                active={isActive(item.href)}
                collapsed={effectiveCollapsed}
              />
            ))}
          </nav>
        </div>

        {/* Footer — user identity + sign out */}
        <div className="px-3 pb-4 pt-3 shrink-0">
          {effectiveCollapsed ? (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={`Signed in as ${displayUsername} — expand sidebar`}
              title={displayUsername}
              className="hidden lg:flex w-9 h-9 mx-auto items-center justify-center rounded-[4px] outline-none transition-colors hover:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
            >
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-7 h-7 rounded-[4px] object-cover"
                />
              ) : (
                <span className="w-7 h-7 rounded-[4px] flex items-center justify-center text-xs font-semibold tracking-tight bg-white text-black">
                  {initial}
                </span>
              )}
            </button>
          ) : null}
          <div className={`bg-zinc-900 rounded-[4px] px-3 py-2.5 flex items-center gap-3 ${effectiveCollapsed ? "lg:hidden" : ""}`}>
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="w-8 h-8 rounded-[4px] object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-[4px] flex items-center justify-center text-xs font-semibold tracking-tight bg-white text-black shrink-0">
                {initial}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium tracking-tight text-white truncate">
                {isLoading ? "…" : displayUsername}
              </p>
              {user?.email && (
                <p className="text-[11px] text-white/40 truncate">
                  {user.email}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-white/40 outline-none transition-colors hover:text-white hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-[#e1a8f0]"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
