"use client"

import { 
  useUser as useAlchemyUser,
  useLogout,
} from "@account-kit/react"
import {
  IconLogout,
  IconDotsVertical,
} from "@tabler/icons-react"
import { useAuth } from "@/lib/hooks/useAuth"

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
  const alchemyUser = useAlchemyUser()
  const { logout } = useLogout()
  const { user, isLoading } = useAuth()

  // Get first letter for fallback avatar
  const getInitial = () => {
    if (user?.username) {
      return user.username.replace('@', '').charAt(0).toUpperCase()
    }
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase()
    }
    if (alchemyUser?.email) {
      return alchemyUser.email.charAt(0).toUpperCase()
    }
    if (user?.walletAddress) {
      return user.walletAddress.slice(2, 3).toUpperCase()
    }
    return "U"
  }

  // Get @username for primary display
  const getUsername = () => {
    if (user?.username) {
      const username = user.username.startsWith('@') ? user.username : `@${user.username}`
      return username
    }
    return "@user"
  }

  // Get email or truncated wallet address for subtitle
  const getSubtitle = () => {
    if (alchemyUser?.email) {
      return alchemyUser.email
    }
    if (user?.walletAddress) {
      return `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    }
    return null
  }

  const handleSignOut = async () => {
    await logout()
  }

  // Avatar component with image or fallback
  const Avatar = ({ size = 'normal' }: { size?: 'normal' | 'large' }) => {
    const sizeClasses = size === 'large' 
      ? 'size-10' 
      : 'size-8 group-data-[collapsible=icon]:size-9'
    const textSize = size === 'large' 
      ? 'text-base' 
      : 'text-sm group-data-[collapsible=icon]:text-base'
    
    if (user?.avatarUrl) {
      return (
        <div className={`flex ${sizeClasses} items-center justify-center rounded-full overflow-hidden shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}>
          <img 
            src={user.avatarUrl} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
      )
    }
    
    return (
      <div className={`flex ${sizeClasses} items-center justify-center rounded-full bg-white/90 text-black shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}>
        <span className={`${textSize} font-semibold transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}>
          {getInitial()}
        </span>
      </div>
    )
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
              {/* Avatar */}
              <Avatar />
              {/* Info - hidden in collapsed state */}
              <div className="grid flex-1 text-left leading-tight transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium text-white/80">
                  {isLoading ? '...' : getUsername()}
                </span>
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
                <Avatar size="large" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {isLoading ? '...' : getUsername()}
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
