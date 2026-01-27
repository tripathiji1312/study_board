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
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pl-2">Focus Queue</h3>
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2 no-scrollbar mask-gradient-b">
                {todos.map(todo => {
                    const isActive = activeTaskId === String(todo.id)
                    return (
                        <div
                            key={todo.id}
                            className={cn(
                                "group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 border border-transparent",
                                isActive
                                    ? "bg-white/10 border-white/10 shadow-lg backdrop-blur-sm"
                                    : "hover:bg-white/5 hover:border-white/5 active:bg-white/10"
                            )}
                        >
                            <div className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer" onClick={() => onToggleTodo(todo.id, todo.completed)}>
                                {todo.completed ? (
                                    <IconCircleCheck className="w-4 h-4 text-white/40" />
                                ) : (
                                    <IconCircle className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                                )}
                                <span className={cn("text-sm truncate font-light transition-all tracking-wide", todo.completed ? "line-through opacity-30" : "text-white/70 group-hover:text-white")}>
                                    {todo.text}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isActive ? (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="w-6 h-6 rounded-full text-white/30 hover:text-white"
                                        onClick={(e) => { e.stopPropagation(); onClearFocus(); }}
                                        title="Stop Focusing on this"
                                    >
                                        <IconX className="w-3 h-3" />
                                    </Button>
                                ) : (
                                    !todo.completed && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="w-6 h-6 rounded-full text-white/30 hover:text-white"
                                            onClick={(e) => { e.stopPropagation(); onSelectTask(String(todo.id), todo.text); }}
                                        >
                                            <IconPlayerPlay className="w-3 h-3 fill-current" />
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
