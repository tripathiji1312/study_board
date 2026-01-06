"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { IconSearch, IconPlus, IconPencil, IconTrash, IconCalendar, IconFlame, IconCheck, IconClock, IconFilter } from "@tabler/icons-react"
import { useStore, Priority, Status, Assignment } from "@/components/providers/store-provider"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { format, parseISO, differenceInDays, isPast, isToday } from "date-fns"

const PLATFORMS = ["VTOP", "Google Classroom", "Moodle", "Email", "Other"]

export default function AssignmentsPage() {
    const { assignments, subjects, currentSemester, addAssignment, updateAssignment, deleteAssignment } = useStore()
    const [filterStatus, setFilterStatus] = React.useState<string>("all")
    const [search, setSearch] = React.useState("")
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingId, setEditingId] = React.useState<number | null>(null)

    // Form State
    const [title, setTitle] = React.useState("")
    const [subjectId, setSubjectId] = React.useState("")
    const [due, setDue] = React.useState("")
    const [priority, setPriority] = React.useState<Priority>("Medium")
    const [status, setStatus] = React.useState<Status>("Pending")
    const [platform, setPlatform] = React.useState("")
    const [description, setDescription] = React.useState("")

    const currentSubjects = subjects.filter(s => s.semesterId === currentSemester?.id)

    const filteredAssignments = assignments.filter((a) => {
        const matchesStatus = filterStatus === "all" || a.status.toLowerCase().replace(" ", "-") === filterStatus
        const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.course?.toLowerCase().includes(search.toLowerCase())
        return matchesStatus && matchesSearch
    })

    // Sort by: Pending first, then by due date (soonest first)
    const sortedAssignments = [...filteredAssignments].sort((a, b) => {
        // Completed items go last
        if (a.status === "Completed" && b.status !== "Completed") return 1
        if (a.status !== "Completed" && b.status === "Completed") return -1
        // Then by due date
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

    // Stats
    const pending = assignments.filter(a => a.status === "Pending").length
    const inProgress = assignments.filter(a => a.status === "In Progress").length
    const completed = assignments.filter(a => a.status === "Completed").length
    const total = assignments.length
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    const openAddDialog = () => {
        setEditingId(null)
        setTitle("")
        setSubjectId("")
        setDue("")
        setPriority("Medium")
        setStatus("Pending")
        setPlatform("")
        setDescription("")
        setIsDialogOpen(true)
    }

    const openEditDialog = (a: Assignment) => {
        setEditingId(a.id)
        setTitle(a.title)
        setSubjectId("")
        setDue(a.dueDate)
        setPriority(a.priority)
        setStatus(a.status)
        setPlatform("")
        setDescription("")
        setIsDialogOpen(true)
    }

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !due) return

        const selectedSubject = subjectId && subjectId !== "general" ? subjects.find(s => s.id === subjectId) : null

        const data = {
            title,
            course: selectedSubject?.name || "General",
            dueDate: due,
            priority,
            status,
        }

        if (editingId) {
            updateAssignment({ id: editingId, ...data })
        } else {
            addAssignment(data)
        }
        setIsDialogOpen(false)
    }

    const getDaysLeft = (dueDate: string) => {
        try {
            const days = differenceInDays(parseISO(dueDate), new Date())
            if (days < 0) return { text: `${Math.abs(days)}d overdue`, urgent: true }
            if (days === 0) return { text: "Due today", urgent: true }
            if (days === 1) return { text: "Due tomorrow", urgent: true }
            if (days <= 3) return { text: `${days} days left`, urgent: true }
            return { text: `${days} days left`, urgent: false }
        } catch {
            return { text: dueDate, urgent: false }
        }
    }

    const getPriorityConfig = (p: Priority) => {
        switch (p) {
            case "Urgent": return { color: "bg-red-500", text: "text-red-500", ring: "ring-red-500/20" }
            case "High": return { color: "bg-orange-500", text: "text-orange-500", ring: "ring-orange-500/20" }
            case "Medium": return { color: "bg-yellow-500", text: "text-yellow-500", ring: "ring-yellow-500/20" }
            case "Low": return { color: "bg-green-500", text: "text-green-500", ring: "ring-green-500/20" }
        }
    }

    const getStatusConfig = (s: Status) => {
        switch (s) {
            case "Completed": return { icon: IconCheck, color: "bg-emerald-500", text: "Completed" }
            case "In Progress": return { icon: IconClock, color: "bg-blue-500", text: "In Progress" }
            case "Pending": return { icon: IconCalendar, color: "bg-slate-500", text: "Pending" }
        }
    }

    const AssignmentCard = ({ assignment }: { assignment: Assignment }) => {
        const priorityConfig = getPriorityConfig(assignment.priority)
        const statusConfig = getStatusConfig(assignment.status)
        const daysInfo = getDaysLeft(assignment.dueDate)
        const StatusIcon = statusConfig.icon

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                    "group p-4 rounded-xl border bg-card hover:shadow-lg transition-all",
                    assignment.status === "Completed" && "opacity-60 bg-muted/30",
                    daysInfo.urgent && assignment.status !== "Completed" && "ring-2",
                    priorityConfig.ring
                )}
            >
                <div className="flex items-start gap-3">
                    {/* Priority Indicator */}
                    <div className={cn("w-1 self-stretch rounded-full", priorityConfig.color)} />

                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Title & Subject */}
                        <div>
                            <h3 className={cn(
                                "font-semibold",
                                assignment.status === "Completed" && "line-through"
                            )}>
                                {assignment.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">{assignment.course}</p>
                        </div>

                        {/* Due Date & Status */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className={cn(
                                "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                                daysInfo.urgent && assignment.status !== "Completed"
                                    ? "bg-red-500/10 text-red-500 font-medium"
                                    : "bg-muted text-muted-foreground"
                            )}>
                                {daysInfo.urgent && assignment.status !== "Completed" && <IconFlame className="w-3 h-3" />}
                                <IconCalendar className="w-3 h-3" />
                                {daysInfo.text}
                            </div>
                            <Badge variant="outline" className={cn("text-xs", priorityConfig.text)}>
                                {assignment.priority}
                            </Badge>
                        </div>

                        {/* Quick Status Toggle */}
                        <div className="flex items-center gap-1 pt-2">
                            <Button
                                variant={assignment.status === "Pending" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => updateAssignment({ ...assignment, status: "Pending" })}
                            >
                                Pending
                            </Button>
                            <Button
                                variant={assignment.status === "In Progress" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => updateAssignment({ ...assignment, status: "In Progress" })}
                            >
                                In Progress
                            </Button>
                            <Button
                                variant={assignment.status === "Completed" ? "default" : "ghost"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => updateAssignment({ ...assignment, status: "Completed" })}
                            >
                                <IconCheck className="w-3 h-3 mr-1" />
                                Done
                            </Button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(assignment)}>
                            <IconPencil className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteAssignment(assignment.id)}
                        >
                            <IconTrash className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </motion.div>
        )
    }

    return (
        <Shell>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
                        <p className="text-muted-foreground">Track your academic deadlines.</p>
                    </div>
                    <Button onClick={openAddDialog} className="shadow-lg shadow-primary/20">
                        <IconPlus className="w-4 h-4 mr-2" /> Add Assignment
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-slate-500/10 border border-slate-500/20">
                        <p className="text-2xl font-bold">{pending}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-2xl font-bold">{inProgress}</p>
                        <p className="text-xs text-muted-foreground">In Progress</p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-2xl font-bold">{completed}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                        <p className="text-2xl font-bold">{Math.round(completionRate)}%</p>
                        <p className="text-xs text-muted-foreground">Completion</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search assignments..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <IconFilter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Assignment List */}
                <ScrollArea className="h-[calc(100vh-26rem)]">
                    <div className="space-y-3 pr-4">
                        <AnimatePresence mode="popLayout">
                            {sortedAssignments.length > 0 ? (
                                sortedAssignments.map(a => <AssignmentCard key={a.id} assignment={a} />)
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-xl"
                                >
                                    <IconCalendar className="w-10 h-10 mx-auto mb-4 opacity-30" />
                                    <p className="font-medium">No assignments found</p>
                                    <p className="text-sm mt-1">Add your first assignment to get started</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>

                {/* Add/Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Assignment" : "New Assignment"}</DialogTitle>
                            <DialogDescription>
                                {editingId ? "Update the assignment details." : "Add a new assignment to track."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Lab Report 5" required />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Subject</Label>
                                    <Select value={subjectId} onValueChange={setSubjectId}>
                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">General</SelectItem>
                                            {currentSubjects.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Due Date</Label>
                                    <Input type="date" value={due} onChange={e => setDue(e.target.value)} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select value={priority} onValueChange={(v: Priority) => setPriority(v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Low">🟢 Low</SelectItem>
                                            <SelectItem value="Medium">🟡 Medium</SelectItem>
                                            <SelectItem value="High">🟠 High</SelectItem>
                                            <SelectItem value="Urgent">🔴 Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {editingId && (
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select value={status} onValueChange={(v: Status) => setStatus(v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Pending">Pending</SelectItem>
                                                <SelectItem value="In Progress">In Progress</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">{editingId ? "Update" : "Create"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </Shell>
    )
}
