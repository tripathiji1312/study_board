"use client"

import * as React from "react"
import Link from "next/link"
import { Shell } from "@/components/ui/shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    IconClipboardList,
    IconChecklist,
    IconRocket,
    IconCalendarEvent,
    IconPlus,
    IconFlame,
    IconBrandSpotify,
    IconArrowRight,
    IconBook,
    IconLink,
    IconVideo,
    IconFileText
} from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { SpotifyWidget } from "@/components/spotify-widget"
import { StudyGraph } from "@/components/dashboard/study-graph"
import { ExamWidget } from "@/components/dashboard/exam-widget"
import { MoodWidget } from "@/components/dashboard/mood-widget"
import { AmbienceWidget } from "@/components/dashboard/ambience-widget"
import { format, isToday, parseISO, differenceInDays } from "date-fns"

const RESOURCE_ICONS: Record<string, typeof IconLink> = {
    "Article": IconFileText,
    "Video": IconVideo,
    "Link": IconLink,
    "Book": IconBook,
}

import { FocusAnalytics } from "@/components/dashboard/focus-analytics"
import { IconTargetArrow } from "@tabler/icons-react"

export default function DashboardPage() {
    const {
        settings,
        todos,
        assignments,
        projects,
        schedule,
        resources,
        currentSemester,
        addTodo
    } = useStore()

    const [quickTask, setQuickTask] = React.useState("")

    // Check for email notifications on load
    React.useEffect(() => {
        const checkNotifications = async () => {
            if (settings?.emailNotifications && settings?.notificationEmail) {
                try {
                    await fetch('/api/notifications/check', {
                        method: 'POST',
                        body: JSON.stringify({ email: settings.notificationEmail })
                    })
                } catch (e) {
                    console.error("Failed to check notifications", e)
                }
            }
        }

        // Simple check: run once on mount if settings are loaded
        if (settings) {
            checkNotifications()
        }
    }, [settings?.emailNotifications, settings?.notificationEmail])

    // Stats
    const pendingAssignments = assignments.filter(a => a.status === "Pending").length
    const todayTodos = todos.filter(t => t.category === "today" && !t.completed)
    const completedToday = todos.filter(t => t.category === "today" && t.completed).length
    const activeProjects = projects.filter(p => p.status === "In Progress").length
    const todayEvents = schedule.filter(e => {
        try {
            return isToday(parseISO(e.day))
        } catch {
            return e.day === format(new Date(), "EEEE")
        }
    }).sort((a, b) => a.time.localeCompare(b.time))

    // Upcoming deadlines
    const upcomingDeadlines = assignments
        .filter(a => a.status !== "Completed")
        .map(a => ({ ...a, daysLeft: differenceInDays(parseISO(a.due), new Date()) }))
        .filter(a => a.daysLeft >= 0 && a.daysLeft <= 7)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 3)

    // Recent resources
    const recentResources = resources.slice(0, 4)

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Good morning"
        if (hour < 18) return "Good afternoon"
        return "Good evening"
    }

    const handleQuickAdd = (e: React.FormEvent) => {
        e.preventDefault()
        if (!quickTask.trim()) return
        addTodo({ text: quickTask, completed: false, category: "today" })
        setQuickTask("")
    }

    return (
        <Shell>
            <div className="space-y-6">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-light tracking-tight text-foreground/90">
                            {getGreeting()}, <span className="font-semibold text-primary">{settings?.displayName || "Scholar"}</span>
                        </h1>
                        <p className="text-muted-foreground">Here's your daily overview.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="default" size="lg" className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" asChild>
                            <Link href="/focus">
                                <IconTargetArrow className="w-5 h-5 mr-2" />
                                Enter Laser Mode
                            </Link>
                        </Button>
                    </div>
                </header>

                {/* Focus Analytics Row */}
                <FocusAnalytics />

                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Link href="/assignments">
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                    <IconClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{pendingAssignments}</p>
                                    <p className="text-xs text-muted-foreground">Pending</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/todos">
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                    <IconChecklist className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{todayTodos.length}</p>
                                    <p className="text-xs text-muted-foreground">Tasks</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/projects">
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                    <IconRocket className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{activeProjects}</p>
                                    <p className="text-xs text-muted-foreground">Projects</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/schedule">
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                    <IconCalendarEvent className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{todayEvents.length}</p>
                                    <p className="text-xs text-muted-foreground">Today</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Study Graph */}
                <StudyGraph />

                {/* Quick Add */}
                <form onSubmit={handleQuickAdd} className="flex gap-2">
                    <Input
                        value={quickTask}
                        onChange={e => setQuickTask(e.target.value)}
                        placeholder="Quick add a task..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon">
                        <IconPlus className="w-4 h-4" />
                    </Button>
                </form>

                {/* Deadlines Alert */}
                {upcomingDeadlines.length > 0 && (
                    <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700 dark:text-orange-300">
                                <IconFlame className="w-4 h-4" />
                                Due Soon
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {upcomingDeadlines.map(a => (
                                <div key={a.id} className="flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{a.title}</p>
                                        <p className="text-xs text-muted-foreground">{a.subject}</p>
                                    </div>
                                    <Badge variant={a.daysLeft <= 1 ? "destructive" : "secondary"} className="shrink-0">
                                        {a.daysLeft === 0 ? "Today" : a.daysLeft === 1 ? "Tomorrow" : `${a.daysLeft}d`}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Main Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                    {/* Exam Countdown */}
                    <ExamWidget />

                    {/* Schedule */}
                    <Card>
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium">Today's Schedule</CardTitle>
                            <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                                <Link href="/schedule">View All</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {todayEvents.length > 0 ? (
                                <div className="space-y-3">
                                    {todayEvents.slice(0, 4).map(event => (
                                        <div key={event.id} className="flex items-center gap-3">
                                            <span className="text-xs font-mono text-muted-foreground w-12">{event.time}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{event.title}</p>
                                                <p className="text-xs text-muted-foreground">{event.type}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground py-4 text-center">No events today</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tasks */}
                    <Card>
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium">
                                Tasks
                                {completedToday > 0 && <span className="text-muted-foreground ml-1">({completedToday} done)</span>}
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                                <Link href="/todos">View All</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {todayTodos.length > 0 ? (
                                <div className="space-y-3">
                                    {todayTodos.slice(0, 4).map(todo => (
                                        <div key={todo.id} className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                            <p className="text-sm truncate">{todo.text}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground py-4 text-center">All done!</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Mood Tracker */}
                    <MoodWidget />

                    {/* Ambience */}
                    <AmbienceWidget />

                    {/* Spotify */}
                    <SpotifyWidget />
                </div>
                {/* Resources Section */}
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <IconBook className="w-4 h-4" />
                            Recent Resources
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                            <Link href="/resources">
                                View All <IconArrowRight className="w-3 h-3 ml-1" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentResources.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {recentResources.map(r => {
                                    const Icon = RESOURCE_ICONS[r.type] || IconLink
                                    return (
                                        <a
                                            key={r.id}
                                            href={r.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <Icon className="w-4 h-4 text-muted-foreground" />
                                                <Badge variant="outline" className="text-xs">{r.type}</Badge>
                                            </div>
                                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{r.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">{r.category}</p>
                                        </a>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-sm text-muted-foreground mb-2">No resources yet</p>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/resources">
                                        <IconPlus className="w-4 h-4 mr-1" /> Add Resource
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Shell>
    )
}