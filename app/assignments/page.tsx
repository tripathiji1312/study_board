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
            case "Urgent": return { color: "bg-error", text: "text-error", ring: "ring-error/20" }
            case "High": return { color: "bg-tertiary", text: "text-tertiary", ring: "ring-tertiary/20" }
            case "Medium": return { color: "bg-primary", text: "text-primary", ring: "ring-primary/20" }
            case "Low": return { color: "bg-secondary", text: "text-secondary", ring: "ring-secondary/20" }
        }
    }

    const getStatusConfig = (s: Status) => {
        switch (s) {
            case "Completed": return { icon: IconCheck, color: "bg-secondary", text: "Completed" }
            case "In Progress": return { icon: IconClock, color: "bg-primary", text: "In Progress" }
            case "Pending": return { icon: IconCalendar, color: "bg-tertiary", text: "Pending" }
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
                    "group p-6 rounded-[1.5rem] border transition-all relative overflow-hidden",
                    assignment.status === "Completed" 
                        ? "opacity-60 bg-surface-container-low border-transparent" 
                        : "bg-surface border-transparent hover:border-border/20 shadow-sm hover:shadow-md",
                    daysInfo.urgent && assignment.status !== "Completed" && "ring-2",
                    priorityConfig.ring
                )}
            >
                <div className="flex items-start gap-4">
                    {/* Priority Indicator */}
                    <div className={cn("w-1.5 self-stretch rounded-full my-1", priorityConfig.color)} />

                    <div className="flex-1 min-w-0 space-y-3">
                        {/* Title & Subject */}
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className={cn(
                                    "font-medium text-lg text-on-surface leading-tight",
                                    assignment.status === "Completed" && "line-through text-on-surface-variant"
                                )}>
                                    {assignment.title}
                                </h3>
                            </div>
                            <p className="text-sm text-on-surface-variant mt-1 bg-surface-container-high/50 inline-block px-2 py-0.5 rounded-md">{assignment.course}</p>
                        </div>

                        {/* Due Date & Status */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className={cn(
                                "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                                daysInfo.urgent && assignment.status !== "Completed"
                                    ? "bg-error/10 text-error"
                                    : "bg-surface-container-high text-on-surface-variant"
                            )}>
                                {daysInfo.urgent && assignment.status !== "Completed" && <IconFlame className="w-3.5 h-3.5" />}
                                <IconCalendar className="w-3.5 h-3.5" />
                                {daysInfo.text}
                            </div>
                            <Badge variant="outline" className={cn("text-xs border-0 bg-opacity-10 px-2.5 py-1 h-auto", priorityConfig.text, priorityConfig.color.replace("bg-", "bg-opacity-10 bg-"))}>
                                {assignment.priority}
                            </Badge>
                        </div>

                        {/* Quick Status Toggle */}
                        <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant={assignment.status === "Pending" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-8 text-xs rounded-full px-3"
                                onClick={() => updateAssignment({ ...assignment, status: "Pending" })}
                            >
                                Pending
                            </Button>
                            <Button
                                variant={assignment.status === "In Progress" ? "secondary" : "ghost"}
                                size="sm"
                                className="h-8 text-xs rounded-full px-3"
                                onClick={() => updateAssignment({ ...assignment, status: "In Progress" })}
                            >
                                In Progress
                            </Button>
                            <Button
                                variant={assignment.status === "Completed" ? "default" : "ghost"}
                                size="sm"
                                className="h-8 text-xs rounded-full px-3"
                                onClick={() => updateAssignment({ ...assignment, status: "Completed" })}
                            >
                                <IconCheck className="w-3.5 h-3.5 mr-1.5" />
                                Done
                            </Button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                         <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary" onClick={() => openEditDialog(assignment)}>
                            <IconPencil className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-error"
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
            <div className="max-w-[1600px] mx-auto space-y-8 min-h-[calc(100vh-8rem)]">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-normal tracking-tight text-on-surface">Assignments</h1>
                        <p className="text-on-surface-variant mt-2 text-lg">Track your academic deadlines.</p>
                    </div>
                    <Button onClick={openAddDialog} className="shadow-lg shadow-primary/20 rounded-2xl h-12 px-6 text-base">
                        <IconPlus className="w-5 h-5 mr-2" /> Add Assignment
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-6 rounded-[2rem] bg-surface-container-low border border-transparent hover:border-border/20 transition-colors">
                        <p className="text-4xl font-medium text-on-surface mb-1">{pending}</p>
                        <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Pending</p>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-surface-container-low border border-transparent hover:border-border/20 transition-colors">
                        <p className="text-4xl font-medium text-primary mb-1">{inProgress}</p>
                        <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">In Progress</p>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-surface-container-low border border-transparent hover:border-border/20 transition-colors">
                        <p className="text-4xl font-medium text-secondary mb-1">{completed}</p>
                        <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Completed</p>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-surface-container-low border border-transparent hover:border-border/20 transition-colors">
                        <p className="text-4xl font-medium text-tertiary mb-1">{Math.round(completionRate)}%</p>
                        <p className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Completion</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 bg-surface-container rounded-[2rem] p-2 pr-4 shadow-sm">
                    <div className="relative flex-1">
                        <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                        <Input
                            placeholder="Search assignments..."
                            className="pl-12 h-12 bg-transparent border-none text-base focus-visible:ring-0 placeholder:text-on-surface-variant/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="w-px bg-on-surface-variant/10 my-2 hidden sm:block" />
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-[180px] h-12 border-none bg-transparent focus:ring-0 text-base font-medium">
                            <IconFilter className="w-5 h-5 mr-2 text-on-surface-variant" />
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/20 bg-surface-container-high">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Assignment List */}
                <ScrollArea className="h-[calc(100vh-28rem)]">
                    <div className="space-y-4 pr-4 pb-12">
                        <AnimatePresence mode="popLayout">
                            {sortedAssignments.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {sortedAssignments.map(a => <AssignmentCard key={a.id} assignment={a} />)}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-24 text-center text-on-surface-variant/50 border-2 border-dashed border-border/20 rounded-[2rem] bg-surface-container-lowest/30"
                                >
                                    <IconCalendar className="w-16 h-16 mx-auto mb-6 opacity-30" />
                                    <p className="text-xl font-medium text-on-surface">No assignments found</p>
                                    <p className="text-base mt-2">Add your first assignment to get started</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>

                {/* Add/Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-md rounded-[2.5rem] bg-surface-container border-none shadow-xl p-8">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-normal">{editingId ? "Edit Assignment" : "New Assignment"}</DialogTitle>
                            <DialogDescription className="text-base text-on-surface-variant">
                                {editingId ? "Update the assignment details." : "Add a new assignment to track."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-6 mt-4">
                            <div className="space-y-2">
                                <Label className="text-on-surface-variant pl-1">Title</Label>
                                <Input 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)} 
                                    placeholder="Lab Report 5" 
                                    required 
                                    className="h-12 rounded-xl bg-surface border-transparent focus:bg-surface-container-high transition-colors"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-on-surface-variant pl-1">Subject</Label>
                                    <Select value={subjectId} onValueChange={setSubjectId}>
                                        <SelectTrigger className="h-12 rounded-xl bg-surface border-transparent"><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="general">General</SelectItem>
                                            {currentSubjects.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-on-surface-variant pl-1">Due Date</Label>
                                    <Input 
                                        type="date" 
                                        value={due} 
                                        onChange={e => setDue(e.target.value)} 
                                        required 
                                        className="h-12 rounded-xl bg-surface border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-on-surface-variant pl-1">Priority</Label>
                                    <Select value={priority} onValueChange={(v: Priority) => setPriority(v)}>
                                        <SelectTrigger className="h-12 rounded-xl bg-surface border-transparent"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="Low">🟢 Low</SelectItem>
                                            <SelectItem value="Medium">🟡 Medium</SelectItem>
                                            <SelectItem value="High">🟠 High</SelectItem>
                                            <SelectItem value="Urgent">🔴 Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {editingId && (
                                    <div className="space-y-2">
                                        <Label className="text-on-surface-variant pl-1">Status</Label>
                                        <Select value={status} onValueChange={(v: Status) => setStatus(v)}>
                                            <SelectTrigger className="h-12 rounded-xl bg-surface border-transparent"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="Pending">Pending</SelectItem>
                                                <SelectItem value="In Progress">In Progress</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-full h-12 px-6">Cancel</Button>
                                <Button type="submit" className="rounded-full h-12 px-8">{editingId ? "Update" : "Create"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </Shell>
    )
}
