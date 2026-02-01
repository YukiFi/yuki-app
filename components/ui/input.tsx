import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border-0 bg-white/[0.04] px-4 py-2 text-base text-white shadow-sm transition-all duration-250 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgba(225,168,240,0.3)] focus-visible:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
