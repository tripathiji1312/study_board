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
    IconTrash,
    IconTelescope,
    IconExternalLink,
    IconBookmark
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
import { SyllabusSkeleton } from "@/components/academics/syllabus-skeleton"

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

    // Resource Scout State
    const [isScoutOpen, setIsScoutOpen] = React.useState(false)
    const [scoutingModule, setScoutingModule] = React.useState<SyllabusModule | null>(null)
    const [scoutedResources, setScoutedResources] = React.useState<any[]>([])
    const [isScouting, setIsScouting] = React.useState(false)
    const [scoutStep, setScoutStep] = React.useState(0) // 0: Idle, 1: Analyzing, 2: Searching, 3: Curating
    const [savedResourceIds, setSavedResourceIds] = React.useState<Set<string>>(new Set())

    // Optimized Data Fetching
    React.useEffect(() => {
        const fetchData = async () => {
            const startTime = performance.now()
            try {
                // Parallelize requests
                const [subjectsRes, syllabusRes] = await Promise.all([
                    fetch('/api/academics'),
                    fetch(`/api/syllabus?subjectId=${subjectId}`)
                ])

                const [subjectsData, syllabusData] = await Promise.all([
                    subjectsRes.json(),
                    syllabusRes.json()
                ])

                if (Array.isArray(subjectsData)) {
                    const found = subjectsData.find((s: Subject) => s.id === subjectId)
                    if (found) setSubject(found)
                }

                if (Array.isArray(syllabusData)) {
                    setModules(syllabusData)
                } else {
                    console.error("Invalid syllabus data:", syllabusData)
                    // If it's an error object, likely an empty state or error is better
                    setModules([])
                }
            } catch (error) {
                console.error("Failed to fetch data:", error)
                toast.error("Failed to load syllabus")
            } finally {
                // Ensure at least 300ms loading state to prevent flash
                const elapsed = performance.now() - startTime
                if (elapsed < 300) {
                    setTimeout(() => setIsLoading(false), 300 - elapsed)
                } else {
                    setIsLoading(false)
                }
            }
        }
        fetchData()
    }, [subjectId])

    // Refresh modules from API
    const refreshModules = async () => {
        try {
            const syllabusRes = await fetch(`/api/syllabus?subjectId=${subjectId}`)
            const syllabusData = await syllabusRes.json()
            if (Array.isArray(syllabusData)) {
                setModules(syllabusData)
            }
        } catch (e) {
            console.error("Failed to refresh modules")
        }
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
            if (error.message?.includes("API Key")) {
                toast.error("AI Features Disabled", {
                    description: "Please configure your Groq API Key in Settings to import syllabus PDFs.",
                    duration: 5000,
                })
            } else {
                toast.error(error.message || "Failed to import syllabus")
            }
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

    // --- AI Resource Scout Logic ---
    const openScoutDefault = (mod: SyllabusModule) => {
        setScoutingModule(mod)
        setScoutedResources([])
        setSavedResourceIds(new Set())
        setIsScoutOpen(true)
        scoutResources(mod)
    }

    const scoutResources = async (mod: SyllabusModule) => {
        setIsScouting(true)
        setScoutStep(1)

        // Simulation of steps for UX
        const stepsInterval = setInterval(() => {
            setScoutStep(prev => (prev < 3 ? prev + 1 : prev))
        }, 1500)

        try {
            const res = await fetch('/api/resources/scout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subjectName: subject?.name,
                    moduleTitle: mod.title,
                    topics: mod.topics
                })
            })
            const data = await res.json()
            if (!res.ok) {
                if (res.status === 400 && data.error?.includes("API")) {
                    toast.error("AI Features Disabled", {
                        description: "Groq API Key required for Resource Scout. Please check Settings.",
                        duration: 5000,
                    })
                    return
                }
                throw new Error(data.error || "Failed to scout")
            }
            if (data.resources) {
                setScoutedResources(data.resources)
            }
        } catch (error: any) {
            console.error("Scout error:", error)
            if (error.message?.includes("API Key") || (error instanceof SyntaxError)) { // handle JSON parse error if 400 returns text/html, but our API returns json error
                // Actually fetch throws on non-ok status if we don't handle it
                // But here we rely on res.json() in try block.
                // Let's improve the fetch handling above.
            }
            toast.error("Failed to scout resources. Check API Key.")
        } finally {
            clearInterval(stepsInterval)
            setIsScouting(false)
            setScoutStep(0)
        }
    }

    const saveResource = async (res: any, index: number) => {
        try {
            const response = await fetch('/api/resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: res.title,
                    type: res.type,
                    url: `https://www.google.com/search?q=${encodeURIComponent(res.searchQuery)}`,
                    category: "Learning",
                    subjectId: subjectId,
                    syllabusModuleId: scoutingModule?.id,
                    scoutedByAi: true
                })
            })
            if (!response.ok) throw new Error("Failed")

            // Mark as saved
            setSavedResourceIds(prev => new Set(prev).add(`${res.title}-${index}`))
            toast.success("Saved to Library!")
        } catch (error) {
            toast.error("Failed to save")
        }
    }

    const saveAllResources = async () => {
        const promises = scoutedResources.map((res, index) => {
            if (savedResourceIds.has(`${res.title}-${index}`)) return Promise.resolve()
            return saveResource(res, index)
        })
        await Promise.all(promises)
        toast.info("All resources saved to library!")
    }

    // Calculate progress
    const completedCount = modules.filter(m => m.status === "Completed" || m.status === "Revised").length
    const progress = modules.length > 0 ? (completedCount / modules.length) * 100 : 0

    if (isLoading) {
        return <SyllabusSkeleton />
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
                            Import Syllabus PDF using AI
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
                                        Parse & Import with AI
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
                                                        className="h-8 w-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openScoutDefault(mod)
                                                        }}
                                                        title="Scout Resources"
                                                    >
                                                        <IconTelescope className="w-4 h-4" />
                                                    </Button>
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
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveModule} disabled={isSaving}>
                            {isSaving ? "Saving..." : (editingModule ? "Update" : "Add")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AI Scout Dialog */}
            <Dialog open={isScoutOpen} onOpenChange={setIsScoutOpen}>
                <DialogContent className="sm:max-w-2xl bg-zinc-950 border-zinc-900">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <IconTelescope className="w-6 h-6 text-indigo-500" />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                                    AI Curriculum Architect
                                </span>
                            </DialogTitle>
                            {!isScouting && scoutedResources.length > 0 && (
                                <Button size="sm" onClick={saveAllResources} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <IconBookmark className="w-4 h-4 mr-2" />
                                    Save All
                                </Button>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Curating <span className="text-indigo-400 font-medium">Gold Standard</span> resources for: <span className="font-medium text-foreground">{scoutingModule?.title}</span>
                        </p>
                    </DialogHeader>

                    <div className="min-h-[350px] max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar p-1">
                        {isScouting ? (
                            <div className="flex flex-col items-center justify-center h-[300px] space-y-6">
                                <div className="relative w-24 h-24">
                                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-[spin_3s_linear_infinite]" />
                                    <div className="absolute inset-2 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <IconTelescope className="w-8 h-8 text-indigo-500" />
                                    </div>
                                </div>
                                <div className="space-y-2 text-center">
                                    <h3 className="font-medium text-lg animate-pulse">
                                        {scoutStep === 1 && "Analyzing syllabus module..."}
                                        {scoutStep === 2 && "Searching expert educators..."}
                                        {scoutStep === 3 && "Selecting top 5 resources..."}
                                    </h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                        Using Llama 3 to find high-authority content from top universities and tech experts.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 pb-4">
                                {scoutedResources.map((res, i) => {
                                    const isSaved = savedResourceIds.has(`${res.title}-${i}`)
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <Card className={cn(
                                                "border-l-4 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5 hover:border-zinc-700 bg-zinc-900/50",
                                                isSaved ? "border-l-emerald-500 bg-emerald-500/5" : "border-l-indigo-500"
                                            )}>
                                                <CardContent className="p-4 flex items-start justify-between gap-4">
                                                    <div className="space-y-1.5 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-zinc-900 border-zinc-800 text-zinc-400">
                                                                {res.category?.replace('_', ' ') || res.type}
                                                            </Badge>
                                                            {res.author && (
                                                                <span className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                                                                    <div className="w-1 h-1 rounded-full bg-indigo-500" />
                                                                    {res.author}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 className="font-semibold text-base leading-tight text-zinc-100">{res.title}</h4>
                                                        <p className="text-sm text-zinc-400">{res.description}</p>
                                                    </div>
                                                    <div className="flex flex-col gap-2 shrink-0">
                                                        <Button size="sm" variant="outline" asChild className="h-8 w-24 justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300">
                                                            <a href={`https://www.google.com/search?q=${encodeURIComponent(res.searchQuery)}`} target="_blank" rel="noopener noreferrer">
                                                                <IconExternalLink className="w-3.5 h-3.5 mr-2" />
                                                                Open
                                                            </a>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className={cn("h-8 w-24 justify-start transition-colors", isSaved ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white")}
                                                            onClick={() => !isSaved && saveResource(res, i)}
                                                            disabled={isSaved}
                                                        >
                                                            {isSaved ? (
                                                                <>
                                                                    <IconCircleCheck className="w-3.5 h-3.5 mr-2" />
                                                                    Saved
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <IconBookmark className="w-3.5 h-3.5 mr-2" />
                                                                    Save
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )
                                })}
                                {scoutedResources.length > 0 && (
                                    <div className="flex justify-center pt-2">
                                        <div className="bg-zinc-900/50 rounded-full px-4 py-2 text-xs text-zinc-500 flex items-center gap-2 border border-zinc-800">
                                            <IconTelescope className="w-3.5 h-3.5" />
                                            Curated by Llama 3 Curriculum Architect
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </Shell>
    )
}
