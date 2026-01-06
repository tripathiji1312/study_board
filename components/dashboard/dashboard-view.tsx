"use client"

import * as React from "react"
import Link from "next/link"
import { Shell } from "@/components/ui/shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    IconClipboardList,
    IconChecklist,
    IconRocket,
    IconCalendarEvent,
    IconPlus,
    IconTargetArrow,
    IconFlame
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useStore } from "@/components/providers/store-provider"
import dynamic from "next/dynamic"
import { StudyGraph } from "@/components/dashboard/study-graph"
import { ExamWidget } from "@/components/dashboard/exam-widget"
import { MoodWidget } from "@/components/dashboard/mood-widget"
import { SmartScheduleWidget } from "@/components/dashboard/smart-schedule"
import { AssignmentsWidget } from "@/components/dashboard/assignments-widget"
import { ResourcesWidget } from "@/components/dashboard/resources-widget"
import { StreakWidget, BadgesWidget } from "@/components/dashboard/gamification-widgets"

const FocusAnalytics = dynamic(() => import("@/components/dashboard/focus-analytics").then(m => m.FocusAnalytics), {
    loading: () => <ChartSkeleton />,
    ssr: false
})

const SpotifyWidget = dynamic(() => import("@/components/spotify-widget").then(m => m.SpotifyWidget), {
    loading: () => <WidgetSkeleton className="h-[200px]" />,
    ssr: false
})

