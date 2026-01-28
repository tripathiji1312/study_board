"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { IconFlame, IconTrophy, IconClock } from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { cn } from "@/lib/utils"

export function FocusAnalytics() {
    const { dailyLogs, subjects } = useStore()
    const logs = dailyLogs || []

    // --- Stats Calculation ---
    // 1. Today's Focus
    const today = new Date().toISOString().split('T')[0]
    const todayMinutes = logs
        .filter(l => l.date?.startsWith(today))
        .reduce((acc, l) => acc + (l.studyTime || 0), 0)

    // 2. Highest Daily Focus (Record)
    const dailyTotals = logs.reduce((acc, log) => {
        if (log.date) {
            const date = log.date.split('T')[0]
            acc[date] = (acc[date] || 0) + (log.studyTime || 0)
        }
        return acc
    }, {} as Record<string, number>)
    const maxMinutes = Math.max(0, ...Object.values(dailyTotals))

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Stat Cards */}
            <div className="bg-surface-container border border-transparent rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
                <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Today's Focus</p>
                    <p className="text-3xl font-light text-foreground group-hover:text-primary transition-colors">
                        {Math.floor(todayMinutes / 60)}<span className="text-sm font-medium text-muted-foreground ml-0.5">h</span> {todayMinutes % 60}<span className="text-sm font-medium text-muted-foreground ml-0.5">m</span>
                    </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <IconClock className="w-5 h-5 text-primary" />
                </div>
            </div>

            <div className="bg-surface-container border border-transparent rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
                <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Daily Record</p>
                    <p className="text-3xl font-light text-foreground group-hover:text-amber-500 transition-colors">
                        {Math.floor(maxMinutes / 60)}<span className="text-sm font-medium text-muted-foreground ml-0.5">h</span> {maxMinutes % 60}<span className="text-sm font-medium text-muted-foreground ml-0.5">m</span>
                    </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <IconTrophy className="w-5 h-5 text-amber-500" />
                </div>
            </div>
        </div>
    )
}
