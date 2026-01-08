"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { cn } from "@/lib/utils"

interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function Shell({ children, className, ...props }: ShellProps) {
    const [sidebarOpen, setSidebarOpen] = React.useState(false)

    return (
        <div className="min-h-screen bg-background">
            <AppSidebar isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />
            <main
                className={cn(
                    "min-h-screen transition-all duration-300 ease-in-out",
                    "md:ml-64 md:w-[calc(100%-16rem)]",
                    className
                )}
                {...props}
            >
                <div className="container mx-auto p-4 md:p-8 pt-16 md:pt-8 pb-24 md:pb-8 max-w-7xl">
                    {children}
                </div>
            </main>
            <MobileBottomNav onMoreClick={() => setSidebarOpen(true)} />
        </div>
    )
}

