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
            exam: "bg-error/10 text-error border-error/20",
            holiday: "bg-tertiary/10 text-tertiary border-tertiary/20",
            event: "bg-primary/10 text-primary border-primary/20",
            deadline: "bg-secondary/10 text-secondary border-secondary/20"
        }
        return styles[type] || "bg-surface-container-high text-on-surface-variant"
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'exam': return <IconAlertTriangle className="w-3.5 h-3.5" />
            case 'holiday': return <IconCalendarEvent className="w-3.5 h-3.5" />
            case 'event': return <IconSchool className="w-3.5 h-3.5" />
            case 'deadline': return <IconFlag className="w-3.5 h-3.5" />
            default: return <IconCalendarEvent className="w-3.5 h-3.5" />
        }
    }

    const selectedCount = events.filter(e => e.selected).length

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetState() }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-full border-border/40 hover:bg-surface-container-high bg-surface">
                    <IconCalendarEvent className="w-4 h-4" />
                    Import Calendar with AI
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-3xl h-[90vh] sm:h-[85vh] p-0 flex flex-col gap-0 overflow-hidden rounded-[2.5rem] bg-surface-container border-none shadow-xl">
                <DialogHeader className="shrink-0 p-8 pb-4 border-b border-border/10">
                    <DialogTitle className="flex items-center gap-2 text-2xl font-normal">
                        <IconCalendarEvent className="w-6 h-6 text-primary" />
                        Import Academic Calendar
                        {isOcrActive && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 text-[10px] ml-2 border-amber-500/20">
                                <IconLoader2 className="w-3 h-3 mr-1 animate-spin" /> OCR
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-base text-on-surface-variant/80">
                        Upload a PDF or image of your academic calendar. We'll extract events and holidays.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-8 bg-surface-container-low/50">
                    {step === "upload" ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/20 rounded-[2rem] bg-surface-container-lowest/50 hover:bg-surface-container-lowest transition-colors">
                            {isParsing ? (
                                <div className="text-center space-y-6 w-full max-w-sm">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-4 rounded-full bg-primary/10">
                                            <IconLoader2 className="w-12 h-12 animate-spin text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-medium text-on-surface">Analyzing calendar...</p>
                                            <p className="text-sm text-on-surface-variant mt-1">This uses AI and may take up to 30 seconds.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 pt-2">
                                        <Skeleton className="h-14 w-full rounded-xl bg-surface-container-high/50" />
                                        <Skeleton className="h-14 w-full rounded-xl bg-surface-container-high/30" />
                                        <Skeleton className="h-14 w-full rounded-xl bg-surface-container-high/10" />
                                    </div>
                                </div>
                            ) : file ? (
                                <div className="text-center space-y-6">
                                    <div className="p-6 bg-primary/5 rounded-full inline-flex mx-auto">
                                        <IconFileText className="w-16 h-16 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-medium text-on-surface">{file.name}</p>
                                        <p className="text-sm text-on-surface-variant mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <div className="flex gap-3 justify-center">
                                        <Button variant="outline" onClick={() => setFile(null)} className="rounded-full px-6">Change</Button>
                                        <Button onClick={parseCalendar} className="gap-2 rounded-full px-8">
                                            Parse <IconArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-6 cursor-pointer" onClick={() => inputRef.current?.click()}>
                                    <div className="p-6 bg-surface-container-high rounded-full inline-flex mx-auto group-hover:scale-110 transition-transform">
                                        <IconUpload className="w-16 h-16 text-on-surface-variant/50" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-medium text-on-surface">Drop your file here</p>
                                        <p className="text-base text-on-surface-variant mt-1">PDF or Image (PNG, JPG)</p>
                                    </div>
                                    <Button variant="default" className="rounded-full px-8 h-12 text-base">
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
                            <div className="shrink-0 flex items-center justify-between px-1">
                                <p className="text-sm text-on-surface-variant">
                                    Found <span className="font-semibold text-primary">{events.length}</span> events
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => toggleAll(true)} className="text-xs rounded-full">
                                        Select All
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => toggleAll(false)} className="text-xs rounded-full">
                                        Deselect All
                                    </Button>
                                    <div className="w-px h-4 bg-border/20 my-auto mx-1" />
                                    <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)} className="text-xs rounded-full">
                                        {showDebug ? "Show Events" : "Debug"}
                                    </Button>
                                </div>
                            </div>

                            {showDebug ? (
                                <ScrollArea className="flex-1 border rounded-2xl bg-surface-container-lowest p-4">
                                    <pre className="text-xs font-mono whitespace-pre-wrap text-on-surface-variant">
                                        {debugText || "No debug text."}
                                    </pre>
                                </ScrollArea>
                            ) : (
                                <ScrollArea className="flex-1 -mr-4 pr-4">
                                    <div className="grid gap-3 sm:grid-cols-2 pb-4">
                                        {events.map((event, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "cursor-pointer transition-all rounded-xl relative overflow-hidden border",
                                                    event.selected 
                                                        ? "bg-surface border-primary/20 shadow-sm" 
                                                        : "opacity-60 border-transparent bg-surface-container-lowest"
                                                )}
                                                onClick={() => toggleEvent(i)}
                                            >
                                                {event.selected && (
                                                    <div className="absolute top-0 right-0 p-1.5 bg-primary rounded-bl-xl z-10">
                                                        <IconCheck className="w-3.5 h-3.5 text-on-primary" />
                                                    </div>
                                                )}
                                                <div className="p-4 flex gap-4">
                                                    <div className="pt-1">
                                                        <Checkbox
                                                            checked={event.selected}
                                                            onCheckedChange={() => toggleEvent(i)}
                                                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary border-on-surface-variant/30"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn("text-[10px] uppercase font-bold px-2 h-6 gap-1.5 rounded-md border-0", getTypeBadge(event.type))}
                                                            >
                                                                {getTypeIcon(event.type)}
                                                                {event.type}
                                                            </Badge>
                                                            <span className="text-xs font-mono text-on-surface-variant bg-surface-container-high/50 px-2 py-1 rounded-md">
                                                                {event.startDate}
                                                                {event.endDate && event.endDate !== event.startDate && ` → ${event.endDate}`}
                                                            </span>
                                                        </div>
                                                        <div className="pr-6">
                                                            <p className="text-base font-medium leading-tight text-on-surface">{event.title}</p>
                                                            {event.description && (
                                                                <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">{event.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    )}
                </div>

                {step === "review" && !showDebug && (
                    <DialogFooter className="shrink-0 p-6 pt-4 border-t border-border/10 flex-row gap-3 sm:justify-end mt-auto bg-surface-container">
                        <Button variant="ghost" onClick={resetState} className="rounded-full">Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving || selectedCount === 0} className="gap-2 rounded-full px-6">
                            {isSaving ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
                            Import {selectedCount} Events
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}
