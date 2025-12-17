"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/components/providers/store-provider"
import { format, isSameDay, parseISO, startOfDay } from "date-fns"
import {
    IconCalendar,
    IconClock,
    IconSchool,
    IconFlag,
    IconAlertTriangle,
    IconCheck,
    IconPlus,
    IconMapPin
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function SchedulePage() {
    const { schedule, assignments, exams, todos, toggleTodo } = useStore()
    const [date, setDate] = React.useState<Date | undefined>(new Date())

    // Helper: Is a date "busy"? (Has any event)
    const isDayBusy = (day: Date) => {
        const dayName = format(day, "EEEE")
        const dateStr = format(day, "yyyy-MM-dd")

        const hasClass = schedule.some(ev => ev.day === dayName || ev.day === dateStr)
        const hasAssignment = assignments.some(a => a.dueDate && isSameDay(parseISO(a.dueDate), day))
        const hasExam = exams.some(e => isSameDay(new Date(e.date), day))
        const hasTodo = todos.some(t => t.category === "today" && isSameDay(day, new Date())) // Simple todo logic for now

        return hasClass || hasAssignment || hasExam || hasTodo
    }

    // Helper: Does day have exam? (For heavy styling)
    const isExamDay = (day: Date) => {
        return exams.some(e => isSameDay(new Date(e.date), day))
    }

    const selectedDate = date || new Date()

    // Get Items for Selected Date
    const getItemsForDate = (viewDate: Date) => {
        const items = []

        const dayName = format(viewDate, "EEEE")
        const dateStr = format(viewDate, "yyyy-MM-dd")

        // 1. Classes
        schedule.forEach(ev => {
            if (ev.day === dayName || ev.day === dateStr) {
                items.push({
                    id: `ev-${ev.id}`,
                    type: "Class",
                    title: ev.title,
                    time: ev.startTime,
                    endTime: ev.endTime,
                    subtitle: ev.location,
                    original: ev
                })
            }
        })

        // 2. Assignments
        assignments.forEach(a => {
            if (a.dueDate && isSameDay(parseISO(a.dueDate), viewDate)) {
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
            if (isSameDay(new Date(e.date), viewDate)) {
                items.push({
                    id: `ex-${e.id}`,
                    type: "Exam",
                    title: e.title,
                    time: format(new Date(e.date), "HH:mm"),
                    subtitle: e.subjectId,
                    original: e
                })
            }
        })

        // 4. Todos (Only if selected date is TODAY, or maybe implement date-based todos later)
        if (isSameDay(viewDate, new Date())) {
            todos.filter(t => t.category === "today").forEach(t => {
                items.push({
                    id: `td-${t.id}`,
                    type: "Todo",
                    title: t.text,
                    subtitle: "Task",
                    original: t
                })
            })
        }

        return items.sort((a, b) => (a.time || "23:59").localeCompare(b.time || "23:59"))
    }

    const events = getItemsForDate(selectedDate)

    return (
        <Shell>
            <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">

                {/* LEFT: Calendar */}
                <Card className="w-full md:w-[380px] flex flex-col shadow-md">
                    <CardHeader>
                        <CardTitle>Calendar</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex justify-center p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border-0"
                            modifiers={{
                                busy: (day) => isDayBusy(day),
                                exam: (day) => isExamDay(day)
                            }}
                            modifiersStyles={{
                                busy: { fontWeight: "bold", textDecoration: "underline", textDecorationColor: "hsl(var(--primary))" },
                                exam: { color: "hsl(var(--destructive))", fontWeight: "bold" }
                            }}
                        />
                    </CardContent>
                    <div className="p-4 border-t bg-muted/20 space-y-2">
                        <h4 className="font-medium text-sm">Key</h4>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Busy</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Exam</div>
                        </div>
                    </div>
                </Card>

                {/* RIGHT: Agenda Details */}
                <Card className="flex-1 flex flex-col shadow-md overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center bg-card">
                        <div>
                            <h2 className="text-2xl font-bold">{format(selectedDate, "EEEE")}</h2>
                            <p className="text-muted-foreground">{format(selectedDate, "MMMM do, yyyy")}</p>
                        </div>
                        <Button>
                            <IconPlus className="w-4 h-4 mr-2" /> Add Event
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 bg-muted/5 p-6">
                        {events.length > 0 ? (
                            <div className="space-y-6 max-w-3xl">
                                {events.map((item, i) => {
                                    const isCompleted = item.type === "Todo" && item.original.completed

                                    return (
                                        <div key={item.id} className="flex gap-4 group">
                                            {/* Time Column */}
                                            <div className="w-16 flex flex-col items-end pt-1">
                                                <span className="font-mono text-sm font-semibold text-foreground/80">
                                                    {item.time || "All Day"}
                                                </span>
                                                {item.endTime && (
                                                    <span className="text-xs text-muted-foreground">{item.endTime}</span>
                                                )}
                                            </div>

                                            {/* Visual Line */}
                                            <div className="relative flex flex-col items-center">
                                                <div className={cn(
                                                    "w-3 h-3 rounded-full border-2 z-10 bg-background transition-colors",
                                                    item.type === "Exam" ? "border-red-500 bg-red-500" :
                                                        item.type === "Assignment" ? "border-orange-500 bg-orange-500" :
                                                            item.type === "Class" ? "border-primary bg-primary" :
                                                                "border-slate-400 bg-slate-400"
                                                )} />
                                                {i !== events.length - 1 && (
                                                    <div className="w-0.5 bg-border flex-1 my-1" />
                                                )}
                                            </div>

                                            {/* Card Content */}
                                            <div className="flex-1 pb-6">
                                                <div className={cn(
                                                    "rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md",
                                                    item.type === "Exam" && "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10",
                                                    item.type === "Assignment" && "border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10",
                                                    isCompleted && "opacity-60 grayscale"
                                                )}>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Badge variant="outline" className="text-[10px] h-5">
                                                                    {item.type}
                                                                </Badge>
                                                                {item.subtitle && (
                                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                        {item.type === "Class" && <IconMapPin className="w-3 h-3" />}
                                                                        {item.subtitle}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h3 className={cn("text-lg font-semibold", isCompleted && "line-through")}>
                                                                {item.title}
                                                            </h3>
                                                        </div>

                                                        {item.type === "Todo" && (
                                                            <Checkbox
                                                                checked={isCompleted}
                                                                onCheckedChange={(checked) => {
                                                                    const todoId = String(item.id).replace("td-", "")
                                                                    toggleTodo(todoId, !!checked)
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                <IconCalendar className="w-16 h-16 mb-4 opacity-20" />
                                <h3 className="text-xl font-medium">Clear Schedule</h3>
                                <p>No events planned for this day.</p>
                            </div>
                        )}
                    </ScrollArea>
                </Card>
            </div>
        </Shell>
    )
}
