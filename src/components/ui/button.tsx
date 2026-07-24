import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#9BCEC1] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#9BCEC1] text-[#0E2C24] shadow-sm hover:bg-[#83BEB0] hover:shadow-md",
        destructive:
          "bg-[#4A1E17] text-[#FFEBD3] shadow-sm hover:bg-[#3B1B15]",
        outline:
          "border border-[#F7A898] bg-[#FFEBD3] text-[#4A1E17] shadow-2xs hover:bg-[#FFECE8] hover:border-[#FFB6A6]",
        secondary:
          "bg-[#FFB6A6] text-[#4A1E17] shadow-2xs hover:bg-[#FA9E8B]",
        ghost:
          "text-[#4A1E17] hover:bg-[#FFECE8] hover:text-[#2D1E12]",
        link: "text-[#0E2C24] underline-offset-4 hover:underline font-bold",
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
