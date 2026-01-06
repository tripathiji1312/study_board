"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Calendar } from "@/components/ui/calendar"
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    IconPlus,
    IconTrash,
    IconCalendar,
    IconSun,
    IconClock,
    IconInbox,
    IconCheck,
    IconFlame,
    IconFlag,
    IconTag,
    IconChevronDown,
    IconChevronRight,
    IconCalendarEvent,
    IconSearch,
    IconX,
    IconDotsVertical,
    IconEdit,
    IconCalendarDue,
    IconBook,
    IconSparkles
} from "@tabler/icons-react"
import { useStore, Todo, Tag } from "@/components/providers/store-provider"
import { useXP } from "@/components/xp-widget"
import { cn } from "@/lib/utils"
import { format, isToday, isPast, isTomorrow, parseISO, isThisWeek, addDays } from "date-fns"
import { useReschedule } from "@/hooks/use-reschedule"

type ViewType = "inbox" | "today" | "upcoming" | "completed" | "all" | `tag-${string}`

const PRIORITY_COLORS: Record<number, string> = {
    1: "border-l-red-500 bg-red-500/5",
    2: "border-l-orange-500 bg-orange-500/5",
    3: "border-l-blue-500 bg-blue-500/5",
    4: "border-l-slate-300 bg-slate-500/5",
}

const PRIORITY_FLAGS: Record<number, string> = {
    1: "text-red-500",
    2: "text-orange-500",
    3: "text-blue-500",
    4: "text-slate-400",
}

