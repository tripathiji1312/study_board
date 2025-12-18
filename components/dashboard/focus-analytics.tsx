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
            <div className="bg-card/50 border border-border/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">Today's Focus</p>
                    <p className="text-2xl font-light">
                        {Math.floor(todayMinutes / 60)}<span className="text-sm font-medium text-muted-foreground">h</span> {todayMinutes % 60}<span className="text-sm font-medium text-muted-foreground">m</span>
                    </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <IconClock className="w-5 h-5 text-blue-500" />
                </div>
            </div>

            <div className="bg-card/50 border border-border/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">Daily Record</p>
                    <p className="text-2xl font-light">
                        {Math.floor(maxMinutes / 60)}<span className="text-sm font-medium text-muted-foreground">h</span> {maxMinutes % 60}<span className="text-sm font-medium text-muted-foreground">m</span>
                    </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <IconTrophy className="w-5 h-5 text-yellow-500" />
                </div>
            </div>
        </div>
    )
}
