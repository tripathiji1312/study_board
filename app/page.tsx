"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    IconTarget,
    IconClockHour4,
    IconTrophy,
    IconCalendarEvent,
    IconPlus,
    IconPlayerPlay,
    IconPlayerPause,
    IconRefresh,
    IconChecklist,
    IconSchool,
    IconBulb,
    IconSparkles,
    IconFlame,
    IconBolt
} from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { format } from "date-fns"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"

export default function Page() {
    const { assignments, projects, todos, schedule, toggleTodo, subjects } = useStore()

    // Time-based greeting
    const currentHour = new Date().getHours()
    const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening"
    const today = format(new Date(), "yyyy-MM-dd")

    // Stats
    const pendingAssignments = assignments.filter(a => a.status !== "Completed").length
    const completedProjects = projects.filter(p => p.status === "Completed").length
    const todaysTodos = todos.filter(t => t.category === "today")
    const completedTodaysTodos = todaysTodos.filter(t => t.completed).length
    const todaysEvents = schedule.filter(s => s.day === today).sort((a, b) => a.time.localeCompare(b.time))

    // Upcoming Deadlines (next 7 days)
    const upcomingDeadlines = assignments
        .filter(a => a.status !== "Completed")
        .sort((a, b) => a.due.localeCompare(b.due))
        .slice(0, 5)

    // Pomodoro Timer State
    const [pomodoroTime, setPomodoroTime] = React.useState(25 * 60) // 25 minutes
    const [isRunning, setIsRunning] = React.useState(false)
    const [pomodoroMode, setPomodoroMode] = React.useState<"focus" | "break">("focus")

    React.useEffect(() => {
        let interval: NodeJS.Timeout
        if (isRunning && pomodoroTime > 0) {
            interval = setInterval(() => {
                setPomodoroTime(prev => prev - 1)
            }, 1000)
        } else if (pomodoroTime === 0) {
            // Switch modes
            if (pomodoroMode === "focus") {
                setPomodoroMode("break")
                setPomodoroTime(5 * 60) // 5 min break
            } else {
                setPomodoroMode("focus")
                setPomodoroTime(25 * 60)
            }
            setIsRunning(false)
        }
        return () => clearInterval(interval)
    }, [isRunning, pomodoroTime, pomodoroMode])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const resetPomodoro = () => {
        setIsRunning(false)
        setPomodoroMode("focus")
        setPomodoroTime(25 * 60)
    }

    // Calculate academic progress (mock CGPA calculation)
    const calculateGPA = () => {
        if (subjects.length === 0) return 0
        let totalMarks = 0
        let count = 0
        subjects.forEach(sub => {
            if (sub.marks.CAT1) { totalMarks += sub.marks.CAT1; count++ }
            if (sub.marks.CAT2) { totalMarks += sub.marks.CAT2; count++ }
        })
        return count > 0 ? (totalMarks / count).toFixed(1) : "N/A"
    }

    return (
        <Shell>
            <div className="flex flex-col gap-6">
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{greeting}, Student!</h1>
                        <p className="text-muted-foreground">Here's what's happening in your academic life today.</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Badge variant="outline" className="gap-1 py-1.5 px-3">
                            <IconCalendarEvent className="w-3.5 h-3.5" />
                            {format(new Date(), "EEEE, MMM d")}
                        </Badge>
                        <Badge variant="secondary" className="gap-1 py-1.5 px-3">
                            <IconFlame className="w-3.5 h-3.5 text-orange-500" />
                            7 Day Streak
                        </Badge>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" asChild>
                        <Link href="/assignments">
                            <IconPlus className="w-4 h-4 mr-1" /> New Assignment
                        </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                        <Link href="/todos">
                            <IconChecklist className="w-4 h-4 mr-1" /> Add Todo
                        </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                        <Link href="/projects">
                            <IconBulb className="w-4 h-4 mr-1" /> New Project
                        </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                        <Link href="/schedule">
                            <IconCalendarEvent className="w-4 h-4 mr-1" /> Schedule Event
                        </Link>
                    </Button>
                </div>

                {/* Stats Row */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-200/20 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
                            <IconTarget className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingAssignments}</div>
                            <p className="text-xs text-muted-foreground">needs attention</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-200/20 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
                            <IconChecklist className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{completedTodaysTodos}/{todaysTodos.length}</div>
                            <Progress value={todaysTodos.length > 0 ? (completedTodaysTodos / todaysTodos.length) * 100 : 0} className="h-1.5 mt-2" />
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-200/20 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
                            <IconTrophy className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{completedProjects}</div>
                            <p className="text-xs text-muted-foreground">keep building!</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-200/20 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
                            <IconSchool className="h-4 w-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{calculateGPA()}</div>
                            <p className="text-xs text-muted-foreground">current average</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Widget Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Today's Schedule */}
                    <Card className="lg:col-span-1">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <IconCalendarEvent className="w-5 h-5 text-primary" />
                                Today's Schedule
                            </CardTitle>
                            <CardDescription>{todaysEvents.length} events today</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[250px] pr-4">
                                {todaysEvents.length > 0 ? (
                                    <div className="space-y-4">
                                        {todaysEvents.map(event => (
                                            <div key={event.id} className="flex gap-3 items-start">
                                                <div className="text-xs font-mono text-muted-foreground w-12 shrink-0 pt-0.5">
                                                    {event.time}
                                                </div>
                                                <div className="flex-1 border-l-2 border-primary/30 pl-3">
                                                    <p className="font-medium text-sm">{event.title}</p>
                                                    <p className="text-xs text-muted-foreground">{event.duration} · {event.type}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                        <IconSparkles className="w-8 h-8 mb-2 opacity-50" />
                                        <p className="text-sm">No events today!</p>
                                        <Button variant="link" size="sm" asChild>
                                            <Link href="/schedule">Add an event</Link>
                                        </Button>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Today's Todos */}
                    <Card className="lg:col-span-1">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <IconChecklist className="w-5 h-5 text-primary" />
                                Today's Todos
                            </CardTitle>
                            <CardDescription>{completedTodaysTodos} of {todaysTodos.length} complete</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[250px] pr-4">
                                {todaysTodos.length > 0 ? (
                                    <div className="space-y-3">
                                        <AnimatePresence>
                                            {todaysTodos.map(todo => (
                                                <motion.div
                                                    key={todo.id}
                                                    layout
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="flex items-center gap-3 group"
                                                >
                                                    <Checkbox
                                                        id={`dash-${todo.id}`}
                                                        checked={todo.completed}
                                                        onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
                                                    />
                                                    <label
                                                        htmlFor={`dash-${todo.id}`}
                                                        className={`text-sm flex-1 cursor-pointer ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
                                                    >
                                                        {todo.text}
                                                    </label>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                        <IconSparkles className="w-8 h-8 mb-2 opacity-50" />
                                        <p className="text-sm">No todos for today</p>
                                        <Button variant="link" size="sm" asChild>
                                            <Link href="/todos">Add a todo</Link>
                                        </Button>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Pomodoro Timer */}
                    <Card className="lg:col-span-1 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <IconBolt className="w-5 h-5 text-violet-500" />
                                Focus Timer
                            </CardTitle>
                            <CardDescription>{pomodoroMode === "focus" ? "Stay focused!" : "Take a break"}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center gap-4 py-4">
                            <div className={`text-6xl font-mono font-bold tracking-tight ${pomodoroMode === 'focus' ? 'text-violet-600 dark:text-violet-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {formatTime(pomodoroTime)}
                            </div>
                            <Badge variant={pomodoroMode === "focus" ? "default" : "secondary"} className="text-xs">
                                {pomodoroMode === "focus" ? "Focus Session" : "Break Time"}
                            </Badge>
                            <div className="flex gap-2 mt-2">
                                <Button
                                    size="lg"
                                    variant={isRunning ? "secondary" : "default"}
                                    onClick={() => setIsRunning(!isRunning)}
                                    className="gap-2"
                                >
                                    {isRunning ? <IconPlayerPause className="w-5 h-5" /> : <IconPlayerPlay className="w-5 h-5" />}
                                    {isRunning ? "Pause" : "Start"}
                                </Button>
                                <Button size="lg" variant="outline" onClick={resetPomodoro}>
                                    <IconRefresh className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Upcoming Deadlines & Projects Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Upcoming Deadlines */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <IconTarget className="w-5 h-5 text-primary" />
                                Upcoming Deadlines
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[200px] pr-4">
                                {upcomingDeadlines.length > 0 ? (
                                    <div className="space-y-3">
                                        {upcomingDeadlines.map(assignment => (
                                            <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                                <div>
                                                    <p className="font-medium text-sm">{assignment.title}</p>
                                                    <p className="text-xs text-muted-foreground">{assignment.subject}</p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline" className={
                                                        assignment.priority === "Urgent" ? "border-red-500 text-red-500" :
                                                            assignment.priority === "High" ? "border-orange-500 text-orange-500" :
                                                                "border-muted-foreground"
                                                    }>
                                                        {assignment.due}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8">
                                        <IconTrophy className="w-8 h-8 mb-2 opacity-50" />
                                        <p className="text-sm">All caught up!</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Active Projects */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <IconBulb className="w-5 h-5 text-primary" />
                                Active Projects
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[200px] pr-4">
                                {projects.filter(p => p.status !== "Completed").slice(0, 4).length > 0 ? (
                                    <div className="space-y-3">
                                        {projects.filter(p => p.status !== "Completed").slice(0, 4).map(project => (
                                            <div key={project.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="font-medium text-sm">{project.title}</p>
                                                    <span className="text-xs text-muted-foreground">{project.progress}%</span>
                                                </div>
                                                <Progress value={project.progress} className="h-1.5" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8">
                                        <IconBulb className="w-8 h-8 mb-2 opacity-50" />
                                        <p className="text-sm">No active projects</p>
                                        <Button variant="link" size="sm" asChild>
                                            <Link href="/projects">Start a project</Link>
                                        </Button>
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Shell>
    )
}