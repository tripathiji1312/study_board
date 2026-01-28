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
    IconBookmark,
    IconSparkles,
    IconListDetails
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
                    url: res.url, // Use the processed URL from API (direct link or Google search)
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
            <div className="max-w-4xl mx-auto space-y-8 pb-24">
                {/* Back Button */}
                <Button variant="ghost" size="sm" asChild className="-ml-2 rounded-full hover:bg-surface-container-high hover:text-primary transition-colors">
                    <Link href="/academics">
                        <IconArrowLeft className="w-4 h-4 mr-2" />
                        Back to Academics
                    </Link>
                </Button>

                {/* Hero Header */}
                <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-surface-container-low to-surface-container shadow-sm rounded-[2rem]">
                    <CardHeader className="pb-6 pt-8 px-8">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="outline" className="bg-surface/50 backdrop-blur-sm border-primary/20 text-primary font-mono tracking-wider">{subject?.code}</Badge>
                                    <Badge variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors">{subject?.type}</Badge>
                                </div>
                                <CardTitle className="text-4xl font-black tracking-tight text-on-surface leading-tight">
                                    {subject?.name}
                                </CardTitle>
                                <p className="text-lg text-on-surface-variant/80 font-medium">Syllabus Tracker</p>
                            </div>

                            {/* Progress Circle or Trophy */}
                            <div className="flex items-center gap-4 bg-surface/40 p-4 rounded-3xl backdrop-blur-sm border border-white/10 shadow-sm">
                                {progress === 100 ? (
                                    <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-emerald-500/10 text-emerald-600 shadow-inner">
                                        <IconTrophy className="w-6 h-6" />
                                        <span className="font-bold text-lg">All Done!</span>
                                    </div>
                                ) : (
                                    <div className="text-right px-2">
                                        <p className="text-5xl font-black text-primary tracking-tighter">{Math.round(progress)}%</p>
                                        <p className="text-sm font-medium text-on-surface-variant">{completedCount}/{modules.length} modules</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0 px-8 pb-8">
                        <Progress value={progress} className="h-3 rounded-full bg-surface-container-highest" />
                    </CardContent>
                </Card>

                {/* Import Section */}
                <Card className="rounded-[2rem] border-border/40 bg-surface-container-low shadow-sm hover:shadow-expressive transition-all duration-300">
                    <CardHeader className="pb-4 px-8 pt-6">
                        <CardTitle className="text-xl font-bold flex items-center gap-3 text-on-surface">
                            <div className="p-2 bg-tertiary/10 rounded-xl text-tertiary">
                                <IconUpload className="w-5 h-5" />
                            </div>
                            Import Syllabus PDF using AI
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-tertiary/10 file:text-tertiary hover:file:bg-tertiary/20 cursor-pointer h-14 bg-surface-container rounded-full border border-transparent focus:border-tertiary/30 transition-all text-on-surface-variant pl-4"
                                />
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                    <IconFileText className="w-5 h-5 text-tertiary/50" />
                                </div>
                            </div>
                            <Button
                                onClick={handleImport}
                                disabled={!file || isImporting}
                                className="shrink-0 rounded-full h-14 px-8 bg-tertiary text-on-tertiary hover:bg-tertiary/90 shadow-lg shadow-tertiary/20 font-medium text-base transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isImporting ? (
                                    <>
                                        <IconLoader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <IconFileText className="w-5 h-5 mr-2" />
                                        Parse & Import
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-sm text-on-surface-variant/70 mt-3 ml-2 flex items-center gap-2">
                            <IconSparkles className="w-4 h-4 text-tertiary" />
                            Upload your syllabus PDF to automatically extract modules and topics using AI.
                        </p>
                    </CardContent>
                </Card>

                <Separator className="bg-border/40" />

                {/* Modules List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-bold flex items-center gap-3 text-on-surface">
                            <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
                                <IconBook className="w-5 h-5" />
                            </div>
                            Modules ({modules.length})
                        </h2>
                        <Button onClick={openAddDialog} size="sm" className="rounded-full h-10 px-5 bg-surface-container-high text-on-surface hover:bg-primary hover:text-on-primary border border-border/50 hover:border-primary transition-all shadow-sm">
                            <IconPlus className="w-4 h-4 mr-2" />
                            Add Module
                        </Button>
                    </div>

                    {modules.length === 0 ? (
                        <Card className="py-20 rounded-[2.5rem] bg-surface-container-lowest/50 border-2 border-dashed border-border/40">
                            <CardContent className="flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-3xl bg-surface-container-highest flex items-center justify-center mb-6 shadow-sm">
                                    <IconBook className="w-10 h-10 text-on-surface-variant/50" />
                                </div>
                                <h3 className="font-bold text-xl text-on-surface mb-2">No Modules Yet</h3>
                                <p className="text-on-surface-variant mt-1 max-w-sm leading-relaxed">
                                    Import a syllabus PDF or add modules manually to start tracking.
                                </p>
                                <Button onClick={openAddDialog} className="mt-8 rounded-full h-12 px-8 shadow-lg shadow-primary/20">
                                    <IconPlus className="w-5 h-5 mr-2" />
                                    Add First Module
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {modules.map((mod, index) => {
                                const config = STATUS_CONFIG[mod.status] || STATUS_CONFIG.Pending
                                const Icon = config.icon

                                return (
                                    <motion.div
                                        key={mod.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05, type: "spring", stiffness: 100, damping: 15 }}
                                    >
                                        <Card className={cn(
                                            "transition-all duration-300 hover:shadow-expressive group border-border/40 overflow-hidden rounded-[1.5rem] bg-surface-container-low",
                                            expanded.has(mod.id) && "ring-2 ring-primary/20 bg-surface-container"
                                        )}>
                                            <div
                                                onClick={() => toggleExpand(mod.id)}
                                                className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 cursor-pointer select-none"
                                            >
                                                {/* Module Info */}
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
                                                    {/* Expand Icon */}
                                                    <div className="hidden sm:flex w-10 h-10 rounded-full bg-surface-container-highest items-center justify-center text-on-surface-variant shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        {expanded.has(mod.id) ? (
                                                            <IconChevronDown className="w-5 h-5" />
                                                        ) : (
                                                            <IconChevronRight className="w-5 h-5" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <h4 className="font-bold text-lg text-on-surface break-words leading-tight">{mod.title}</h4>
                                                            {/* Retention Indicator */}
                                                            {(() => {
                                                                if (mod.status === 'Completed' || mod.status === 'Revised') {
                                                                    const retention = calculateRetention(mod.lastStudiedAt, mod.strength)
                                                                    let color = "bg-emerald-500" // > 80%
                                                                    if (retention < 50) color = "bg-error"
                                                                    else if (retention < 80) color = "bg-tertiary"

                                                                    return (
                                                                        <div className="flex items-center bg-surface-container-highest rounded-full px-2 py-0.5 border border-border/50">
                                                                            <div className={cn("w-2 h-2 rounded-full shadow-sm", color)} />
                                                                            <span className="ml-1.5 text-[11px] text-on-surface-variant font-mono font-medium">{retention}% Retention</span>
                                                                        </div>
                                                                    )
                                                                } else if (mod.status === 'InProgress') {
                                                                    return (
                                                                        <div className="flex items-center bg-amber-500/10 rounded-full px-2 py-0.5 border border-amber-500/20">
                                                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                                            <span className="ml-1.5 text-[11px] text-amber-600 font-bold uppercase tracking-wide">Learning</span>
                                                                        </div>
                                                                    )
                                                                }
                                                                return null
                                                            })()}
                                                        </div>
                                                        <p className="text-sm text-on-surface-variant/80 font-medium flex items-center gap-1.5">
                                                            <IconListDetails className="w-3.5 h-3.5 opacity-70" />
                                                            {mod.topics?.length || 0} topics
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Actions and Status row */}
                                                <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0 shrink-0">
                                                    {/* Action Buttons */}
                                                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-surface-container-high/50 rounded-full p-1 border border-border/30 backdrop-blur-sm">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-full"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openScoutDefault(mod)
                                                            }}
                                                            title="Scout Resources"
                                                        >
                                                            <IconTelescope className="w-4.5 h-4.5" />
                                                        </Button>
                                                        <div className="w-px h-4 bg-border/50 mx-0.5"></div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-full"
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
                                                            className="h-9 w-9 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full"
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
                                                            "min-w-[120px] h-10 rounded-xl transition-all font-medium border shadow-sm hover:shadow-md active:scale-95",
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
                                            </div>

                                            {/* Expanded Topics */}
                                            <AnimatePresence>
                                                {expanded.has(mod.id) && mod.topics && mod.topics.length > 0 && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden border-t border-border/40"
                                                    >
                                                        <div className="p-6 pl-20 bg-surface-container-lowest/30">
                                                            <ul className="space-y-3">
                                                                {mod.topics.map((topic, i) => (
                                                                    <li key={i} className="flex items-start gap-3 text-sm group/topic">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 shrink-0 group-hover/topic:bg-primary transition-colors ring-2 ring-primary/10" />
                                                                        <span className="text-on-surface-variant/90 leading-relaxed group-hover/topic:text-on-surface transition-colors">{topic}</span>
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
                <DialogContent className="sm:max-w-lg rounded-[2rem] border-border/50 bg-surface-container-high shadow-xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-4 bg-surface-container-high border-b border-border/40">
                        <DialogTitle className="text-xl font-bold text-on-surface">
                            {editingModule ? "Edit Module" : "Add New Module"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 p-6 bg-surface-container">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Module Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Module 1: Introduction to..."
                                value={moduleTitle}
                                onChange={(e) => setModuleTitle(e.target.value)}
                                className="h-12 rounded-xl bg-surface-container-low border-transparent focus:border-primary/50 focus:bg-surface-container-low/50 transition-all font-medium text-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="topics" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Topics (one per line)</Label>
                            <Textarea
                                id="topics"
                                placeholder="Enter topics, one per line..."
                                value={moduleTopics}
                                onChange={(e) => setModuleTopics(e.target.value)}
                                rows={8}
                                className="min-h-[150px] rounded-xl bg-surface-container-low border-transparent focus:border-primary/50 focus:bg-surface-container-low/50 transition-all resize-none font-medium leading-relaxed"
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-4 bg-surface-container-high border-t border-border/40">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-full text-on-surface-variant hover:text-on-surface">Cancel</Button>
                        <Button onClick={handleSaveModule} disabled={isSaving} className="rounded-full px-8 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-on-primary font-medium">
                            {isSaving ? "Saving..." : (editingModule ? "Update Module" : "Add Module")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AI Scout Dialog */}
            <Dialog open={isScoutOpen} onOpenChange={setIsScoutOpen}>
                <DialogContent className="sm:max-w-3xl bg-zinc-950 border-zinc-900 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl shadow-indigo-500/10">
                    <DialogHeader className="p-8 pb-4 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                                <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                    <IconTelescope className="w-6 h-6 text-indigo-400" />
                                </div>
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-indigo-100 to-purple-300">
                                    Curriculum Architect
                                </span>
                            </DialogTitle>
                            {!isScouting && scoutedResources.length > 0 && (
                                <Button size="sm" onClick={saveAllResources} className="bg-white text-zinc-950 hover:bg-zinc-200 rounded-full font-bold px-6 shadow-lg shadow-white/5 transition-all hover:scale-105 active:scale-95">
                                    <IconBookmark className="w-4 h-4 mr-2" />
                                    Save All
                                </Button>
                            )}
                        </div>
                        <p className="text-zinc-400 mt-2 text-base ml-1">
                            Curating <span className="text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">Gold Standard</span> resources for: <span className="font-bold text-zinc-100">{scoutingModule?.title}</span>
                        </p>
                    </DialogHeader>

                    <div className="h-[500px] overflow-y-auto custom-scrollbar p-6 bg-gradient-to-b from-zinc-950 to-zinc-900/50">
                        {isScouting ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in duration-700">
                                <div className="relative w-32 h-32">
                                    <div className="absolute inset-0 rounded-full border-[6px] border-indigo-500/20 animate-[spin_4s_linear_infinite]" />
                                    <div className="absolute inset-2 rounded-full border-[6px] border-t-indigo-400 border-r-transparent border-b-purple-500/50 border-l-transparent animate-spin duration-[2s]" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/20 border border-white/5">
                                            <IconTelescope className="w-10 h-10 text-indigo-400 animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 text-center">
                                    <h3 className="font-bold text-xl text-zinc-100 animate-pulse tracking-wide">
                                        {scoutStep === 1 && "Analyzing syllabus module depth..."}
                                        {scoutStep === 2 && "Scanning top university archives..."}
                                        {scoutStep === 3 && "Curating expert-verified content..."}
                                    </h3>
                                    <p className="text-zinc-500 max-w-sm mx-auto font-medium">
                                        Using Llama 3 to analyze topic density and retrieve high-authority learning materials.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 pb-8">
                                {scoutedResources.map((res, i) => {
                                    const isSaved = savedResourceIds.has(`${res.title}-${i}`)
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ delay: i * 0.1, type: "spring", bounce: 0.4 }}
                                        >
                                            <Card className={cn(
                                                "border-0 border-l-[6px] transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:translate-x-1 bg-zinc-900/40 backdrop-blur-md rounded-2xl overflow-hidden",
                                                isSaved ? "border-l-emerald-500 bg-emerald-950/10" : "border-l-indigo-500"
                                            )}>
                                                <CardContent className="p-5 flex items-start justify-between gap-5">
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-zinc-950/50 border-zinc-800 text-zinc-400 font-bold py-1 px-2.5 rounded-lg">
                                                                {res.category?.replace('_', ' ') || res.type}
                                                            </Badge>
                                                            {res.author && (
                                                                <span className="text-xs text-indigo-300 font-bold flex items-center gap-1.5 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/10">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                                                                    {res.author}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 className="font-bold text-lg leading-snug text-zinc-100 group-hover:text-white transition-colors">{res.title}</h4>
                                                        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">{res.description}</p>
                                                    </div>
                                                    <div className="flex flex-col gap-3 shrink-0 pt-1">
                                                        <Button size="sm" variant="outline" asChild className="h-9 w-28 justify-start bg-zinc-950 border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-medium rounded-xl hover:border-zinc-700 transition-all">
                                                            <a href={res.url} target="_blank" rel="noopener noreferrer">
                                                                <IconExternalLink className="w-3.5 h-3.5 mr-2" />
                                                                {res.isDirectLink ? 'Visit Link' : 'Search'}
                                                            </a>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className={cn("h-9 w-28 justify-start transition-all font-bold rounded-xl shadow-lg", isSaved ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/20 hover:shadow-indigo-500/20")}
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
                                                                    Save Resource
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
                                    <div className="flex justify-center pt-6 pb-2">
                                        <div className="bg-zinc-950/80 backdrop-blur-sm rounded-full px-5 py-2.5 text-xs text-zinc-500 flex items-center gap-2.5 border border-zinc-900 shadow-xl">
                                            <IconTelescope className="w-4 h-4 text-indigo-500/50" />
                                            <span className="font-medium tracking-wide">Curated by <span className="text-zinc-300 font-bold">Llama 3 Curriculum Architect</span></span>
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
