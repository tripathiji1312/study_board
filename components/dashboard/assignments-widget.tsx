"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useStore } from "@/components/providers/store-provider"
import { IconClipboardCheck, IconTrophy } from "@tabler/icons-react"
import { motion, AnimatePresence } from "framer-motion"

export function AssignmentsWidget() {
    const { assignments } = useStore()
    const activeAssignments = assignments.filter(a => a.status !== "Completed")

    // Sort by due date urgency
    const sortedAssignments = [...activeAssignments].sort((a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )

    return (
        <Card className="flex flex-col h-full bg-surface-container-low shadow-none border-0 overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between flex-shrink-0 space-y-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    Assignments
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-surface-container-high hover:bg-surface-container-highest">
                        {activeAssignments.length}
                    </Badge>
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs px-2 text-muted-foreground hover:bg-surface-container-high rounded-full">
                    <Link href="/assignments">View All</Link>
                </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                {activeAssignments.length > 0 ? (
                    <ScrollArea className="h-full px-4 pb-4">
                        <div className="space-y-3 pt-1">
                            <AnimatePresence>
                                {sortedAssignments.map((a, i) => (
                                    <motion.div
                                        key={a.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="group flex items-start gap-3 p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors shadow-sm border-0"
                                    >
                                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${a.priority === "Urgent" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                                            a.priority === "High" ? "bg-orange-500" :
                                                a.priority === "Medium" ? "bg-yellow-500" : "bg-emerald-500"
                                            }`} />

                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <p className="text-sm font-medium truncate leading-tight group-hover:text-primary transition-colors">
                                                {a.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate font-mono opacity-80">
                                                {a.course} • Due {new Date(a.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>

                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0 bg-surface-container-highest/50 border-transparent text-muted-foreground">
                                            {a.status}
                                        </Badge>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-500">
                        <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
                            <IconTrophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-sm font-medium">All Caught Up!</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[150px]">
                            No pending assignments. Enjoy your free time.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
