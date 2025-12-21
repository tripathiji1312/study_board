"use client"

import * as React from "react"
import { IconUpload, IconFileText, IconLoader2, IconX, IconCheck, IconRefresh, IconArrowRight, IconCalendarEvent, IconAlertTriangle, IconSchool, IconFlag } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface CalendarEvent {
    title: string
    type: 'exam' | 'holiday' | 'event' | 'deadline'
    startDate: string
    endDate?: string
    time?: string
    description?: string
    selected?: boolean
}

interface CalendarImporterProps {
    onImportComplete?: () => void
}

export function CalendarImporter({ onImportComplete }: CalendarImporterProps) {
    const [file, setFile] = React.useState<File | null>(null)
    const [isParsing, setIsParsing] = React.useState(false)
    const [events, setEvents] = React.useState<CalendarEvent[]>([])
    const [step, setStep] = React.useState<"upload" | "review">("upload")
    const [open, setOpen] = React.useState(false)
    const [showDebug, setShowDebug] = React.useState(false)
    const [debugText, setDebugText] = React.useState<string>("")
    const [isSaving, setIsSaving] = React.useState(false)
    const [isOcrActive, setIsOcrActive] = React.useState(false)

    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const parseCalendar = async () => {
        if (!file) return

        setIsParsing(true)
        setDebugText("")
        setIsOcrActive(false)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/calendar/parse', { method: 'POST', body: formData })
            const data = await res.json()

            if (!res.ok) throw new Error(data.details || data.error || 'Failed to parse')

            if (data.debugText) setDebugText(data.debugText)
            setIsOcrActive(data.debugText?.startsWith('OCR_FALLBACK_ACTIVE'))

            // Mark all events as selected by default
            const parsedEvents = (data.events || []).map((e: CalendarEvent) => ({
                ...e,
                selected: true
            }))

            if (parsedEvents.length > 0) {
                setEvents(parsedEvents)
                setStep("review")
                toast.success(`Found ${parsedEvents.length} events`)
            } else {
                toast.error("Could not find any events. Check Debug view.")
                if (data.debugText) {
                    setStep("review")
                    setShowDebug(true)
                }
            }
        } catch (error: any) {
            if (error.message?.includes("API Key")) {
                toast.error("AI Features Disabled", {
                    description: "Please configure your Groq API Key in Settings to parse files.",
                    duration: 5000,
                })
            } else {
                toast.error(`Parsing failed: ${error.message}`)
            }
        } finally {
            setIsParsing(false)
        }
    }

    const handleSave = async () => {
        const selectedEvents = events.filter(e => e.selected)
        if (selectedEvents.length === 0) return

        setIsSaving(true)
        try {
            const res = await fetch('/api/calendar/parse', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    events: selectedEvents
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save to database')

            toast.success(`Added ${data.results.exams} exams, ${data.results.scheduleEvents} events`)
            setOpen(false)
            resetState()
            onImportComplete?.()
        } catch (error: any) {
            toast.error("Failed to save calendar: " + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const resetState = () => {
        setStep("upload")
        setFile(null)
        setEvents([])
        setDebugText("")
        setShowDebug(false)
    }

    const toggleEvent = (index: number) => {
        setEvents(prev => prev.map((e, i) =>
            i === index ? { ...e, selected: !e.selected } : e
        ))
    }

    const toggleAll = (selected: boolean) => {
        setEvents(prev => prev.map(e => ({ ...e, selected })))
    }

    const getTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            exam: "bg-red-500/10 text-red-500 border-red-500/20",
            holiday: "bg-green-500/10 text-green-500 border-green-500/20",
            event: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            deadline: "bg-orange-500/10 text-orange-500 border-orange-500/20"
        }
        return styles[type] || "bg-muted text-muted-foreground"
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'exam': return <IconAlertTriangle className="w-3 h-3 text-red-500" />
            case 'holiday': return <IconCalendarEvent className="w-3 h-3 text-green-500" />
            case 'event': return <IconSchool className="w-3 h-3 text-blue-500" />
            case 'deadline': return <IconFlag className="w-3 h-3 text-orange-500" />
            default: return <IconCalendarEvent className="w-3 h-3" />
        }
    }

    const selectedCount = events.filter(e => e.selected).length

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetState() }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <IconCalendarEvent className="w-4 h-4" />
                    Import Calendar with AI
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-3xl h-[90vh] sm:h-[85vh] p-0 flex flex-col gap-0 overflow-hidden">
                <DialogHeader className="shrink-0 p-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <IconCalendarEvent className="w-5 h-5" />
                        Import Academic Calendar
                        {isOcrActive && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 text-[10px] ml-2">
                                <IconLoader2 className="w-3 h-3 mr-1 animate-spin" /> OCR
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Upload a PDF or image of your academic calendar. We'll extract events and holidays.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-6">
                    {step === "upload" ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                            {isParsing ? (
                                <div className="text-center space-y-4 w-full max-w-sm">
                                    <div className="flex flex-col items-center gap-2">
                                        <IconLoader2 className="w-12 h-12 animate-spin text-primary" />
                                        <p className="text-lg font-medium">Analyzing calendar...</p>
                                        <p className="text-sm text-muted-foreground">This uses AI and may take up to 30 seconds.</p>
                                    </div>
                                    <div className="space-y-2 pt-4">
                                        <Skeleton className="h-12 w-full rounded-lg" />
                                        <Skeleton className="h-12 w-full rounded-lg opacity-80" />
                                        <Skeleton className="h-12 w-full rounded-lg opacity-60" />
                                    </div>
                                </div>
                            ) : file ? (
                                <div className="text-center space-y-4">
                                    <IconFileText className="w-12 h-12 text-primary mx-auto" />
                                    <div>
                                        <p className="text-lg font-medium">{file.name}</p>
                                        <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <div className="flex gap-3 justify-center">
                                        <Button variant="outline" onClick={() => setFile(null)}>Change</Button>
                                        <Button onClick={parseCalendar} className="gap-2">
                                            Parse <IconArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <IconUpload className="w-12 h-12 text-muted-foreground mx-auto" />
                                    <div>
                                        <p className="text-lg font-medium">Drop your file here</p>
                                        <p className="text-sm text-muted-foreground">PDF or Image (PNG, JPG)</p>
                                    </div>
                                    <Button onClick={() => inputRef.current?.click()}>
                                        Select File
                                    </Button>
                                    <input
                                        type="file"
                                        accept=".pdf,image/*"
                                        className="hidden"
                                        ref={inputRef}
                                        onChange={handleFileChange}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col gap-4">
                            <div className="shrink-0 flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Found <span className="font-semibold text-foreground">{events.length}</span> events
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => toggleAll(true)} className="text-xs">
                                        Select All
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => toggleAll(false)} className="text-xs">
                                        Deselect All
                                    </Button>
                                    <div className="w-px h-4 bg-border my-auto mx-1" />
                                    <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)}>
                                        {showDebug ? "Show Events" : "Debug"}
                                    </Button>
                                </div>
                            </div>

                            {showDebug ? (
                                <ScrollArea className="h-[calc(90vh-280px)] sm:h-[calc(85vh-280px)] border rounded-lg">
                                    <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                                        {debugText || "No debug text."}
                                    </pre>
                                </ScrollArea>
                            ) : (
                                <ScrollArea className="h-[calc(90vh-280px)] sm:h-[calc(85vh-280px)]">
                                    <div className="grid gap-3 sm:grid-cols-2 pr-4 pb-4">
                                        {events.map((event, i) => (
                                            <Card
                                                key={i}
                                                className={cn(
                                                    "cursor-pointer transition-all hover:bg-muted/50 relative overflow-hidden",
                                                    event.selected ? "border-primary/50 shadow-sm" : "opacity-60 border-transparent bg-muted/20"
                                                )}
                                                onClick={() => toggleEvent(i)}
                                            >
                                                {event.selected && (
                                                    <div className="absolute top-0 right-0 p-1.5 bg-primary/10 rounded-bl-lg">
                                                        <IconCheck className="w-3.5 h-3.5 text-primary" />
                                                    </div>
                                                )}
                                                <div className="p-4 flex gap-3">
                                                    <div className="pt-0.5">
                                                        <Checkbox
                                                            checked={event.selected}
                                                            onCheckedChange={() => toggleEvent(i)}
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn("text-[10px] uppercase font-bold px-1.5 h-5 gap-1", getTypeBadge(event.type))}
                                                            >
                                                                {getTypeIcon(event.type)}
                                                                {event.type}
                                                            </Badge>
                                                            <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border">
                                                                {event.startDate}
                                                                {event.endDate && event.endDate !== event.startDate && ` → ${event.endDate}`}
                                                            </span>
                                                        </div>
                                                        <div className="pr-6">
                                                            <p className="text-sm font-semibold leading-tight">{event.title}</p>
                                                            {event.description && (
                                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    )}
                </div>

                {step === "review" && !showDebug && (
                    <DialogFooter className="shrink-0 p-6 pt-4 border-t flex-row gap-2 sm:justify-end mt-auto">
                        <Button variant="outline" onClick={resetState}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving || selectedCount === 0} className="gap-2">
                            {isSaving ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
                            Import {selectedCount} Events
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}
