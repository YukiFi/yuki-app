"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Home,
  Activity,
  User,
  Users,
  Settings,
  HelpCircle,
  FileText,
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const navSecondary = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Help",
    url: "/help",
    icon: HelpCircle,
  },
  {
    title: "Legal",
    url: "/legal",
    icon: FileText,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  
  // Build nav items with dynamic profile URL
  const navMain = React.useMemo(() => {
    // Strip the @ from username for the URL (e.g. @haruxe -> /haruxe)
    const cleanUsername = user?.username?.replace(/^@/, '')
    const profileUrl = cleanUsername ? `/${cleanUsername}` : "/settings"
    
    return [
      {
        title: "Home",
        url: "/",
        icon: Home,
      },
      {
        title: "Activity",
        url: "/activity",
        icon: Activity,
      },
      {
        title: "Profile",
        url: profileUrl,
        icon: User,
      },
      {
        title: "Contacts",
        url: "/contacts",
        icon: Users,
      },
    ]
  }, [user?.username])

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Header - refined spacing, centered in collapsed state */}
      <SidebarHeader className="px-4 pt-5 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[slot=sidebar-menu-button]:!p-0 hover:bg-transparent"
            >
              <Link href="/">
                <Image
                  src="/images/appletname.svg"
                  alt="Yuki"
                  width={72}
                  height={28}
                  className="h-[40px] w-auto transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:hidden opacity-90"
                />
                <Image
                  src="/images/applet.svg"
                  alt="Yuki"
                  width={28}
                  height={28}
                  className="h-7 w-7 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hidden group-data-[collapsible=icon]:block opacity-80"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content - generous top padding for breathing room */}
      <SidebarContent className="px-2 pt-2">
        <NavMain items={navMain} />
        {/* Separator - more subtle, better spacing */}
        <SidebarSeparator className="my-3 mx-2 bg-white/[0.04]" />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      {/* Footer - refined padding */}
      <SidebarFooter className="px-2 pb-4 pt-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
