"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/components/providers/store-provider"
import { format, subDays, isSameDay, startOfWeek, parseISO } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useGamification } from "@/components/providers/gamification-provider"

export function StudyGraph() {
    const { dailyLogs, todos, assignments } = useStore()
    const { streak } = useGamification()
    const logs = dailyLogs || []

    const today = new Date()
    // 365 days look back
    const startDate = subDays(today, 364)

    // Helper: Get data for a specific date
    const getDataForDate = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd")

        // Log data
        const log = logs.find(l => l.date && isSameDay(new Date(l.date), date))
        const studyMinutes = log?.studyTime || 0

        // Assignment data (completed on this due date, or just completed and match due date for existing data)
        const completedAssigns = (assignments || []).filter(a =>
            a.status === "Completed" &&
            a.dueDate &&
            isSameDay(new Date(a.dueDate), date)
        )

        // Todo data: Count completed todos for 'Today' if the date is today. 
        // For past dates, we can check if we have a way to know, but for now we'll rely on 'dueDate' if available causing a match? 
        // Simpler: If date is TODAY, count all currently completed tasks (regardless of category).
        // This gives immediate gratification for any work done.
        const completedTodosCount = (todos || []).filter(t => {
            if (!t.completed) return false

            // 1. Accurate Time (Post-Fix)
            if (t.completedAt) {
                return isSameDay(parseISO(t.completedAt), date)
            }

            // 2. Legacy Fallback (Last Update = Likely Completion)
            if (t.updatedAt) {
                return isSameDay(parseISO(t.updatedAt), date)
            }

            // 3. Fallback for immediate UI updates without refetch
            if (isSameDay(date, new Date())) return true

            return false
        }).length

        // Calculating score with lower thresholds to ensure "5 mins" shows up green
        // Score 1 => Light Green.
        // 1 completed task OR >0 study mins OR 1 assignment => Active
        let pointScore = 0
        if (studyMinutes > 0) pointScore += 1
        if (studyMinutes > 30) pointScore += 1 // Bonus for >30m
        pointScore += completedAssigns.length * 2
        pointScore += completedTodosCount // 1 point per task

        return {
            date,
            score: pointScore,
            studyMinutes,
            assignmentsCompleted: completedAssigns.length + completedTodosCount
        }
    }

    // Generate last 365 days data
    const daysData = React.useMemo(() => {
        const d = []
        let current = startDate
        while (current <= today) {
            d.push(getDataForDate(current))
            current = new Date(current.getTime() + 86400000)
        }
        return d
    }, [logs, assignments, todos]) // Re-calc when these change

    // Calculate Stats
    const stats = React.useMemo(() => {
        const currentStreak = 0
        let longestStreak = 0
        let activeDays = 0
        let tempStreak = 0

        // Iterate through all days to calculate stats
        daysData.forEach((day, index) => {
            if (day.score > 0) {
                activeDays++
                tempStreak++
            } else {
                // Streak broken
                if (tempStreak > longestStreak) longestStreak = tempStreak
                tempStreak = 0
            }
        })
        // Check finding longest if ends on today
        if (tempStreak > longestStreak) longestStreak = tempStreak

        // Calculate current streak (backwards from today)
        // If today has activity, include it. If not, check yesterday.
        let i = daysData.length - 1
        // If today has 0 score, but yesterday had score, streak is still alive essentially? 
        // Strict streak: Today must be active or yesterday must be active.

        // Let's count backwards until a day with 0 score
        let countingStreak = 0
        while (i >= 0) {
            if (daysData[i].score > 0) {
                countingStreak++
            } else {
                // If it's today and 0, and we haven't started counting, it's fine (streak might refer to up to yesterday)
                // But generally "Current Streak" implies consecutive active days ending recently.
                // Simple logic: consecutive active days ending at `daysData[daysData.length-1]`
                if (i === daysData.length - 1 && daysData[i].score === 0) {
                    // check yesterday
                } else {
                    break;
                }
            }
            i--
        }
        // Correct simple current streak logic:
        // Iterate backwards. allow today to be skipped if only yesterday was active.
        let revI = daysData.length - 1
        let currStr = 0

        // Check today
        if (daysData[revI].score > 0) {
            currStr++
            revI--
            while (revI >= 0 && daysData[revI].score > 0) {
                currStr++
                revI--
            }
        } else {
            // Today is inactive, check yesterday
            if (revI > 0 && daysData[revI - 1].score > 0) {
                revI-- // Start from yesterday
                while (revI >= 0 && daysData[revI].score > 0) {
                    currStr++
                    revI--
                }
            }
        }

        return {
            currentStreak: currStr,
            longestStreak,
            activeDays,
            totalDays: daysData.length
        }
    }, [daysData])

    const getIntensityClass = (score: number) => {
        if (score === 0) return "bg-muted hover:bg-muted/80"
        if (score <= 1) return "bg-emerald-200 dark:bg-emerald-900/50 hover:bg-emerald-300 dark:hover:bg-emerald-800"
        if (score <= 2) return "bg-emerald-400 dark:bg-emerald-700 hover:bg-emerald-500 dark:hover:bg-emerald-600"
        return "bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400"
    }

    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-medium">Study Consistency</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">Activity over the last year</p>
                    </div>
                    {/* Stats Row */}
                    <div className="flex gap-6 text-right">
                        <div>
                            <p className="text-2xl font-bold">{streak} <span className="text-base text-orange-500">🔥</span></p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Streak</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.longestStreak} <span className="text-base text-yellow-500">⚡</span></p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Best</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-primary">{stats.activeDays}</p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Active Days</p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
                    <div className="min-w-fit">
                        <div className="grid grid-rows-7 grid-flow-col gap-1.5 w-max">
                            {daysData.map((day, i) => (
                                <TooltipProvider key={i}>
                                    <Tooltip delayDuration={50}>
                                        <TooltipTrigger>
                                            <div
                                                className={`w-3.5 h-3.5 rounded-sm transition-colors ${getIntensityClass(day.score)}`}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs p-2">
                                            <p className="font-semibold mb-1">{format(day.date, "MMM d, yyyy")}</p>
                                            <div className="space-y-0.5 text-muted-foreground">
                                                {day.studyMinutes > 0 && <p>📚 {day.studyMinutes}m studied</p>}
                                                {day.assignmentsCompleted > 0 && <p>✅ {day.assignmentsCompleted} assignments</p>}
                                                {day.score === 0 && <p>No activity recorded</p>}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>

                        {/* Month Labels (Optional enhancement, tricky with grid-flow-col but lets skip for simplicity or approximate) */}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-muted-foreground px-1">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-muted" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/50" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
                    </div>
                    <span>More</span>
                </div>
            </CardContent>
        </Card>
    )
}
