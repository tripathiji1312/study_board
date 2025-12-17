"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/components/providers/store-provider"
import { format, subDays, isSameDay, startOfWeek } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function StudyGraph() {
    const { dailyLogs, todos, assignments } = useStore()
    const logs = dailyLogs || []

    // Calculate 52 weeks ago from today
    const today = new Date()
    const startDate = subDays(today, 364) // roughly 1 year

    // Generate days map
    const days = React.useMemo(() => {
        const d = []
        let current = startDate
        while (current <= today) {
            d.push(current)
            current = new Date(current.getTime() + 86400000)
        }
        return d
    }, [])

    const getActivityLevel = (date: Date) => {
        let score = 0
        // Check logs
        const log = logs.find(l => l.date && isSameDay(new Date(l.date), date))
        if (log) score += 1
        if ((log as any)?.studyTime && (log as any).studyTime > 60) score += 2

        // Check Assignments
        const completedAssigns = (assignments || []).filter(a => a.status === "Completed" && a.dueDate && isSameDay(new Date(a.dueDate), date))
        score += completedAssigns.length * 2

        if (score === 0) return "bg-muted"
        if (score <= 1) return "bg-green-200 dark:bg-green-900"
        if (score <= 3) return "bg-green-400 dark:bg-green-700"
        return "bg-green-600 dark:bg-green-500"
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Study Consistency</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Render standard Github Style Grid (7 rows, 52 cols) - Simplified flex wrap here */}
                    <div className="grid grid-flow-col grid-rows-7 gap-1">
                        {days.map((day, i) => (
                            <TooltipProvider key={i}>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div
                                            className={`w-3 h-3 rounded-[2px] ${getActivityLevel(day)}`}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs">{format(day, "MMM d, yyyy")}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
