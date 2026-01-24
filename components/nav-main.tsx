"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
}) {
  const pathname = usePathname()

  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(url)
  }

  return (
    <SidebarGroup className="px-1">
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {items.map((item) => {
            const active = isActive(item.url)
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.title}
                  className="h-9 px-3 rounded-lg transition-colors duration-150"
                >
                  <Link href={item.url}>
                    <item.icon 
                      className={`!size-[18px] shrink-0 ${active ? 'text-white' : 'text-white/50'}`}
                      strokeWidth={active ? 2 : 1.5}
                    />
                    <span className={`text-[13px] group-data-[collapsible=icon]:hidden ${active ? 'font-medium text-white' : 'font-normal text-white/60'}`}>
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
