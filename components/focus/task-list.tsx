"use client"

import * as React from "react"
import { IconPlayerPlay, IconCircle, IconCircleCheck, IconPlayerPause, IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Todo {
    id: string
    text: string
    completed: boolean
}

interface FocusTaskListProps {
    todos: Todo[]
    activeTaskId: string | null
    onSelectTask: (taskId: string, taskText: string) => void
    onToggleTodo: (id: string, currentStatus: boolean) => void
    onClearFocus: () => void
}

export function FocusTaskList({ todos, activeTaskId, onSelectTask, onToggleTodo, onClearFocus }: FocusTaskListProps) {
    if (todos.length === 0) return (
        <div className="w-full max-w-sm space-y-4 transition-opacity duration-500 opacity-20 hover:opacity-100">
             <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pl-2">Focus Queue</h3>
            <p className="text-sm text-white/30 px-2">No tasks for today. Enjoy the silence.</p>
        </div>
    )

    return (
        <div className="w-full max-w-sm space-y-4 transition-opacity duration-500 opacity-20 hover:opacity-100">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-2">Focus Queue</h3>
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2 no-scrollbar mask-gradient-b">
                {todos.map(todo => {
                    const isActive = activeTaskId === String(todo.id)
                    return (
                        <div
                            key={todo.id}
                            className={cn(
                                "group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 border",
                                isActive
                                    ? "bg-primary/10 border-primary/20 shadow-expressive"
                                    : "bg-surface-container-low/40 border-transparent hover:bg-surface-container-low/80 hover:scale-[1.02] hover:shadow-sm"
                            )}
                        >
                            <div className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer" onClick={() => onToggleTodo(todo.id, todo.completed)}>
                                {todo.completed ? (
                                    <IconCircleCheck className="w-5 h-5 text-primary/40" />
                                ) : (
                                    <IconCircle className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground/50 group-hover:text-primary/80")} />
                                )}
                                <span className={cn("text-sm font-medium transition-all", todo.completed ? "line-through opacity-40 text-muted-foreground" : "text-foreground/90")}>
                                    {todo.text}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isActive ? (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="w-8 h-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => { e.stopPropagation(); onClearFocus(); }}
                                        title="Stop Focusing on this"
                                    >
                                        <IconX className="w-4 h-4" />
                                    </Button>
                                ) : (
                                    !todo.completed && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                                            onClick={(e) => { e.stopPropagation(); onSelectTask(String(todo.id), todo.text); }}
                                        >
                                            <IconPlayerPlay className="w-4 h-4 fill-current" />
                                        </Button>
                                    )
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
