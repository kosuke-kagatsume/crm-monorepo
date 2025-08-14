import * as React from "react"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = "", value = 0, ...props }, ref) => {
    const width = Math.min(100, Math.max(0, value))
    return (
      <div
        ref={ref}
        className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
        {...props}
      >
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
