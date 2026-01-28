import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-outline focus-visible:border-primary focus-visible:ring-primary/20 aria-invalid:ring-error/20 aria-invalid:border-error h-12 rounded-xl border bg-surface-container-highest/50 px-4 py-2 text-base shadow-sm transition-all duration-200 ease-emphasized file:h-7 file:text-sm file:font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] md:text-sm file:text-on-surface placeholder:text-on-surface-variant/70 w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface-container-highest focus:bg-surface-container-highest focus:shadow-md text-on-surface",
        className
      )}
      {...props}
    />
  )
}

export { Input }
