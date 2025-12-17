"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStore } from "@/components/providers/store-provider"
import { isSameDay, format } from "date-fns"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const MOODS = [
    { level: 1, color: "bg-red-500", label: "Terrible 😫" },
    { level: 2, color: "bg-orange-500", label: "Bad 😞" },
    { level: 3, color: "bg-yellow-500", label: "Okay 😐" },
    { level: 4, color: "bg-lime-500", label: "Good 🙂" },
    { level: 5, color: "bg-green-500", label: "Great 🤩" },
]

export function MoodWidget() {
    const { dailyLogs, addDailyLog } = useStore()
    const logs = dailyLogs || []
    const today = new Date()

    const todayLog = logs.find(l => l.date && isSameDay(new Date(l.date), today))

    const handleLog = async (level: number) => {
        await addDailyLog({
            mood: level,
            focusMinutes: 0,
            notes: ""
        })
    }

    // Grid for last 30 days
    const recentLogs = React.useMemo(() => {
        const days = []
        for (let i = 29; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            // find LATEST log for day
            const log = logs.filter(l => isSameDay(new Date(l.date), d)).sort((a, b) => b.id - a.id)[0]
            days.push({ date: d, log })
        }
        return days
    }, [logs])

    return (
        <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Daily Mood</CardTitle>
                {todayLog && (
                    <Button variant="ghost" size="sm" onClick={() => handleLog(0)} className="h-6 text-xs text-muted-foreground">
                        Reset
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex justify-between gap-1 mb-4">
                    {MOODS.map(m => (
                        <button
                            key={m.level}
                            onClick={() => handleLog(m.level)}
                            className={cn(
                                "w-8 h-8 rounded-full transition-all flex items-center justify-center text-xs shadow-sm ring-1 ring-inset ring-black/10",
                                m.color,
                                todayLog?.mood === m.level ? "scale-125 ring-2 ring-primary border-2 border-white dark:border-black" : "hover:scale-110 opacity-70 hover:opacity-100"
                            )}
                            title={m.label}
                        >
                            {m.level}
                        </button>
                    ))}
                </div>

                <div className="flex gap-1 flex-wrap justify-end">
                    {recentLogs.map((item, i) => (
                        <TooltipProvider key={i}>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div
                                        className={cn(
                                            "w-2 h-2 rounded-[1px]",
                                            item.log ? MOODS.find(m => m.level === item.log!.mood)?.color : "bg-muted"
                                        )}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">
                                        {format(item.date, "MMM d")}: {item.log ? MOODS.find(m => m.level === item.log.mood)?.label : "No log"}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
