import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-250 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgba(225,168,240,0.3)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:
          "bg-[#e1a8f0] text-[#1a0a1f] shadow-sm hover:bg-[#e1a8f0]/90",
        destructive:
          "bg-red-500/10 text-red-400 shadow-sm hover:bg-red-500/20",
        outline:
          "border-0 bg-white/[0.03] hover:bg-white/[0.05] text-white",
        secondary:
          "bg-white/[0.06] text-white shadow-sm hover:bg-white/[0.08]",
        ghost: "hover:bg-white/[0.05] text-white/60 hover:text-white/80",
        link: "text-[#e1a8f0] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
