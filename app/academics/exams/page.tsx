"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { IconPlus, IconCalendarEvent, IconSearch } from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { ExamCard } from "@/components/academics/exam-card"
import { format, parseISO, isAfter } from "date-fns"

export default function ExamsPage() {
    const { exams, subjects, addExam } = useStore()
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    // Form State
    const [subjectId, setSubjectId] = React.useState("")
    const [type, setType] = React.useState<"CAT1" | "CAT2" | "FAT" | "Lab">("CAT1")
    const [date, setDate] = React.useState("")
    const [time, setTime] = React.useState("")
    const [syllabus, setSyllabus] = React.useState("")

    const handleAdd = () => {
        if (!subjectId || !date) return

        addExam({
            subjectId,
            type,
            date,
            time,
            syllabus
        })

        setSubjectId("")
        setDate("")
        setTime("")
        setSyllabus("")
        setIsAddOpen(false)
    }

    // Sort exams: Upcoming first, then past
    const sortedExams = [...exams].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    const filteredExams = sortedExams.filter(exam => {
        const sub = subjects.find(s => s.id === exam.subjectId)
        const term = searchQuery.toLowerCase()
        return (
            (sub?.name || "").toLowerCase().includes(term) ||
            (exam.type || "").toLowerCase().includes(term)
        )
    })

    const upcomingExams = filteredExams.filter(e => e.date && (isAfter(parseISO(e.date), new Date()) || new Date(e.date).toDateString() === new Date().toDateString()))
    const pastExams = filteredExams.filter(e => e.date && (!isAfter(parseISO(e.date), new Date()) && new Date(e.date).toDateString() !== new Date().toDateString()))

    return (
        <Shell>
            <div className="flex flex-col gap-10 max-w-6xl mx-auto w-full pb-20">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-on-surface">Exam Manager</h1>
                        <p className="text-on-surface-variant text-lg">Track schedules, syllabus, and preparation status.</p>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="shrink-0 gap-2 rounded-full h-12 px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-on-primary font-medium transition-all hover:scale-105 active:scale-95">
                                <IconPlus className="w-5 h-5" /> Schedule Exam
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[2rem] border-border/50 bg-surface-container-high shadow-xl p-0 overflow-hidden">
                            <DialogHeader className="p-6 pb-4 bg-surface-container-high border-b border-border/40">
                                <DialogTitle className="text-xl font-bold text-on-surface flex items-center gap-2">
                                    <IconCalendarEvent className="w-5 h-5 text-primary" />
                                    Schedule New Exam
                                </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-5 p-6 bg-surface-container">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Subject</Label>
                                    <Select value={subjectId} onValueChange={setSubjectId}>
                                        <SelectTrigger className="h-12 rounded-xl bg-surface-container-low border-transparent focus:border-primary/50 focus:bg-surface-container-low/50 transition-all font-medium">
                                            <SelectValue placeholder="Select subject..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-border/50 bg-surface-container-high shadow-expressive">
                                            {subjects.map(s => (
                                                <SelectItem key={s.id} value={s.id} className="rounded-lg focus:bg-primary/10 focus:text-primary cursor-pointer my-0.5">{s.name} ({s.code})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Exam Type</Label>
                                        <Select value={type} onValueChange={(v: any) => setType(v)}>
                                            <SelectTrigger className="h-12 rounded-xl bg-surface-container-low border-transparent focus:border-primary/50 focus:bg-surface-container-low/50 transition-all font-medium">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border/50 bg-surface-container-high shadow-expressive">
                                                <SelectItem value="CAT1" className="rounded-lg focus:bg-primary/10 focus:text-primary cursor-pointer">CAT 1</SelectItem>
                                                <SelectItem value="CAT2" className="rounded-lg focus:bg-primary/10 focus:text-primary cursor-pointer">CAT 2</SelectItem>
                                                <SelectItem value="FAT" className="rounded-lg focus:bg-primary/10 focus:text-primary cursor-pointer">FAT</SelectItem>
                                                <SelectItem value="Lab" className="rounded-lg focus:bg-primary/10 focus:text-primary cursor-pointer">Lab Exam</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Date</Label>
                                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-12 rounded-xl bg-surface-container-low border-transparent focus:border-primary/50 focus:bg-surface-container-low/50 transition-all font-medium" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Time (Optional)</Label>
                                    <Input placeholder="e.g. 10:00 AM - 12:00 PM" value={time} onChange={e => setTime(e.target.value)} className="h-12 rounded-xl bg-surface-container-low border-transparent focus:border-primary/50 focus:bg-surface-container-low/50 transition-all font-medium" />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Syllabus / Notes</Label>
                                    <Textarea
                                        placeholder="e.g. Modules 1, 2 and 3..."
                                        value={syllabus}
                                        onChange={e => setSyllabus(e.target.value)}
                                        className="min-h-[100px] rounded-xl bg-surface-container-low border-transparent focus:border-primary/50 focus:bg-surface-container-low/50 transition-all resize-none font-medium"
                                    />
                                </div>
                            </div>
                            <DialogFooter className="p-6 pt-2 bg-surface-container-high">
                                <Button onClick={handleAdd} disabled={!subjectId || !date} className="w-full rounded-full h-12 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-on-primary font-medium text-base">
                                    Schedule Exam
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search / Filter */}
                <div className="relative group">
                    <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search exams by subject or type..."
                        className="pl-12 h-14 rounded-full bg-surface-container border-transparent focus:border-primary/30 focus:bg-surface-container-high shadow-sm text-lg transition-all"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Upcoming Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <IconCalendarEvent className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-on-surface">Upcoming Exams</h2>
                    </div>
                    
                    {upcomingExams.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {upcomingExams.map(exam => (
                                <ExamCard key={exam.id} exam={exam} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 px-6 border-2 border-dashed border-border/40 rounded-[2rem] flex flex-col items-center justify-center text-center bg-surface-container-low/50">
                            <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mb-4 text-on-surface-variant/50">
                                <IconCalendarEvent className="w-8 h-8" />
                            </div>
                            <p className="text-lg font-medium text-on-surface mb-1">No upcoming exams scheduled.</p>
                            <p className="text-on-surface-variant mb-4">Enjoy your free time or plan ahead!</p>
                            <Button variant="link" onClick={() => setIsAddOpen(true)} className="text-primary font-bold hover:underline decoration-2 underline-offset-4">Schedule one now</Button>
                        </div>
                    )}
                </div>

                {/* Past Section */}
                {pastExams.length > 0 && (
                    <div className="space-y-6 pt-8 border-t border-border/40">
                        <h2 className="text-xl font-bold text-on-surface-variant/70">Past Exams</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-70 hover:opacity-100 transition-opacity duration-300">
                            {pastExams.map(exam => (
                                <ExamCard key={exam.id} exam={exam} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Shell>
    )
}
