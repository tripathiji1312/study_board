"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
    IconArrowLeft,
    IconUpload,
    IconBook,
    IconCircle,
    IconCircleDashed,
    IconCircleCheck,
    IconCircleDot,
    IconChevronDown,
    IconChevronRight,
    IconLoader2,
    IconTrophy,
    IconFileText,
    IconPlus,
    IconPencil,
    IconTrash
} from "@tabler/icons-react"
import { Shell } from "@/components/ui/shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Status configuration with icons and colors
const STATUS_CONFIG = {
    "Pending": {
        color: "text-muted-foreground",
        bg: "bg-muted/50 hover:bg-muted text-muted-foreground border-transparent",
        icon: IconCircle,
        label: "Pending",
        next: "InProgress"
    },
    "InProgress": {
        color: "text-amber-500",
        bg: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-500/20",
        icon: IconCircleDashed,
        label: "In Progress",
        next: "Completed"
    },
    "Completed": {
        color: "text-emerald-500",
        bg: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border-emerald-500/20",
        icon: IconCircleCheck,
        label: "Completed",
        next: "Revised"
    },
    "Revised": {
        color: "text-purple-500",
        bg: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border-purple-500/20",
        icon: IconCircleDot,
        label: "Revised",
        next: "Pending"
    }
} as const

interface SyllabusModule {
    id: string
    title: string
    topics: string[]
    status: keyof typeof STATUS_CONFIG
    order: number
    lastStudiedAt?: string | null
    strength?: number
}

interface Subject {
    id: string
    name: string
    code: string
    type: string
}

// Helper to calculate retention
const calculateRetention = (lastStudiedAt?: string | null, strength: number = 1.0) => {
    if (!lastStudiedAt) return 0
    const diffTime = Math.abs(new Date().getTime() - new Date(lastStudiedAt).getTime())
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    // Ebbinghaus Formula
    return Math.round(Math.exp(-diffDays / strength) * 100)
}

