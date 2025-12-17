"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStore } from "@/components/providers/store-provider"
import { isSameDay, format } from "date-fns"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const MOODS = [
    { level: 1, color: "bg-red-400", hover: "hover:bg-red-500", label: "Terrible", emoji: "😫" },
    { level: 2, color: "bg-orange-400", hover: "hover:bg-orange-500", label: "Bad", emoji: "😞" },
    { level: 3, color: "bg-yellow-400", hover: "hover:bg-yellow-500", label: "Okay", emoji: "😐" },
    { level: 4, color: "bg-lime-400", hover: "hover:bg-lime-500", label: "Good", emoji: "🙂" },
    { level: 5, color: "bg-green-400", hover: "hover:bg-green-500", label: "Great", emoji: "🤩" },
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
        <Card className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Daily Mood</CardTitle>
                {todayLog && (
                    <Button variant="ghost" size="sm" onClick={() => handleLog(0)} className="h-6 text-[10px] px-2 text-muted-foreground hover:text-destructive">
                        Reset
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between gap-1 mb-4 px-1">
                    {MOODS.map(m => (
                        <TooltipProvider key={m.level}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => handleLog(m.level)}
                                        className={cn(
                                            "w-9 h-9 rounded-full transition-all flex items-center justify-center text-xl shadow-sm border border-transparent",
                                            todayLog?.mood === m.level ? "scale-110 ring-4 ring-primary/20 bg-accent" : "grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:scale-110",
                                            todayLog?.mood === m.level ? "" : "bg-transparent"
                                        )}
                                    >
                                        {m.emoji}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{m.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>

                <div className="flex gap-[3px] flex-wrap justify-end">
                    {recentLogs.map((item, i) => (
                        <TooltipProvider key={i}>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div
                                        className={cn(
                                            "w-2.5 h-2.5 rounded-[2px] transition-colors",
                                            item.log ? MOODS.find(m => m.level === item.log!.mood)?.color : "bg-muted/50 hover:bg-muted"
                                        )}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs font-semibold">
                                        {format(item.date, "MMM d")}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.log ? MOODS.find(m => m.level === item.log.mood)?.label : "No log"}
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
