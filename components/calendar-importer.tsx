"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { IconUpload, IconCalendarEvent, IconLoader2, IconCheck, IconX } from "@tabler/icons-react"
import { toast } from "sonner"
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
    const [isOpen, setIsOpen] = React.useState(false)
    const [isParsing, setIsParsing] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)
    const [events, setEvents] = React.useState<CalendarEvent[]>([])
    const [fileName, setFileName] = React.useState("")
    const [showDebug, setShowDebug] = React.useState(false)
    const [debugText, setDebugText] = React.useState("")
    const [isOcrActive, setIsOcrActive] = React.useState(false)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        setIsParsing(true)
        setEvents([])
        setDebugText("")
        setShowDebug(false)
        setIsOcrActive(false)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/calendar/parse', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()

            if (!res.ok) {
                if (data.debugText) setDebugText(data.debugText)
                throw new Error(data.error || 'Failed to parse calendar')
            }

            if (data.debugText) {
                setDebugText(data.debugText)
                setIsOcrActive(data.debugText.startsWith('OCR_FALLBACK_ACTIVE'))
            }

            // Mark all events as selected by default
            const parsedEvents = (data.events || []).map((e: CalendarEvent) => ({
                ...e,
                selected: true
            }))

            if (parsedEvents.length === 0) {
                toast.error("No events found in this file. Check the Debug view.")
                setShowDebug(true)
            } else {
                toast.success(`Found ${parsedEvents.length} events`)
            }

            setEvents(parsedEvents)

        } catch (error) {
            console.error('Parse error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to parse calendar')
        } finally {
            setIsParsing(false)
        }
    }

    const toggleEvent = (index: number) => {
        setEvents(prev => prev.map((e, i) =>
            i === index ? { ...e, selected: !e.selected } : e
        ))
    }

    const toggleAll = (selected: boolean) => {
        setEvents(prev => prev.map(e => ({ ...e, selected })))
    }

    const handleSave = async () => {
        const selectedEvents = events.filter(e => e.selected)
        if (selectedEvents.length === 0) {
            toast.error('No events selected')
            return
        }

        setIsSaving(true)

        try {
            const res = await fetch('/api/calendar/parse', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events: selectedEvents })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save events')
            }

            toast.success(`Added ${data.results.exams} exams, ${data.results.scheduleEvents} events`)
            setIsOpen(false)
            setEvents([])
            setFileName("")
            setDebugText("")
            setShowDebug(false)
            onImportComplete?.()

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save events')
        } finally {
            setIsSaving(false)
        }
    }

    const getTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            exam: "bg-red-500/10 text-red-500 border-red-500/20",
            holiday: "bg-green-500/10 text-green-500 border-green-500/20",
            event: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            deadline: "bg-orange-500/10 text-orange-500 border-orange-500/20"
        }
        return styles[type] || "bg-muted"
    }

    const selectedCount = events.filter(e => e.selected).length

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <IconUpload className="w-4 h-4" />
                    Import Calendar
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <DialogTitle className="flex items-center gap-2">
                                <IconCalendarEvent className="w-5 h-5" />
                                Import Academic Calendar
                            </DialogTitle>
                            {isOcrActive && (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 w-fit">
                                    <IconLoader2 className="w-3 h-3 animate-spin" />
                                    AI VISION OCR ACTIVE
                                </div>
                            )}
                        </div>
                        {debugText && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDebug(!showDebug)}
                                className="text-xs mr-4"
                            >
                                {showDebug ? "Show Events" : "Show Debug"}
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {showDebug ? (
                        <div className="flex flex-col gap-2 h-[400px]">
                            <p className="text-xs text-muted-foreground">
                                This is the raw text extracted from your PDF. Use this to verify if the text is readable.
                            </p>
                            <textarea
                                className="w-full h-full p-4 bg-muted font-mono text-xs rounded-lg border resize-none focus:outline-none"
                                value={debugText}
                                readOnly
                            />
                        </div>
                    ) : (
                        <>
                            {/* Upload Area */}
                            {events.length === 0 && (
                                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                                    {isParsing ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
                                            <p className="text-sm text-muted-foreground">
                                                Analyzing document...
                                            </p>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <input
                                                type="file"
                                                accept=".pdf,image/*"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                            />
                                            <div className="flex flex-col items-center gap-3">
                                                <IconUpload className="w-10 h-10 text-muted-foreground" />
                                                <div>
                                                    <p className="font-semibold text-lg">Upload Calendar</p>
                                                    <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                                                        Select a PDF or image of your academic calendar table. We'll extract events automatically.
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            )}

                            {/* Events List */}
                            {events.length > 0 && (
                                <>
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-sm text-muted-foreground font-medium">
                                            <span className="text-primary">{selectedCount}</span> of {events.length} events found
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs h-7"
                                                onClick={() => toggleAll(true)}
                                            >
                                                Select All
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs h-7"
                                                onClick={() => toggleAll(false)}
                                            >
                                                Deselect All
                                            </Button>
                                        </div>
                                    </div>

                                    <ScrollArea className="flex-1 max-h-[500px]">
                                        <div className="space-y-3 pr-4">
                                            {events.map((event, index) => (
                                                <Card
                                                    key={index}
                                                    className={cn(
                                                        "cursor-pointer transition-all hover:bg-muted/50",
                                                        event.selected
                                                            ? "border-primary/50 shadow-sm"
                                                            : "opacity-60 border-transparent bg-muted/20"
                                                    )}
                                                    onClick={() => toggleEvent(index)}
                                                >
                                                    <div className="p-4 flex items-start gap-4">
                                                        <Checkbox
                                                            checked={event.selected}
                                                            className="mt-1"
                                                            onCheckedChange={() => toggleEvent(index)}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn("text-[10px] uppercase tracking-wider font-bold py-0 h-4 px-1.5", getTypeBadge(event.type))}
                                                                >
                                                                    {event.type}
                                                                </Badge>
                                                                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                                    {event.startDate}
                                                                    {event.endDate && event.endDate !== event.startDate && (
                                                                        <> → {event.endDate}</>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <p className="font-semibold text-sm">
                                                                {event.title}
                                                            </p>
                                                            {event.description && (
                                                                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                                                                    {event.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter className="mt-4 pt-4 border-t">
                    {(events.length > 0 || debugText) && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setEvents([])
                                setFileName("")
                                setDebugText("")
                                setShowDebug(false)
                            }}
                        >
                            Start Over
                        </Button>
                    )}
                    <div className="flex-1" />
                    {events.length > 0 && !showDebug && (
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || selectedCount === 0}
                            className="min-w-[140px]"
                        >
                            {isSaving ? (
                                <>
                                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <IconCheck className="w-4 h-4 mr-2" />
                                    Import {selectedCount} Events
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
