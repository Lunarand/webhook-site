import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number
  onValueChange: (value: number) => void
  max: number
  min?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, min = 0, max, ...props }, ref) => {
    const percentage = ((value - min) / (max - min)) * 100

    return (
      <div className="relative w-full flex items-center h-4 group cursor-pointer">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onValueChange(Number(e.target.value))}
          className={cn(
            "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20",
            className
          )}
          ref={ref}
          {...props}
        />
        {/* Track */}
        <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden relative z-0">
          {/* Fill */}
          <div
            className="h-full bg-neon-blue rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Thumb */}
        <div
          className="absolute h-4 w-4 bg-white rounded-full shadow-[0_0_10px_rgba(0,243,255,0.8)] z-10 pointer-events-none group-hover:scale-110 transition-transform"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
