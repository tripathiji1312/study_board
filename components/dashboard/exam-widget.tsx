"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStore } from "@/components/providers/store-provider"
import { format, differenceInDays, parseISO, isValid } from "date-fns"
import { IconClock, IconPlus, IconTrash, IconCalendarEvent } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export function ExamWidget() {
    const { exams, addExam, deleteExam, subjects, schedule } = useStore()
    const [open, setOpen] = React.useState(false)
    const [title, setTitle] = React.useState("")
    const [date, setDate] = React.useState("")
    const [subjectId, setSubjectId] = React.useState("none")

    // Merge explicitly added Exams and Schedule events marked as "Exam"
    const allExams = React.useMemo(() => {
        const scheduleExams = schedule
            .filter(e => e.type === "Exam")
            .map(e => ({
                id: `sched-${e.id}`, // specific prefix to avoid collision
                title: e.title,
                date: e.day, // Schedule uses 'day' (YYYY-MM-DD or DayName)
                source: 'schedule',
                subjectId: e.subjectId
            }))
            // Filter out non-date schedule items (e.g. "Monday") if any
            .filter(e => isValid(new Date(e.date)))

        const manualExams = exams.map(e => ({ ...e, id: `manual-${e.id}`, source: 'manual' }))

        return [...manualExams, ...scheduleExams]
            .filter(e => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0))) // Future only
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }, [exams, schedule])

    const nextExam = allExams[0]
    const nextExamSubject = subjects.find(s => s.id === nextExam?.subjectId)

    const handleAdd = () => {
        addExam({
            title,
            date: new Date(date).toISOString(),
            subjectId: subjectId === "none" ? undefined : subjectId
        })
        setOpen(false)
        setTitle("")
        setDate("")
    }

    const getDaysLeft = (dateStr: string) => {
        const days = differenceInDays(new Date(dateStr), new Date())
        if (days <= 0) return "Today!"
        if (days === 1) return "1 Day"
        return `${days} Days`
    }

    const getUrgencyColor = (dateStr: string) => {
        const days = differenceInDays(new Date(dateStr), new Date())
        if (days <= 3) return "bg-red-500 text-white animate-pulse"
        if (days <= 7) return "bg-orange-500 text-white"
        if (days <= 14) return "bg-yellow-500 text-black"
        return "bg-primary text-primary-foreground"
    }

    return (
        <Card className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <IconClock className="w-4 h-4" /> Exam Countdown
                </CardTitle>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6"><IconPlus className="w-3 h-3" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Exam</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <Select value={subjectId} onValueChange={setSubjectId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select subject..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Select value={title} onValueChange={setTitle}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Exam Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CAT 1">CAT 1</SelectItem>
                                        <SelectItem value="CAT 2">CAT 2</SelectItem>
                                        <SelectItem value="FAT">FAT</SelectItem>
                                        <SelectItem value="Lab">Lab Exam</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                            <Button onClick={handleAdd} disabled={!date}>Add Exam</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                {nextExam ? (
                    <div className={cn(
                        "rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg transition-all overflow-hidden",
                        getUrgencyColor(nextExam.date)
                    )}>
                        <h3 className="text-3xl font-black tracking-tighter mb-1 leading-none">
                            {getDaysLeft(nextExam.date)}
                        </h3>
                        <p className="text-xs font-bold opacity-90 uppercase tracking-wider truncate max-w-full px-2 leading-tight">
                            {nextExamSubject?.name || "Exam"}
                        </p>
                        <p className="text-[10px] opacity-70 mt-1 truncate max-w-full px-2">
                            {nextExam.title} • {format(new Date(nextExam.date), "MMM d")}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-xl border-2 border-dashed p-6 text-center text-muted-foreground text-xs flex flex-col items-center gap-2">
                        <IconCalendarEvent className="w-8 h-8 opacity-20" />
                        No upcoming exams.
                        <br /> Enjoy the peace! 😌
                    </div>
                )}

                {allExams.length > 1 && (
                    <div className="space-y-1.5 flex-1 min-h-0 overflow-hidden">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1 mb-1">Up Next</p>
                        {allExams.slice(1).map((exam: any) => {
                            const sub = subjects.find(s => s.id === exam.subjectId)
                            return (
                                <div key={exam.id} className="flex items-center justify-between gap-3 text-xs p-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="font-medium truncate leading-tight">{sub?.name || exam.title}</span>
                                        <span className="text-[10px] text-muted-foreground leading-tight">{exam.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                            {format(new Date(exam.date), "MMM d")}
                                        </span>
                                        {exam.source === 'manual' && (
                                            <button
                                                onClick={() => deleteExam(Number(exam.id.replace('manual-', '')))}
                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                <IconTrash className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