const MemoryLeaksWidget = dynamic(() => import("@/components/dashboard/memory-leaks-widget").then(m => m.MemoryLeaksWidget), {
    loading: () => <WidgetSkeleton className="h-full" />,
    ssr: false
})
import { WidgetSkeleton, StatCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton-loaders"
import { Skeleton } from "@/components/ui/skeleton"
import { isToday, parseISO, differenceInDays, format } from "date-fns"
import { motion } from "framer-motion"

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export function DashboardView() {
    const {
        settings,
        todos,
        assignments,
        projects,
        schedule,
        addTodo,
        isLoading
    } = useStore()

    const [quickTask, setQuickTask] = React.useState("")
    const quickAddRef = React.useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Keyboard Shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

            if (e.key.toLowerCase() === 'n') {
                e.preventDefault()
                quickAddRef.current?.focus()
            }
            if (e.key.toLowerCase() === 'f') {
                e.preventDefault()
                router.push("/focus")
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [router])

    // Greeting Logic
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Good morning"
        if (hour < 18) return "Good afternoon"
        return "Good evening"
    }

    // --- Stats Calculations ---
    const pendingAssignments = assignments.filter(a => a.status === "Pending").length
    const todayTodos = todos.filter(t => {
        if (t.completed) return false
        if (!t.dueDate) return false
        return isToday(parseISO(t.dueDate))
    }).length
    const activeProjects = projects.filter(p => p.status === "In Progress").length
    const todayEvents = schedule.filter(e => {
        try {
            return isToday(parseISO(e.day))
        } catch {
            return e.day === format(new Date(), "EEEE") // Fallback for recurring days
        }
    }).length

    // Anti-Procrastination Check
    // Convert status to string safely to avoid conflict if types mismatch
    const overdueCount = [...assignments, ...todos].filter(i => {
        const item = i as any
        const isNotDone = item.status !== "Completed" && !item.completed
        const isDue = item.dueDate && differenceInDays(parseISO(item.dueDate), new Date()) < 0
        return isNotDone && isDue
    }).length

    const isCrisis = overdueCount >= 3

    const handleQuickAdd = (e: React.FormEvent) => {
        e.preventDefault()
        if (!quickTask.trim()) return
        addTodo({
            text: quickTask.trim(),
            completed: false,
            dueDate: format(new Date(), 'yyyy-MM-dd'),
            priority: 4
        })
        setQuickTask("")
    }

    return (
        <Shell>
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-6 max-w-[1600px] mx-auto"
            >
                {/* Header - Beautiful Greeting Card */}
                <motion.header variants={item}>
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-4 md:p-6">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3 md:gap-4">
                                {/* Greeting emoji */}
                                <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-2xl shrink-0">
                                    {new Date().getHours() < 12 ? "🌅" : new Date().getHours() < 18 ? "☀️" : "🌙"}
                                </div>

                                <div className="flex-1">
                                    {isLoading ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-7 md:h-9 w-48 md:w-64" />
                                            <Skeleton className="h-4 w-32 md:w-48" />
                                        </div>
                                    ) : (
                                        <>
                                            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                                                {getGreeting()}, <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{settings?.displayName || "Student"}</span>
                                            </h1>
                                            <p className="text-sm md:text-base text-muted-foreground mt-0.5 md:mt-1">
                                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                                <span className="hidden md:inline"> · Here's your daily briefing</span>
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Right side - widgets and CTA */}
                            <div className="flex items-center gap-2 md:gap-3">
                                <StreakWidget />
                                <BadgesWidget />
                                <Button variant="default" size="default" className="hidden md:flex rounded-full px-5 gap-2 shadow-lg shadow-primary/20" asChild>
                                    <Link href="/focus">
                                        <IconTargetArrow className="w-4 h-4" />
                                        <span>Laser Mode</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.header>

                {/* Alert Banner */}
                {overdueCount > 0 && (
                    <motion.div variants={item} className={`rounded-xl p-4 border flex items-center justify-between shadow-sm ${isCrisis
                        ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                        : 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isCrisis ? 'bg-red-500/20 animate-pulse' : 'bg-orange-500/20'}`}>
                                <IconFlame className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">
                                    {isCrisis ? 'Crisis Mode Active' : 'Action Required'}
                                </p>
                                <p className="text-xs opacity-90">
                                    You have {overdueCount} overdue items. {isCrisis && "Time to lock in."}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="hover:bg-background/50 h-8 text-xs" asChild>
                            <Link href="/todos">Review</Link>
                        </Button>
                    </motion.div>
                )}

                {/* Focus Analytics */}
                <motion.div variants={item}>
                    <FocusAnalytics />
                </motion.div>

                {/* Key Metrics Row - Horizontal scroll on mobile */}
                <motion.div variants={item} className="-mx-4 px-4 md:mx-0 md:px-0">
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide md:grid md:grid-cols-4 md:gap-4 pb-2 md:pb-0">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
                        ) : (
                            [
                                { label: "Pending", val: pendingAssignments, icon: IconClipboardList, color: "text-orange-500", bg: "bg-orange-500/10", href: "/assignments" },
                                { label: "Tasks", val: todayTodos, icon: IconChecklist, color: "text-blue-500", bg: "bg-blue-500/10", href: "/todos" },
                                { label: "Projects", val: activeProjects, icon: IconRocket, color: "text-purple-500", bg: "bg-purple-500/10", href: "/projects" },
                                { label: "Schedule", val: todayEvents, icon: IconCalendarEvent, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/schedule" },
                            ].map((stat, i) => (
                                <Link key={i} href={stat.href} className="flex-shrink-0 w-[140px] md:w-auto">
                                    <Card className="hover:bg-muted/50 hover:border-primary/20 transition-all cursor-pointer group touch-manipulation active:scale-[0.98]">
                                        <CardContent className="p-3 md:p-4 flex items-center gap-3 md:gap-4">
                                            <div className={`p-2 md:p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                                <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                                            </div>
                                            <div>
                                                <p className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{stat.val}</p>
                                                <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Quick Add Input */}
                <motion.div variants={item}>
                    <form onSubmit={handleQuickAdd} className="relative group">
                        <Input
                            ref={quickAddRef}
                            value={quickTask}
                            onChange={e => setQuickTask(e.target.value)}
                            placeholder="What needs to be done? (Press 'N')"
                            className="h-12 pl-4 pr-12 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50 shadow-sm rounded-xl transition-all"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg shadow-none opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={!quickTask.trim()}
                        >
                            <IconPlus className="w-4 h-4" />
                        </Button>
                    </form>
                </motion.div>

                {/* Main Grid Layout */}
                <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {isLoading ? (
                        <>
                            {/* Column 1 Skeleton */}
                            <div className="flex flex-col gap-6 h-auto md:h-[500px]">
                                <WidgetSkeleton className="flex-1" />
                                <WidgetSkeleton className="h-[200px]" />
                            </div>
                            {/* Column 2 Skeleton */}
                            <div className="h-[500px] md:h-[500px]">
                                <WidgetSkeleton className="h-full" />
                            </div>
                            {/* Column 3 Skeleton */}
                            <div className="flex flex-col gap-6 h-auto md:h-[500px] md:col-span-2 xl:col-span-1">
                                <WidgetSkeleton className="flex-1" />
                                <WidgetSkeleton className="h-[200px]" />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Column 1: Exams & Mood */}
                            <div className="flex flex-col gap-6 h-auto md:h-[500px]">
                                <div className="flex-1 min-h-[300px] md:min-h-0"><ExamWidget /></div>
                                <div className="h-[200px] shrink-0"><MoodWidget /></div>
                            </div>

                            {/* Column 2: Schedule (Tall) */}
                            <div className="h-[500px] md:h-[500px]">
                                <SmartScheduleWidget />
                            </div>

                            {/* Column 3: Assignments & Spotify */}
                            <div className="flex flex-col gap-6 h-auto md:h-[500px] md:col-span-2 xl:col-span-1">
                                <div className="flex-1 min-h-[300px] md:min-h-0"><AssignmentsWidget /></div>
                                <div className="h-[200px] shrink-0"><SpotifyWidget /></div>
                            </div>
                        </>
                    )}
                </motion.div>

                {/* Study Graph */}
                <motion.div variants={item}>
                    {isLoading ? <ChartSkeleton /> : <StudyGraph />}
                </motion.div>

                {/* Resources & Memory Leaks Row */}
                <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    <div className="md:col-span-2 h-full">
                        <ResourcesWidget />
                    </div>
                    <div className="md:col-span-1 h-full [&>*]:h-full">
                        <MemoryLeaksWidget />
                    </div>
                </motion.div>

            </motion.div>
        </Shell>
    )
}