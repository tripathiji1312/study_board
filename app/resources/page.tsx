"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    IconPlus,
    IconTrash,
    IconLink,
    IconVideo,
    IconFileText,
    IconExternalLink,
    IconSearch,
    IconFolder,
    IconBook,
    IconTelescope,
    IconChevronDown
} from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const RESOURCE_TYPES = [
    { value: "link", label: "Link", icon: IconLink, color: "bg-blue-500" },
    { value: "video", label: "Video", icon: IconVideo, color: "bg-red-500" },
    { value: "pdf", label: "PDF/Doc", icon: IconFileText, color: "bg-orange-500" },
]

export default function ResourcesPage() {
    const { resources, subjects, currentSemester, addResource, deleteResource } = useStore()
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [filterCategory, setFilterCategory] = React.useState("all") // Kept for legacy compatibility if needed
    const [search, setSearch] = React.useState("")

    // Form State
    const [title, setTitle] = React.useState("")
    const [type, setType] = React.useState<"link" | "video" | "pdf">("link")
    const [url, setUrl] = React.useState("")
    const [category, setCategory] = React.useState("")
    const [subjectId, setSubjectId] = React.useState("none")
    const [moduleId, setModuleId] = React.useState("none")

    const currentSubjects = subjects.filter(s => s.semesterId === currentSemester?.id)
    const categories = [...new Set(resources.map(r => r.category))]

    const filteredResources = resources.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.category?.toLowerCase().includes(search.toLowerCase())
        return matchesSearch
    })

    // Grouping Logic
    const groupedBySubject: Record<string, { name: string, totalCount: number, general: any[], modules: Record<string, any[]> }> = {}
    const uncategorizedResources: any[] = []

    filteredResources.forEach(res => {
        if (res.subjectId && res.subjectId !== "none") {
            const subject = subjects.find(s => s.id === res.subjectId)
            if (subject) {
                if (!groupedBySubject[res.subjectId]) {
                    groupedBySubject[res.subjectId] = {
                        name: subject.name,
                        totalCount: 0,
                        general: [],
                        modules: {}
                    }
                }
                const group = groupedBySubject[res.subjectId]
                group.totalCount++

                if (res.syllabusModuleId && res.syllabusModuleId !== "none") {
                    const moduleTitle = subject.modules?.find(m => m.id === res.syllabusModuleId)?.title || "Unknown Module"
                    if (!group.modules[moduleTitle]) group.modules[moduleTitle] = []
                    group.modules[moduleTitle].push(res)
                } else {
                    group.general.push(res)
                }
                return
            }
        }
        uncategorizedResources.push(res)
    })

    const getTypeConfig = (t: string) =>
        RESOURCE_TYPES.find(rt => rt.value === t) || RESOURCE_TYPES[0]

    const renderResourceCard = (resource: any) => {
        const typeConfig = getTypeConfig(resource.type)
        const TypeIcon = typeConfig.icon

        return (
            <motion.div
                key={resource.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                    "group p-3 rounded-xl border bg-card hover:shadow-md transition-all relative overflow-hidden",
                    resource.scoutedByAi ? "border-indigo-500/30 bg-indigo-50/5" : ""
                )}
            >
                {resource.scoutedByAi && (
                    <div className="absolute top-0 right-0 p-1.5 bg-indigo-500/10 rounded-bl-lg">
                        <IconTelescope className="w-3 h-3 text-indigo-500" />
                    </div>
                )}
                <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg shrink-0", typeConfig.color + "/10")}>
                        <TypeIcon className={cn("w-4 h-4", typeConfig.color.replace("bg-", "text-"))} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate pr-4" title={resource.title}>{resource.title}</h3>
                        <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground truncate mt-0.5 hover:underline block"
                        >
                            {new URL(resource.url).hostname.replace('www.', '')}
                        </a>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[10px] h-5">{typeConfig.label}</Badge>
                            {resource.category && resource.category !== "Learning" && (
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                                    {resource.category}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur rounded-lg p-0.5 border shadow-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        asChild
                    >
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            <IconExternalLink className="w-3 h-3" />
                        </a>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                            e.preventDefault()
                            deleteResource(resource.id)
                            toast.success("Resource deleted")
                        }}
                    >
                        <IconTrash className="w-3 h-3" />
                    </Button>
                </div>
            </motion.div>
        )
    }

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !url) return

        const selectedSubject = subjects.find(s => s.id === subjectId)
        const resourceCategory = subjectId && selectedSubject ? selectedSubject.name : category || "General"

        addResource({
            title,
            type,
            url,
            category: resourceCategory,
            subjectId: subjectId && subjectId !== "none" ? subjectId : undefined,
            syllabusModuleId: moduleId && moduleId !== "none" ? moduleId : undefined
        })

        setTitle("")
        setUrl("")
        setCategory("")
        setSubjectId("none")
        setModuleId("none")
        setIsDialogOpen(false)
        toast.success("Resource added! 📚")
    }

    return (
        <Shell>
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                                <IconBook className="h-6 w-6 text-white" />
                            </div>
                            Resources
                        </h1>
                        <p className="text-muted-foreground mt-1">Your learning materials library, organized by subject.</p>
                    </div>
                    <Button onClick={() => setIsDialogOpen(true)} className="shadow-lg shadow-primary/20">
                        <IconPlus className="w-4 h-4 mr-2" /> Add Resource
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-2xl font-bold">{resources.filter(r => r.type === "link").length}</p>
                        <p className="text-xs text-muted-foreground">Links</p>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-2xl font-bold">{resources.filter(r => r.type === "video").length}</p>
                        <p className="text-xs text-muted-foreground">Videos</p>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <p className="text-2xl font-bold">{resources.filter(r => r.scoutedByAi).length}</p>
                        <p className="text-xs text-muted-foreground">AI Scouted</p>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                        <p className="text-2xl font-bold">{Object.keys(groupedBySubject).length}</p>
                        <p className="text-xs text-muted-foreground">Subjects</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search resources..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Content */}
                <ScrollArea className="h-[calc(100vh-26rem)]">
                    <div className="space-y-8 pr-4">
                        <AnimatePresence mode="popLayout">
                            {/* Render Subjects */}
                            {Object.entries(groupedBySubject).map(([subId, group]) => (
                                <SubjectGroup
                                    key={subId}
                                    group={group}
                                    renderResourceCard={renderResourceCard}
                                />
                            ))}

                            {/* Other / Uncategorized Global */}
                            {uncategorizedResources.length > 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-4 border-t">
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <IconBook className="w-5 h-5 text-muted-foreground" />
                                        Uncategorized
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {uncategorizedResources.map(renderResourceCard)}
                                    </div>
                                </motion.div>
                            )}

                            {Object.keys(groupedBySubject).length === 0 && uncategorizedResources.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-16 text-center border-2 border-dashed rounded-xl"
                                >
                                    <IconBook className="w-10 h-10 mx-auto mb-4 opacity-30" />
                                    <p className="font-medium">No resources found</p>
                                    <p className="text-sm text-muted-foreground mt-1">Add your first resource to get started</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>

                {/* Add Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Resource</DialogTitle>
                            <DialogDescription>Save a link, video, or document for later.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="React Hooks Tutorial" required />
                            </div>
                            <div className="space-y-2">
                                <Label>URL</Label>
                                <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {RESOURCE_TYPES.map(t => (
                                                <SelectItem key={t.value} value={t.value}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("w-2 h-2 rounded-full", t.color)} />
                                                        {t.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Subject</Label>
                                    <Select value={subjectId} onValueChange={setSubjectId}>
                                        <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {currentSubjects.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Module Selection (Conditional) */}
                            {subjectId && subjectId !== "none" && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label>Module (Optional)</Label>
                                    <Select value={moduleId} onValueChange={setModuleId}>
                                        <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">General (No Module)</SelectItem>
                                            {currentSubjects.find(s => s.id === subjectId)?.modules?.map(m => (
                                                <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {(!subjectId || subjectId === "none") && (
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Web Development" />
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">Add Resource</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </Shell>
    )
}

function SubjectGroup({ group, renderResourceCard }: { group: any, renderResourceCard: (r: any) => React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(true)

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-xl border bg-card/50 overflow-hidden"
        >
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
            >
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <IconFolder className="w-5 h-5 text-primary" />
                    {group.name}
                    <Badge variant="secondary" className="ml-2">{group.totalCount}</Badge>
                </h2>
                <IconChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", isOpen ? "rotate-180" : "")} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 space-y-6">
                            {/* Uncategorized / General Resources for this Subject */}
                            {group.general.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-1">General Materials</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {group.general.map(renderResourceCard)}
                                    </div>
                                </div>
                            )}

                            {/* Modules */}
                            {Object.entries(group.modules).map(([modName, modResources]: [string, any]) => (
                                <div key={modName} className="space-y-3 pl-4 border-l-2 border-muted/50 ml-1">
                                    <h3 className="text-sm font-medium flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                        {modName}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {modResources.map(renderResourceCard)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
