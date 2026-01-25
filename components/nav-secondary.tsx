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
        <SidebarMenu className="gap-1">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                tooltip={item.title}
                className="h-10 px-3 rounded-xl"
              >
                <Link href={item.url}>
                  <item.icon className="!size-[18px] text-white/40 shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-data-[collapsible=icon]:!size-5" strokeWidth={1.5} />
                  <span className="text-sm text-white/45 font-normal transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:hidden">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
