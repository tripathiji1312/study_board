"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { IconAlertTriangle, IconFlame, IconCheck } from "@tabler/icons-react"
import { Todo } from "@/components/providers/store-provider"
import { cn } from "@/lib/utils"

interface AntiProcrastinationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    todo: Todo | null
    onConfirm: () => void
    onCancel: () => void
}

export function AntiProcrastinationDialog({ open, onOpenChange, todo, onConfirm, onCancel }: AntiProcrastinationDialogProps) {
    if (!todo) return null

    const count = (todo.rescheduleCount || 0) + 1
    const isSevere = count >= 5

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn("sm:max-w-md", isSevere ? "border-red-500/50" : "border-orange-500/50")}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isSevere ? (
                            <>
                                <IconFlame className="w-5 h-5 text-red-500" />
                                <span className="text-red-600 dark:text-red-400">Strict Intervention</span>
                            </>
                        ) : (
                            <>
                                <IconAlertTriangle className="w-5 h-5 text-orange-500" />
                                <span className="text-orange-600 dark:text-orange-400">Wait a moment...</span>
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-foreground">
                        {isSevere ? (
                            <>
                                You have rescheduled <strong>"{todo.text}"</strong> {count} times.
                                <br /><br />
                                Be honest: <strong>Is this actually important?</strong>
                                <br />
                                If it is, do it today. If not, delete it.
                            </>
                        ) : (
                            <>
                                You've moved <strong>"{todo.text}"</strong> {count} times.
                                <br /><br />
                                Is the task too big? Maybe verify if you can break it down instead of postponing it again.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2 py-2">
                    {/* Motivational Quote or Insight */}
                    <div className="text-xs text-muted-foreground italic border-l-2 pl-3 py-1">
                        {isSevere
                            ? "Action is the foundational key to all success. - Pablo Picasso"
                            : "Procrastination is the thief of time. - Edward Young"
                        }
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="text-muted-foreground"
                    >
                        Keep Current Date
                    </Button>

                    <Button
                        variant={isSevere ? "destructive" : "default"}
                        onClick={onConfirm}
                        className={cn(isSevere ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700")}
                    >
                        {isSevere ? "I'll Reschedule (Last Time)" : "Reschedule Anyway"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
