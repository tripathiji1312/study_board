"use client"

import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStore } from "@/components/providers/store-provider"
import { format } from "date-fns"
import { IconFlame, IconClock, IconBook } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

// Color palette for subjects
const COLORS = ["#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#ef4444"]

export function FocusHistory() {
    const { dailyLogs, subjects } = useStore()

    // Aggregate Data by Subject
    const stats = React.useMemo(() => {
        const bySubject: Record<string, number> = {}
        let total = 0

        dailyLogs.forEach(log => {
            if (log.studyTime) {
                const key = log.subjectId || "general"
                bySubject[key] = (bySubject[key] || 0) + log.studyTime
                total += log.studyTime
            }
        })

        return { bySubject, total }
    }, [dailyLogs])

    // Sort subjects by time
    const sortedSubjects = React.useMemo(() => {
        return Object.entries(stats.bySubject)
            .sort(([, a], [, b]) => b - a)
            .map(([id, time], index) => {
                const subject = subjects.find(s => s.id === id)
                return {
                    id,
                    name: subject?.name || subject?.code || "General Focus",
                    time,
                    percentage: stats.total > 0 ? (time / stats.total) * 100 : 0,
                    color: COLORS[index % COLORS.length]
                }
            })
    }, [stats, subjects])

    const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return h > 0 ? `${h}h ${m}m` : `${m}m`
    }

    return (
        <div className="space-y-8 pt-2">
            {/* Total Stats */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="text-center">
                    <p className="text-4xl font-black text-foreground tracking-tight">{formatTime(stats.total)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-bold">Total Focus</p>
                </div>
                <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                <div className="text-center">
                    <p className="text-4xl font-black text-foreground tracking-tight">{dailyLogs.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-bold">Sessions</p>
                </div>
            </div>

            {/* Pie Chart Visual */}
            {sortedSubjects.length > 0 && (
                <div className="flex flex-col items-center gap-6 py-6 border-y border-white/5 bg-surface-container-low/50 rounded-3xl mx-[-12px] px-[12px] shadow-sm">
                    <div className="relative w-40 h-40">
                        <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
                            {sortedSubjects.reduce((acc, sub, i) => {
                                const prev = acc.offset
                                acc.items.push(
                                    <circle
                                        key={sub.id}
                                        r="16"
                                        cx="16"
                                        cy="16"
                                        fill="transparent"
                                        stroke={sub.color}
                                        strokeWidth="3"
                                        strokeDasharray={`${sub.percentage} ${100 - sub.percentage}`}
                                        strokeDashoffset={-prev}
                                        className="transition-all duration-500"
                                        strokeLinecap="round" 
                                    />
                                )
                                acc.offset += sub.percentage
                                return acc
                            }, { items: [] as React.ReactNode[], offset: 0 }).items}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <IconFlame className="w-8 h-8 text-primary mb-1" />
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Focus</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 px-4">
                        {sortedSubjects.map(sub => (
                            <div key={sub.id} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white/5 shadow-sm" style={{ backgroundColor: sub.color }} />
                                <div className="flex flex-col">
                                    <span className="text-xs text-foreground/80 font-bold">{sub.name}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">{Math.round(sub.percentage)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {sortedSubjects.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-muted rounded-2xl bg-surface-container/20">
                    <IconBook className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm font-bold text-muted-foreground">No sessions yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Start a timer to track your focus.</p>
                </div>
            )}

            {/* Recent Sessions */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 pl-1">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recent Sessions</h3>
                    <span className="text-[10px] font-bold text-muted-foreground bg-surface-container px-2.5 py-1 rounded-full">{dailyLogs.length} Total</span>
                </div>
                <ScrollArea className="flex-1 h-[250px] pr-4 -mr-4">
                    <div className="space-y-2 pr-4">
                        {dailyLogs.length === 0 && (
                            <p className="text-sm text-muted-foreground/40 italic py-4 text-center">Your history will appear here.</p>
                        )}
                        {dailyLogs.slice(0, 20).map((log, i) => {
                            const subject = subjects.find(s => s.id === log.subjectId)
                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "group flex items-center justify-between p-3.5 rounded-2xl border border-transparent bg-surface-container-low/50",
                                        "hover:bg-surface-container hover:shadow-sm hover:scale-[1.01] transition-all cursor-default"
                                    )}
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                            <IconClock className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-foreground/90 truncate">
                                                {log.note?.replace("Deep Work: ", "") || "Focus Session"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-sm font-black text-foreground">{log.studyTime}m</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
