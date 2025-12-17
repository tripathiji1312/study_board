"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    IconPlus,
    IconTrash,
    IconCalendarEvent,
    IconClock,
    IconBook,
    IconFlask,
    IconNotebook,
    IconTarget,
    IconMapPin,
    IconAlertCircle
} from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { format, isSameDay, isToday, isFuture, parseISO, startOfDay, addDays } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

const TYPE_CONFIG: Record<string, { icon: typeof IconBook, color: string, bg: string }> = {
    "Class": { icon: IconBook, color: "text-blue-500", bg: "bg-blue-500" },
    "Lab": { icon: IconFlask, color: "text-purple-500", bg: "bg-purple-500" },
    "Exam": { icon: IconAlertCircle, color: "text-red-500", bg: "bg-red-500" },
    "Study": { icon: IconNotebook, color: "text-green-500", bg: "bg-green-500" },
    "Personal": { icon: IconTarget, color: "text-orange-500", bg: "bg-orange-500" },
}

export default function SchedulePage() {
    const { schedule, subjects, currentSemester, addScheduleEvent, deleteScheduleEvent } = useStore()
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)

    // Form State
    const [title, setTitle] = React.useState("")
    const [type, setType] = React.useState("Class")
    const [time, setTime] = React.useState("")
    const [duration, setDuration] = React.useState("1h")
    const [location, setLocation] = React.useState("")
    const [subjectId, setSubjectId] = React.useState("")

    const currentSubjects = subjects.filter(s => s.semesterId === currentSemester?.id)

    // Get events for selected date
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd")
    const eventsForSelectedDate = schedule
        .filter(e => e.day === selectedDateStr || e.day === format(selectedDate, "EEEE"))
        .sort((a, b) => a.time.localeCompare(b.time))

    // Get upcoming events (next 7 days)
    const upcomingEvents = schedule
        .filter(e => {
            try {
                const eventDate = parseISO(e.day)
                return isFuture(eventDate) || isToday(eventDate)
            } catch {
                return false // Weekly recurring events
            }
        })
        .sort((a, b) => a.day.localeCompare(b.day))
        .slice(0, 5)

    // Dates with events (for calendar highlighting)
    const datesWithEvents = React.useMemo(() => {
        return schedule
            .map(e => {
                try {
                    return parseISO(e.day)
                } catch {
                    return null
                }
            })
            .filter(Boolean) as Date[]
    }, [schedule])

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !time) return

        const selectedSubject = subjects.find(s => s.id === subjectId)
        const eventTitle = selectedSubject && (type === "Class" || type === "Lab") ? selectedSubject.name : title

        addScheduleEvent({
            title: eventTitle,
            type,
            time,
            duration,
            location: location || undefined,
            day: format(selectedDate, "yyyy-MM-dd"),
            subjectId: subjectId && subjectId !== "none" ? subjectId : undefined
        })

        setTitle("")
        setTime("")
        setDuration("1h")
        setLocation("")
        setSubjectId("")
        setIsDialogOpen(false)
    }

    const EventCard = ({ event, showDate = false }: { event: typeof schedule[0], showDate?: boolean }) => {
        const config = TYPE_CONFIG[event.type] || TYPE_CONFIG["Personal"]
        const Icon = config.icon

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all group"
            >
                <div className={`w-1 h-12 rounded-full ${config.bg}`} />
                <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                        {showDate && (
                            <span className="font-medium">
                                {(() => {
                                    try {
                                        return format(parseISO(event.day), "MMM d")
                                    } catch {
                                        return event.day
                                    }
                                })()}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <IconClock className="w-3 h-3" /> {event.time}
                        </span>
                        <span>·</span>
                        <span>{event.duration}</span>
                        {event.location && (
                            <>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                    <IconMapPin className="w-3 h-3" /> {event.location}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <Badge variant="outline" className={`text-xs ${config.color}`}>{event.type}</Badge>
                <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 text-destructive shrink-0 h-8 w-8"
                    onClick={() => deleteScheduleEvent(event.id)}
                >
                    <IconTrash className="w-4 h-4" />
                </Button>
            </motion.div>
        )
    }

    return (
        <Shell>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
                        <p className="text-muted-foreground">Your personal academic calendar</p>
                    </div>
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <IconPlus className="w-4 h-4 mr-2" /> Add Event
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Calendar */}
                    <Card className="lg:col-span-2">
                        <CardContent className="p-4">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                className="w-full"
                                modifiers={{
                                    hasEvent: datesWithEvents
                                }}
                                modifiersStyles={{
                                    hasEvent: {
                                        fontWeight: "bold",
                                        textDecoration: "underline",
                                        textDecorationColor: "hsl(var(--primary))"
                                    }
                                }}
                            />
                        </CardContent>
                    </Card>

                    {/* Upcoming Events */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <IconCalendarEvent className="w-5 h-5" />
                                Upcoming
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[280px]">
                                {upcomingEvents.length > 0 ? (
                                    <div className="space-y-2">
                                        {upcomingEvents.map(event => (
                                            <EventCard key={event.id} event={event} showDate />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <p className="text-sm">No upcoming events</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Selected Date Events */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                            {format(selectedDate, "EEEE, MMMM d, yyyy")}
                            {isToday(selectedDate) && (
                                <Badge variant="secondary" className="ml-2">Today</Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {eventsForSelectedDate.length > 0 ? (
                            <div className="space-y-2">
                                <AnimatePresence>
                                    {eventsForSelectedDate.map(event => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-muted-foreground mb-3">No events on this day</p>
                                <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
                                    <IconPlus className="w-4 h-4 mr-1" /> Add Event
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Add Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add Event — {format(selectedDate, "MMM d")}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.keys(TYPE_CONFIG).map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {(type === "Class" || type === "Lab") && currentSubjects.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Subject</Label>
                                        <Select value={subjectId} onValueChange={setSubjectId}>
                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {currentSubjects.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event name" required={!subjectId || subjectId === "none"} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Time</Label>
                                    <Input type="time" value={time} onChange={e => setTime(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duration</Label>
                                    <Select value={duration} onValueChange={setDuration}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="30m">30 min</SelectItem>
                                            <SelectItem value="1h">1 hour</SelectItem>
                                            <SelectItem value="1.5h">1.5 hours</SelectItem>
                                            <SelectItem value="2h">2 hours</SelectItem>
                                            <SelectItem value="3h">3 hours</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Room / Building" />
                            </div>

                            <DialogFooter>
                                <Button type="submit" className="w-full">Add Event</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </Shell>
    )
}