export default function TodosPage() {
    const {
        todos,
        tags,
        subjects,
        currentSemester,
        addTodo,
        updateTodo,
        toggleTodo,
        deleteTodo,
        addSubtask,
        addTag
    } = useStore()
    const { requestReschedule, RescheduleDialog } = useReschedule()

    const { addXP } = useXP()

    const [activeView, setActiveView] = React.useState<ViewType>("today")
    const [quickTask, setQuickTask] = React.useState("")
    const [searchQuery, setSearchQuery] = React.useState("")
    const [showAddDialog, setShowAddDialog] = React.useState(false)
    const [expandedTodos, setExpandedTodos] = React.useState<Set<string>>(new Set())

    // Edit task state
    const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null)
    const [editText, setEditText] = React.useState("")
    const [editDescription, setEditDescription] = React.useState("")
    const [editDate, setEditDate] = React.useState<Date | undefined>(undefined)
    const [editPriority, setEditPriority] = React.useState<1 | 2 | 3 | 4>(4)

    // New task form state
    const [newTaskText, setNewTaskText] = React.useState("")
    const [newTaskDescription, setNewTaskDescription] = React.useState("")
    const [newTaskDate, setNewTaskDate] = React.useState<Date | undefined>(new Date())
    const [newTaskTime, setNewTaskTime] = React.useState("")
    const [newTaskPriority, setNewTaskPriority] = React.useState<1 | 2 | 3 | 4>(4)
    const [newTaskTags, setNewTaskTags] = React.useState<string[]>([])
    const [newTagInput, setNewTagInput] = React.useState("")
    const [newTaskSubjectId, setNewTaskSubjectId] = React.useState<string | undefined>(undefined)

    const currentSubjects = subjects.filter(s => s.semesterId === currentSemester?.id)

    // Filter todos based on view
    const getFilteredTodos = () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStr = format(today, 'yyyy-MM-dd')

        // Only get parent todos (not subtasks)
        let filtered = todos.filter(t => !t.parentId)

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(t =>
                t.text.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query) ||
                t.tags?.some(tag => tag.name.toLowerCase().includes(query))
            )
        }

        switch (activeView) {
            case "inbox":
                return filtered.filter(t => !t.dueDate && !t.completed)
            case "today":
                return filtered.filter(t => {
                    if (t.completed) return false
                    if (!t.dueDate) return false
                    const dueDate = t.dueDate
                    return dueDate === todayStr || dueDate < todayStr // Today + overdue
                })
            case "upcoming":
                return filtered.filter(t => {
                    if (t.completed) return false
                    if (!t.dueDate) return false
                    const dueDate = parseISO(t.dueDate)
                    return isThisWeek(dueDate, { weekStartsOn: 1 }) && !isToday(dueDate) && !isPast(dueDate)
                })
            case "completed":
                return filtered.filter(t => t.completed)
            case "all":
                return filtered
            default:
                if (activeView.startsWith("tag-")) {
                    const tagId = activeView.replace("tag-", "")
                    return filtered.filter(t => t.tags?.some(tag => tag.id === tagId))
                }
                return filtered
        }
    }

    const filteredTodos = getFilteredTodos()

    // Sort: overdue first, then by priority, then by date
    const sortedTodos = [...filteredTodos].sort((a, b) => {
        // Completed last
        if (a.completed !== b.completed) return a.completed ? 1 : -1

        // Overdue first
        const aOverdue = a.dueDate && isPast(parseISO(a.dueDate)) && !isToday(parseISO(a.dueDate))
        const bOverdue = b.dueDate && isPast(parseISO(b.dueDate)) && !isToday(parseISO(b.dueDate))
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1

        // Priority (lower = higher priority)
        if (a.priority !== b.priority) return a.priority - b.priority

        // Date
        if (a.dueDate && b.dueDate) {
            return a.dueDate.localeCompare(b.dueDate)
        }
        return 0
    })

    // Stats
    const todayTodos = todos.filter(t => {
        if (!t.dueDate) return false
        return isToday(parseISO(t.dueDate))
    })
    const completedToday = todayTodos.filter(t => t.completed).length
    const totalToday = todayTodos.length
    const progressPercent = totalToday > 0 ? (completedToday / totalToday) * 100 : 0

    // Handlers
    const handleQuickAdd = (e: React.FormEvent) => {
        e.preventDefault()
        if (!quickTask.trim()) return

        // Parse natural language
        let dueDate: string | undefined = format(new Date(), 'yyyy-MM-dd') // Default to today
        let priority: 1 | 2 | 3 | 4 = 4
        let text = quickTask

        // Check for "inbox" or "no date" to clear date
        if (text.toLowerCase().includes("inbox") || text.toLowerCase().includes("no date")) {
            dueDate = undefined
            text = text.replace(/\binbox\b|\bno date\b/i, "").trim()
        }

        // Check for p1, p2, p3, p4
        const priorityMatch = text.match(/\bp([1-4])\b/i)
        if (priorityMatch) {
            priority = parseInt(priorityMatch[1]) as 1 | 2 | 3 | 4
            text = text.replace(priorityMatch[0], "").trim()
        }

        // Check for "today", "tomorrow"
        if (text.toLowerCase().includes("today")) {
            // Already today by default, just remove keyword
            text = text.replace(/\btoday\b/i, "").trim()
        } else if (text.toLowerCase().includes("tomorrow")) {
            dueDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')
            text = text.replace(/\btomorrow\b/i, "").trim()
        }

        addTodo({
            text,
            completed: false,
            priority,
            dueDate
        })
        setQuickTask("")
    }

    const handleToggle = (id: string, completed: boolean) => {
        toggleTodo(id, completed)
        if (!completed) {
            addXP(50)
        }
    }

    const handleAddTask = () => {
        if (!newTaskText.trim()) return

        addTodo({
            text: newTaskText,
            description: newTaskDescription || undefined,
            completed: false,
            priority: newTaskPriority,
            dueDate: newTaskDate ? format(newTaskDate, 'yyyy-MM-dd') : undefined,
            dueTime: newTaskTime || undefined,
            tagIds: newTaskTags,
            subjectId: newTaskSubjectId
        })

        // Reset form
        setNewTaskText("")
        setNewTaskDescription("")
        setNewTaskDate(new Date()) // Reset to Today
        setNewTaskTime("")
        setNewTaskPriority(4)
        setNewTaskTags([])
        setNewTaskSubjectId(undefined)
        setShowAddDialog(false)
    }

    const handleOpenEdit = (todo: Todo) => {
        setEditingTodo(todo)
        setEditText(todo.text)
        setEditDescription(todo.description || "")
        setEditDate(todo.dueDate ? parseISO(todo.dueDate) : undefined)
        setEditPriority(todo.priority)
    }

    const handleSaveEdit = () => {
        if (!editingTodo || !editText.trim()) return

        const newDateStr = editDate ? format(editDate, 'yyyy-MM-dd') : undefined
        const dateChanged = newDateStr !== editingTodo.dueDate

        if (dateChanged && newDateStr) {
            // Update details first
            updateTodo(editingTodo.id, {
                text: editText,
                description: editDescription || undefined,
                priority: editPriority
            })
            // Trigger Nudge for date change
            requestReschedule(editingTodo.id, newDateStr)
        } else {
            // Standard update (no date change or move to inbox)
            updateTodo(editingTodo.id, {
                text: editText,
                description: editDescription || undefined,
                dueDate: newDateStr,
                priority: editPriority
            })
        }
        setEditingTodo(null)
    }

    const handleCreateTag = async () => {
        if (!newTagInput.trim()) return
        const tag = await addTag({
            name: newTagInput.toLowerCase().trim(),
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
        })
        setNewTaskTags(prev => [...prev, tag.id])
        setNewTagInput("")
    }

    const toggleExpanded = (id: string) => {
        setExpandedTodos(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const isOverdue = (dueDate?: string) => {
        if (!dueDate) return false
        try {
            const date = parseISO(dueDate)
            return isPast(date) && !isToday(date)
        } catch { return false }
    }

    const formatDueDate = (dueDate?: string, dueTime?: string) => {
        if (!dueDate) return null
        try {
            const date = parseISO(dueDate)
            let text = ""
            if (isToday(date)) text = "Today"
            else if (isTomorrow(date)) text = "Tomorrow"
            else text = format(date, "MMM d")

            if (dueTime) text += ` ${dueTime}`
            return text
        } catch { return null }
    }

    // Views configuration
    const views = [
        { id: "inbox" as const, label: "Inbox", icon: IconInbox, count: todos.filter(t => !t.dueDate && !t.completed && !t.parentId).length },
        { id: "today" as const, label: "Today", icon: IconSun, count: todayTodos.filter(t => !t.completed).length },
        { id: "upcoming" as const, label: "Upcoming", icon: IconCalendarEvent, count: todos.filter(t => t.dueDate && isThisWeek(parseISO(t.dueDate), { weekStartsOn: 1 }) && !isToday(parseISO(t.dueDate))).length },
        { id: "completed" as const, label: "Completed", icon: IconCheck },
    ]

    // Todo Item Component
    const TodoItem = ({ todo, isSubtask = false }: { todo: Todo; isSubtask?: boolean }) => {
        const overdue = isOverdue(todo.dueDate)
        const hasSubtasks = (todo.subtasks?.length || 0) > 0
        const isExpanded = expandedTodos.has(todo.id)
        const completedSubtasks = todo.subtasks?.filter(s => s.completed).length || 0

        return (
            <div className={cn("group", isSubtask && "ml-8")}>
                <div
                    className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border-l-4 transition-colors",
                        "hover:shadow-md bg-card",
                        todo.completed && "opacity-60 bg-muted/40",
                        overdue && !todo.completed && "border-l-red-500 bg-red-500/5",
                        !overdue && PRIORITY_COLORS[todo.priority]
                    )}
                >
                    {/* Expand button for subtasks */}
                    {hasSubtasks && !isSubtask && (
                        <button
                            onClick={() => toggleExpanded(todo.id)}
                            className="mt-1 p-0.5 hover:bg-muted rounded"
                        >
                            {isExpanded ? (
                                <IconChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                                <IconChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                        </button>
                    )}

                    <Checkbox
                        id={todo.id}
                        checked={todo.completed}
                        onCheckedChange={() => handleToggle(todo.id, todo.completed)}
                        className={cn(
                            "mt-1 w-5 h-5",
                            overdue && !todo.completed && "border-red-500"
                        )}
                    />

                    <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-start gap-2">
                            <label
                                htmlFor={todo.id}
                                className={cn(
                                    "text-sm font-medium cursor-pointer break-words",
                                    todo.completed && "line-through text-muted-foreground"
                                )}
                            >
                                {todo.text}
                            </label>
                            {todo.priority < 4 && (
                                <IconFlag className={cn("w-3.5 h-3.5 shrink-0", PRIORITY_FLAGS[todo.priority])} />
                            )}
                        </div>

                        {todo.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
                                {todo.description}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-2">
                            {todo.dueDate && (
                                <div className={cn(
                                    "flex items-center gap-1 text-xs",
                                    overdue && !todo.completed ? "text-red-500 font-medium" : "text-muted-foreground"
                                )}>
                                    <IconCalendar className="w-3 h-3" />
                                    {overdue && !todo.completed && <IconFlame className="w-3 h-3" />}
                                    {formatDueDate(todo.dueDate, todo.dueTime)}
                                </div>
                            )}

                            {/* Subject Badge */}
                            {todo.subjectId && (() => {
                                const subj = subjects.find(s => s.id === todo.subjectId)
                                return subj ? (
                                    <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                                        <IconBook className="w-3 h-3" />
                                        {subj.name}
                                    </Badge>
                                ) : null
                            })()}

                            {todo.tags?.map(tag => (
                                <Badge
                                    key={tag.id}
                                    variant="outline"
                                    className="text-[10px] h-5"
                                    style={{ borderColor: tag.color, color: tag.color }}
                                >
                                    #{tag.name}
                                </Badge>
                            ))}

                            {/* Auto-tagging indicator */}
                            {todo.isOptimistic && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-indigo-500 animate-pulse font-medium">
                                    <IconSparkles className="w-3 h-3" />
                                    Auto-tagging...
                                </span>
                            )}

                            {hasSubtasks && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <IconCheck className="w-3 h-3" />
                                    {completedSubtasks}/{todo.subtasks?.length}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                            >
                                <IconDotsVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(todo)}>
                                <IconEdit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                const tomorrow = addDays(new Date(), 1)
                                requestReschedule(todo.id, format(tomorrow, 'yyyy-MM-dd'))
                            }}>
                                <IconCalendarDue className="w-4 h-4 mr-2" /> Move to Tomorrow
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteTodo(todo.id)}
                            >
                                <IconTrash className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Subtasks */}
                {isExpanded && hasSubtasks && (
                    <div className="mt-1 space-y-1">
                        {todo.subtasks?.map(subtask => (
                            <TodoItem key={subtask.id} todo={subtask} isSubtask />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <Shell>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)]">
                {/* Mobile Navigation */}
                <div className="md:hidden flex flex-col gap-3">
                    {/* Mobile Search */}
                    <div className="relative">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-8 h-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                <IconX className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </button>
                        )}
                    </div>

                    <ScrollArea className="w-full whitespace-nowrap -mx-4 px-4">
                        <div className="flex w-max space-x-2 py-1">
                            {views.map(view => (
                                <button
                                    key={view.id}
                                    onClick={() => setActiveView(view.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all touch-manipulation",
                                        "active:scale-95",
                                        activeView === view.id
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    <view.icon className="w-4 h-4" />
                                    {view.label}
                                    {view.count !== undefined && view.count > 0 && (
                                        <Badge variant={activeView === view.id ? "secondary" : "outline"} className="ml-1 h-5 text-[10px] px-1.5">
                                            {view.count}
                                        </Badge>
                                    )}
                                </button>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>

                    {tags.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                                Tags:
                            </span>
                            {tags.map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => setActiveView(`tag-${tag.id}`)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border shrink-0",
                                        activeView === `tag-${tag.id}`
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                                    )}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: tag.color }}
                                    />
                                    #{tag.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop Sidebar */}
                <div className="hidden md:block w-64 flex-shrink-0">
                    <div className="sticky top-0 space-y-6">
                        {/* Search */}
                        <div className="relative">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-8"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    <IconX className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                </button>
                            )}
                        </div>

                        {/* Views */}
                        <div className="space-y-1">
                            {views.map(view => (
                                <button
                                    key={view.id}
                                    onClick={() => setActiveView(view.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                        activeView === view.id
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <view.icon className="w-4 h-4" />
                                    {view.label}
                                    {view.count !== undefined && view.count > 0 && (
                                        <Badge variant="secondary" className="ml-auto h-5 text-xs">
                                            {view.count}
                                        </Badge>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tags */}
                        {tags.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                                    Tags
                                </h3>
                                <div className="space-y-1">
                                    {tags.map(tag => (
                                        <button
                                            key={tag.id}
                                            onClick={() => setActiveView(`tag-${tag.id}`)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                                activeView === `tag-${tag.id}`
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: tag.color }}
                                            />
                                            #{tag.name}
                                            {tag.usageCount !== undefined && tag.usageCount > 0 && (
                                                <Badge variant="secondary" className="ml-auto h-5 text-xs">
                                                    {tag.usageCount}
                                                </Badge>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-shrink-0">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                {activeView === "inbox" && "Inbox"}
                                {activeView === "today" && `Today · ${format(new Date(), "MMM d")}`}
                                {activeView === "upcoming" && "Upcoming"}
                                {activeView === "completed" && "Completed"}
                                {activeView === "all" && "All Tasks"}
                                {activeView.startsWith("tag-") && `#${tags.find(t => t.id === activeView.replace("tag-", ""))?.name}`}
                            </h1>
                            {activeView === "today" && totalToday > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {completedToday}/{totalToday} completed
                                </p>
                            )}
                        </div>

                        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 hidden md:flex">
                                    <IconPlus className="w-4 h-4" />
                                    Add Task
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Add New Task</DialogTitle>
                                    <DialogDescription>
                                        Create a new task with details, due date, and tags.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <Input
                                        placeholder="Task name"
                                        value={newTaskText}
                                        onChange={(e) => setNewTaskText(e.target.value)}
                                    />
                                    <Input
                                        placeholder="Description (optional)"
                                        value={newTaskDescription}
                                        onChange={(e) => setNewTaskDescription(e.target.value)}
                                    />

                                    <div className="flex flex-wrap gap-2">
                                        {/* Date Picker */}
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn("gap-2", !newTaskDate && "text-muted-foreground")}>
                                                    <IconCalendar className="w-4 h-4" />
                                                    {newTaskDate ? format(newTaskDate, "MMM d") : "Inbox"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={newTaskDate}
                                                    onSelect={setNewTaskDate}
                                                />
                                                <div className="p-3 border-t">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full justify-start text-muted-foreground h-8"
                                                        onClick={() => { setNewTaskDate(undefined); document.body.click() }}
                                                    >
                                                        <IconInbox className="w-4 h-4 mr-2" />
                                                        Move to Inbox (No Date)
                                                    </Button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>

                                        {/* Time */}
                                        <Input
                                            type="time"
                                            value={newTaskTime}
                                            onChange={(e) => setNewTaskTime(e.target.value)}
                                            className="w-32"
                                        />

                                        {/* Priority */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="gap-2">
                                                    <IconFlag className={cn("w-4 h-4", PRIORITY_FLAGS[newTaskPriority])} />
                                                    P{newTaskPriority}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {[1, 2, 3, 4].map(p => (
                                                    <DropdownMenuItem
                                                        key={p}
                                                        onClick={() => setNewTaskPriority(p as 1 | 2 | 3 | 4)}
                                                    >
                                                        <IconFlag className={cn("w-4 h-4 mr-2", PRIORITY_FLAGS[p])} />
                                                        Priority {p}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {/* Subject */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="gap-2">
                                                    <IconBook className="w-4 h-4" />
                                                    {newTaskSubjectId
                                                        ? currentSubjects.find(s => s.id === newTaskSubjectId)?.name || "Subject"
                                                        : "Subject"}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[240px] max-h-[300px] overflow-y-auto">
                                                <DropdownMenuItem onClick={() => setNewTaskSubjectId(undefined)}>
                                                    <IconX className="w-4 h-4 mr-2 opacity-50" />
                                                    No Subject
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {currentSubjects.map(subject => (
                                                    <DropdownMenuItem
                                                        key={subject.id}
                                                        onClick={() => setNewTaskSubjectId(subject.id)}
                                                    >
                                                        <IconBook className="w-4 h-4 mr-2" />
                                                        <span className="truncate">{subject.name}</span>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Tags */}
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap gap-2">
                                            {newTaskTags.map(tagId => {
                                                const tag = tags.find(t => t.id === tagId)
                                                if (!tag) return null
                                                return (
                                                    <Badge
                                                        key={tag.id}
                                                        variant="outline"
                                                        style={{ borderColor: tag.color, color: tag.color }}
                                                        className="gap-1"
                                                    >
                                                        #{tag.name}
                                                        <button onClick={() => setNewTaskTags(prev => prev.filter(id => id !== tagId))}>
                                                            <IconX className="w-3 h-3" />
                                                        </button>
                                                    </Badge>
                                                )
                                            })}
                                        </div>

                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Add tag..."
                                                value={newTagInput}
                                                onChange={(e) => setNewTagInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault()
                                                        handleCreateTag()
                                                    }
                                                }}
                                            />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="icon">
                                                        <IconTag className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {tags.filter(t => !newTaskTags.includes(t.id)).map(tag => (
                                                        <DropdownMenuItem
                                                            key={tag.id}
                                                            onClick={() => setNewTaskTags(prev => [...prev, tag.id])}
                                                        >
                                                            <div
                                                                className="w-3 h-3 rounded-full mr-2"
                                                                style={{ backgroundColor: tag.color }}
                                                            />
                                                            #{tag.name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleAddTask}>Add Task</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Edit Task Dialog */}
                        <Dialog open={!!editingTodo} onOpenChange={(open) => !open && setEditingTodo(null)}>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Edit Task</DialogTitle>
                                    <DialogDescription>
                                        Make changes to your task below.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <Input
                                        placeholder="Task name"
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                    />
                                    <Input
                                        placeholder="Description (optional)"
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                    />

                                    <div className="flex flex-wrap gap-2">
                                        {/* Date Picker */}
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn("gap-2", !editDate && "text-muted-foreground")}>
                                                    <IconCalendar className="w-4 h-4" />
                                                    {editDate ? format(editDate, "MMM d") : "No Date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={editDate}
                                                    onSelect={setEditDate}
                                                />
                                                <div className="p-3 border-t">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full justify-start text-muted-foreground h-8"
                                                        onClick={() => { setEditDate(undefined); document.body.click() }}
                                                    >
                                                        <IconInbox className="w-4 h-4 mr-2" />
                                                        Move to Inbox (No Date)
                                                    </Button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>

                                        {/* Priority */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="gap-2">
                                                    <IconFlag className={cn("w-4 h-4", PRIORITY_FLAGS[editPriority])} />
                                                    P{editPriority}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {[1, 2, 3, 4].map(p => (
                                                    <DropdownMenuItem
                                                        key={p}
                                                        onClick={() => setEditPriority(p as 1 | 2 | 3 | 4)}
                                                    >
                                                        <IconFlag className={cn("w-4 h-4 mr-2", PRIORITY_FLAGS[p])} />
                                                        Priority {p}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditingTodo(null)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSaveEdit}>Save Changes</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <RescheduleDialog />
                    </div>

                    {/* Progress (for Today view) */}
                    {activeView === "today" && totalToday > 0 && (
                        <div className="space-y-2 flex-shrink-0">
                            <Progress value={progressPercent} className="h-2" />
                            <p className="text-xs text-center text-muted-foreground">
                                {progressPercent === 100
                                    ? "🎉 All tasks completed! Great job!"
                                    : `${Math.round(progressPercent)}% of today's tasks done`
                                }
                            </p>
                        </div>
                    )}

                    {/* Quick Add */}
                    <form onSubmit={handleQuickAdd} className="flex gap-2 flex-shrink-0">
                        <div className="relative flex-1">
                            <Input
                                value={quickTask}
                                onChange={(e) => setQuickTask(e.target.value)}
                                placeholder="Quick add task... (try 'Buy milk tomorrow p1')"
                                className="pr-10"
                            />
                        </div>
                        <Button type="submit" size="icon">
                            <IconPlus className="w-4 h-4" />
                        </Button>
                    </form>

                    {/* Task List */}
                    <ScrollArea className="flex-1">
                        <div className="space-y-2 pr-4">
                            {sortedTodos.length > 0 ? (
                                sortedTodos.map(todo => (
                                    <TodoItem key={todo.id} todo={todo} />
                                ))
                            ) : (
                                <div className="py-16 text-center text-muted-foreground">
                                    <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                                        {activeView === "inbox" && <IconInbox className="w-8 h-8 opacity-30" />}
                                        {activeView === "today" && <IconSun className="w-8 h-8 opacity-30" />}
                                        {activeView === "upcoming" && <IconCalendarEvent className="w-8 h-8 opacity-30" />}
                                        {activeView === "completed" && <IconCheck className="w-8 h-8 opacity-30" />}
                                    </div>
                                    <p className="font-medium">
                                        {activeView === "inbox" && "Inbox is empty"}
                                        {activeView === "today" && "No tasks for today"}
                                        {activeView === "upcoming" && "No upcoming tasks"}
                                        {activeView === "completed" && "No completed tasks"}
                                        {activeView.startsWith("tag-") && "No tasks with this tag"}
                                    </p>
                                    <p className="text-sm mt-1">Add a task to get started</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Mobile Floating Action Button */}
            <Button
                className="md:hidden mobile-fab h-14 w-14 shadow-xl"
                onClick={() => setShowAddDialog(true)}
            >
                <IconPlus className="w-6 h-6" />
            </Button>
        </Shell>
    )
}
