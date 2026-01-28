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
        if (days <= 3) return "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20"
        if (days <= 7) return "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
        if (days <= 14) return "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20"
        return "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
    }

    return (
        <Card className="flex flex-col h-full bg-surface-container-low shadow-none border-0 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <IconClock className="w-4 h-4 text-primary" /> Exam Countdown
                </CardTitle>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-surface-container-high rounded-full"><IconPlus className="w-4 h-4" /></Button>
                    </DialogTrigger>
                    <DialogContent className="bg-surface-container-high border-none shadow-expressive-md">
                        <DialogHeader><DialogTitle>Add Exam</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <Select value={subjectId} onValueChange={setSubjectId}>
                                    <SelectTrigger className="bg-surface-container-highest border-none">
                                        <SelectValue placeholder="Select subject..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-surface-container-highest border-none">
                                        {subjects.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Select value={title} onValueChange={setTitle}>
                                    <SelectTrigger className="bg-surface-container-highest border-none">
                                        <SelectValue placeholder="Exam Type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-surface-container-highest border-none">
                                        <SelectItem value="CAT 1">CAT 1</SelectItem>
                                        <SelectItem value="CAT 2">CAT 2</SelectItem>
                                        <SelectItem value="FAT">FAT</SelectItem>
                                        <SelectItem value="Lab">Lab Exam</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-surface-container-highest border-none" />
                            </div>
                            <Button onClick={handleAdd} disabled={!date} className="w-full shadow-primary-md">Add Exam</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 p-4 pt-0">
                {nextExam ? (
                    <div className={cn(
                        "rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all overflow-hidden relative isolate shrink-0",
                        getUrgencyColor(nextExam.date)
                    )}>
                        {/* Pattern overlay for texture */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
                        
                        <h3 className="text-4xl font-black tracking-tighter mb-1 leading-none drop-shadow-sm">
                            {getDaysLeft(nextExam.date)}
                        </h3>
                        <p className="text-sm font-bold opacity-90 uppercase tracking-wider truncate max-w-full px-2 leading-tight">
                            {nextExamSubject?.name || "Exam"}
                        </p>
                        <p className="text-xs opacity-80 mt-1 truncate max-w-full px-2 font-medium">
                            {nextExam.title} • {format(new Date(nextExam.date), "MMM d")}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-2xl border-2 border-dashed border-surface-container-highest/50 p-6 text-center text-muted-foreground text-xs flex flex-col items-center gap-2 bg-surface-container/30">
                        <IconCalendarEvent className="w-8 h-8 opacity-20" />
                        No upcoming exams.
                        <br /> Enjoy the peace! 😌
                    </div>
                )}

                {allExams.length > 1 && (
                    <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1 mb-2">Up Next</p>
                        <div className="max-h-[140px] overflow-y-auto pr-1">
                            <div className="space-y-2 pb-1">
                                {allExams.slice(1).map((exam: any) => {
                                    const sub = subjects.find(s => s.id === exam.subjectId)
                                    return (
                                        <div key={exam.id} className="flex items-center justify-between gap-3 text-xs p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors group">
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="font-semibold truncate leading-tight text-foreground">{sub?.name || exam.title}</span>
                                                <span className="text-[10px] text-muted-foreground leading-tight">{exam.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full text-[10px]">
                                                    {format(new Date(exam.date), "MMM d")}
                                                </span>
                                                {exam.source === 'manual' && (
                                                    <button
                                                        onClick={() => deleteExam(Number(exam.id.replace('manual-', '')))}
                                                        className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <IconTrash className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
