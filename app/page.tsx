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
            <Shell>
                <div className="space-y-6 max-w-[1600px] mx-auto pt-8">
                    <div className="flex flex-col gap-4">
                        <div className="h-12 w-48 bg-muted rounded-lg animate-pulse" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <WidgetSkeleton />
                            <WidgetSkeleton />
                            <WidgetSkeleton />
                        </div>
                    </div>
                </div>
            </Shell>
        )
    }

    if (session) {
        return <DashboardView />
    }

    return <LandingPage />
}