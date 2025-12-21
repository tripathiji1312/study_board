"use client"

import { useSession } from "next-auth/react"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { LandingPage } from "@/components/landing-page"
import { Shell } from "@/components/ui/shell"
import { WidgetSkeleton } from "@/components/ui/skeleton-loaders"

export default function Home() {
    const { data: session, status } = useSession()

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="space-y-6 max-w-[1600px] mx-auto pt-8 opacity-50">
                    {/* Neutral loading state without sidebar */}
                    <div className="flex flex-col gap-4 items-center">
                        <div className="h-12 w-48 bg-muted rounded-lg animate-pulse" />
                    </div>
                </div>
            </div>
        )

    }

    if (session) {
        return <DashboardView />
    }

    return <LandingPage />
}