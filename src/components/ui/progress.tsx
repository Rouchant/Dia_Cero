"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, indicatorClassName, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    aria-label={props["aria-label"] || (value !== undefined ? `Progreso: ${value}%` : "Barra de progreso")}
    value={value}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-slate-200",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 bg-brand-green transition-all rounded-full", indicatorClassName)}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
