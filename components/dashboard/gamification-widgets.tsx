"use client"

import { useGamification } from "@/components/providers/gamification-provider"
import { IconFlame, IconMedal } from "@tabler/icons-react"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function StreakWidget() {
    const { streak } = useGamification()

    if (streak === 0) return null

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full border border-orange-500/20"
                    >
                        <IconFlame className="w-4 h-4 fill-current" />
                        <span className="text-sm font-bold">{streak}</span>
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{streak} Day Streak!</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export function BadgesWidget() {
    const { unlockedBadges } = useGamification()

    // Show top 3 recent badges
    const recentBadges = unlockedBadges.slice(-3)

    if (recentBadges.length === 0) return null

    return (
        <div className="flex -space-x-2">
            {recentBadges.map((badge) => (
                <TooltipProvider key={badge.id}>
                    <Tooltip>
                        <TooltipTrigger>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-8 h-8 rounded-full bg-background border flex items-center justify-center text-lg shadow-sm hover:z-10 hover:scale-110 transition-transform cursor-help"
                            >
                                {badge.icon}
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-semibold">{badge.name}</p>
                            <p className="text-xs text-muted-foreground">{badge.description}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ))}
        </div>
    )
}
