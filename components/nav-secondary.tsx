"use client"

import Link from "next/link"
import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavSecondary({
  items,
  className,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
  className?: string
}) {
  return (
    <SidebarGroup className={cn("px-1", className)}>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                tooltip={item.title}
                className="h-8 px-3 rounded-lg transition-colors duration-150"
              >
                <Link href={item.url}>
                  <item.icon className="!size-4 text-white/40 shrink-0" strokeWidth={1.5} />
                  <span className="text-[13px] text-white/45 font-normal group-data-[collapsible=icon]:hidden">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
