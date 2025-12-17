"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    IconPlus,
    IconTrash,
    IconCalendar,
    IconSun,
    IconClock,
    IconArchive,
    IconCheck,
    IconFlame
} from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { useXP } from "@/components/xp-widget"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { format, isToday, isPast, parseISO, differenceInDays } from "date-fns"

export default function TodosPage() {
    const { todos, subjects, currentSemester, addTodo, toggleTodo, deleteTodo } = useStore()
    const { addXP } = useXP()
    const [quickTask, setQuickTask] = React.useState("")
    const [activeTab, setActiveTab] = React.useState<"today" | "upcoming" | "backlog">("today")

    const currentSubjects = subjects.filter(s => s.semesterId === currentSemester?.id)

    // Categorize todos
    const todayTodos = todos.filter(t => t.category === "today")
    const upcomingTodos = todos.filter(t => t.category === "upcoming")
    const backlogTodos = todos.filter(t => t.category === "backlog")

    // Stats
    const completedToday = todayTodos.filter(t => t.completed).length
    const totalToday = todayTodos.length
    const progressPercent = totalToday > 0 ? (completedToday / totalToday) * 100 : 0

    const handleQuickAdd = (e: React.FormEvent) => {
        e.preventDefault()
        if (!quickTask.trim()) return
        addTodo({ text: quickTask, completed: false, category: activeTab })
        setQuickTask("")
    }

    const handleToggle = (id: string, completed: boolean) => {
        toggleTodo(id, completed)
        if (!completed) {
            addXP(50)
        }
    }

    const getSubjectName = (id?: string) => {
        if (!id) return null
        return subjects.find(s => s.id === id)?.code || null
    }

    const isOverdue = (dueDate?: string) => {
        if (!dueDate) return false
        try {
            return isPast(parseISO(dueDate)) && !isToday(parseISO(dueDate))
        } catch { return false }
    }

    const tabs = [
        { id: "today" as const, label: "Today", icon: IconSun, count: todayTodos.length, color: "text-amber-500" },
        { id: "upcoming" as const, label: "Upcoming", icon: IconClock, count: upcomingTodos.length, color: "text-blue-500" },
        { id: "backlog" as const, label: "Backlog", icon: IconArchive, count: backlogTodos.length, color: "text-slate-500" },
    ]

    const currentTodos = activeTab === "today" ? todayTodos : activeTab === "upcoming" ? upcomingTodos : backlogTodos

    const TodoItem = ({ todo }: { todo: typeof todos[0] }) => {
        const overdue = isOverdue(todo.dueDate)

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                className={cn(
                    "group flex items-start gap-3 p-4 rounded-xl border bg-card transition-all hover:shadow-md",
                    todo.completed && "opacity-60 bg-muted/30",
                    overdue && !todo.completed && "border-red-500/50 bg-red-500/5"
                )}
            >
                <Checkbox
                    id={todo.id}
                    checked={todo.completed}
                    onCheckedChange={() => handleToggle(todo.id, todo.completed)}
                    className={cn("mt-1 w-5 h-5", overdue && !todo.completed && "border-red-500")}
                />
                <div className="flex-1 min-w-0">
                    <label
                        htmlFor={todo.id}
                        className={cn(
                            "block text-sm font-medium cursor-pointer",
                            todo.completed && "line-through text-muted-foreground"
                        )}
                    >
                        {todo.text}
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {todo.dueDate && (
                            <div className={cn(
                                "flex items-center gap-1 text-xs",
                                overdue && !todo.completed ? "text-red-500 font-medium" : "text-muted-foreground"
                            )}>
                                <IconCalendar className="w-3 h-3" />
                                {overdue && !todo.completed && <IconFlame className="w-3 h-3" />}
                                {format(parseISO(todo.dueDate), "MMM d")}
                            </div>
                        )}
                        {getSubjectName(todo.subjectId) && (
                            <Badge variant="secondary" className="text-[10px] h-5">
                                {getSubjectName(todo.subjectId)}
                            </Badge>
                        )}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteTodo(todo.id)}
                >
                    <IconTrash className="w-4 h-4" />
                </Button>
            </motion.div>
        )
    }

    return (
        <Shell>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header with Progress */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                            <p className="text-muted-foreground">Stay focused, get things done.</p>
                        </div>
                        {totalToday > 0 && (
                            <div className="text-right">
                                <div className="flex items-center gap-2">
                                    <IconCheck className="w-5 h-5 text-green-500" />
                                    <span className="text-2xl font-bold">{completedToday}/{totalToday}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">completed today</p>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {totalToday > 0 && (
                        <div className="space-y-2">
                            <Progress value={progressPercent} className="h-2" />
                            <p className="text-xs text-muted-foreground text-center">
                                {progressPercent === 100
                                    ? "🎉 All tasks completed! Great job!"
                                    : `${Math.round(progressPercent)}% of today's tasks done`
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-background shadow-sm"
                                    : "hover:bg-background/50"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", activeTab === tab.id && tab.color)} />
                            {tab.label}
                            <Badge variant="secondary" className="h-5 text-[10px]">{tab.count}</Badge>
                        </button>
                    ))}
                </div>

                {/* Quick Add */}
                <form onSubmit={handleQuickAdd} className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            value={quickTask}
                            onChange={e => setQuickTask(e.target.value)}
                            placeholder={`Add a task to ${activeTab}...`}
                            className="pr-10"
                        />
                    </div>
                    <Button type="submit" size="icon">
                        <IconPlus className="w-4 h-4" />
                    </Button>
                </form>

                {/* Task List */}
                <ScrollArea className="h-[calc(100vh-24rem)]">
                    <div className="space-y-2 pr-4">
                        <AnimatePresence mode="popLayout">
                            {currentTodos.length > 0 ? (
                                // Sort: incomplete first, then by overdue
                                [...currentTodos]
                                    .sort((a, b) => {
                                        if (a.completed !== b.completed) return a.completed ? 1 : -1
                                        if (isOverdue(a.dueDate) !== isOverdue(b.dueDate)) return isOverdue(a.dueDate) ? -1 : 1
                                        return 0
                                    })
                                    .map(todo => <TodoItem key={todo.id} todo={todo} />)
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-16 text-center text-muted-foreground"
                                >
                                    <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                                        {activeTab === "today" && <IconSun className="w-8 h-8 opacity-30" />}
                                        {activeTab === "upcoming" && <IconClock className="w-8 h-8 opacity-30" />}
                                        {activeTab === "backlog" && <IconArchive className="w-8 h-8 opacity-30" />}
                                    </div>
                                    <p className="font-medium">No {activeTab} tasks</p>
                                    <p className="text-sm mt-1">Add a task using the input above</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
            </div>
        </Shell>
    )
}
