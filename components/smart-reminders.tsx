"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    IconClock,
    IconX,
    IconBell,
    IconCalendarEvent,
    IconClipboardList,
    IconCheckbox,
    IconExternalLink
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/components/providers/store-provider"
import { differenceInDays, differenceInHours, parseISO, isToday, isTomorrow, isPast } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Reminder {
    id: string
    type: "assignment" | "exam" | "todo"
    title: string
    dueText: string
    urgency: "critical" | "warning" | "info"
    link?: string
}

const SNOOZE_DURATION = 30

const TYPE_ICONS = {
    assignment: IconClipboardList,
    exam: IconCalendarEvent,
    todo: IconCheckbox
}

export function SmartReminders() {
    const { assignments, exams, todos } = useStore()
    const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set())
    const [snoozedUntil, setSnoozedUntil] = React.useState<Map<string, Date>>(new Map())
    const [isOpen, setIsOpen] = React.useState(false)

    const reminders = React.useMemo(() => {
        const now = new Date()
        const items: Reminder[] = []

        assignments
            .filter(a => a.status !== "Completed")
            .forEach(a => {
                try {
                    const dueDate = parseISO(a.dueDate)
                    const days = differenceInDays(dueDate, now)
                    const hours = differenceInHours(dueDate, now)
                    const id = `assign-${a.id}`

                    if (dismissedIds.has(id)) return
                    const snoozeEnd = snoozedUntil.get(id)
                    if (snoozeEnd && now < snoozeEnd) return

                    if (isPast(dueDate) && !isToday(dueDate)) {
                        items.push({ id, type: "assignment", title: a.title, dueText: `${Math.abs(days)}d overdue`, urgency: "critical", link: "/assignments" })
                    } else if (isToday(dueDate)) {
                        items.push({ id, type: "assignment", title: a.title, dueText: hours <= 3 ? `${hours}h left` : "Today", urgency: hours <= 3 ? "critical" : "warning", link: "/assignments" })
                    } else if (isTomorrow(dueDate)) {
                        items.push({ id, type: "assignment", title: a.title, dueText: "Tomorrow", urgency: "warning", link: "/assignments" })
                    } else if (days <= 3 && days > 0) {
                        items.push({ id, type: "assignment", title: a.title, dueText: `${days}d left`, urgency: "info", link: "/assignments" })
                    }
                } catch { }
            })

        exams.forEach(exam => {
            try {
                const examDate = new Date(exam.date)
                const days = differenceInDays(examDate, now)
                const id = `exam-${exam.id}`

                if (dismissedIds.has(id)) return
                const snoozeEnd = snoozedUntil.get(id)
                if (snoozeEnd && now < snoozeEnd) return

                if (days === 0) {
                    items.push({ id, type: "exam", title: exam.title, dueText: "Today!", urgency: "critical", link: "/academics" })
                } else if (days === 1) {
                    items.push({ id, type: "exam", title: exam.title, dueText: "Tomorrow!", urgency: "critical", link: "/academics" })
                } else if (days <= 3 && days > 0) {
                    items.push({ id, type: "exam", title: exam.title, dueText: `${days}d left`, urgency: "warning", link: "/academics" })
                } else if (days <= 7 && days > 0) {
                    items.push({ id, type: "exam", title: exam.title, dueText: `${days}d left`, urgency: "info", link: "/academics" })
                }
            } catch { }
        })

        todos
            .filter(t => !t.completed && t.dueDate)
            .forEach(t => {
                try {
                    const dueDate = parseISO(t.dueDate!)
                    const days = differenceInDays(dueDate, now)
                    const id = `todo-${t.id}`

                    if (dismissedIds.has(id)) return
                    const snoozeEnd = snoozedUntil.get(id)
                    if (snoozeEnd && now < snoozeEnd) return

                    if (isPast(dueDate) && !isToday(dueDate)) {
                        items.push({ id, type: "todo", title: t.text, dueText: "Overdue", urgency: "critical", link: "/todos" })
                    } else if (isToday(dueDate)) {
                        items.push({ id, type: "todo", title: t.text, dueText: "Today", urgency: "warning", link: "/todos" })
                    }
                } catch { }
            })

        return items.sort((a, b) => {
            const order = { critical: 0, warning: 1, info: 2 }
            return order[a.urgency] - order[b.urgency]
        })
    }, [assignments, exams, todos, dismissedIds, snoozedUntil])

    const dismiss = (id: string) => setDismissedIds(prev => new Set(prev).add(id))
    const snooze = (id: string) => setSnoozedUntil(prev => new Map(prev).set(id, new Date(Date.now() + SNOOZE_DURATION * 60 * 1000)))

    React.useEffect(() => {
        const interval = setInterval(() => {
            setSnoozedUntil(prev => {
                const now = new Date()
                const next = new Map(prev)
                for (const [id, until] of next.entries()) {
                    if (now >= until) next.delete(id)
                }
                return next
            })
        }, 60000)
        return () => clearInterval(interval)
    }, [])

    if (reminders.length === 0) return null

    const criticalCount = reminders.filter(r => r.urgency === "critical").length

    return (
        <div className="fixed bottom-20 md:bottom-4 right-4 z-50">
            <AnimatePresence mode="wait">
                {!isOpen ? (
                    <motion.button
                        key="fab"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setIsOpen(true)}
                        className={cn(
                            "h-12 w-12 rounded-full shadow-lg flex items-center justify-center relative",
                            "transition-colors duration-200",
                            criticalCount > 0
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-primary text-primary-foreground"
                        )}
                    >
                        <IconBell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 bg-background border text-foreground rounded-full min-w-5 h-5 text-[10px] font-bold flex items-center justify-center">
                            {reminders.length}
                        </span>
                    </motion.button>
                ) : (
                    <motion.div
                        key="panel"
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.15 }}
                    >
                        <Card className="w-72 shadow-xl">
                            {/* Header */}
                            <div className="flex items-center justify-between px-3 py-2 border-b">
                                <div className="flex items-center gap-2">
                                    <IconBell className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                        {reminders.length} Reminder{reminders.length !== 1 && 's'}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <IconX className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* List */}
                            <CardContent className="p-0 max-h-60 overflow-y-auto">
                                {reminders.slice(0, 5).map((reminder) => {
                                    const Icon = TYPE_ICONS[reminder.type]
                                    return (
                                        <div
                                            key={reminder.id}
                                            className={cn(
                                                "px-3 py-2 border-b last:border-b-0",
                                                "hover:bg-muted/50 transition-colors"
                                            )}
                                        >
                                            <div className="flex items-start gap-2">
                                                <Icon className={cn(
                                                    "w-4 h-4 mt-0.5 shrink-0",
                                                    reminder.urgency === "critical" && "text-destructive",
                                                    reminder.urgency === "warning" && "text-orange-500",
                                                    reminder.urgency === "info" && "text-muted-foreground"
                                                )} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{reminder.title}</p>
                                                    <Badge
                                                        variant={reminder.urgency === "critical" ? "destructive" : "secondary"}
                                                        className="mt-1 text-[10px] h-5"
                                                    >
                                                        {reminder.dueText}
                                                    </Badge>
                                                </div>
                                                {reminder.link && (
                                                    <Link href={reminder.link}>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                                            <IconExternalLink className="w-3 h-3" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="flex gap-1 mt-2 ml-6">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 text-[10px] px-2"
                                                    onClick={() => snooze(reminder.id)}
                                                >
                                                    <IconClock className="w-3 h-3 mr-1" />
                                                    30m
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-[10px] px-2"
                                                    onClick={() => dismiss(reminder.id)}
                                                >
                                                    Dismiss
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </CardContent>

                            {reminders.length > 5 && (
                                <div className="px-3 py-2 border-t text-center">
                                    <span className="text-xs text-muted-foreground">
                                        +{reminders.length - 5} more
                                    </span>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
