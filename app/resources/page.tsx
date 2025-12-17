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
import { IconPlus, IconTrash, IconLink, IconVideo, IconFileText, IconExternalLink, IconSearch, IconFolder, IconBook } from "@tabler/icons-react"
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
    const [filterCategory, setFilterCategory] = React.useState("all")
    const [search, setSearch] = React.useState("")

    // Form State
    const [title, setTitle] = React.useState("")
    const [type, setType] = React.useState<"link" | "video" | "pdf">("link")
    const [url, setUrl] = React.useState("")
    const [category, setCategory] = React.useState("")
    const [subjectId, setSubjectId] = React.useState("")

    const currentSubjects = subjects.filter(s => s.semesterId === currentSemester?.id)
    const categories = [...new Set(resources.map(r => r.category))]

    const filteredResources = resources.filter(r => {
        const matchesCategory = filterCategory === "all" || r.category === filterCategory
        const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.category?.toLowerCase().includes(search.toLowerCase())
        return matchesCategory && matchesSearch
    })

    // Group by category
    const groupedResources = filteredResources.reduce((acc, res) => {
        if (!acc[res.category]) acc[res.category] = []
        acc[res.category].push(res)
        return acc
    }, {} as Record<string, typeof resources>)

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
            subjectId: subjectId && subjectId !== "none" ? subjectId : undefined
        })

        setTitle("")
        setUrl("")
        setCategory("")
        setSubjectId("")
        setIsDialogOpen(false)
        toast.success("Resource added! 📚")
    }

    const getTypeConfig = (t: string) =>
        RESOURCE_TYPES.find(rt => rt.value === t) || RESOURCE_TYPES[0]

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
                        <p className="text-muted-foreground mt-1">Your learning materials library</p>
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
                    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <p className="text-2xl font-bold">{resources.filter(r => r.type === "pdf").length}</p>
                        <p className="text-xs text-muted-foreground">Documents</p>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                        <p className="text-2xl font-bold">{categories.length}</p>
                        <p className="text-xs text-muted-foreground">Categories</p>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search resources..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <IconFolder className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Resource Groups */}
                <ScrollArea className="h-[calc(100vh-26rem)]">
                    <div className="space-y-6 pr-4">
                        <AnimatePresence mode="popLayout">
                            {Object.keys(groupedResources).length > 0 ? (
                                Object.entries(groupedResources).map(([cat, items]) => (
                                    <motion.div
                                        key={cat}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <IconFolder className="w-4 h-4 text-muted-foreground" />
                                            <h2 className="font-semibold text-sm">{cat}</h2>
                                            <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {items.map(resource => {
                                                const typeConfig = getTypeConfig(resource.type)
                                                const TypeIcon = typeConfig.icon

                                                return (
                                                    <motion.div
                                                        key={resource.id}
                                                        layout
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="group p-4 rounded-xl border bg-card hover:shadow-md transition-all"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={cn("p-2 rounded-lg", typeConfig.color + "/10")}>
                                                                <TypeIcon className={cn("w-4 h-4", typeConfig.color.replace("bg-", "text-"))} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-medium text-sm truncate">{resource.title}</h3>
                                                                <p className="text-xs text-muted-foreground truncate mt-1">{resource.url}</p>
                                                                <Badge variant="outline" className="text-[10px] mt-2">{typeConfig.label}</Badge>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    asChild
                                                                >
                                                                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                                                        <IconExternalLink className="w-4 h-4" />
                                                                    </a>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => {
                                                                        deleteResource(resource.id)
                                                                        toast.success("Resource deleted")
                                                                    }}
                                                                >
                                                                    <IconTrash className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
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
                                    <Label>Subject (Optional)</Label>
                                    <Select value={subjectId} onValueChange={setSubjectId}>
                                        <SelectTrigger><SelectValue placeholder="Link to subject" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {currentSubjects.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {!subjectId || subjectId === "none" ? (
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Web Development" />
                                </div>
                            ) : null}
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
