"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { IconPlus, IconTrash, IconLink, IconVideo, IconFileText, IconExternalLink, IconFolder } from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"

const RESOURCE_TYPES = [
    { value: "link", label: "Link", icon: IconLink },
    { value: "video", label: "Video", icon: IconVideo },
    { value: "pdf", label: "PDF/Document", icon: IconFileText },
]

export default function ResourcesPage() {
    const { resources, subjects, currentSemester, addResource, deleteResource } = useStore()
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [filterCategory, setFilterCategory] = React.useState("all")

    // Form State
    const [title, setTitle] = React.useState("")
    const [type, setType] = React.useState<"link" | "video" | "pdf">("link")
    const [url, setUrl] = React.useState("")
    const [category, setCategory] = React.useState("")
    const [subjectId, setSubjectId] = React.useState("")

    const currentSubjects = subjects.filter(s => s.semesterId === currentSemester?.id)

    // Group resources by category
    const categories = [...new Set(resources.map(r => r.category))]
    const filteredResources = filterCategory === "all"
        ? resources
        : resources.filter(r => r.category === filterCategory)

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
    }

    const getIcon = (type: string) => {
        switch (type) {
            case "video": return <IconVideo className="w-5 h-5 text-red-500" />
            case "pdf": return <IconFileText className="w-5 h-5 text-orange-500" />
            default: return <IconLink className="w-5 h-5 text-blue-500" />
        }
    }

    // Group by category for display
    const groupedResources = filteredResources.reduce((acc, res) => {
        if (!acc[res.category]) acc[res.category] = []
        acc[res.category].push(res)
        return acc
    }, {} as Record<string, typeof resources>)

    return (
        <Shell>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
                        <p className="text-muted-foreground">Save and organize learning materials.</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><IconPlus className="w-4 h-4 mr-2" /> Add Resource</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Resource</DialogTitle>
                                <DialogDescription>Save a link, video, or document for later.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Resource name" required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <Select value={type} onValueChange={(v: any) => setType(v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {RESOURCE_TYPES.map(t => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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

                                <div className="space-y-2">
                                    <Label>URL</Label>
                                    <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." type="url" required />
                                </div>

                                {!subjectId && (
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g., DSA, Interview Prep" />
                                    </div>
                                )}

                                <DialogFooter>
                                    <Button type="submit">Save Resource</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap">
                    <Button variant={filterCategory === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterCategory("all")}>
                        All
                    </Button>
                    {categories.map(cat => (
                        <Button
                            key={cat}
                            variant={filterCategory === cat ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterCategory(cat)}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>

                {/* Resources Grid by Category */}
                {Object.keys(groupedResources).length > 0 ? (
                    <div className="space-y-6">
                        {Object.entries(groupedResources).map(([cat, items]) => (
                            <Card key={cat}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <IconFolder className="w-5 h-5 text-primary" />
                                        {cat}
                                    </CardTitle>
                                    <CardDescription>{items.length} resources</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {items.map(res => (
                                            <div
                                                key={res.id}
                                                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                                            >
                                                {getIcon(res.type)}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{res.title}</p>
                                                    <Badge variant="secondary" className="text-xs mt-1">{res.type}</Badge>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                        <a href={res.url} target="_blank" rel="noopener noreferrer">
                                                            <IconExternalLink className="w-4 h-4" />
                                                        </a>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() => deleteResource(res.id)}
                                                    >
                                                        <IconTrash className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="py-12">
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <IconFolder className="w-12 h-12 text-muted-foreground mb-4" />
                            <h3 className="font-semibold text-lg mb-2">No Resources Yet</h3>
                            <p className="text-muted-foreground mb-4">Save links, videos, and documents for quick access.</p>
                            <Button onClick={() => setIsDialogOpen(true)}>Add Your First Resource</Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </Shell>
    )
}
