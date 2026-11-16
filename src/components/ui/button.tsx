import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#EC7D55] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#EC7D55] text-[#253341] shadow-sm hover:bg-[#AB421C] hover:text-[#F5F9F5] hover:shadow-md",
        destructive:
          "bg-[#AB421C] text-[#F5F9F5] shadow-sm hover:bg-[#253341]",
        outline:
          "border border-[#BCC7D2] bg-[#F5F9F5] text-[#253341] shadow-2xs hover:bg-[#DBE6DD] hover:border-[#3E5164]",
        secondary:
          "bg-[#3E5164] text-[#F5F9F5] shadow-2xs hover:bg-[#253341]",
        ghost:
          "text-[#253341] hover:bg-[#DBE6DD] hover:text-[#253341]",
        link: "text-[#AB421C] underline-offset-4 hover:underline font-bold",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-8 rounded-lg gap-1.5 px-3.5 text-xs has-[>svg]:px-2.5",
        lg: "h-12 rounded-2xl px-7 text-base has-[>svg]:px-5",
        icon: "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
