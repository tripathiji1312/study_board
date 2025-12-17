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

    const sub = subjects.find(s => s.id === exam.subjectId)
    const term = searchQuery.toLowerCase()
    return (
        (sub?.name || "").toLowerCase().includes(term) ||
        (exam.type || "").toLowerCase().includes(term)
    )
})

const upcomingExams = filteredExams.filter(e => isAfter(parseISO(e.date), new Date()) || new Date(e.date).toDateString() === new Date().toDateString())
const pastExams = filteredExams.filter(e => !isAfter(parseISO(e.date), new Date()) && new Date(e.date).toDateString() !== new Date().toDateString())

return (
    <Shell>
        <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Exam Manager</h1>
                    <p className="text-muted-foreground mt-1">Track schedules, syllabus, and preparation status.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="shrink-0 gap-2">
                            <IconPlus className="w-4 h-4" /> Add Exam
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Schedule New Exam</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
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
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Exam Type</Label>
                                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CAT1">CAT 1</SelectItem>
                                            <SelectItem value="CAT2">CAT 2</SelectItem>
                                            <SelectItem value="FAT">FAT</SelectItem>
                                            <SelectItem value="Lab">Lab Exam</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Time (Optional)</Label>
                                <Input placeholder="e.g. 10:00 AM - 12:00 PM" value={time} onChange={e => setTime(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Syllabus / Notes</Label>
                                <Textarea
                                    placeholder="e.g. Modules 1, 2 and 3..."
                                    value={syllabus}
                                    onChange={e => setSyllabus(e.target.value)}
                                    className="h-24"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAdd} disabled={!subjectId || !date}>
                                Schedule Exam
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search / Filter */}
            <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search exams..."
                    className="pl-9 max-w-md bg-card"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Upcoming Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <IconCalendarEvent className="w-5 h-5 text-primary" />
                    Upcoming Exams
                </h2>
                {upcomingExams.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {upcomingExams.map(exam => (
                            <ExamCard key={exam.id} exam={exam} />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center text-muted-foreground bg-card/50">
                        <p>No upcoming exams scheduled.</p>
                        <Button variant="link" onClick={() => setIsAddOpen(true)}>Schedule one now</Button>
                    </div>
                )}
            </div>

            {/* Past Section */}
            {pastExams.length > 0 && (
                <div className="space-y-4 pt-8 border-t">
                    <h2 className="text-xl font-semibold opacity-70">Past Exams</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60 hover:opacity-100 transition-opacity">
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
