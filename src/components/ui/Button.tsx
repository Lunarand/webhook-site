import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/src/lib/utils"
import { motion } from "motion/react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-discord text-white hover:bg-discord-hover shadow-[0_0_15px_rgba(88,101,242,0.5)] hover:shadow-[0_0_25px_rgba(88,101,242,0.8)]",
        destructive: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
        outline: "border border-white/10 bg-transparent hover:bg-white/5",
        secondary: "bg-white/5 text-white hover:bg-white/10 border border-white/5",
        ghost: "hover:bg-white/5 hover:text-white text-white/70",
        link: "text-primary underline-offset-4 hover:underline",
        neon: "bg-transparent border border-neon-blue text-neon-blue hover:bg-neon-blue/10 shadow-[0_0_10px_rgba(0,243,255,0.4)] inset-shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
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
