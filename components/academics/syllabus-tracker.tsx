"use client"

import * as React from "react"
import { IconPlus, IconTrash, IconTrophy, IconBook, IconCircle, IconCircleDashed, IconCircleCheck, IconCircleDot } from "@tabler/icons-react"
import { useStore, Module } from "@/components/providers/store-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface SyllabusTrackerProps {
    subjectId: string
}

const STATUS_CONFIG = {
    "Pending": {
        color: "text-muted-foreground",
        bg: "bg-muted/50 hover:bg-muted text-muted-foreground border-transparent",
        icon: IconCircle,
        label: "Pending"
    },
    "In Progress": {
        color: "text-amber-500",
        bg: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-500/20",
        icon: IconCircleDashed,
        label: "In Progress"
    },
    "Completed": {
        color: "text-emerald-500",
        bg: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border-emerald-500/20",
        icon: IconCircleCheck,
        label: "Done"
    },
    "Revised": {
        color: "text-purple-500",
        bg: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border-purple-500/20",
        icon: IconCircleDot,
        label: "Revised"
    }
}

export function SyllabusTracker({ subjectId }: SyllabusTrackerProps) {
    const { subjects, addModule, updateModule, deleteModule } = useStore()
    const subject = subjects.find(s => s.id === subjectId)
    const [title, setTitle] = React.useState("")
    const scrollRef = React.useRef<HTMLDivElement>(null)

    if (!subject) return null

    const modules = subject.modules || []

    // Stats
    const total = modules.length
    const completed = modules.filter(m => m.status === "Completed" || m.status === "Revised").length
    const progress = total === 0 ? 0 : (completed / total) * 100

    const onAdd = () => {
        if (!title.trim()) return
        addModule(subjectId, {
            title: title.trim(),
            status: "Pending"
        })
        setTitle("")
        // Auto-scroll to bottom after add
        setTimeout(() => {
            if (scrollRef.current) {
                const scrollableNode = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
                if (scrollableNode) {
                    scrollableNode.scrollTop = scrollableNode.scrollHeight;
                }
            }
        }, 100)
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault()
            onAdd()
        }
    }

    const nextStatus = (current: Module['status']): Module['status'] => {
        if (current === "Pending") return "In Progress"
        if (current === "In Progress") return "Completed"
        if (current === "Completed") return "Revised"
        return "Pending"
    }

    const handleToggle = (module: Module) => {
        updateModule(subjectId, { ...module, status: nextStatus(module.status) })
    }

    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto">
            {/* Header / Stats */}
            <div className="mb-8 p-6 bg-card border rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-lg font-semibold tracking-tight">Your Progress</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            You&apos;ve completed <span className="font-medium text-foreground">{completed}</span> out of <span className="font-medium text-foreground">{total}</span> modules.
                        </p>
                    </div>
                    <div className="text-right min-w-[120px] flex justify-end">
                        {progress === 100 ? (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 px-3 h-9">
                                <IconTrophy className="w-4 h-4 mr-2" /> All Done!
                            </Badge>
                        ) : (
                            <span className="text-3xl font-bold tracking-tight text-primary h-9 flex items-center">{Math.round(progress)}%</span>
                        )}
                    </div>
                </div>
                <Progress value={progress} className="h-3 w-full bg-secondary/50" indicatorClassName="bg-primary/90" />
            </div>

            {/* List */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-[400px] relative rounded-2xl border bg-card/50">
                {modules.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 p-8 text-center animate-in fade-in duration-500">
                        <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
                            <IconBook className="w-10 h-10 opacity-40" />
                        </div>
                        <p className="text-lg font-medium text-foreground/80">Syllabus Empty</p>
                        <p className="text-sm max-w-[250px] mt-2 leading-relaxed">Add chapters or units below to start tracking your completion.</p>
                    </div>
                ) : (
                    <ScrollArea className="flex-1" ref={scrollRef}>
                        <div className="p-2 space-y-3">
                            {modules.map((module) => {
                                const Config = STATUS_CONFIG[module.status]
                                const Icon = Config.icon

                                return (
                                    <div
                                        key={module.id}
                                        className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-background border border-border/50 hover:border-border hover:shadow-md transition-all duration-200"
                                    >
                                        {/* Status Button - Fixed Width Container */}
                                        <div className="sm:w-32 shrink-0">
                                            <button
                                                onClick={() => handleToggle(module)}
                                                className={cn(
                                                    "w-full h-10 px-0 rounded-lg flex items-center justify-center gap-2.5 transition-all duration-200 border text-xs font-semibold tracking-wide uppercase select-none",
                                                    Config.bg,
                                                    "active:scale-95"
                                                )}
                                            >
                                                <Icon className="w-4 h-4" stroke={2.5} />
                                                <span>{Config.label}</span>
                                            </button>
                                        </div>

                                        {/* Title */}
                                        <div className="flex-1 min-w-0">
                                            <span className={cn(
                                                "text-base font-medium transition-all text-foreground/90 block truncate",
                                                module.status === "Completed" && "text-muted-foreground line-through decoration-border",
                                            )}>
                                                {module.title}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hidden sm:flex w-9 h-9 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                                            onClick={() => deleteModule(subjectId, module.id)}
                                        >
                                            <IconTrash className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="sm:hidden w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => deleteModule(subjectId, module.id)}
                                        >
                                            <IconTrash className="w-4 h-4 mr-2" /> Delete
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                )}
            </div>

            {/* Add Footer */}
            <div className="mt-6">
                <div className="flex gap-3 relative group">
                    <Input
                        placeholder="Add new module (e.g. Unit 1: Algebra)..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={onKeyDown}
                        className="h-12 pl-4 pr-12 bg-card border-border/60 focus:border-primary/50 text-base shadow-sm rounded-xl transition-all"
                    />
                    <Button
                        onClick={onAdd}
                        size="icon"
                        className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg shadow-sm"
                        disabled={!title.trim()}
                    >
                        <IconPlus className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
