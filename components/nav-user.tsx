"use client"

import { useUser, useClerk } from "@clerk/nextjs"
import {
  IconLogout,
  IconDotsVertical,
} from "@tabler/icons-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user } = useUser()
  const { signOut } = useClerk()

  // Get first letter for the simple profile icon
  const getInitial = () => {
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase()
    }
    if (user?.primaryPhoneNumber?.phoneNumber) {
      return user.primaryPhoneNumber.phoneNumber.charAt(0)
    }
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress.charAt(0).toUpperCase()
    }
    return "U"
  }

  // Format phone for display
  const formatPhone = (phone: string | undefined) => {
    if (!phone) return ""
    const cleaned = phone.replace(/\D/g, "")
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  // Get display name
  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    if (user?.firstName) {
      return user.firstName
    }
    if (user?.primaryPhoneNumber?.phoneNumber) {
      return formatPhone(user.primaryPhoneNumber.phoneNumber)
    }
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress
    }
    return "User"
  }

  // Get email or phone for subtitle
  const getSubtitle = () => {
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress
    }
    if (user?.primaryPhoneNumber?.phoneNumber) {
      return formatPhone(user.primaryPhoneNumber.phoneNumber)
    }
    return null
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-12 px-2 rounded-lg data-[state=open]:bg-white/[0.04] cursor-pointer transition-colors duration-150"
            >
              {/* Avatar - refined sizing, centered in collapsed state */}
              <div className="flex size-7 items-center justify-center rounded-full bg-white/90 text-[#0f0f12] shrink-0">
                <span className="text-xs font-semibold">{getInitial()}</span>
              </div>
              {/* Info - hidden in collapsed state */}
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-[13px] font-medium text-white/80">{getDisplayName()}</span>
                {getSubtitle() && (
                  <span className="truncate text-[11px] text-white/40">{getSubtitle()}</span>
                )}
              </div>
              <IconDotsVertical className="ml-auto size-3.5 text-white/30 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-52 rounded-xl bg-[#121215] border border-white/[0.06]"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            {/* User info header - refined */}
            <div className="px-3 py-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-white/90 text-[#0f0f12]">
                  <span className="text-sm font-semibold">{getInitial()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white/90 truncate">
                    {getDisplayName()}
                  </p>
                  {getSubtitle() && (
                    <p className="text-[11px] text-white/40 truncate">
                      {getSubtitle()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="p-1.5">
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="h-8 px-2 rounded-lg cursor-pointer text-[13px] text-red-400/80 hover:text-red-400 focus:text-red-400 focus:bg-red-500/[0.08]"
              >
                <IconLogout className="mr-2 size-3.5" />
                Sign Out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
