import * as React from "react"
import { cn } from "@/src/lib/utils"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' }>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          "h-9 px-4 py-2",
          variant === 'default' && "bg-gray-900 text-gray-50 hover:bg-gray-900/90 shadow",
          variant === 'outline' && "border border-gray-200 bg-transparent hover:bg-gray-100 text-gray-900",
          variant === 'ghost' && "hover:bg-gray-100 hover:text-gray-900 text-gray-700",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
