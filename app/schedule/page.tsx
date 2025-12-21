"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore, ScheduleEvent } from "@/components/providers/store-provider"
import { CalendarImporter } from "@/components/calendar-importer"
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    isSameMonth,
    addMonths,
    subMonths,
    parseISO
} from "date-fns"
import {
    IconChevronLeft,
    IconChevronRight,
    IconClock,
    IconSchool,
    IconFlag,
    IconAlertTriangle,
    IconCheck,
    IconPlus,
    IconMapPin,
    IconTrash,
    IconEdit
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function SchedulePage() {
    const { schedule, assignments, exams, todos, subjects, toggleTodo, addScheduleEvent, updateScheduleEvent, addExam, refreshData, deleteScheduleEvent } = useStore()
    const [currentMonth, setCurrentMonth] = React.useState(new Date())
    const [selectedDate, setSelectedDate] = React.useState(new Date())

    // Dialog State
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [newEventTitle, setNewEventTitle] = React.useState("")
    const [newEventType, setNewEventType] = React.useState<"Lecture" | "Lab" | "Study" | "Personal" | "Exam">("Personal")
    const [newEventTime, setNewEventTime] = React.useState("09:00")
    const [newEventEndTime, setNewEventEndTime] = React.useState("10:00")
    const [newEventLocation, setNewEventLocation] = React.useState("")
    const [newExamSubjectId, setNewExamSubjectId] = React.useState("")
    const [editingEvent, setEditingEvent] = React.useState<any>(null)

    // --- Calendar Logic ---
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
    const weeks = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const jumpToToday = () => {
        const today = new Date()
        setCurrentMonth(today)
        setSelectedDate(today)
    }

    const handleAddEvent = () => {
        if (!newEventTitle) return

        const dateStr = format(selectedDate, "yyyy-MM-dd")

        if (newEventType === "Exam") {
            // Add as exam (Exams are not editable in this quick view yet)
            addExam({
                title: newEventTitle,
                subjectId: newExamSubjectId || undefined,
                date: dateStr,
                time: newEventTime,
                syllabus: newEventLocation
            })
            toast.success("Exam scheduled")
        } else {
            if (editingEvent) {
                updateScheduleEvent({
                    ...editingEvent,
                    title: newEventTitle,
                    type: newEventType,
                    day: dateStr,
                    startTime: newEventTime,
                    endTime: newEventEndTime,
                    location: newEventLocation
                })
                toast.success("Event updated")
            } else {
                addScheduleEvent({
                    title: newEventTitle,
                    type: newEventType,
                    day: dateStr,
                    startTime: newEventTime,
                    endTime: newEventEndTime,
                    location: newEventLocation
                })
                toast.success("Event added to schedule")
            }
        }

        setIsAddOpen(false)
        setEditingEvent(null)
        setNewEventTitle("")
        setNewEventLocation("")
        setNewExamSubjectId("")
        // Reset times
        setNewEventTime("09:00")
        setNewEventEndTime("10:00")
        setNewEventType("Personal")
    }

    // --- Data Aggregation Helper ---
    // Optimization: Create Maps for O(1) lookup instead of O(N) filtering inside loops
    const eventsByDate = React.useMemo(() => {
        const map = new Map<string, { type: string, title: string, color: string }[]>()

        const addToMap = (dateStr: string, item: { type: string, title: string, color: string }) => {
            if (!map.has(dateStr)) map.set(dateStr, [])
            map.get(dateStr)?.push(item)
        }

        schedule.forEach(ev => {
            if (ev.day.match(/^\d{4}-\d{2}-\d{2}$/)) {
                addToMap(ev.day, { type: "Class", title: ev.title, color: "bg-blue-500" })
            } else {
                // Handling recurring days (Monday, Tuesday etc) is harder with a simple map
                // We'll handle them separately or generate dates for the view
            }
        })

        assignments.forEach(a => {
            if (a.dueDate) {
                const dateStr = a.dueDate.split('T')[0]
                addToMap(dateStr, { type: "Assignment", title: a.title, color: "bg-orange-500" })
            }
        })

        exams.forEach(e => {
            if (e.date) {
                const dateStr = e.date.split('T')[0]
                addToMap(dateStr, { type: "Exam", title: e.title, color: "bg-red-500" })
            }
        })

        return map
    }, [schedule, assignments, exams])

    const getDayEvents = React.useCallback((date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        const dayName = format(date, "EEEE")

        // Get strict date matches
        const items = [...(eventsByDate.get(dateStr) || [])]

        // Add recurring schedule events
        schedule.forEach(ev => {
            if (ev.day === dayName) {
                items.push({ type: "Class", title: ev.title, color: "bg-blue-500" })
            }
        })

        return items
    }, [eventsByDate, schedule])

    // --- Selected Day Details Helper ---
    const getDetailedEvents = React.useCallback((date: Date) => {
        const items: any[] = []
        const dayName = format(date, "EEEE")
        const dateStr = format(date, "yyyy-MM-dd")

        schedule.forEach(ev => items.push({ ...ev, type: "Class", time: ev.startTime }))
        assignments.forEach(a => {
            if (a.dueDate && isSameDay(parseISO(a.dueDate), date)) items.push({ ...a, type: "Assignment", time: "23:59" })
        })
        exams.forEach(e => {
            if (isSameDay(new Date(e.date), date)) items.push({ ...e, type: "Exam", time: format(new Date(e.date), "HH:mm") })
        })
        if (isSameDay(date, new Date())) {
            todos.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), date)).forEach(t => items.push({ ...t, type: "Todo", title: t.text }))
        }

        const validItems = items.filter(item => {
            if (item.type === "Class") {
                return (item as any).day === dayName || (item as any).day === dateStr
            }
            return true
        })

        return validItems.sort((a, b) => (a.time || "").localeCompare(b.time || ""))
    }, [schedule, assignments, exams, todos])

    const selectedDayEvents = getDetailedEvents(selectedDate)

    return (
        <Shell>
            <div className="max-w-[1600px] mx-auto h-auto lg:h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6 p-2">

                {/* BIG CALENDAR AREA */}
                <div className="flex-1 flex flex-col gap-4 min-h-[500px]">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{format(currentMonth, "MMMM yyyy")}</h2>
                            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                                    <IconChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                                    <IconChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button variant="outline" size="sm" onClick={jumpToToday}>Today</Button>
                            <CalendarImporter onImportComplete={refreshData} />
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <Card className="flex-1 flex flex-col shadow-sm border-muted min-h-[400px] lg:min-h-0 overflow-hidden">
                        <div className="grid grid-cols-7 border-b bg-muted/40 text-center py-2">
                            {weeks.map(day => (
                                <div key={day} className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-muted/20 gap-[1px]">
                            {calendarDays.map((date, i) => {
                                const isSelected = isSameDay(date, selectedDate)
                                const isCurrentMonth = isSameMonth(date, currentMonth)
                                const isToday = isSameDay(date, new Date())
                                const dayEvents = getDayEvents(date)

                                return (
                                    <div
                                        key={date.toString()}
                                        onClick={() => setSelectedDate(date)}
                                        className={cn(
                                            "relative bg-card p-1 md:p-2 flex flex-col gap-1 transition-colors hover:bg-muted/50 cursor-pointer min-h-[60px] md:min-h-[100px]",
                                            !isCurrentMonth && "bg-muted/10 text-muted-foreground/50",
                                            isSelected && "ring-2 ring-primary ring-inset z-10"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={cn(
                                                "text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full",
                                                isToday && "bg-primary text-primary-foreground"
                                            )}>
                                                {format(date, "d")}
                                            </span>
                                            {dayEvents.length > 0 && <span className="hidden md:inline text-[10px] text-muted-foreground font-mono">{dayEvents.length}</span>}
                                            {dayEvents.length > 0 && <div className="md:hidden w-1.5 h-1.5 rounded-full bg-primary" />}
                                        </div>

                                        <div className="flex-1 flex flex-col justify-end gap-1 overflow-hidden">
                                            <div className="hidden md:block space-y-1">
                                                {dayEvents.slice(0, 3).map((ev, idx) => (
                                                    <div key={idx} className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm bg-muted/50 border border-transparent hover:border-border transition-colors truncate">
                                                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", ev.color)} />
                                                        <span className="text-[10px] truncate font-medium leading-tight">{ev.title}</span>
                                                    </div>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <div className="text-[10px] text-muted-foreground pl-1">
                                                        + {dayEvents.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                </div>

                {/* RIGHT: Selected Day Agenda */}
                <Card className="w-full lg:w-[400px] flex flex-col shadow-lg border-l-0 lg:border-l-4 border-t-4 lg:border-t-0 border-primary/20 h-[600px] lg:h-full">
                    <CardHeader className="py-4 border-b bg-muted/10">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>{format(selectedDate, "EEEE")}</CardTitle>
                                <p className="text-sm text-muted-foreground">{format(selectedDate, "MMMM do")}</p>
                            </div>

                            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                                <DialogTrigger asChild>
                                    <Button size="icon" className="h-8 w-8 rounded-full shadow-sm">
                                        <IconPlus className="w-4 h-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{editingEvent ? "Edit Event" : `Add to Schedule (${format(selectedDate, "MMM d")})`}</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label>Title</Label>
                                            <Input
                                                placeholder="Study Session, Gym, etc."
                                                value={newEventTitle}
                                                onChange={(e) => setNewEventTitle(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Type</Label>
                                                <Select value={newEventType} onValueChange={(v: any) => setNewEventType(v)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Personal">Personal</SelectItem>
                                                        <SelectItem value="Study">Study Block</SelectItem>
                                                        <SelectItem value="Lecture">Lecture</SelectItem>
                                                        <SelectItem value="Lab">Lab</SelectItem>
                                                        <SelectItem value="Exam">📝 Exam</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>{newEventType === "Exam" ? "Notes" : "Location"}</Label>
                                                <Input
                                                    placeholder={newEventType === "Exam" ? "Modules 1-3..." : "Room / Online"}
                                                    value={newEventLocation}
                                                    onChange={(e) => setNewEventLocation(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        {newEventType === "Exam" && (
                                            <div className="grid gap-2">
                                                <Label>Subject (Optional)</Label>
                                                <Select value={newExamSubjectId} onValueChange={setNewExamSubjectId}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select subject..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {subjects.map(s => (
                                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>{newEventType === "Exam" ? "Time" : "Start Time"}</Label>
                                                <Input
                                                    type="time"
                                                    value={newEventTime}
                                                    onChange={(e) => setNewEventTime(e.target.value)}
                                                />
                                            </div>
                                            {newEventType !== "Exam" && (
                                                <div className="grid gap-2">
                                                    <Label>End Time</Label>
                                                    <Input
                                                        type="time"
                                                        value={newEventEndTime}
                                                        onChange={(e) => setNewEventEndTime(e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        {newEventType !== "Exam" && (
                                            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                                <p>This will add a <b>Schedule Event</b> for this specific date.</p>
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => { setIsAddOpen(false); setEditingEvent(null); }}>Cancel</Button>
                                        <Button onClick={handleAddEvent}>{editingEvent ? "Update Event" : "Add Event"}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 p-0 overflow-hidden relative">
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-4">
                                {selectedDayEvents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground opacity-50">
                                        <IconClock className="w-12 h-12 mb-3" />
                                        <p>No events</p>
                                    </div>
                                ) : (
                                    selectedDayEvents.map((item: any, i) => {
                                        const isCompleted = item.type === "Todo" && item.completed
                                        return (
                                            <div key={i} className="group relative flex gap-3 pb-4 last:pb-0">
                                                <div className="flex flex-col items-center">
                                                    <div className={cn(
                                                        "w-2.5 h-2.5 rounded-full ring-4 ring-background z-10",
                                                        item.type === "Exam" ? "bg-red-500" :
                                                            item.type === "Assignment" ? "bg-orange-500" :
                                                                item.type === "Class" ? "bg-blue-500" : "bg-slate-400"
                                                    )} />
                                                    <div className="w-[1px] bg-border h-full absolute top-2.5" />
                                                </div>

                                                <div className="flex-1 min-w-0 pb-2">
                                                    <div className={cn(
                                                        "p-3 rounded-lg border bg-card transition-all hover:bg-accent/40",
                                                        isCompleted && "opacity-60 grayscale"
                                                    )}>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary" className="text-[10px] h-4 px-1">{item.time || "All Day"}</Badge>
                                                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-tight">{item.type}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {item.type === "Todo" && (
                                                                    <Checkbox
                                                                        checked={isCompleted}
                                                                        className="w-4 h-4 rounded-full"
                                                                        onCheckedChange={(c) => toggleTodo(item.id.toString(), !!c)}
                                                                    />
                                                                )}
                                                                {item.type === "Class" && (
                                                                    <>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                setEditingEvent(item)
                                                                                setNewEventTitle(item.title)
                                                                                setNewEventType(item.type)
                                                                                setNewEventTime(item.startTime || "09:00")
                                                                                setNewEventEndTime(item.endTime || "10:00")
                                                                                setNewEventLocation(item.location || "")
                                                                                setIsAddOpen(true)
                                                                            }}
                                                                        >
                                                                            <IconEdit className="w-3 h-3" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                deleteScheduleEvent(item.id)
                                                                            }}
                                                                        >
                                                                            <IconTrash className="w-3 h-3" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <h4 className={cn("font-semibold text-sm truncate", isCompleted && "line-through")}>{item.title || item.text}</h4>
                                                        {item.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><IconMapPin className="w-3 h-3" /> {item.location}</p>}
                                                        {item.course && <p className="text-xs text-muted-foreground mt-1">{item.course}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </Shell>
    )
}
