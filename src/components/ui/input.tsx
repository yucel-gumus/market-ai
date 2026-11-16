import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-xl border border-[#BCC7D2] bg-[#F5F9F5] px-4 py-2 text-base text-[#253341] placeholder:text-[#3E5164]/70 shadow-xs transition-all outline-none md:text-sm",
        "focus-visible:border-[#EC7D55] focus-visible:ring-2 focus-visible:ring-[#EC7D55]/45",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
