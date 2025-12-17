"use client"

import * as React from "react"
import { IconCheck, IconTrash, IconSchool, IconClock, IconBulb, IconCode } from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useStore } from "@/components/providers/store-provider"
import { AnimatePresence, motion } from "framer-motion"
import { useXP } from "@/components/xp-widget"

// --- WIDGETS ---

function TodoWidget() {
    const { todos, addTodo, toggleTodo, deleteTodo } = useStore()
    const { addXP } = useXP()
    const [newTodo, setNewTodo] = React.useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTodo.trim()) return
        addTodo({ text: newTodo, completed: false, category: "today" })
        setNewTodo("")
    }

    const handleToggle = (id: string, currentStatus: boolean) => {
        toggleTodo(id, currentStatus)
        // Award XP only when completing (not uncompleting)
        if (!currentStatus) {
            addXP(50) // +50 XP for completing a task!
        }
    }

    const todayTodos = todos.filter(t => t.category === "today").slice(0, 5)

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <IconCheck className="w-5 h-5 text-primary" />
                    Quick Tasks
                </CardTitle>
                <CardDescription>Daily quick-capture to-do list</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        placeholder="Add a task..."
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        className="flex-1"
                    />
                </form>

                <ScrollArea className="flex-1 -mx-4 px-4">
                    <div className="flex flex-col gap-2">
                        <AnimatePresence>
                            {todayTodos.map((todo) => (
                                <motion.div
                                    key={todo.id}
                                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
                                    className="flex items-center gap-2 group p-2 hover:bg-muted/50 rounded-md transition-colors"
                                >
                                    <Checkbox
                                        id={`widget-${todo.id}`}
                                        checked={todo.completed}
                                        onCheckedChange={() => handleToggle(todo.id, todo.completed)}
                                    />
                                    <label
                                        htmlFor={`widget-${todo.id}`}
                                        className={`flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-all ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
                                    >
                                        {todo.text}
                                    </label>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => deleteTodo(todo.id)}
                                    >
                                        <IconTrash className="h-3 w-3" />
                                    </Button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {todayTodos.length === 0 && (
                            <div className="text-center text-muted-foreground text-sm py-8">
                                No tasks for today!
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

function AssignmentWidget() {
    const { assignments } = useStore()
    // Sort by multiple criteria in real app, simply taking first 5 here
    const upcomingAssignments = assignments.filter(a => a.status !== "Completed").slice(0, 5)

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <IconSchool className="w-5 h-5 text-primary" />
                    Assignments
                </CardTitle>
                <CardDescription>Upcoming academic deadlines</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-[300px] md:h-full -mr-4 pr-4">
                    <div className="flex flex-col gap-3">
                        {upcomingAssignments.map((assignment, i) => (
                            <div key={i} className="flex flex-col gap-1 p-3 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="font-semibold text-sm line-clamp-1">{assignment.title}</span>
                                    {(assignment.priority === "Urgent" || assignment.priority === "High") && (
                                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Urgent</Badge>
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground">{assignment.subject}</span>
                                <div className="flex items-center gap-1.5 mt-2 text-xs font-medium">
                                    <IconClock className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-muted-foreground">Due {assignment.due}</span>
                                </div>
                            </div>
                        ))}
                        {upcomingAssignments.length === 0 && (
                            <div className="text-center text-muted-foreground text-sm py-8">
                                No pending assignments.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

function ProjectWidget() {
    const { projects } = useStore()
    const displayProjects = projects.slice(0, 3)

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <IconBulb className="w-5 h-5 text-primary" />
                    Project Hub
                </CardTitle>
                <CardDescription>Ongoing ideas and builds</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 flex-1">
                <div className="flex flex-col gap-3">
                    {displayProjects.map((project, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                    <IconCode className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{project.title}</span>
                                    <span className="text-xs text-muted-foreground">{project.tech.slice(0, 2).join(", ")}</span>
                                </div>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                                {project.status}
                            </span>
                        </div>
                    ))}
                </div>
                <Button variant="outline" className="w-full mt-auto" asChild>
                    <Link href="/projects">View All Projects</Link>
                </Button>
            </CardContent>
        </Card>
    )
}


export { TodoWidget, AssignmentWidget, ProjectWidget }
