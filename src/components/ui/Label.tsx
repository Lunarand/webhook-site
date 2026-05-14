import * as React from "react"
import { cn } from "@/src/lib/utils"

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 block",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
