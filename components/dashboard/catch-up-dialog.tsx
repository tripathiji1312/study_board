"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { IconCalendarPlus, IconArrowsShuffle, IconFilter, IconRobot, IconLoader2 } from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface CatchUpDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    overdueCount: number
    onComplete: () => void
}

const strategies = [
    {
        id: 'tomorrow' as const,
        name: 'Push to Tomorrow',
        description: 'Move all overdue tasks to tomorrow. Quick reset.',
        icon: IconCalendarPlus,
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        iconBg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
        id: 'spread' as const,
        name: 'Spread Over 3 Days',
        description: 'Distribute evenly across the next 3 days.',
        icon: IconArrowsShuffle,
        color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
        iconBg: 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
        id: 'ruthless' as const,
        name: 'Ruthless Priority',
        description: 'Keep urgent today, move rest to Inbox.',
        icon: IconFilter,
        color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        iconBg: 'bg-red-100 dark:bg-red-900/30'
    },
    {
        id: 'ai' as const,
        name: 'AI Smart Reschedule',
        description: 'Let AI analyze and optimize your schedule.',
        icon: IconRobot,
        color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        iconBg: 'bg-purple-100 dark:bg-purple-900/30'
    }
]

export function CatchUpDialog({ open, onOpenChange, overdueCount, onComplete }: CatchUpDialogProps) {
    const [loading, setLoading] = React.useState<string | null>(null)
    const { rescheduleOverdue } = useStore()
    const router = useRouter()

    const handleReschedule = async (strategy: 'tomorrow' | 'spread' | 'ruthless' | 'ai') => {
        setLoading(strategy)
        try {
            await rescheduleOverdue(strategy)
            onComplete()
            onOpenChange(false)
            router.refresh()
        } catch (error) {
            // Error handled in store
        } finally {
            setLoading(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 bg-gradient-to-br from-red-500/5 to-orange-500/5 border-b">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        🏃 Catch Up Mode
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        You have <span className="font-semibold text-red-500">{overdueCount} overdue</span> tasks.
                        Choose a recovery strategy below.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-4 space-y-2">
                    {strategies.map((strategy) => {
                        const Icon = strategy.icon
                        const isLoading = loading === strategy.id

                        return (
                            <button
                                key={strategy.id}
                                disabled={loading !== null}
                                onClick={() => handleReschedule(strategy.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all text-left",
                                    "hover:scale-[1.01] active:scale-[0.99]",
                                    strategy.color,
                                    loading !== null && loading !== strategy.id && "opacity-50"
                                )}
                            >
                                <div className={cn("p-2.5 rounded-lg", strategy.iconBg)}>
                                    {isLoading ? (
                                        <IconLoader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Icon className="w-5 h-5" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-sm">{strategy.name}</div>
                                    <div className="text-xs opacity-80 mt-0.5">{strategy.description}</div>
                                </div>
                            </button>
                        )
                    })}
                </div>

                <div className="px-6 py-3 bg-muted/30 border-t text-center">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
