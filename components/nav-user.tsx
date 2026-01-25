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
              className="h-14 px-2 rounded-xl data-[state=open]:bg-white/[0.04] cursor-pointer"
            >
              {/* Avatar - bigger in collapsed state */}
              <div className="flex size-8 items-center justify-center rounded-full bg-white/90 text-black shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-data-[collapsible=icon]:size-9">
                <span className="text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-data-[collapsible=icon]:text-base">{getInitial()}</span>
              </div>
              {/* Info - hidden in collapsed state */}
              <div className="grid flex-1 text-left leading-tight transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium text-white/80">{getDisplayName()}</span>
                {getSubtitle() && (
                  <span className="truncate text-xs text-white/40">{getSubtitle()}</span>
                )}
              </div>
              <IconDotsVertical className="ml-auto size-4 text-white/30 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-52 rounded-2xl bg-black border-0"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            {/* User info header */}
            <div className="px-4 py-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-white/90 text-black">
                  <span className="text-base font-semibold">{getInitial()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {getDisplayName()}
                  </p>
                  {getSubtitle() && (
                    <p className="text-xs text-white/40 truncate">
                      {getSubtitle()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="p-2">
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="h-10 px-3 rounded-xl cursor-pointer text-sm text-red-400/80 hover:text-red-400 focus:text-red-400 focus:bg-red-500/[0.08]"
              >
                <IconLogout className="mr-2 size-4" />
                Sign Out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
