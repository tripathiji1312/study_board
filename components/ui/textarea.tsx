import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-outline focus-visible:border-primary focus-visible:ring-primary/20 aria-invalid:ring-error/20 aria-invalid:border-error rounded-xl border bg-surface-container-highest/50 px-4 py-3 text-base shadow-sm transition-[color,box-shadow] focus-visible:ring-[3px] aria-invalid:ring-[3px] md:text-sm placeholder:text-on-surface-variant/70 flex field-sizing-content min-h-[5rem] w-full outline-none disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface-container-highest focus:bg-surface-container-highest focus:shadow-md text-on-surface",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
