"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { calculateLevel, calculateNextLevelXP, calculateProgress } from "@/lib/gamification"
import { cn } from "@/lib/utils"
import { IconTrophy } from "@tabler/icons-react"
import { toast } from "sonner"

const RANKS = [
    { level: 1, name: "Novice", color: "text-gray-400" },
    { level: 3, name: "Apprentice", color: "text-green-400" },
    { level: 5, name: "Scholar", color: "text-blue-400" },
    { level: 8, name: "Expert", color: "text-purple-400" },
    { level: 12, name: "Master", color: "text-yellow-400" },
    { level: 20, name: "Grandmaster", color: "text-orange-400" },
    { level: 30, name: "Legend", color: "text-red-400" },
]

interface XPContextType {
    xp: number
    addXP: (amount: number) => void
    level: number
    rank: typeof RANKS[0]
}

const XPContext = React.createContext<XPContextType | null>(null)

export function XPProvider({ children }: { children: React.ReactNode }) {
    const [xp, setXP] = React.useState(0)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        try {
            const saved = localStorage.getItem("study_xp")
            if (saved) setXP(parseInt(saved, 10))
        } catch (error) {
            console.error("Failed to load XP:", error)
        }
    }, [])

    const addXP = React.useCallback((amount: number) => {
        setXP(prev => {
            const newXP = prev + amount
            try {
                localStorage.setItem("study_xp", String(newXP))
            } catch (error) {
                console.error("Failed to save XP:", error)
            }
            return newXP
        })
        toast.success(`+${amount} XP! ⚔️`, { duration: 1500 })
    }, [])

    const level = calculateLevel(xp)
    const rank = [...RANKS].reverse().find(r => level >= r.level) || RANKS[0]

    return (
        <XPContext.Provider value={{ xp, addXP, level, rank }}>
            {children}
        </XPContext.Provider>
    )
}

export function useXP() {
    const context = React.useContext(XPContext)
    // Fallback for when not in provider (SSR or initial render)
    if (!context) {
        return {
            xp: 0,
            addXP: () => { },
            level: 1,
            rank: RANKS[0],
            nextLevelXP: 100,
            progress: 0
        }
    }
    const nextLevelXP = calculateNextLevelXP(context.level)
    const progress = calculateProgress(context.xp, context.level, nextLevelXP)
    return { ...context, nextLevelXP, progress }
}

export function XPWidget() {
    const { xp, level, nextLevelXP, progress, rank } = useXP()

    return (
        <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1 rounded", rank.color.replace("text-", "bg-").replace("-400", "-500/20"))}>
                        <IconTrophy className={cn("w-4 h-4", rank.color)} />
                    </div>
                    <div>
                        <p className={cn("text-xs font-semibold", rank.color)}>{rank.name}</p>
                        <p className="text-[10px] text-muted-foreground">Level {level}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-mono">{xp} XP</p>
                </div>
            </div>
            <Progress value={progress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground text-center">
                {Math.round(nextLevelXP - xp)} XP to next level
            </p>
        </div>
    )
}
