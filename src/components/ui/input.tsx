import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-xl border border-[#F7A898] bg-[#FFEBD3] px-4 py-2 text-base text-[#2D1E12] placeholder:text-[#854B41]/70 shadow-xs transition-all outline-none md:text-sm",
        "focus-visible:border-[#9BCEC1] focus-visible:ring-2 focus-visible:ring-[#9BCEC1]/60",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
