"use client"

import * as React from "react"
import { IconBrain, IconCalendarStats, IconCheck, IconLoader2, IconSparkles, IconClock, IconBook } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useStore, Module } from "@/components/providers/store-provider"
import { format, differenceInDays, parseISO } from "date-fns"

interface StudyPlannerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    examDate: string
    subjectId: string
    examTitle: string
}

interface StudyPlanDay {
    date: string
    sessions: {
        moduleId: string
        moduleTitle: string
        topic: string
        durationMinutes: number
        notes: string
    }[]
}

export function StudyPlannerDialog({ open, onOpenChange, examDate, subjectId, examTitle }: StudyPlannerDialogProps) {
    const { subjects, refreshData } = useStore()
    const [step, setStep] = React.useState<"config" | "review">("config")
    const [isLoading, setIsLoading] = React.useState(false) // Generating plan
    const [isSaving, setIsSaving] = React.useState(false) // Saving to DB

    // Config State
    const [hoursPerDay, setHoursPerDay] = React.useState([4])
    const [selectedModules, setSelectedModules] = React.useState<string[]>([])

    // Result State
    const [generatedPlan, setGeneratedPlan] = React.useState<StudyPlanDay[]>([])

    const subject = subjects.find(s => s.id === subjectId)
    const modules = subject?.modules || []

    // Pre-select all modules initially
    React.useEffect(() => {
        if (open && modules.length > 0) {
            setSelectedModules(modules.map(m => m.id))
            setStep("config")
            setGeneratedPlan([])
        }
    }, [open, modules])

    const handleGenerate = async () => {
        if (selectedModules.length === 0) {
            toast.error("Please select at least one module")
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch('/api/ai/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    examDate,
                    subjectId,
                    selectedModuleIds: selectedModules,
                    availableHoursPerDay: hoursPerDay[0]
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to generate plan")

            setGeneratedPlan(data.plan)
            setStep("review")
        } catch (error: any) {
            const msg = error instanceof Error ? error.message : 'Failed to generate plan'
            if (msg.includes("API")) {
                toast.error("AI Features Disabled", {
                    description: "Please configure your Groq API Key in Settings to generate study plans.",
                    duration: 5000,
                })
            } else {
                toast.error("Failed to generate plan")
                console.error(error)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Flatten plan into events
            const events = generatedPlan.flatMap(day =>
                day.sessions.map(session => ({
                    title: `Study: ${session.moduleTitle}`,
                    type: "Study" as const,
                    day: day.date,
                    time: "09:00", // Default start, user can adjust
                    duration: `${session.durationMinutes / 60}h`,
                    location: session.notes, // Store AI advice in location/notes
                    subjectId: subjectId
                }))
            )

            // Save via existing batch API (or loop simpler API)
            // For now, we'll loop creating events (V2: batch API)
            // Actually, let's use a batch endpoint if we have one, or loop.
            // We only have single create. Let's make a specialized save in the future.
            // For now, let's just use the loop logic for simplicity in this version.

            const promises = events.map(evt =>
                fetch('/api/schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(evt)
                })
            )

            await Promise.all(promises)

            toast.success("Study plan added to calendar!")
            await refreshData()
            onOpenChange(false)
        } catch (error) {
            toast.error("Failed to save plan")
        } finally {
            setIsSaving(false)
        }
    }

    const daysLeft = differenceInDays(parseISO(examDate), new Date())

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <IconBrain className="w-5 h-5 text-indigo-500" />
                        AI Study Planner for {examTitle}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-2">
                    {step === "config" ? (
                        <div className="space-y-8">
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 text-sm text-indigo-600 dark:text-indigo-400">
                                <p>This exam is in <strong>{daysLeft} days</strong>. I'll help you distribute the workload intelligently.</p>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-base">1. Which modules are included in this exam?</Label>
                                <Card className="p-4">
                                    <ScrollArea className="h-[200px] pr-4">
                                        <div className="space-y-3">
                                            {modules.map(module => (
                                                <div key={module.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={module.id}
                                                        checked={selectedModules.includes(module.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) setSelectedModules([...selectedModules, module.id])
                                                            else setSelectedModules(selectedModules.filter(id => id !== module.id))
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={module.id}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {module.title}
                                                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                                                            ({module.status})
                                                        </span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between">
                                    <Label className="text-base">2. Daily Study Capacity</Label>
                                    <span className="font-bold text-lg text-primary">{hoursPerDay} hours</span>
                                </div>
                                <Slider
                                    value={hoursPerDay}
                                    onValueChange={setHoursPerDay}
                                    max={12}
                                    min={1}
                                    step={1}
                                    className="w-full"
                                />
                                <p className="text-xs text-muted-foreground">
                                    We'll try not to exceed this, but heavy modules might require it.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Proposed Schedule</h3>
                                <Badge variant="secondary" className="gap-1">
                                    <IconClock className="w-3 h-3" />
                                    {generatedPlan.length} Days of Study
                                </Badge>
                            </div>

                            <div className="space-y-4 relative pl-4 border-l-2 border-dashed border-muted ml-2">
                                {generatedPlan.map((day, i) => (
                                    <div key={day.date} className="relative">
                                        <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                                        <h4 className="font-medium text-sm text-muted-foreground mb-2">
                                            {format(parseISO(day.date), "EEEE, MMM d")}
                                        </h4>
                                        <div className="space-y-3">
                                            {day.sessions.map((session, j) => (
                                                <Card key={j} className="p-3 bg-card/50 hover:bg-card transition-colors border-l-4 border-l-indigo-500">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-semibold text-sm">{session.moduleTitle}</span>
                                                        <Badge variant="outline" className="text-[10px] h-5">
                                                            {session.durationMinutes}m
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground font-medium mb-1">
                                                        Focus: {session.topic}
                                                    </p>
                                                    <div className="text-xs bg-secondary/50 p-2 rounded text-secondary-foreground italic">
                                                        "{session.notes}"
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t bg-muted/20">
                    {step === "config" ? (
                        <Button onClick={handleGenerate} disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? (
                                <>
                                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing Syllabus...
                                </>
                            ) : (
                                <>
                                    <IconSparkles className="w-4 h-4 mr-2" />
                                    Generate Smart Plan
                                </>
                            )}
                        </Button>
                    ) : (
                        <div className="flex w-full gap-2">
                            <Button variant="outline" onClick={() => setStep("config")} className="flex-1">
                                Back
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving} className="flex-2 w-full">
                                {isSaving ? "Saving to Calendar..." : "Accept & Add to Calendar"}
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
