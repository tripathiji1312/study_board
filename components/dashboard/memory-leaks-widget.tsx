"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { IconBrain, IconRefresh, IconAlertTriangle } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"

interface RetentionItem {
    id: string
    title: string
    subject: { name: string, code: string }
    retention: number
    daysSince: number
    strength: number
}

export function MemoryLeaksWidget() {
    const [items, setItems] = useState<RetentionItem[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRetention = async () => {
        try {
            const res = await fetch("/api/analytics/retention")
            const data = await res.json()
            if (Array.isArray(data)) {
                // Only show items with reasonable decay (e.g. < 90%)
                setItems(data.filter(i => i.retention < 90).slice(0, 3))
            }
        } catch (error) {
            console.error("Failed to load retention data", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRetention()
    }, [])

    if (loading) return <Skeleton className="h-[200px] w-full rounded-xl" />

    // If no leaks, show a happy state or return null
    if (items.length === 0) {
        return (
            <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full min-h-[180px]">
                    <IconBrain className="w-10 h-10 text-emerald-500 mb-2" />
                    <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">Memory Optimized!</h3>
                    <p className="text-sm text-muted-foreground">Your retention is high across all topics. Great job!</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-red-500/10 shadow-sm relative overflow-hidden group">
            {/* Background Gradient for urgency */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-background to-background pointer-events-none" />

            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                        <IconBrain className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold">Memory Leaks</CardTitle>
                        <p className="text-xs text-muted-foreground">Topics fading from memory</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchRetention} className="h-8 w-8">
                    <IconRefresh className="w-4 h-4 text-muted-foreground" />
                </Button>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
                {items.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="space-y-1.5"
                    >
                        <div className="flex justify-between items-end text-sm">
                            <div className="flex flex-col">
                                <span className="font-medium truncate max-w-[180px]">{item.title}</span>
                                <span className="text-[10px] text-muted-foreground">{item.subject.code} • {item.daysSince}d ago</span>
                            </div>
                            <span className={cn(
                                "font-bold text-xs",
                                item.retention < 50 ? "text-red-500" : "text-amber-500"
                            )}>
                                {item.retention}%
                            </span>
                        </div>
                        <div className="relative">
                            <Progress
                                value={item.retention}
                                className={cn("h-1.5", item.retention < 50 ? "bg-red-100 dark:bg-red-900/20" : "bg-amber-100 dark:bg-amber-900/20")}
                                indicatorClassName={item.retention < 50 ? "bg-red-500" : "bg-amber-500"}
                            />
                        </div>

                        {/* Quick Action Overlay (Visible on Hover) */}
                        <div className="hidden">
                            {/* Future: Add 'Review Now' button */}
                        </div>
                    </motion.div>
                ))}

                <Button variant="outline" size="sm" className="w-full text-xs h-8 mt-2" asChild>
                    <Link href="/academics">
                        Review Studies
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}