export default function SyllabusPage() {
    const params = useParams()
    const router = useRouter()
    const subjectId = params.subjectId as string

    const [subject, setSubject] = React.useState<Subject | null>(null)
    const [modules, setModules] = React.useState<SyllabusModule[]>([])
    const [expanded, setExpanded] = React.useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = React.useState(true)
    const [isImporting, setIsImporting] = React.useState(false)
    const [file, setFile] = React.useState<File | null>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Add/Edit Dialog State
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingModule, setEditingModule] = React.useState<SyllabusModule | null>(null)
    const [moduleTitle, setModuleTitle] = React.useState("")
    const [moduleTopics, setModuleTopics] = React.useState("")
    const [isSaving, setIsSaving] = React.useState(false)

    // Fetch data on mount
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch subject info
                const subjectsRes = await fetch('/api/academics')
                const subjectsData = await subjectsRes.json()
                const found = subjectsData.find((s: Subject) => s.id === subjectId)
                if (found) setSubject(found)

                // Fetch syllabus modules
                const syllabusRes = await fetch(`/api/syllabus?subjectId=${subjectId}`)
                const syllabusData = await syllabusRes.json()
                setModules(syllabusData)
            } catch (error) {
                console.error("Failed to fetch data:", error)
                toast.error("Failed to load syllabus")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [subjectId])

    // Refresh modules from API
    const refreshModules = async () => {
        const syllabusRes = await fetch(`/api/syllabus?subjectId=${subjectId}`)
        const syllabusData = await syllabusRes.json()
        setModules(syllabusData)
    }

    // Toggle expand module
    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expanded)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpanded(newExpanded)
    }

    // Update module status
    const updateStatus = async (id: string, currentStatus: keyof typeof STATUS_CONFIG) => {
        const config = STATUS_CONFIG[currentStatus]
        const newStatus = config.next

        // Optimistic update
        const oldModules = [...modules]
        setModules(modules.map(m => m.id === id ? { ...m, status: newStatus as keyof typeof STATUS_CONFIG } : m))

        try {
            const res = await fetch('/api/syllabus', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            })
            if (!res.ok) throw new Error('Failed to update')
        } catch (err) {
            setModules(oldModules)
            toast.error("Failed to update status")
        }
    }

    // Handle file import
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleImport = async () => {
        if (!file) return

        setIsImporting(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            // Parse PDF
            const parseRes = await fetch('/api/syllabus/parse', { method: 'POST', body: formData })
            const parseData = await parseRes.json()

            if (!parseRes.ok || !parseData.modules) {
                throw new Error(parseData.error || 'Failed to parse PDF')
            }

            // Save to database
            const saveRes = await fetch('/api/syllabus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subjectId,
                    modules: parseData.modules,
                    mode: 'replace'
                })
            })

            if (!saveRes.ok) throw new Error('Failed to save')

            // Refresh modules
            await refreshModules()

            toast.success(`Imported ${parseData.modules.length} modules!`)
            setFile(null)
            if (inputRef.current) inputRef.current.value = ''
        } catch (error: any) {
            console.error("Import failed:", error)
            toast.error(error.message || "Failed to import syllabus")
        } finally {
            setIsImporting(false)
        }
    }

    // Open Add Dialog
    const openAddDialog = () => {
        setEditingModule(null)
        setModuleTitle("")
        setModuleTopics("")
        setIsDialogOpen(true)
    }

    // Open Edit Dialog
    const openEditDialog = (mod: SyllabusModule) => {
        setEditingModule(mod)
        setModuleTitle(mod.title)
        setModuleTopics(mod.topics?.join("\n") || "")
        setIsDialogOpen(true)
    }

    // Save Module (Add or Edit)
    const handleSaveModule = async () => {
        if (!moduleTitle.trim()) {
            toast.error("Title is required")
            return
        }

        setIsSaving(true)
        const topicsArray = moduleTopics
            .split("\n")
            .map(t => t.trim())
            .filter(Boolean)

        try {
            if (editingModule) {
                // Edit existing module
                const res = await fetch('/api/syllabus', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editingModule.id,
                        title: moduleTitle.trim(),
                        topics: topicsArray
                    })
                })
                if (!res.ok) throw new Error('Failed to update')
                toast.success("Module updated!")
            } else {
                // Add new module
                const res = await fetch('/api/syllabus', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subjectId,
                        modules: [{ title: moduleTitle.trim(), topics: topicsArray }],
                        mode: 'append'
                    })
                })
                if (!res.ok) throw new Error('Failed to add')
                toast.success("Module added!")
            }

            await refreshModules()
            setIsDialogOpen(false)
        } catch (error) {
            console.error("Save failed:", error)
            toast.error("Failed to save module")
        } finally {
            setIsSaving(false)
        }
    }

    // Delete Module
    const handleDeleteModule = async (id: string) => {
        // Optimistic update
        const oldModules = [...modules]
        setModules(modules.filter(m => m.id !== id))

        try {
            const res = await fetch(`/api/syllabus?id=${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete')
            toast.success("Module deleted")
        } catch (err) {
            setModules(oldModules)
            toast.error("Failed to delete module")
        }
    }

    // Calculate progress
    const completedCount = modules.filter(m => m.status === "Completed" || m.status === "Revised").length
    const progress = modules.length > 0 ? (completedCount / modules.length) * 100 : 0

    if (isLoading) {
        return (
            <Shell>
                <div className="flex items-center justify-center h-[60vh]">
                    <IconLoader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            </Shell>
        )
    }

    return (
        <Shell>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Back Button */}
                <Button variant="ghost" size="sm" asChild className="-ml-2">
                    <Link href="/academics">
                        <IconArrowLeft className="w-4 h-4 mr-2" />
                        Back to Academics
                    </Link>
                </Button>

                {/* Hero Header */}
                <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-background to-background">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">{subject?.code}</Badge>
                                    <Badge variant="secondary">{subject?.type}</Badge>
                                </div>
                                <CardTitle className="text-3xl font-bold tracking-tight">
                                    {subject?.name}
                                </CardTitle>
                                <p className="text-muted-foreground mt-1">Syllabus Tracker</p>
                            </div>

                            {/* Progress Circle or Trophy */}
                            <div className="flex items-center gap-4">
                                {progress === 100 ? (
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600">
                                        <IconTrophy className="w-5 h-5" />
                                        <span className="font-semibold">All Done!</span>
                                    </div>
                                ) : (
                                    <div className="text-right">
                                        <p className="text-4xl font-bold text-primary">{Math.round(progress)}%</p>
                                        <p className="text-sm text-muted-foreground">{completedCount}/{modules.length} modules</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <Progress value={progress} className="h-2" />
                    </CardContent>
                </Card>

                {/* Import Section */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <IconUpload className="w-5 h-5" />
                            Import Syllabus PDF
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                                />
                            </div>
                            <Button
                                onClick={handleImport}
                                disabled={!file || isImporting}
                                className="shrink-0"
                            >
                                {isImporting ? (
                                    <>
                                        <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <IconFileText className="w-4 h-4 mr-2" />
                                        Parse & Import
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Upload your syllabus PDF to automatically extract modules and topics using AI.
                        </p>
                    </CardContent>
                </Card>

                <Separator />

                {/* Modules List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <IconBook className="w-5 h-5" />
                            Modules ({modules.length})
                        </h2>
                        <Button onClick={openAddDialog} size="sm">
                            <IconPlus className="w-4 h-4 mr-2" />
                            Add Module
                        </Button>
                    </div>

                    {modules.length === 0 ? (
                        <Card className="py-12">
                            <CardContent className="flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <IconBook className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg">No Modules Yet</h3>
                                <p className="text-muted-foreground mt-1 max-w-sm">
                                    Import a syllabus PDF or add modules manually to start tracking.
                                </p>
                                <Button onClick={openAddDialog} className="mt-4">
                                    <IconPlus className="w-4 h-4 mr-2" />
                                    Add First Module
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {modules.map((mod, index) => {
                                const config = STATUS_CONFIG[mod.status] || STATUS_CONFIG.Pending
                                const Icon = config.icon

                                return (
                                    <motion.div
                                        key={mod.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card className={cn(
                                            "transition-all duration-200 hover:shadow-md group",
                                            expanded.has(mod.id) && "ring-2 ring-primary/20"
                                        )}>
                                            <div
                                                onClick={() => toggleExpand(mod.id)}
                                                className="flex items-center gap-4 p-4 cursor-pointer select-none"
                                            >
                                                {/* Expand Icon */}
                                                <div className="text-muted-foreground">
                                                    {expanded.has(mod.id) ? (
                                                        <IconChevronDown className="w-5 h-5" />
                                                    ) : (
                                                        <IconChevronRight className="w-5 h-5" />
                                                    )}
                                                </div>

                                                {/* Module Info */}
                                                {/* Module Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium text-base truncate">{mod.title}</h4>
                                                        {/* Retention Indicator */}
                                                        {(() => {
                                                            if (mod.status === 'Completed' || mod.status === 'Revised') {
                                                                const retention = calculateRetention(mod.lastStudiedAt, mod.strength)
                                                                let color = "bg-emerald-500" // > 80%
                                                                if (retention < 50) color = "bg-red-500"
                                                                else if (retention < 80) color = "bg-amber-500"

                                                                return (
                                                                    <div className="flex items-center bg-muted/50 rounded-full px-1.5 py-0.5">
                                                                        <div className={cn("w-1.5 h-1.5 rounded-full", color)} />
                                                                        <span className="ml-1 text-[10px] text-muted-foreground font-mono">{retention}%</span>
                                                                    </div>
                                                                )
                                                            } else if (mod.status === 'InProgress') {
                                                                return (
                                                                    <div className="flex items-center bg-amber-500/10 rounded-full px-1.5 py-0.5">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                                        <span className="ml-1 text-[10px] text-amber-600 font-medium">Learning</span>
                                                                    </div>
                                                                )
                                                            }
                                                            return null
                                                        })()}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {mod.topics?.length || 0} topics
                                                    </p>
                                                </div>

                                                {/* Action Buttons (Edit/Delete) */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openEditDialog(mod)
                                                        }}
                                                    >
                                                        <IconPencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteModule(mod.id)
                                                        }}
                                                    >
                                                        <IconTrash className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {/* Status Button */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className={cn(
                                                        "min-w-[120px] h-9 rounded-lg transition-all",
                                                        config.bg
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        updateStatus(mod.id, mod.status)
                                                    }}
                                                >
                                                    <Icon className="w-4 h-4 mr-2" />
                                                    {config.label}
                                                </Button>
                                            </div>

                                            {/* Expanded Topics */}
                                            <AnimatePresence>
                                                {expanded.has(mod.id) && mod.topics && mod.topics.length > 0 && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden border-t"
                                                    >
                                                        <div className="p-4 pl-14 bg-muted/30">
                                                            <ul className="space-y-2">
                                                                {mod.topics.map((topic, i) => (
                                                                    <li key={i} className="flex items-start gap-2 text-sm">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 shrink-0" />
                                                                        <span className="text-muted-foreground">{topic}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </Card>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingModule ? "Edit Module" : "Add New Module"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Module Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Module 1: Introduction to..."
                                value={moduleTitle}
                                onChange={(e) => setModuleTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="topics">Topics (one per line)</Label>
                            <Textarea
                                id="topics"
                                placeholder="Enter topics, one per line..."
                                value={moduleTopics}
                                onChange={(e) => setModuleTopics(e.target.value)}
                                rows={6}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveModule} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                editingModule ? "Save Changes" : "Add Module"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Shell>
    )
}
