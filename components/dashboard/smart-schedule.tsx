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
import confetti from "canvas-confetti"
import { toast } from "sonner"
import { useSession, signIn, signOut } from "next-auth/react"
import {
    IconCalendar,
    IconCalendarEvent,
    IconSchool,
    IconFlag,
    IconAlertTriangle,
    IconCheck,
    IconPlus,
    IconClock,
    IconBrandGoogle
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Small Components ---
function ProgressBadge({ progress }: { progress: number }) {
    const isComplete = progress >= 100
    return (
        <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all",
            isComplete ? "bg-emerald-500/20 text-emerald-500" : "bg-primary/10 text-primary"
        )}>
            {isComplete ? (
                <>
                    <IconCheck className="w-3 h-3" />
                    Done!
                </>
            ) : (
                <>
                    {Math.round(progress)}%
                </>
            )}
        </div>
    )
}

// Animation Variants
const listVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
}

// Unified Event Type
type TimelineItem = {
    id: string | number
    type: "Class" | "Assignment" | "Exam" | "Todo" | "Google"
    title: string
    time?: string // HH:mm
    subtitle?: string
    priority?: "Low" | "Medium" | "High" | "Urgent"
    status?: "Pending" | "In Progress" | "Completed"
    original: any
}

// --- Sortable Item Component ---
function SortableItem({ id, children, disabled }: { id: string, children: React.ReactNode, disabled?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
        position: 'relative' as 'relative', // Fix type
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
}

export function SmartScheduleWidget() {
    const { schedule, assignments, exams, todos, toggleTodo, subjects, updateTodo, updateAssignment } = useStore()
    const { data: session } = useSession()
    const [activeTab, setActiveTab] = React.useState("today")
    const [googleEvents, setGoogleEvents] = React.useState<any[]>([])

    const today = React.useMemo(() => new Date(), [])
    const tomorrow = React.useMemo(() => addDays(today, 1), [today])

    // Fetch Google Calendar Events
    React.useEffect(() => {
        if (session) {
            fetch('/api/gcal/sync')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setGoogleEvents(data)
                    }
                })
                .catch(err => console.error("Failed to fetch GCal", err))
        }
    }, [session])

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
                const subject = subjects.find(s => s.id === e.subjectId)
                items.push({
                    id: `ex-${e.id}`,
                    type: "Exam",
                    title: e.title,
                    time: format(new Date(e.date), "HH:mm"),
                    subtitle: subject?.name || "Exam",
                    priority: "Urgent",
                    original: e
                })
            }
        })

        // 4. Google Events
        googleEvents.forEach(g => {
            const gDate = new Date(g.start)
            if (isSameDay(gDate, date)) {
                items.push({
                    id: `g-${g.id}`,
                    type: "Google",
                    title: g.title,
                    time: format(gDate, "HH:mm"),
                    subtitle: "Google Calendar",
                    original: g
                })
            }
        })

        // 5. Todos (Tasks for date)
        todos.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), date)).forEach(t => {
            items.push({
                id: `td-${t.id}`,
                type: "Todo",
                title: t.text,
                time: undefined,
                subtitle: t.description || "Task",
                original: t
            })
        })

        // Sort by time
        return items.sort((a, b) => {
            const timeA = a.time || "23:59"
            const timeB = b.time || "23:59"
            return timeA.localeCompare(timeB)
        })
    }, [schedule, assignments, exams, todos, today, googleEvents])

    const todayItems = React.useMemo(() => getItemsForDate(today), [getItemsForDate, today])
    const tomorrowItems = React.useMemo(() => getItemsForDate(tomorrow), [getItemsForDate, tomorrow])

    // Week View Data
    const weekDays = React.useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(today, i))
    }, [today])

    const weekItems = React.useMemo(() => {
        const itemsByDay: Record<string, TimelineItem[]> = {}
        weekDays.forEach(day => {
            const dateStr = format(day, "yyyy-MM-dd")
            itemsByDay[dateStr] = getItemsForDate(day)
        })
        return itemsByDay
        return itemsByDay
    }, [weekDays, getItemsForDate])

    // Progress Calculation (Actionable items only)
    const progress = React.useMemo(() => {
        const actionable = todayItems.filter(i => i.type === "Todo" || i.type === "Assignment")
        if (actionable.length === 0) return 0
        const completed = actionable.filter(i => i.status === "Completed" || i.original?.completed).length
        return (completed / actionable.length) * 100
    }, [todayItems])

    // Quick Add Mock
    const handleAdd = () => {
        window.location.href = "/schedule"
    }

    const handleToggle = (id: string | number, type: string, isCurrentlyCompleted?: boolean) => {
        if (type === "Todo") {
            const todoId = String(id).replace("td-", "")
            const newStatus = !isCurrentlyCompleted

            // toggleTodo expects (id, currentStatus) and internally does !currentStatus
            // So we pass isCurrentlyCompleted (the CURRENT status) and it will flip it
            toggleTodo(todoId, isCurrentlyCompleted ?? false)

            if (newStatus) {
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.7 },
                    colors: ['#3b82f6', '#10b981', '#f59e0b']
                })
                toast.success("Task Completed! +20 XP 🌟")
            }
        }
    }

    // --- Drag and Drop Logic ---
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const activeId = String(active.id)
        const overId = String(over.id)

        // Find current list
        const currentList = activeTab === "today" ? todayItems : activeTab === "tomorrow" ? tomorrowItems : []
        const oldIndex = currentList.findIndex(i => i.id === activeId)
        const newIndex = currentList.findIndex(i => i.id === overId)

        if (oldIndex === -1 || newIndex === -1) return

        // 1. Identify Target Time
        let newTime = "12:00" // Default

        // Strategy: Take time of item AT newIndex (or before/after depending on direction)
        // If moving down (old < new): Place AFTER newIndex item
        // If moving up (old > new): Place BEFORE newIndex item

        // Simpler: Just look at the neighbor at the target position
        // If I drop at index 0, take index 1 time minus 30m?
        // If I drop at index 5, take index 4 time plus 30m?

        let targetNeighborIndex = newIndex
        if (oldIndex < newIndex) {
            // Moved down. We want to be after the item currently at newIndex (which shifts up)
            // But visually, we are dropping "on" it.
            // Let's look at the item *currently* at the drop position.
            // If we want to be *after* it? No, standard sortable swaps them.
            // Let's rely on arrayMove logic locally to find "neighbors".

            // Actually, simpler heuristic:
            // Get item at newIndex. Inherit its time?
            // Or get time of item *before* the new slot. 
            const prevItem = newIndex > 0 ? currentList[newIndex - 1] : null
            const nextItem = currentList[newIndex]
            // Logic is tricky because list is dynamic.

            // Let's use the time of the item we swapped with.
            const targetItem = currentList[newIndex]
            if (targetItem.time) newTime = targetItem.time
        } else {
            const targetItem = currentList[newIndex]
            if (targetItem.time) newTime = targetItem.time
        }

        // Apply Time Update
        const type = activeId.split("-")[0]
        const id = activeId.split("-")[1]

        // Only allow updating Todos and Assignments for now
        if (type === "td") {
            updateTodo(id, { dueTime: newTime })
            toast.success(`Rescheduled to ${newTime}`)
        } else if (type === "as") {
            // Assignments might not support dueTime update in same way, but let's try
            // updateAssignment({ ...item.original, dueDate: ... }) -> Complex if date changes?
            // Just time for now. Assignment interface has dueDate string (ISO?).
            // Skip assignment rescheduling for safety for now.
            toast("Assignment rescheduling not fully supported yet.")
        }
    }

    const renderList = (items: TimelineItem[]) => {
        if (items.length === 0) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="bg-accent/50 p-6 rounded-full mb-4"
                    >
                        <IconCalendar className="w-10 h-10" />
                    </motion.div>
                    <p className="font-medium">No plans yet</p>
                    <p className="text-xs">Enjoy your free time!</p>
                </div>
            )
        }

        return (
            <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="space-y-1 pr-3"
            >
                <AnimatePresence mode="popLayout">
                    {items.map((item) => {
                        const isCompleted = item.type === "Todo" && item.original?.completed
                        const isTodo = item.type === "Todo"

                        return (
                            <motion.div
                                key={item.id}
                                variants={itemVariants}
                                layout
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                                onClick={isTodo ? () => handleToggle(item.id, item.type, isCompleted) : undefined}
                                className={cn(
                                    "group/item flex items-center gap-3 p-2.5 rounded-lg transition-all border border-transparent",
                                    isTodo && "hover:bg-accent/50 cursor-pointer active:scale-[0.98]",
                                    !isTodo && "hover:bg-accent/30",
                                    isCompleted && "opacity-50"
                                )}
                            >
                                {/* Icon / Action Column */}
                                <div className="shrink-0">
                                    {isTodo ? (
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                            isCompleted ? "bg-primary border-primary" : "border-muted-foreground/30 hover:border-primary/50"
                                        )}>
                                            {isCompleted && <IconCheck className="w-3 h-3 text-primary-foreground" />}
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center border text-xs shadow-sm",
                                            item.type === "Exam" ? "bg-red-100 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400" :
                                                item.type === "Assignment" ? "bg-orange-100 border-orange-200 text-orange-600 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400" :
                                                    item.type === "Google" ? "bg-white border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/10 dark:text-white" :
                                                        "bg-blue-100 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                                        )}>
                                            {item.type === "Exam" && <IconAlertTriangle className="w-4 h-4" />}
                                            {item.type === "Assignment" && <IconFlag className="w-4 h-4" />}
                                            {item.type === "Class" && <IconSchool className="w-4 h-4" />}
                                            {item.type === "Google" && <IconBrandGoogle className="w-4 h-4" />}
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
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </motion.div>
        )
    }

    const renderWeekList = () => {
        const hasAnyItems = weekDays.some(day => {
            const dateStr = format(day, "yyyy-MM-dd")
            return weekItems[dateStr]?.length > 0
        })

        if (!hasAnyItems) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="bg-accent/50 p-6 rounded-full mb-4"
                    >
                        <IconCalendar className="w-10 h-10" />
                    </motion.div>
                    <p className="font-medium">No plans for the week</p>
                    <p className="text-xs">Time to relax!</p>
                </div>
            )
        }

        return (
            <div className="space-y-6 pb-4">
                {weekDays.map(day => {
                    const dateStr = format(day, "yyyy-MM-dd")
                    const items = weekItems[dateStr] || []
                    if (items.length === 0) return null

                    return (
                        <div key={dateStr} className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 bg-card/95 backdrop-blur py-2 z-10 border-b w-full">
                                {format(day, "EEEE, MMM d")}
                            </h4>
                            {renderList(items)}
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <Card className="h-full min-h-[500px] flex flex-col shadow-sm group">
            <CardHeader className="p-4 pb-2 space-y-0 flex flex-row items-center justify-between border-b bg-card shrink-0">
                <div className="flex items-center gap-3">
                    <CardTitle className="text-sm font-medium">Smart Agenda</CardTitle>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
                        {activeTab === "today" ? format(today, "MMM d") :
                            activeTab === "tomorrow" ? format(tomorrow, "MMM d") :
                                "Next 7 Days"}
                    </Badge>
                    {activeTab === "today" && <ProgressBadge progress={progress} />}
                </div>

                <div className="flex items-center gap-2">
                    {!session && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-sm"
                            onClick={() => signIn("google")}
                            title="Connect Google Calendar"
                        >
                            <IconBrandGoogle className="w-3.5 h-3.5" />
                        </Button>
                    )}
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
                            <TabsTrigger
                                value="week"
                                className="h-6 text-[10px] px-2.5 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                            >
                                Week
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative bg-card/50">
                <ScrollArea className="h-full p-2">
                    {activeTab === "today" && renderList(todayItems)}
                    {activeTab === "tomorrow" && renderList(tomorrowItems)}
                    {activeTab === "week" && renderWeekList()}
                </ScrollArea>

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
