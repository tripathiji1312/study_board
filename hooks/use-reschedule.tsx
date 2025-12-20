"use client"

import * as React from "react"
import { useStore, Todo } from "@/components/providers/store-provider"
import { AntiProcrastinationDialog } from "@/components/dashboard/anti-procrastination-dialog"

export function useReschedule() {
    const { todos, updateTodo } = useStore()
    const [dialogState, setDialogState] = React.useState<{
        open: boolean,
        todo: Todo | null,
        newDate: string | null
    }>({
        open: false,
        todo: null,
        newDate: null
    })

    const requestReschedule = (todoId: string, newDate: string) => {
        const todo = todos.find(t => t.id === todoId)
        if (!todo) return

        const count = todo.rescheduleCount || 0

        // Threshold: Intervene after 3 reschedules
        if (count >= 3) {
            setDialogState({ open: true, todo, newDate })
        } else {
            // Just update
            updateTodo(todoId, {
                dueDate: newDate,
                rescheduleCount: count + 1
            })
        }
    }

    const confirmReschedule = () => {
        if (dialogState.todo && dialogState.newDate) {
            updateTodo(dialogState.todo.id, {
                dueDate: dialogState.newDate,
                rescheduleCount: (dialogState.todo.rescheduleCount || 0) + 1
            })
        }
        setDialogState({ open: false, todo: null, newDate: null })
    }

    const RescheduleDialog = () => (
        <AntiProcrastinationDialog
            open={dialogState.open}
            onOpenChange={(op) => !op && setDialogState(prev => ({ ...prev, open: false }))}
            todo={dialogState.todo}
            onConfirm={confirmReschedule}
            onCancel={() => setDialogState({ open: false, todo: null, newDate: null })}
        />
    )

    return { requestReschedule, RescheduleDialog }
}
