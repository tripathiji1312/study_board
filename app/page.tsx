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
import { SpotifyWidget } from "@/components/spotify-widget"
import { StudyGraph } from "@/components/dashboard/study-graph"
import { ExamWidget } from "@/components/dashboard/exam-widget"
import { MoodWidget } from "@/components/dashboard/mood-widget"
import { SmartScheduleWidget } from "@/components/dashboard/smart-schedule"
import { AssignmentsWidget } from "@/components/dashboard/assignments-widget"
import { ResourcesWidget } from "@/components/dashboard/resources-widget"
import { FocusAnalytics } from "@/components/dashboard/focus-analytics"
import { StreakWidget, BadgesWidget } from "@/components/dashboard/gamification-widgets"
import { WidgetSkeleton, StatCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton-loaders"
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

export default function DashboardPage() {
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
                {/* Header */}
                <motion.header variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-light tracking-tight text-foreground/90">
                            {getGreeting()}, <span className="font-semibold text-primary">{settings?.displayName || "Student"}</span>
                        </h1>
                        <p className="text-muted-foreground mt-1">Here is your daily briefing.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <StreakWidget />
                        <BadgesWidget />
                        <Button variant="default" size="lg" className="rounded-full px-6 transition-all" asChild>
                            <Link href="/focus">
                                <IconTargetArrow className="w-5 h-5 mr-2" />
                                Laser Mode
                            </Link>
                        </Button>
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

                {/* Key Metrics Row */}
                <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
                    ) : (
                        [
                            { label: "Pending", val: pendingAssignments, icon: IconClipboardList, color: "text-orange-500", bg: "bg-orange-500/10", href: "/assignments" },
                            { label: "Tasks", val: todayTodos, icon: IconChecklist, color: "text-blue-500", bg: "bg-blue-500/10", href: "/todos" },
                            { label: "Projects", val: activeProjects, icon: IconRocket, color: "text-purple-500", bg: "bg-purple-500/10", href: "/projects" },
                            { label: "Schedule", val: todayEvents, icon: IconCalendarEvent, color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/schedule" },
                        ].map((stat, i) => (
                            <Link key={i} href={stat.href}>
                                <Card className="hover:bg-muted/50 hover:border-primary/20 transition-all cursor-pointer group">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-bold tracking-tight text-foreground">{stat.val}</p>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
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
                <motion.div variants={item} className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {isLoading ? (
                        <>
                            {/* Column 1 Skeleton */}
                            <div className="flex flex-col gap-6 h-[500px]">
                                <WidgetSkeleton className="flex-1" />
                                <WidgetSkeleton className="h-[200px]" />
                            </div>
                            {/* Column 2 Skeleton */}
                            <div className="h-[500px]">
                                <WidgetSkeleton className="h-full" />
                            </div>
                            {/* Column 3 Skeleton */}
                            <div className="flex flex-col gap-6 h-[500px] md:col-span-2 xl:col-span-1">
                                <WidgetSkeleton className="flex-1" />
                                <WidgetSkeleton className="h-[200px]" />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Column 1: Exams & Mood */}
                            <div className="flex flex-col gap-6 h-[500px]">
                                <div className="flex-1 min-h-0"><ExamWidget /></div>
                                <div className="h-[200px] shrink-0"><MoodWidget /></div>
                            </div>

                            {/* Column 2: Schedule (Tall) */}
                            <div className="h-[500px]">
                                <SmartScheduleWidget />
                            </div>

                            {/* Column 3: Assignments & Spotify */}
                            <div className="flex flex-col gap-6 h-[500px] md:col-span-2 xl:col-span-1">
                                <div className="flex-1 min-h-0"><AssignmentsWidget /></div>
                                <div className="h-[200px] shrink-0"><SpotifyWidget /></div>
                            </div>
                        </>
                    )}
                </motion.div>

                {/* Study Graph */}
                <motion.div variants={item}>
                    {isLoading ? <ChartSkeleton /> : <StudyGraph />}
                </motion.div>

                {/* Resources */}
                <motion.div variants={item}>
                    <ResourcesWidget />
                </motion.div>

            </motion.div>
        </Shell>
    )
}