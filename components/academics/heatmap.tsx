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
                                    "w-3 h-3 rounded-[2px] transition-colors",
                                    intensity === 0 && "bg-muted/50",
                                    intensity === 1 && "bg-green-200 dark:bg-green-900",
                                    intensity === 2 && "bg-green-300 dark:bg-green-800",
                                    intensity === 3 && "bg-green-400 dark:bg-green-700",
                                    intensity === 4 && "bg-green-500 dark:bg-green-600",
                                )}
                            />
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
