"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import {
  LayoutDashboard,
  Activity,
  Send,
  Settings,
  HelpCircle,
  FileText,
} from "lucide-react"

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

const navMain = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Activity",
    url: "/activity",
    icon: Activity,
  },
  {
    title: "Send",
    url: "/send",
    icon: Send,
  },
]

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
                  className="h-[40px] w-auto group-data-[collapsible=icon]:hidden opacity-90"
                />
                <Image
                  src="/images/applet.svg"
                  alt="Yuki"
                  width={24}
                  height={24}
                  className="h-6 w-6 hidden group-data-[collapsible=icon]:block opacity-80"
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
