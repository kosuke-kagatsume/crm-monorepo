import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700",
      outline: "border border-gray-300 hover:bg-gray-50",
      ghost: "hover:bg-gray-100"
    }
    return (
      <button
        ref={ref}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${variants[variant]} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
