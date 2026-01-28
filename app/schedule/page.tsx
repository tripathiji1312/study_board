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
                addToMap(ev.day, { type: "Class", title: ev.title, color: "bg-tertiary" })
            } else {
                // Handling recurring days (Monday, Tuesday etc) is harder with a simple map
                // We'll handle them separately or generate dates for the view
            }
        })

        assignments.forEach(a => {
            if (a.dueDate) {
                const dateStr = a.dueDate.split('T')[0]
                addToMap(dateStr, { type: "Assignment", title: a.title, color: "bg-primary" })
            }
        })

        exams.forEach(e => {
            if (e.date) {
                const dateStr = e.date.split('T')[0]
                addToMap(dateStr, { type: "Exam", title: e.title, color: "bg-error" })
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
                items.push({ type: "Class", title: ev.title, color: "bg-tertiary" })
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
            <div className="max-w-[1800px] mx-auto min-h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">

                {/* BIG CALENDAR AREA */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex items-center justify-between pl-2">
                        <div className="flex items-center gap-4">
                            <h2 className="text-3xl md:text-4xl font-normal tracking-tight text-on-surface">{format(currentMonth, "MMMM yyyy")}</h2>
                            <div className="flex items-center gap-1 bg-surface-container-high rounded-full p-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-surface-container-highest" onClick={prevMonth}>
                                    <IconChevronLeft className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-surface-container-highest" onClick={nextMonth}>
                                    <IconChevronRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={jumpToToday} className="rounded-full px-6 border-border/40 hover:bg-surface-container-high">Today</Button>
                            <div className="hidden md:block">
                                <CalendarImporter onImportComplete={refreshData} />
                            </div>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="flex-1 flex flex-col bg-surface-container-lowest rounded-[2rem] p-6 shadow-sm border border-border/20">
                        <div className="grid grid-cols-7 text-center mb-4">
                            {weeks.map(day => (
                                <div key={day} className="text-xs font-medium text-on-surface-variant/70 uppercase tracking-widest py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-2">
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
                                            "relative p-2 md:p-3 flex flex-col gap-1 transition-all cursor-pointer rounded-2xl min-h-[80px] md:min-h-[120px] group border border-transparent",
                                            !isCurrentMonth && "opacity-30 grayscale",
                                            isSelected ? "bg-primary-container/30 ring-2 ring-primary ring-inset shadow-inner" : "hover:bg-surface-container-high hover:border-border/20 bg-surface/50"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={cn(
                                                "text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                                                isToday ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant group-hover:bg-surface-container"
                                            )}>
                                                {format(date, "d")}
                                            </span>
                                            {dayEvents.length > 0 && <div className="md:hidden w-1.5 h-1.5 rounded-full bg-primary" />}
                                            {dayEvents.length > 0 && <span className="hidden md:inline text-[10px] text-on-surface-variant/70 font-mono bg-surface-container px-1.5 py-0.5 rounded-full">{dayEvents.length}</span>}
                                        </div>

                                        <div className="flex-1 flex flex-col justify-end gap-1.5 overflow-hidden mt-1">
                                            <div className="hidden md:block space-y-1">
                                                {dayEvents.slice(0, 3).map((ev, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 px-2 py-1 rounded-md bg-surface-container/50 border border-transparent group-hover:border-border/10 transition-colors truncate">
                                                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", ev.color)} />
                                                        <span className="text-[10px] truncate font-medium text-on-surface-variant leading-none">{ev.title}</span>
                                                    </div>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <div className="text-[10px] text-on-surface-variant/50 pl-2 font-medium">
                                                        + {dayEvents.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Selected Day Agenda */}
                <div className="w-full lg:w-[400px] flex flex-col gap-4">
                    <div className="bg-surface-container rounded-[2.5rem] p-1 flex-1 flex flex-col shadow-expressive">
                        <div className="p-6 pb-2">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-semibold text-on-surface">{format(selectedDate, "EEEE")}</h3>
                                    <p className="text-on-surface-variant">{format(selectedDate, "MMMM do")}</p>
                                </div>

                                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="icon" className="h-12 w-12 rounded-2xl shadow-md bg-primary text-on-primary hover:bg-primary/90 transition-transform active:scale-95">
                                            <IconPlus className="w-6 h-6" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none bg-surface-container-high shadow-xl">
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-medium">{editingEvent ? "Edit Event" : `Add to Schedule`}</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-5 py-4">
                                            <div className="grid gap-2">
                                                <Label className="text-on-surface-variant">Title</Label>
                                                <Input
                                                    className="bg-surface border-transparent rounded-xl h-12"
                                                    placeholder="Study Session, Gym, etc."
                                                    value={newEventTitle}
                                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label className="text-on-surface-variant">Type</Label>
                                                    <Select value={newEventType} onValueChange={(v: any) => setNewEventType(v)}>
                                                        <SelectTrigger className="bg-surface border-transparent rounded-xl h-12">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            <SelectItem value="Personal">Personal</SelectItem>
                                                            <SelectItem value="Study">Study Block</SelectItem>
                                                            <SelectItem value="Lecture">Lecture</SelectItem>
                                                            <SelectItem value="Lab">Lab</SelectItem>
                                                            <SelectItem value="Exam">📝 Exam</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label className="text-on-surface-variant">{newEventType === "Exam" ? "Notes" : "Location"}</Label>
                                                    <Input
                                                        className="bg-surface border-transparent rounded-xl h-12"
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
                                                        <SelectTrigger className="bg-surface border-transparent rounded-xl h-12">
                                                            <SelectValue placeholder="Select subject..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            {subjects.map(s => (
                                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label className="text-on-surface-variant">{newEventType === "Exam" ? "Time" : "Start Time"}</Label>
                                                    <Input
                                                        type="time"
                                                        className="bg-surface border-transparent rounded-xl h-12"
                                                        value={newEventTime}
                                                        onChange={(e) => setNewEventTime(e.target.value)}
                                                    />
                                                </div>
                                                {newEventType !== "Exam" && (
                                                    <div className="grid gap-2">
                                                        <Label className="text-on-surface-variant">End Time</Label>
                                                        <Input
                                                            type="time"
                                                            className="bg-surface border-transparent rounded-xl h-12"
                                                            value={newEventEndTime}
                                                            onChange={(e) => setNewEventEndTime(e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="ghost" onClick={() => { setIsAddOpen(false); setEditingEvent(null); }} className="rounded-full">Cancel</Button>
                                            <Button onClick={handleAddEvent} className="rounded-full px-6">{editingEvent ? "Update Event" : "Add Event"}</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="h-px w-full bg-border/10 mb-2" />
                        </div>

                        <ScrollArea className="flex-1 h-[400px]">
                            <div className="px-4 pb-6 space-y-3">
                                {selectedDayEvents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-[300px] text-on-surface-variant/40">
                                        <div className="p-4 bg-surface rounded-full mb-3">
                                            <IconClock className="w-8 h-8" />
                                        </div>
                                        <p>No events scheduled</p>
                                    </div>
                                ) : (
                                    selectedDayEvents.map((item: any, i) => {
                                        const isCompleted = item.type === "Todo" && item.completed
                                        return (
                                            <div key={i} className="group relative flex gap-4">
                                                {/* Timeline */}
                                                <div className="flex flex-col items-center pt-2">
                                                    <div className={cn(
                                                        "w-3 h-3 rounded-full ring-4 ring-surface-container z-10",
                                                        item.type === "Exam" ? "bg-error" :
                                                            item.type === "Assignment" ? "bg-primary" :
                                                                item.type === "Class" ? "bg-tertiary" : "bg-secondary"
                                                    )} />
                                                    <div className="w-[2px] bg-surface-container-high h-full absolute top-4 bottom-[-1rem] left-[5px]" />
                                                </div>

                                                <div className="flex-1 min-w-0 pb-4">
                                                    <div className={cn(
                                                        "p-4 rounded-2xl bg-surface border border-transparent transition-all hover:border-border/20 hover:shadow-sm",
                                                        isCompleted && "opacity-60 grayscale"
                                                    )}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-mono text-on-surface-variant">{item.time || "All Day"}</span>
                                                                <Badge variant="secondary" className="text-[10px] rounded-md px-1.5 py-0 bg-surface-container-high text-on-surface-variant font-normal">
                                                                    {item.type}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-1 -mr-2 -mt-2">
                                                                {item.type === "Todo" && (
                                                                    <Checkbox
                                                                        checked={isCompleted}
                                                                        className="w-5 h-5 rounded-full border-2 border-on-surface-variant/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                                        onCheckedChange={(c) => toggleTodo(item.id.toString(), !!c)}
                                                                    />
                                                                )}
                                                                {item.type === "Class" && (
                                                                    <>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full"
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
                                                                            <IconEdit className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-error hover:bg-surface-container-high rounded-full"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                deleteScheduleEvent(item.id)
                                                                            }}
                                                                        >
                                                                            <IconTrash className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <h4 className={cn("font-medium text-base text-on-surface truncate", isCompleted && "line-through")}>{item.title || item.text}</h4>
                                                        {item.location && <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-2"><IconMapPin className="w-3.5 h-3.5" /> {item.location}</p>}
                                                        {item.course && <p className="text-xs text-on-surface-variant mt-1 bg-surface-container-high/50 inline-block px-2 py-0.5 rounded-md">{item.course}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </Shell>
    )
}
