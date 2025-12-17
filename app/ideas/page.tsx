"use client"

import * as React from "react"
import { useStore } from "@/components/providers/store-provider"
import { Shell } from "@/components/ui/shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconBulb, IconPlus, IconTrash, IconGripVertical } from "@tabler/icons-react"
import { DndContext, closestCenter, DragOverlay, useSensor, useSensors, PointerSensor, DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

function SortableItem({ id, idea, onDelete }: { id: string, idea: any, onDelete: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div ref={setNodeRef} style={style} className={cn("relative group mb-3", isDragging && "opacity-50 z-50")}>
            <div className="bg-card p-4 rounded-xl border shadow-sm hover:shadow-md transition-all flex items-start gap-3">
                <div {...attributes} {...listeners} className="mt-1 cursor-grab text-muted-foreground hover:text-foreground">
                    <IconGripVertical className="h-4 w-4" />
                </div>
                <div className="flex-1 text-sm font-medium leading-relaxed">
                    {idea.content}
                </div>
                <button
                    onClick={() => onDelete(id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                    <IconTrash className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}

function Column({ id, title, ideas, onDelete, activeId }: { id: string, title: string, ideas: any[], onDelete: (id: string) => void, activeId: string | null }) {
    const { setNodeRef } = useSortable({ id })

    return (
        <div ref={setNodeRef} className="flex flex-col bg-muted/30 rounded-2xl p-4 min-h-[500px] border border-border/50">
            <h3 className="font-bold mb-4 flex items-center justify-between text-muted-foreground uppercase text-xs tracking-wider px-2">
                {title}
                <span className="bg-muted text-foreground px-2 py-0.5 rounded-full text-[10px]">{ideas.length}</span>
            </h3>
            <SortableContext items={ideas.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1">
                    {ideas.map((idea) => (
                        <SortableItem key={idea.id} id={idea.id} idea={idea} onDelete={onDelete} />
                    ))}
                    {ideas.length === 0 && (
                        <div className="h-24 border-2 border-dashed border-muted-foreground/10 rounded-xl flex items-center justify-center text-xs text-muted-foreground/50">
                            Drop ideas here
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    )
}

export default function IdeasPage() {
    const { ideas, addIdea, updateIdea, deleteIdea } = useStore()
    const [newItem, setNewItem] = React.useState("")
    const [activeId, setActiveId] = React.useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newItem.trim()) return
        addIdea({ content: newItem, status: "brainstorm" })
        setNewItem("")
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const activeId = active.id as string
        const activeIdea = ideas.find(i => i.id === activeId)

        // Find which column we dropped into
        // If we drop on a column container directly
        if (over.id === "brainstorm" || over.id === "planned" || over.id === "done") {
            if (activeIdea && activeIdea.status !== over.id) {
                updateIdea(activeId, { status: over.id as any })
            }
            return
        }

        // If we drop on an item, find that item's column
        const overId = over.id as string
        const overIdea = ideas.find(i => i.id === overId)

        if (activeIdea && overIdea && activeIdea.status !== overIdea.status) {
            updateIdea(activeId, { status: overIdea.status })
        }
    }

    const brainstorm = ideas.filter(i => i.status === "brainstorm")
    const planned = ideas.filter(i => i.status === "planned")
    const done = ideas.filter(i => i.status === "done")

    return (
        <Shell>
            <div className="flex flex-col h-[calc(100vh-140px)]">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <IconBulb className="h-8 w-8 text-yellow-500" />
                            Idea Board
                        </h1>
                        <p className="text-muted-foreground">Capture, plan, and execute your brilliant ideas.</p>
                    </div>
                </div>

                <div className="mb-6 max-w-xl">
                    <form onSubmit={handleAdd} className="flex gap-2 relative">
                        <Input
                            value={newItem}
                            onChange={(e: any) => setNewItem(e.target.value)}
                            placeholder="Type a new idea and hit enter..."
                            className="bg-card shadow-sm pl-4 pr-12 h-12 text-lg"
                        />
                        <Button type="submit" size="icon" className="absolute right-1 top-1 h-10 w-10">
                            <IconPlus className="w-5 h-5" />
                        </Button>
                    </form>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
                        <Column id="brainstorm" title="Brainstorm" ideas={brainstorm} onDelete={deleteIdea} activeId={activeId} />
                        <Column id="planned" title="Planned" ideas={planned} onDelete={deleteIdea} activeId={activeId} />
                        <Column id="done" title="Done" ideas={done} onDelete={deleteIdea} activeId={activeId} />
                    </div>

                    <DragOverlay>
                        {activeId ? (
                            <div className="bg-card p-4 rounded-xl border shadow-xl opacity-90 cursor-grabbing">
                                {ideas.find(i => i.id === activeId)?.content}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </Shell>
    )
}
