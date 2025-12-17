"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { IconSearch, IconFilter, IconPlus, IconPencil, IconTrash } from "@tabler/icons-react"
import { useStore, Priority, Status, Assignment } from "@/components/providers/store-provider"
import { AnimatePresence, motion } from "framer-motion"

const PLATFORMS = ["VTOP", "Google Classroom", "Moodle", "Email", "Other"]

export default function AssignmentsPage() {
    const { assignments, subjects, currentSemester, addAssignment, updateAssignment, deleteAssignment } = useStore()
    const [filterStatus, setFilterStatus] = React.useState<string>("all")
    const [search, setSearch] = React.useState("")
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)

    // Edit State
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
            a.subject.toLowerCase().includes(search.toLowerCase())
        return matchesStatus && matchesSearch
    })

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
        setSubjectId(a.subjectId || "")
        setDue(a.due)
        setPriority(a.priority)
        setStatus(a.status)
        setPlatform(a.platform || "")
        setDescription(a.description || "")
        setIsDialogOpen(true)
    }

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !due) return

        const selectedSubject = subjectId && subjectId !== "general" ? subjects.find(s => s.id === subjectId) : null
        const subjectName = selectedSubject?.name || "General"

        const data = {
            title,
            subject: subjectName,
            subjectId: subjectId && subjectId !== "general" ? subjectId : undefined,
            due,
            priority,
            status,
            platform: platform || undefined,
            description: description || undefined
        }

        if (editingId) {
            updateAssignment({ id: editingId, ...data })
        } else {
            addAssignment(data)
        }
        setIsDialogOpen(false)
    }

    const getPriorityColor = (p: Priority) => {
        switch (p) {
            case "Urgent": return "bg-red-500/15 text-red-600 border-red-200 dark:border-red-900"
            case "High": return "bg-orange-500/15 text-orange-600 border-orange-200 dark:border-orange-900"
            case "Medium": return "bg-yellow-500/15 text-yellow-700 border-yellow-200 dark:border-yellow-900"
            case "Low": return "bg-green-500/15 text-green-600 border-green-200 dark:border-green-900"
        }
    }

    const getStatusColor = (s: Status) => {
        switch (s) {
            case "Completed": return "bg-blue-500/15 text-blue-600 border-blue-200 dark:border-blue-900"
            case "In Progress": return "bg-purple-500/15 text-purple-600 border-purple-200 dark:border-purple-900"
            case "Pending": return "bg-slate-500/15 text-slate-600 border-slate-200 dark:border-slate-800"
        }
    }

    return (
        <Shell>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
                        <p className="text-muted-foreground">Manage your academic deliverables and deadlines.</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openAddDialog}>
                                <IconPlus className="w-4 h-4 mr-2" /> Add Assignment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Edit Assignment" : "Add New Assignment"}</DialogTitle>
                                <DialogDescription>
                                    {editingId ? "Update task details." : "Create a new assignment task."}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSave} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Lab Report 5" required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Subject</Label>
                                        <Select value={subjectId} onValueChange={setSubjectId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select subject" />
                                            </SelectTrigger>
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Priority</Label>
                                        <Select value={priority} onValueChange={(v: Priority) => setPriority(v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Low">Low</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="High">High</SelectItem>
                                                <SelectItem value="Urgent">Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Platform</Label>
                                        <Select value={platform} onValueChange={setPlatform}>
                                            <SelectTrigger><SelectValue placeholder="Where to submit?" /></SelectTrigger>
                                            <SelectContent>
                                                {PLATFORMS.map(p => (
                                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
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

                                <div className="space-y-2">
                                    <Label>Description (Optional)</Label>
                                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Additional details..." />
                                </div>

                                <DialogFooter>
                                    <Button type="submit">{editingId ? "Update" : "Create"}</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search assignments..."
                            className="pl-8 bg-background/50 backdrop-blur-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select onValueChange={setFilterStatus} defaultValue="all">
                        <SelectTrigger className="w-full sm:w-[180px] bg-background/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <IconFilter className="w-4 h-4" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-md border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-muted/50">
                                <TableHead>Title</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Due</TableHead>
                                <TableHead>Platform</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence>
                                {filteredAssignments.map((a) => (
                                    <motion.tr
                                        key={a.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="border-b transition-colors hover:bg-muted/50"
                                    >
                                        <TableCell className="font-medium">{a.title}</TableCell>
                                        <TableCell>{a.subject}</TableCell>
                                        <TableCell>{a.due}</TableCell>
                                        <TableCell>{a.platform || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getPriorityColor(a.priority)}>{a.priority}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getStatusColor(a.status)}>{a.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(a)}>
                                                    <IconPencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAssignment(a.id)}>
                                                    <IconTrash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredAssignments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No assignments found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </Shell>
    )
}
