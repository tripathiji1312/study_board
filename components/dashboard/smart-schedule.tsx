"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useStore } from "@/components/providers/store-provider"
import { format, isSameDay, addDays, parseISO } from "date-fns"
import {
    IconCalendar,
    IconCalendarEvent,
    IconSchool,
    IconFlag,
    IconAlertTriangle,
    IconCheck,
    IconPlus,
    IconClock
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

// Unified Event Type
type TimelineItem = {
    id: string | number
    type: "Class" | "Assignment" | "Exam" | "Todo"
    title: string
    time?: string // HH:mm
    subtitle?: string
    priority?: "Low" | "Medium" | "High" | "Urgent"
    status?: "Pending" | "In Progress" | "Completed"
    original: any
}

export function SmartScheduleWidget() {
    const { schedule, assignments, exams, todos, toggleTodo } = useStore()
    const [activeTab, setActiveTab] = React.useState("today")

    const today = new React.useMemo(() => new Date(), [])
    const tomorrow = new React.useMemo(() => addDays(today, 1), [today])

    // Memoize the data processing to prevent lag
    const getItemsForDate = React.useCallback((date: Date) => {
        const items: TimelineItem[] = []

        // 1. Schedule Events (Classes, etc)
        const dayName = format(date, "EEEE")
        const dateStr = format(date, "yyyy-MM-dd")

        schedule.forEach(ev => {
            if (ev.day === dayName || ev.day === dateStr) {
                items.push({
                    id: `ev-${ev.id}`,
                    type: "Class",
                    title: ev.title,
                    time: ev.startTime,
                    subtitle: ev.location || ev.type,
                    original: ev
                })
            }
        })

        // 2. Assignments (Due Date)
        assignments.forEach(a => {
            if (a.status !== "Completed" && a.dueDate && isSameDay(parseISO(a.dueDate), date)) {
                items.push({
                    id: `as-${a.id}`,
                    type: "Assignment",
                    title: a.title,
                    time: "23:59",
                    subtitle: a.course,
                    priority: a.priority,
                    status: a.status,
                    original: a
                })
            }
        })

        // 3. Exams
        exams.forEach(e => {
            if (isSameDay(new Date(e.date), date)) {
                items.push({
                    id: `ex-${e.id}`,
                    type: "Exam",
                    title: e.title,
                    time: format(new Date(e.date), "HH:mm"),
                    subtitle: e.subjectId || "Exam",
                    priority: "Urgent",
                    original: e
                })
            }
        })

        // 4. Todos (Tasks for today)
        if (isSameDay(date, today)) {
            todos.filter(t => t.category === "today").forEach(t => {
                items.push({
                    id: `td-${t.id}`,
                    type: "Todo",
                    title: t.text,
                    time: undefined,
                    subtitle: "Task",
                    original: t
                })
            })
        }

        // Sort by time
        return items.sort((a, b) => {
            const timeA = a.time || "23:59"
            const timeB = b.time || "23:59"
            return timeA.localeCompare(timeB)
        })
    }, [schedule, assignments, exams, todos, today])

    const todayItems = React.useMemo(() => getItemsForDate(today), [getItemsForDate, today])
    const tomorrowItems = React.useMemo(() => getItemsForDate(tomorrow), [getItemsForDate, tomorrow])

    // Quick Add Mock
    const handleAdd = () => {
        window.location.href = "/schedule"
    }

    const handleToggle = (id: string | number, type: string, currentStatus?: boolean) => {
        if (type === "Todo") {
            const todoId = String(id).replace("td-", "")
            toggleTodo(todoId, !!currentStatus) // Toggle
        }
    }

    const renderList = (items: TimelineItem[]) => {
        if (items.length === 0) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                    <IconCalendar className="w-8 h-8 mb-2" />
                    <p className="text-sm">Nothing scheduled</p>
                </div>
            )
        }

        return (
            <div className="space-y-1 pr-3">
                {items.map((item, index) => {
                    const isCompleted = item.type === "Todo" && item.original?.completed

                    return (
                        <div
                            key={item.id}
                            className={cn(
                                "group flex items-center gap-3 p-2 rounded-lg transition-colors border border-transparent",
                                item.type === "Todo" ? "hover:bg-accent/50 cursor-pointer" : "hover:bg-accent/50",
                                isCompleted && "opacity-60 grayscale"
                            )}
                            onClick={() => item.type === "Todo" && handleToggle(item.id, item.type, item.original?.completed)}
                        >
                            {/* Icon / Action Column */}
                            <div className="shrink-0">
                                {item.type === "Todo" ? (
                                    <Checkbox
                                        checked={isCompleted}
                                        className="w-4 h-4 rounded-full border-2"
                                        onCheckedChange={(checked) => handleToggle(item.id, item.type, !checked)}
                                    />
                                ) : (
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border text-xs shadow-sm",
                                        item.type === "Exam" && "bg-red-100 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400",
                                        item.type === "Assignment" && "bg-orange-100 border-orange-200 text-orange-600 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400",
                                        item.type === "Class" && "bg-blue-100 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                                    )}>
                                        {item.type === "Exam" && <IconAlertTriangle className="w-4 h-4" />}
                                        {item.type === "Assignment" && <IconFlag className="w-4 h-4" />}
                                        {item.type === "Class" && <IconSchool className="w-4 h-4" />}
                                    </div>
                                )}
                            </div>

                            {/* Content Column */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className={cn(
                                        "font-medium truncate text-sm",
                                        isCompleted && "line-through text-muted-foreground"
                                    )}>
                                        {item.title}
                                    </span>
                                    {item.time && (
                                        <Badge variant="outline" className="text-[10px] h-5 font-mono text-muted-foreground border-border/50 bg-background/50">
                                            {item.time}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <span className="truncate">{item.subtitle}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <Card className="h-full flex flex-col shadow-sm">
            <CardHeader className="p-4 pb-2 space-y-0 flex flex-row items-center justify-between border-b bg-card">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Smart Agenda</CardTitle>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
                        {activeTab === "today" ? format(today, "MMM d") : format(tomorrow, "MMM d")}
                    </Badge>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-7 w-auto">
                    <TabsList className="h-7 p-0 bg-muted/50 gap-1 rounded-sm">
                        <TabsTrigger
                            value="today"
                            className="h-6 text-[10px] px-2.5 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                        >
                            Today
                        </TabsTrigger>
                        <TabsTrigger
                            value="tomorrow"
                            className="h-6 text-[10px] px-2.5 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                        >
                            Tmrw
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative bg-card/50">
                <ScrollArea className="h-full p-2">
                    {activeTab === "today" ? renderList(todayItems) : renderList(tomorrowItems)}
                </ScrollArea>

                {/* Floating Add Button (Subtle) */}
                <div className="absolute bottom-3 right-3">
                    <Button
                        size="icon"
                        variant="default"
                        className="h-8 w-8 rounded-full shadow-md opacity-0 scale-90 transition-all group-hover:opacity-100 group-hover:scale-100"
                        onClick={handleAdd}
                    >
                        <IconPlus className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
