"use client"

import { motion } from "framer-motion"
import { IconLoader2 } from "@tabler/icons-react"

export function LoadingBar() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-xs space-y-4 flex flex-col items-center">
                <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{
                            repeat: Infinity,
                            duration: 1,
                            ease: "linear",
                        }}
                    />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
            </div>
        </div>
    )
}
