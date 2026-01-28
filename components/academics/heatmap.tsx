"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/components/providers/store-provider"
import { format, subDays, startOfWeek, addDays, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"

export function AcademicHeatmap() {
    const { dailyLogs } = useStore()
    const logs = dailyLogs || []

    // Generate last 60 days
    const today = new Date()
    const days = Array.from({ length: 60 }, (_, i) => {
        const date = subDays(today, 59 - i)
        return date
    })

    const getIntensity = (date: Date) => {
        const log = logs.find(l => l.date && isSameDay(new Date(l.date), date))
        if (!log) return 0
        // Calculate based on study time
        const studyTime = "studyTime" in log && typeof log.studyTime === "number" ? log.studyTime : 0
        if (studyTime > 240) return 4
        if (studyTime > 120) return 3
        if (studyTime > 60) return 2
        return 1
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Study Consistency</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-1">
                    {days.map((day, i) => {
                        const intensity = getIntensity(day)
                        return (
                            <div
                                key={i}
                                title={`${format(day, 'MMM d')}: ${intensity} hrs`}
                                className={cn(
                                    "w-3 h-3 rounded-[4px] transition-all duration-300",
                                    intensity === 0 && "bg-surface-container-highest/50",
                                    intensity === 1 && "bg-primary/20",
                                    intensity === 2 && "bg-primary/40",
                                    intensity === 3 && "bg-primary/60",
                                    intensity === 4 && "bg-primary shadow-[0_0_8px_-2px_var(--primary)]",
                                )}
                            />
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
