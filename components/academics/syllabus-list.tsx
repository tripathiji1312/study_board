"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { IconCheck, IconCircle, IconCircleDashed, IconLoader2, IconChevronDown, IconChevronRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface SyllabusModule {
    id: string
    title: string
    topics: string[]
    status: string // "Pending" | "InProgress" | "Completed" | "Revised"
    order: number
}

interface SyllabusListProps {
    subjectId: string
    initialModules: SyllabusModule[]
    onUpdate?: () => void
}

export function SyllabusList({ subjectId, initialModules, onUpdate }: SyllabusListProps) {
    const [modules, setModules] = React.useState<SyllabusModule[]>(initialModules)
    const [expanded, setExpanded] = React.useState<Set<string>>(new Set())

    // Update local state when props change
    React.useEffect(() => {
        setModules(initialModules)
    }, [initialModules])

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expanded)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpanded(newExpanded)
    }

    const updateStatus = async (id: string, currentStatus: string, e: React.MouseEvent) => {
        e.stopPropagation()

        let newStatus = "Pending"
        if (currentStatus === "Pending") newStatus = "InProgress"
        else if (currentStatus === "InProgress") newStatus = "Completed"
        else if (currentStatus === "Completed") newStatus = "Revised"
        else if (currentStatus === "Revised") newStatus = "Pending"

        // Optimistic update
        const oldModules = [...modules]
        setModules(modules.map(m => m.id === id ? { ...m, status: newStatus } : m))

        try {
            const res = await fetch('/api/syllabus', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            })
            if (!res.ok) throw new Error('Failed to update')
            onUpdate?.() // Trigger parent refresh if needed
        } catch (err) {
            setModules(oldModules)
            toast.error("Failed to update status")
        }
    }

    const completedCount = modules.filter(m => m.status === "Completed" || m.status === "Revised").length
    const progress = modules.length > 0 ? (completedCount / modules.length) * 100 : 0

    if (modules.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                <p className="text-sm font-medium">No syllabus uploaded yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Import a PDF to get started.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                    <span>Course Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-muted/50" indicatorClassName="bg-gradient-to-r from-indigo-500 to-purple-500" />
            </div>

            <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                    {modules.map((mod, index) => (
                        <motion.div
                            key={mod.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                "group border rounded-xl overflow-hidden transition-all duration-200",
                                "bg-card/50 hover:bg-card/80 dark:hover:bg-accent/5",
                                expanded.has(mod.id) ? "ring-1 ring-primary/20 shadow-md" : "hover:border-primary/20"
                            )}
                        >
                            <div
                                onClick={() => toggleExpand(mod.id)}
                                className="flex items-center gap-3 p-4 cursor-pointer select-none"
                            >
                                <div className="text-muted-foreground group-hover:text-primary transition-colors">
                                    {expanded.has(mod.id) ? (
                                        <IconChevronDown className="w-4 h-4" />
                                    ) : (
                                        <IconChevronRight className="w-4 h-4" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm line-clamp-2 break-words pr-2" title={mod.title}>
                                        {mod.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {mod.topics?.length || 0} topics
                                    </p>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-8 px-3 rounded-full text-xs font-medium border transition-all min-w-[80px]",
                                        mod.status === "Completed" && "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
                                        mod.status === "InProgress" && "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20",
                                        mod.status === "Revised" && "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
                                        mod.status === "Pending" && "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                                    )}
                                    onClick={(e) => updateStatus(mod.id, mod.status, e)}
                                >
                                    {mod.status === "Completed" && "Done"}
                                    {mod.status === "InProgress" && "Active"}
                                    {mod.status === "Revised" && "Revised"}
                                    {mod.status === "Pending" && "Start"}
                                </Button>
                            </div>

                            <AnimatePresence>
                                {expanded.has(mod.id) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 pt-0">
                                            <div className="pl-9 space-y-2">
                                                {mod.topics.map((topic, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
                                                        <span className="leading-relaxed break-words">{topic}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
