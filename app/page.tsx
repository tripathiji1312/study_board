"use client"

import { useSession } from "next-auth/react"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { LandingPage } from "@/components/landing-page"
import { Logo } from "@/components/ui/logo"
import { motion } from "framer-motion"

export default function Home() {
    const { data: session, status } = useSession()

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
                {/* Subtle Background */}
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
                <div className="absolute text-primary/5 inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                    <div className="w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] opacity-20" />
                </div>

                <div className="w-full max-w-sm px-6 relative z-10 flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex flex-col items-center gap-8"
                    >
                        {/* Logo Animation */}
                        <div className="relative">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Logo className="scale-150" />
                            </motion.div>
                        </div>

                        {/* Progress Bar & Text */}
                        <div className="w-64 space-y-4">
                            <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary rounded-full"
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "100%" }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                />
                            </div>

                            <motion.p
                                className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                Loading Workspace
                            </motion.p>
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