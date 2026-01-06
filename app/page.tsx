"use client"

import { useSession } from "next-auth/react"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { LandingPage } from "@/components/landing-page"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { IconSchool } from "@tabler/icons-react"

export default function Home() {
    const { data: session, status } = useSession()

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-full max-w-sm px-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-2xl border bg-card/80 backdrop-blur-xl p-8 shadow-2xl"
                    >
                        {/* Animated Logo */}
                        <div className="flex flex-col items-center gap-4">
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                    rotate: [0, 2, -2, 0]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20"
                            >
                                <IconSchool className="h-8 w-8 text-primary-foreground" />
                            </motion.div>

                            <div className="text-center space-y-1">
                                <h2 className="text-lg font-semibold">Study Board</h2>
                                <p className="text-sm text-muted-foreground">Preparing your workspace...</p>
                            </div>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="mt-8 space-y-4">
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full"
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "100%" }}
                                    transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                />
                            </div>

                            {/* Loading Steps */}
                            <div className="flex justify-center gap-6 text-xs text-muted-foreground">
                                <motion.span
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                                >
                                    Connecting
                                </motion.span>
                                <motion.span
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                                >
                                    Loading data
                                </motion.span>
                                <motion.span
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                                >
                                    Almost there
                                </motion.span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        )
    }

    if (session) {
        return <DashboardView />
    }

    return <LandingPage />
}