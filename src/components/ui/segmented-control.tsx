import * as React from "react"

import { cn } from "@/lib/utils"

interface SegmentedOption<T extends string> {
  value: T
  label: React.ReactNode
  srLabel?: string
  id?: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  onValueChange: (value: T) => void
  options: SegmentedOption<T>[]
  "aria-label": string
  className?: string
}

function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  className,
  ...props
}: SegmentedControlProps<T>) {
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )

  return (
    <div
      role="group"
      aria-label={props["aria-label"]}
      className={cn(
        "relative inline-grid h-8 shrink-0 auto-cols-fr grid-flow-col rounded-lg bg-muted p-0.5 pointer-coarse:h-11",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0.5 left-0.5 rounded-md bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_0.5px_rgb(0_0_0/0.06)] transition-transform duration-200 ease-out motion-reduce:transition-none dark:bg-stone-700"
        style={{
          width: `calc((100% - 4px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            id={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "relative z-10 min-w-10 rounded-md px-2.5 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
            {option.srLabel ? " " : null}
            {option.srLabel ? <span className="sr-only">{option.srLabel}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

export { SegmentedControl }
export type { SegmentedOption }
