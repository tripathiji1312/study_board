"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { AnimatePresence, motion } from "framer-motion"

export default function TodosPage() {
    const { todos, subjects, currentSemester, addTodo, toggleTodo, deleteTodo } = useStore()
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)

    // Form State
    const [text, setText] = React.useState("")
    const [category, setCategory] = React.useState<"today" | "upcoming" | "backlog">("today")
    const [dueDate, setDueDate] = React.useState("")
    const [subjectId, setSubjectId] = React.useState("")

    const currentSubjects = subjects.filter(s => s.semesterId === currentSemester?.id)

    const todayTodos = todos.filter(t => t.category === "today")
    const upcomingTodos = todos.filter(t => t.category === "upcoming")
    const backlogTodos = todos.filter(t => t.category === "backlog")

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault()
        if (!text.trim()) return

        addTodo({
            text,
            completed: false,
            category,
            dueDate: dueDate || undefined,
            subjectId: subjectId && subjectId !== "none" ? subjectId : undefined
        })

        setText("")
        setDueDate("")
        setSubjectId("")
        setIsDialogOpen(false)
    }

    const getSubjectName = (id?: string) => {
        if (!id) return null
        const sub = subjects.find(s => s.id === id)
        return sub?.code || null
    }

    const TodoItem = ({ todo }: { todo: typeof todos[0] }) => (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center gap-3 group p-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
            <Checkbox
                id={todo.id}
                checked={todo.completed}
                onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
                className="w-5 h-5"
            />
            <div className="flex-1 min-w-0">
                <label
                    htmlFor={todo.id}
                    className={`block text-sm font-medium cursor-pointer ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
                >
                    {todo.text}
                </label>
                <div className="flex gap-2 mt-1">
                    {todo.dueDate && (
                        <span className="text-xs text-muted-foreground">📅 {todo.dueDate}</span>
                    )}
                    {getSubjectName(todo.subjectId) && (
                        <Badge variant="outline" className="text-xs">{getSubjectName(todo.subjectId)}</Badge>
                    )}
                </div>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => deleteTodo(todo.id)}
            >
                <IconTrash className="w-4 h-4" />
            </Button>
        </motion.div>
    )

    const TodoList = ({ items }: { items: typeof todos }) => (
        <div className="space-y-1">
            <AnimatePresence>
                {items.length > 0 ? (
                    items.map(todo => <TodoItem key={todo.id} todo={todo} />)
                ) : (
                    <p className="py-8 text-center text-muted-foreground text-sm">No tasks here yet.</p>
                )}
            </AnimatePresence>
        </div>
    )

    return (
        <Shell>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">To-Do List</h1>
                        <p className="text-muted-foreground">Manage your daily tasks and goals.</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <IconPlus className="w-4 h-4 mr-2" /> Add Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Task</DialogTitle>
                                <DialogDescription>Create a task with optional subject and due date.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Task</Label>
                                    <Input value={text} onChange={e => setText(e.target.value)} placeholder="What needs to be done?" required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="today">Today</SelectItem>
                                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                                <SelectItem value="backlog">Backlog</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Due Date (Optional)</Label>
                                        <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Subject (Optional)</Label>
                                    <Select value={subjectId} onValueChange={setSubjectId}>
                                        <SelectTrigger><SelectValue placeholder="Link to subject" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {currentSubjects.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <DialogFooter>
                                    <Button type="submit">Add Task</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Tabs defaultValue="today" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="today">Today ({todayTodos.length})</TabsTrigger>
                        <TabsTrigger value="upcoming">Upcoming ({upcomingTodos.length})</TabsTrigger>
                        <TabsTrigger value="backlog">Backlog ({backlogTodos.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="today">
                        <Card>
                            <CardHeader>
                                <CardTitle>Today's Tasks</CardTitle>
                                <CardDescription>Focus on what matters most today.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TodoList items={todayTodos} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="upcoming">
                        <Card>
                            <CardHeader>
                                <CardTitle>Upcoming Tasks</CardTitle>
                                <CardDescription>Tasks scheduled for the coming days.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TodoList items={upcomingTodos} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="backlog">
                        <Card>
                            <CardHeader>
                                <CardTitle>Backlog</CardTitle>
                                <CardDescription>Tasks to get to eventually.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TodoList items={backlogTodos} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </Shell>
    )
}
