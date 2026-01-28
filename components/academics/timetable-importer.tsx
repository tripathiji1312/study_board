"use client"

import * as React from "react"
import { IconUpload, IconFileText, IconLoader2, IconX, IconCheck, IconRefresh, IconArrowRight, IconCalendarTime } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ParsedSubject {
    code: string
    name: string
    slot: string
    type: string
    teacher?: string
    room?: string
}

interface TimetableImporterProps {
    onImportComplete?: () => void
}

export function TimetableImporter({ onImportComplete }: TimetableImporterProps) {
    const [file, setFile] = React.useState<File | null>(null)
    const [isParsing, setIsParsing] = React.useState(false)
    const [parsedSubjects, setParsedSubjects] = React.useState<ParsedSubject[]>([])
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

    const parseTimetable = async () => {
        if (!file) return

        setIsParsing(true)
        setDebugText("")
        setIsOcrActive(false)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/timetable/parse', { method: 'POST', body: formData })
            const data = await res.json()

            if (!res.ok) throw new Error(data.details || data.error || 'Failed to parse')

            if (data.debugText) setDebugText(data.debugText)
            setIsOcrActive(!!data.ocrActive)

            if (data.subjects && data.subjects.length > 0) {
                setParsedSubjects(data.subjects)
                setStep("review")
                toast.success(`Found ${data.subjects.length} subjects`)
            } else {
                toast.error("Could not find any subjects. Check Debug view.")
                if (data.debugText) {
                    setStep("review")
                    setShowDebug(true)
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : ""
            if (errorMessage.includes("API Key")) {
                toast.error("AI Features Disabled", {
                    description: "Please configure your Groq API Key in Settings to parse files.",
                    duration: 5000,
                })
            } else {
                toast.error(`Parsing failed: ${errorMessage || "Unknown error"}`)
            }
        } finally {
            setIsParsing(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/timetable/parse', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subjects: parsedSubjects
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save to database')

            toast.success(`Updated ${data.updated} subjects, Created ${data.created} new subjects!`)
            setOpen(false)
            resetState()
            onImportComplete?.()
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error"
            toast.error("Failed to save timetable: " + errorMessage)
        } finally {
            setIsSaving(false)
        }
    }

    const resetState = () => {
        setStep("upload")
        setFile(null)
        setParsedSubjects([])
        setDebugText("")
        setShowDebug(false)
    }

    const updateSubject = (index: number, field: keyof ParsedSubject, value: string) => {
        const newSubjects = [...parsedSubjects]
        newSubjects[index] = { ...newSubjects[index], [field]: value }
        setParsedSubjects(newSubjects)
    }

    const removeSubject = (index: number) => {
        setParsedSubjects(parsedSubjects.filter((_, i) => i !== index))
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetState() }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <IconCalendarTime className="w-4 h-4" />
                    Import Timetable with AI
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-3xl h-[90vh] sm:h-[85vh] p-0 flex flex-col gap-0 border-border/50 bg-surface-container-low shadow-xl">
                <DialogHeader className="shrink-0 p-6 pb-4 border-b border-border/50 bg-surface-container-low/50 backdrop-blur-sm">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-on-surface">
                        <IconCalendarTime className="w-5 h-5 text-primary" />
                        Import Timetable
                        {isOcrActive && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 text-[10px] ml-2 font-mono">
                                <IconLoader2 className="w-3 h-3 mr-1 animate-spin" /> OCR
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-on-surface-variant">
                        Upload a PDF or image of your timetable. We&apos;ll extract course details automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-6 bg-surface-container-lowest">
                    {step === "upload" ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-border/60 rounded-3xl bg-surface-container-low hover:bg-surface-container transition-all duration-300">
                            {isParsing ? (
                                <div className="text-center space-y-4">
                                    <div className="relative w-16 h-16 mx-auto">
                                        <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                                        <IconLoader2 className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
                                    </div>
                                    <p className="text-lg font-medium text-on-surface">Analyzing timetable...</p>
                                    <p className="text-sm text-on-surface-variant">This may take a moment</p>
                                </div>
                            ) : file ? (
                                <div className="text-center space-y-6">
                                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                                        <IconFileText className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-on-surface">{file.name}</p>
                                        <p className="text-sm text-on-surface-variant">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <div className="flex gap-3 justify-center">
                                        <Button variant="outline" onClick={() => setFile(null)} className="rounded-full border-border/50">Change</Button>
                                        <Button onClick={parseTimetable} className="gap-2 rounded-full shadow-lg shadow-primary/20">
                                            Parse <IconArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-6">
                                    <div className="w-24 h-24 bg-surface-container-highest rounded-3xl flex items-center justify-center mx-auto text-on-surface-variant/50 group-hover:text-primary group-hover:scale-110 transition-all duration-500">
                                        <IconUpload className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-on-surface">Drop your file here</p>
                                        <p className="text-sm text-on-surface-variant mt-1">PDF or Image (PNG, JPG)</p>
                                    </div>
                                    <Button onClick={() => inputRef.current?.click()} size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
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
                                    Found <span className="font-bold text-primary text-base">{parsedSubjects.length}</span> subjects
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)} className="text-on-surface-variant hover:text-primary rounded-full">
                                        {showDebug ? "Show Subjects" : "Debug"}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={resetState} className="text-on-surface-variant hover:text-primary rounded-full">
                                        <IconRefresh className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {showDebug ? (
                                <ScrollArea className="h-[calc(90vh-280px)] sm:h-[calc(85vh-280px)] border border-border/50 rounded-2xl bg-surface-container-low">
                                    <pre className="p-4 text-xs font-mono whitespace-pre-wrap text-on-surface-variant">
                                        {debugText || "No debug text."}
                                    </pre>
                                </ScrollArea>
                            ) : (
                                <ScrollArea className="h-[calc(90vh-280px)] sm:h-[calc(85vh-280px)]">
                                    <div className="grid gap-3 sm:grid-cols-2 pr-4 pb-4">
                                        {parsedSubjects.map((sub, i) => (
                                            <Card key={i} className="group relative p-4 bg-surface-container hover:bg-surface-container-high transition-colors border-border/40 hover:border-primary/30 rounded-2xl shadow-sm">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 text-error hover:text-error hover:bg-error/10 rounded-lg transition-all"
                                                    onClick={() => removeSubject(i)}
                                                >
                                                    <IconX className="w-4 h-4" />
                                                </Button>

                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-on-surface-variant uppercase font-semibold tracking-wider">Code</Label>
                                                            <Input
                                                                value={sub.code}
                                                                onChange={(e) => updateSubject(i, 'code', e.target.value)}
                                                                className="h-9 font-mono text-xs bg-surface-container-highest/50 border-transparent focus:border-primary/50 focus:bg-surface-container-highest transition-all rounded-lg"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-on-surface-variant uppercase font-semibold tracking-wider">Type</Label>
                                                            <Input
                                                                value={sub.type}
                                                                onChange={(e) => updateSubject(i, 'type', e.target.value)}
                                                                className="h-9 text-xs bg-surface-container-highest/50 border-transparent focus:border-primary/50 focus:bg-surface-container-highest transition-all rounded-lg"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-on-surface-variant uppercase font-semibold tracking-wider">Name</Label>
                                                        <Input
                                                            value={sub.name}
                                                            onChange={(e) => updateSubject(i, 'name', e.target.value)}
                                                            className="h-9 text-xs bg-surface-container-highest/50 border-transparent focus:border-primary/50 focus:bg-surface-container-highest transition-all rounded-lg font-medium"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-on-surface-variant uppercase font-semibold tracking-wider">Slot</Label>
                                                            <Input
                                                                value={sub.slot}
                                                                onChange={(e) => updateSubject(i, 'slot', e.target.value)}
                                                                className="h-9 text-xs bg-surface-container-highest/50 border-transparent focus:border-primary/50 focus:bg-surface-container-highest transition-all rounded-lg"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-on-surface-variant uppercase font-semibold tracking-wider">Room</Label>
                                                            <Input
                                                                value={sub.room || ''}
                                                                onChange={(e) => updateSubject(i, 'room', e.target.value)}
                                                                className="h-9 text-xs bg-surface-container-highest/50 border-transparent focus:border-primary/50 focus:bg-surface-container-highest transition-all rounded-lg"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-on-surface-variant uppercase font-semibold tracking-wider">Faculty</Label>
                                                        <Input
                                                            value={sub.teacher || ''}
                                                            onChange={(e) => updateSubject(i, 'teacher', e.target.value)}
                                                            className="h-9 text-xs bg-surface-container-highest/50 border-transparent focus:border-primary/50 focus:bg-surface-container-highest transition-all rounded-lg"
                                                        />
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
                    <DialogFooter className="shrink-0 p-6 pt-4 border-t border-border/50 flex-row gap-3 sm:justify-end bg-surface-container-low/50 backdrop-blur-sm">
                        <Button variant="outline" onClick={resetState} className="rounded-full border-border/50">Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving || parsedSubjects.length === 0} className="gap-2 rounded-full shadow-lg shadow-primary/20">
                            {isSaving ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
                            Sync {parsedSubjects.length} Subjects
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}
