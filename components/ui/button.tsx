import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-full border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none press-scale animate-emphasized",
  {
    variants: {
      variant: {
        default: "bg-primary text-on-primary hover:bg-primary/90 shadow-sm hover:shadow-md active:shadow-sm",
        outline: "border-outline bg-surface hover:bg-surface-container-high hover:text-on-surface shadow-xs hover:shadow-md active:shadow-none",
        secondary: "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 shadow-sm hover:shadow-md active:shadow-sm",
        ghost: "hover:bg-surface-container-highest hover:text-on-surface active:bg-surface-container-highest/80",
        destructive: "bg-error text-on-error hover:bg-error/90 shadow-sm hover:shadow-md",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-6 rounded-full in-data-[slot=button-group]:rounded-full has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1.5 rounded-full px-3 text-xs in-data-[slot=button-group]:rounded-full [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 gap-1.5 rounded-full px-4 in-data-[slot=button-group]:rounded-full",
        lg: "h-12 gap-2 px-8 text-base rounded-full",
        icon: "size-10 rounded-full",
        "icon-xs": "size-7 rounded-full [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 rounded-full",
        "icon-lg": "size-12 rounded-full",
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
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
