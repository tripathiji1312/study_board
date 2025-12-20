"use client"

import * as React from "react"
import { toast } from "sonner"
import { isSameDay, subDays, differenceInCalendarDays, parseISO } from "date-fns"
import confetti from "canvas-confetti"
import { useStore } from "@/components/providers/store-provider"
import { requestNotificationPermission, checkDeadlines } from "@/lib/notifications"

type Badge = {
    id: string
    name: string
    description: string
    icon: string
    condition: (stats: GamificationStats) => boolean
}

type GamificationStats = {
    streak: number
    lastStudyDate: string | null
    totalFocusMinutes: number
    tasksCompleted: number
}

type GamificationContextType = {
    streak: number
    badges: string[]
    checkIn: () => void
    recordFocus: (minutes: number) => void
    recordTaskCompletion: () => void
    unlockedBadges: Badge[]
}

const BADGES: Badge[] = [
    {
        id: "first_step",
        name: "First Step",
        description: "Completed your first study session",
        icon: "🌱",
        condition: (stats) => stats.totalFocusMinutes > 0
    },
    {
        id: "streak_3",
        name: "Consistency Is Key",
        description: "Reached a 3-day streak",
        icon: "🔥",
        condition: (stats) => stats.streak >= 3
    },
    {
        id: "streak_7",
        name: "Unstoppable",
        description: "Reached a 7-day streak",
        icon: "🚀",
        condition: (stats) => stats.streak >= 7
    },
    {
        id: "focus_master",
        name: "Deep Worker",
        description: "Recorded 10 hours of focus time",
        icon: "🧠",
        condition: (stats) => stats.totalFocusMinutes >= 600
    },
    {
        id: "task_slayer",
        name: "Task Slayer",
        description: "Completed 50 tasks",
        icon: "⚔️",
        condition: (stats) => stats.tasksCompleted >= 50
    }
]

const GamificationContext = React.createContext<GamificationContextType | null>(null)

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const [stats, setStats] = React.useState<GamificationStats>({
        streak: 0,
        lastStudyDate: null,
        totalFocusMinutes: 0,
        tasksCompleted: 0
    })
    const [earnedBadges, setEarnedBadges] = React.useState<string[]>([])
    const { assignments, todos } = useStore()
    const [notifiedIds, setNotifiedIds] = React.useState<Set<string>>(new Set())

    // Request Notification Permission
    React.useEffect(() => {
        requestNotificationPermission()
    }, [])

    // Check Deadlines Periodically
    React.useEffect(() => {
        const check = () => {
            const mappedTodos = todos.map(t => ({ ...t, title: t.text }))
            const allItems = [...assignments, ...mappedTodos]
            const newNotified = checkDeadlines(allItems, notifiedIds)

            if (newNotified.length > 0) {
                setNotifiedIds(prev => {
                    const next = new Set(prev)
                    newNotified.forEach(id => next.add(id))
                    return next
                })
            }
        }

        // Check immediately and then every 15 minutes
        check()
        const interval = setInterval(check, 15 * 60 * 1000)
        return () => clearInterval(interval)
    }, [assignments, todos, notifiedIds])

    // Load from local storage
    React.useEffect(() => {
        // SSR safety check
        if (typeof window === "undefined") return

        try {
            const savedStats = localStorage.getItem("study_gamification_stats")
            const savedBadges = localStorage.getItem("study_gamification_badges")

            if (savedStats) setStats(JSON.parse(savedStats))
            if (savedBadges) setEarnedBadges(JSON.parse(savedBadges))
        } catch (error) {
            console.error("Failed to load gamification data:", error)
        }
    }, [])

    // Persist changes
    React.useEffect(() => {
        // SSR safety check
        if (typeof window === "undefined") return

        try {
            localStorage.setItem("study_gamification_stats", JSON.stringify(stats))
            localStorage.setItem("study_gamification_badges", JSON.stringify(earnedBadges))
        } catch (error) {
            console.error("Failed to persist gamification data:", error)
        }
    }, [stats, earnedBadges])

    // Badge Check Logic
    React.useEffect(() => {
        const newBadges: string[] = []
        BADGES.forEach(badge => {
            if (!earnedBadges.includes(badge.id) && badge.condition(stats)) {
                newBadges.push(badge.id)
                toast.success(`Badge Unlocked: ${badge.name}! ${badge.icon}`)
                // Wrap confetti in try-catch as it may fail on some mobile browsers
                try {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    })
                } catch (error) {
                    console.warn("Confetti animation failed:", error)
                }
            }
        })

        if (newBadges.length > 0) {
            setEarnedBadges(prev => [...prev, ...newBadges])
        }
    }, [stats, earnedBadges])

    const checkIn = React.useCallback(() => {
        const today = new Date().toISOString()
        setStats(prev => {
            if (!prev.lastStudyDate) {
                return { ...prev, streak: 1, lastStudyDate: today }
            }

            const lastDate = parseISO(prev.lastStudyDate)
            const currentDate = new Date()

            if (isSameDay(lastDate, currentDate)) {
                return prev // Already checked in today
            }

            const diff = differenceInCalendarDays(currentDate, lastDate)

            if (diff === 1) {
                // Streak continues
                toast.success("Streak Updated! Keep it up! 🔥")
                return { ...prev, streak: prev.streak + 1, lastStudyDate: today }
            } else {
                // Streak broken
                toast.error("Streak Reset! Don't give up!")
                return { ...prev, streak: 1, lastStudyDate: today }
            }
        })
    }, [])

    const recordFocus = React.useCallback((minutes: number) => {
        setStats(prev => ({ ...prev, totalFocusMinutes: prev.totalFocusMinutes + minutes }))
        checkIn() // Studying counts as a check-in
    }, [checkIn])

    const recordTaskCompletion = React.useCallback(() => {
        setStats(prev => ({ ...prev, tasksCompleted: prev.tasksCompleted + 1 }))
        checkIn() // Completing a task counts as a check-in
    }, [checkIn])

    const unlockedBadges = React.useMemo(() => {
        return BADGES.filter(b => earnedBadges.includes(b.id))
    }, [earnedBadges])

    return (
        <GamificationContext.Provider value={{
            streak: stats.streak,
            badges: earnedBadges,
            checkIn,
            recordFocus,
            recordTaskCompletion,
            unlockedBadges
        }}>
            {children}
        </GamificationContext.Provider>
    )
}

export function useGamification() {
    const context = React.useContext(GamificationContext)
    if (!context) {
        throw new Error("useGamification must be used within a GamificationProvider")
    }
    return context
}
