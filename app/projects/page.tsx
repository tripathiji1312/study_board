"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
    Dialog,
    DialogContent,
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
    IconPencil,
    IconRocket,
    IconSparkles,
    IconTarget,
    IconPlayerPlay,
    IconPlayerPause,
    IconCheck,
    IconPackage,
    IconFlame,
    IconBrandGithub,
    IconStar,
    IconGitFork,
    IconExternalLink
} from "@tabler/icons-react"
import { useStore, Project, Status } from "@/components/providers/store-provider"
import { motion, AnimatePresence } from "framer-motion"

const STATUS_CONFIG: Record<string, { icon: typeof IconTarget, color: string, bg: string }> = {
    "Planning": { icon: IconTarget, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-200" },
    "In Progress": { icon: IconPlayerPlay, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-200" },
    "On Hold": { icon: IconPlayerPause, color: "text-slate-500", bg: "bg-slate-500/10 border-slate-200" },
    "Completed": { icon: IconCheck, color: "text-green-500", bg: "bg-green-500/10 border-green-200" },
}

interface GitHubStats {
    stars: number
    forks: number
    loading: boolean
}

export default function ProjectsPage() {
    const { projects, addProject, updateProject, deleteProject } = useStore()
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingProject, setEditingProject] = React.useState<Project | null>(null)
    const [filter, setFilter] = React.useState<string>("all")
    const [githubStats, setGithubStats] = React.useState<Record<number, GitHubStats>>({})

    // Form State
    const [title, setTitle] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [progress, setProgress] = React.useState(0)
    const [status, setStatus] = React.useState("Planning")
    const [tech, setTech] = React.useState("")
    const [githubUrl, setGithubUrl] = React.useState("")

    const filteredProjects = filter === "all"
        ? projects
        : projects.filter(p => p.status === filter)

    const inProgress = projects.filter(p => p.status === "In Progress").length
    const completed = projects.filter(p => p.status === "Completed").length

    // Fetch GitHub stats for a repo
    const fetchGitHubStats = React.useCallback(async (projectId: number, url: string) => {
        if (!url) return

        // Extract owner/repo from GitHub URL
        const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
        if (!match) return

        const [, owner, repo] = match
        setGithubStats(prev => ({ ...prev, [projectId]: { stars: 0, forks: 0, loading: true } }))

        try {
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo.replace('.git', '')}`)
            if (res.ok) {
                const data = await res.json()
                setGithubStats(prev => ({
                    ...prev,
                    [projectId]: { stars: data.stargazers_count, forks: data.forks_count, loading: false }
                }))
            } else {
                setGithubStats(prev => ({ ...prev, [projectId]: { stars: 0, forks: 0, loading: false } }))
            }
        } catch {
            setGithubStats(prev => ({ ...prev, [projectId]: { stars: 0, forks: 0, loading: false } }))
        }
    }, [])

    // Fetch stats for all projects with GitHub URLs
    React.useEffect(() => {
        projects.forEach(p => {
            if (p.githubUrl && !githubStats[p.id]) {
                fetchGitHubStats(p.id, p.githubUrl)
            }
        })
    }, [projects, fetchGitHubStats, githubStats])

    const openAddDialog = () => {
        setEditingProject(null)
        setTitle("")
        setDescription("")
        setProgress(0)
        setStatus("Planning")
        setTech("")
        setGithubUrl("")
        setIsDialogOpen(true)
    }

    const openEditDialog = (project: Project) => {
        setEditingProject(project)
        setTitle(project.title)
        setDescription(project.description)
        setProgress(project.progress)
        setStatus(project.status)
        setTech(project.tech.join(", "))
        setGithubUrl(project.githubUrl || "")
        setIsDialogOpen(true)
    }

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title) return

        const projectData = {
            title,
            description,
            progress,
            status: status as Status,
            tech: tech.split(",").map(t => t.trim()).filter(Boolean),
            githubUrl: githubUrl || undefined
        }

        if (editingProject) {
            updateProject({ ...editingProject, ...projectData })
            // Refresh GitHub stats if URL changed
            if (githubUrl && githubUrl !== editingProject.githubUrl) {
                fetchGitHubStats(editingProject.id, githubUrl)
            }
        } else {
            addProject(projectData)
        }
        setIsDialogOpen(false)
    }

    const quickUpdateProgress = (project: Project, newProgress: number) => {
        updateProject({
            ...project,
            progress: newProgress,
            status: (newProgress >= 100 ? "Completed" : project.status === "Completed" ? "In Progress" : project.status) as Status
        })
    }

    return (
        <Shell>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                        <p className="text-muted-foreground">Track your development work</p>
                    </div>
                    <Button onClick={openAddDialog}>
                        <IconPlus className="w-4 h-4 mr-2" /> New Project
                    </Button>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-4 md:gap-6 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                        <IconPackage className="w-5 h-5 text-muted-foreground" />
                        <div>
                            <p className="text-2xl font-bold">{projects.length}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                    </div>
                    <div className="hidden sm:block h-12 w-px bg-border" />
                    <div className="flex items-center gap-3">
                        <IconFlame className="w-5 h-5 text-orange-500" />
                        <div>
                            <p className="text-2xl font-bold">{inProgress}</p>
                            <p className="text-xs text-muted-foreground">Active</p>
                        </div>
                    </div>
                    <div className="hidden sm:block h-12 w-px bg-border" />
                    <div className="flex items-center gap-3">
                        <IconCheck className="w-5 h-5 text-green-500" />
                        <div>
                            <p className="text-2xl font-bold">{completed}</p>
                            <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={filter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("all")}
                    >
                        All
                    </Button>
                    {Object.entries(STATUS_CONFIG).map(([statusName, config]) => {
                        const Icon = config.icon
                        return (
                            <Button
                                key={statusName}
                                variant={filter === statusName ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilter(statusName)}
                                className="gap-1"
                            >
                                <Icon className={`w-3 h-3 ${filter === statusName ? "" : config.color}`} />
                                {statusName}
                            </Button>
                        )
                    })}
                </div>

                {/* Projects Grid */}
                {filteredProjects.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <AnimatePresence>
                            {filteredProjects.map((project, index) => {
                                const config = STATUS_CONFIG[project.status] || STATUS_CONFIG["Planning"]
                                const Icon = config.icon
                                const stats = githubStats[project.id]

                                return (
                                    <motion.div
                                        key={project.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card className={`hover:shadow-md transition-all group border-2 ${config.bg}`}>
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-2 rounded-md bg-background ${config.color}`}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-base">{project.title}</CardTitle>
                                                            <Badge variant="outline" className="text-xs mt-1">{project.status}</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(project)}>
                                                            <IconPencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteProject(project.id)}>
                                                            <IconTrash className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {project.description && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                                                )}

                                                {/* GitHub Stats */}
                                                {project.githubUrl && (
                                                    <div className="flex items-center gap-3 p-2 rounded-lg bg-background/80 border">
                                                        <IconBrandGithub className="w-4 h-4" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium truncate">
                                                                {project.githubUrl.replace('https://github.com/', '')}
                                                            </p>
                                                        </div>
                                                        {stats && !stats.loading && (
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <IconStar className="w-3 h-3" /> {stats.stars}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <IconGitFork className="w-3 h-3" /> {stats.forks}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" asChild>
                                                            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                                                                <IconExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                )}

                                                {/* Progress Section */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="font-medium">Progress</span>
                                                        <span className="font-bold">{project.progress}%</span>
                                                    </div>
                                                    <Progress value={project.progress} className="h-2" />
                                                    <div className="flex gap-1">
                                                        {[0, 25, 50, 75, 100].map(val => (
                                                            <Button
                                                                key={val}
                                                                variant={project.progress === val ? "default" : "ghost"}
                                                                size="sm"
                                                                className="flex-1 h-7 text-xs"
                                                                onClick={() => quickUpdateProgress(project, val)}
                                                            >
                                                                {val}%
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Tech Stack */}
                                                {project.tech.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {project.tech.map((t, i) => (
                                                            <Badge key={i} variant="secondary" className="text-xs">
                                                                {t}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    <Card className="py-12">
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <IconRocket className="w-12 h-12 text-muted-foreground mb-4" />
                            <h3 className="font-semibold text-lg mb-2">No Projects</h3>
                            <p className="text-muted-foreground mb-4">Start building something!</p>
                            <Button onClick={openAddDialog}>Create Project</Button>
                        </CardContent>
                    </Card>
                )}

                {/* Add/Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {editingProject ? <IconPencil className="w-5 h-5" /> : <IconSparkles className="w-5 h-5" />}
                                {editingProject ? "Edit Project" : "New Project"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Project Name</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="My Project" required />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Brief description..."
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <IconBrandGithub className="w-4 h-4" />
                                    GitHub Repository
                                </Label>
                                <Input
                                    value={githubUrl}
                                    onChange={e => setGithubUrl(e.target.value)}
                                    placeholder="https://github.com/user/repo"
                                />
                                <p className="text-xs text-muted-foreground">Stars and forks will be fetched automatically</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(STATUS_CONFIG).map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Progress</Label>
                                    <span className="text-sm font-medium">{progress}%</span>
                                </div>
                                <Slider
                                    value={[progress]}
                                    onValueChange={(vals: number[]) => setProgress(vals[0])}
                                    max={100}
                                    step={5}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Tech Stack</Label>
                                <Input value={tech} onChange={e => setTech(e.target.value)} placeholder="React, Node.js, MongoDB" />
                                <p className="text-xs text-muted-foreground">Separate with commas</p>
                            </div>

                            <DialogFooter>
                                <Button type="submit" className="w-full">{editingProject ? "Save Changes" : "Create Project"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </Shell>
    )
}
