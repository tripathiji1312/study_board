"use client"

import * as React from "react"
import { IconUpload, IconFileText, IconLoader2, IconX, IconCheck, IconRefresh, IconArrowRight, IconTrophy } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ParsedGrades {
    code: string
    name: string
    cat1?: number
    cat2?: number
    da?: number
    fat?: number
    labInternal?: number
    labFat?: number
}

interface GradesImporterProps {
    onImportComplete?: () => void
}

export function GradesImporter({ onImportComplete }: GradesImporterProps) {
    const [file, setFile] = React.useState<File | null>(null)
    const [isParsing, setIsParsing] = React.useState(false)
    const [parsedGrades, setParsedGrades] = React.useState<ParsedGrades[]>([])
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

    const parseGrades = async () => {
        if (!file) return

        setIsParsing(true)
        setDebugText("")
        setIsOcrActive(false)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/grades/parse', { method: 'POST', body: formData })
            const data = await res.json()

            if (!res.ok) throw new Error(data.details || data.error || 'Failed to parse')

            if (data.debugText) setDebugText(data.debugText)
            setIsOcrActive(!!data.ocrActive)

            if (data.grades && data.grades.length > 0) {
                setParsedGrades(data.grades)
                setStep("review")
                toast.success(`Found marks for ${data.grades.length} subjects`)
            } else {
                toast.error("Could not find any grades. Check Debug view.")
                if (data.debugText) {
                    setStep("review")
                    setShowDebug(true)
                }
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error"

            if (message.includes("API Key")) {
                toast.error("AI Features Disabled", {
                    description: "Please configure your Groq API Key in Settings to parse files.",
                    duration: 5000,
                })
            } else {
                toast.error(`Parsing failed: ${message}`)
            }
        } finally {
            setIsParsing(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/grades/parse', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grades: parsedGrades
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to save to database')

            toast.success(`Updated marks for ${data.updated} subjects!`)
            setOpen(false)
            resetState()
            onImportComplete?.()
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error"
            toast.error("Failed to save grades: " + message)
        } finally {
            setIsSaving(false)
        }
    }

    const resetState = () => {
        setStep("upload")
        setFile(null)
        setParsedGrades([])
        setDebugText("")
        setShowDebug(false)
    }

    const updateGrade = (index: number, field: keyof ParsedGrades, value: number | undefined) => {
        const newGrades = [...parsedGrades]
        newGrades[index] = { ...newGrades[index], [field]: value }
        setParsedGrades(newGrades)
    }

    const removeGrade = (index: number) => {
        setParsedGrades(parsedGrades.filter((_, i) => i !== index))
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetState() }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <IconTrophy className="w-4 h-4" />
                    <span>Import Grades <span className="hidden sm:inline">with AI</span></span>
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-3xl h-[90vh] sm:h-[85vh] p-0 flex flex-col gap-0 border-border/50 bg-surface-container-low shadow-xl">
                <DialogHeader className="shrink-0 p-6 pb-4 border-b border-border/50 bg-surface-container-low/50 backdrop-blur-sm">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-on-surface">
                        <IconTrophy className="w-5 h-5 text-tertiary" />
                        Import Grades
                        {isOcrActive && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 text-[10px] ml-2 font-mono">
                                <IconLoader2 className="w-3 h-3 mr-1 animate-spin" /> OCR
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-on-surface-variant">
                        Upload a PDF or screenshot of your marks. We&apos;ll extract scores automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-6 bg-surface-container-lowest">
                    {step === "upload" ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-border/60 rounded-3xl bg-surface-container-low hover:bg-surface-container transition-all duration-300">
                            {isParsing ? (
                                <div className="text-center space-y-4">
                                    <div className="relative w-16 h-16 mx-auto">
                                        <div className="absolute inset-0 rounded-full border-4 border-tertiary/20"></div>
                                        <div className="absolute inset-0 rounded-full border-4 border-tertiary border-t-transparent animate-spin"></div>
                                        <IconLoader2 className="absolute inset-0 m-auto w-6 h-6 text-tertiary animate-pulse" />
                                    </div>
                                    <p className="text-lg font-medium text-on-surface">Analyzing grades...</p>
                                    <p className="text-sm text-on-surface-variant">This may take a moment</p>
                                </div>
                            ) : file ? (
                                <div className="text-center space-y-6">
                                    <div className="w-20 h-20 bg-tertiary/10 rounded-2xl flex items-center justify-center mx-auto text-tertiary">
                                        <IconFileText className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-on-surface">{file.name}</p>
                                        <p className="text-sm text-on-surface-variant">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <div className="flex gap-3 justify-center">
                                        <Button variant="outline" onClick={() => setFile(null)} className="rounded-full border-border/50">Change</Button>
                                        <Button onClick={parseGrades} className="gap-2 rounded-full shadow-lg shadow-tertiary/20 bg-tertiary hover:bg-tertiary/90">
                                            Parse <IconArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-6">
                                    <div className="w-24 h-24 bg-surface-container-highest rounded-3xl flex items-center justify-center mx-auto text-on-surface-variant/50 group-hover:text-tertiary group-hover:scale-110 transition-all duration-500">
                                        <IconUpload className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-on-surface">Drop your file here</p>
                                        <p className="text-sm text-on-surface-variant mt-1">PDF or Image (PNG, JPG)</p>
                                    </div>
                                    <Button onClick={() => inputRef.current?.click()} size="lg" className="rounded-full px-8 shadow-lg shadow-tertiary/20 bg-tertiary hover:bg-tertiary/90 text-on-tertiary">
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
                                    Found marks for <span className="font-bold text-tertiary text-base">{parsedGrades.length}</span> subjects
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)} className="text-on-surface-variant hover:text-tertiary rounded-full">
                                        {showDebug ? "Show Grades" : "Debug"}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={resetState} className="text-on-surface-variant hover:text-tertiary rounded-full">
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
                                        {parsedGrades.map((grade, i) => (
                                            <Card key={i} className="group relative p-4 bg-surface-container hover:bg-surface-container-high transition-colors border-border/40 hover:border-tertiary/30 rounded-2xl shadow-sm">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 text-error hover:text-error hover:bg-error/10 rounded-lg transition-all"
                                                    onClick={() => removeGrade(i)}
                                                >
                                                    <IconX className="w-4 h-4" />
                                                </Button>

                                                <div className="space-y-4">
                                                    <div className="pr-8">
                                                        <p className="font-bold text-sm truncate text-on-surface">{grade.name}</p>
                                                        <p className="text-xs text-on-surface-variant font-mono mt-0.5">{grade.code}</p>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-on-surface-variant/80 uppercase tracking-wider font-semibold">CAT1</Label>
                                                            <Input
                                                                type="number"
                                                                value={grade.cat1 || ''}
                                                                onChange={(e) => updateGrade(i, 'cat1', parseFloat(e.target.value) || undefined)}
                                                                className="h-8 text-xs bg-surface-container-highest/50 border-transparent focus:border-tertiary/50 focus:bg-surface-container-highest transition-all rounded-lg font-mono text-center"
                                                                placeholder="-"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-on-surface-variant/80 uppercase tracking-wider font-semibold">CAT2</Label>
                                                            <Input
                                                                type="number"
                                                                value={grade.cat2 || ''}
                                                                onChange={(e) => updateGrade(i, 'cat2', parseFloat(e.target.value) || undefined)}
                                                                className="h-8 text-xs bg-surface-container-highest/50 border-transparent focus:border-tertiary/50 focus:bg-surface-container-highest transition-all rounded-lg font-mono text-center"
                                                                placeholder="-"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-on-surface-variant/80 uppercase tracking-wider font-semibold">DA</Label>
                                                            <Input
                                                                type="number"
                                                                value={grade.da || ''}
                                                                onChange={(e) => updateGrade(i, 'da', parseFloat(e.target.value) || undefined)}
                                                                className="h-8 text-xs bg-surface-container-highest/50 border-transparent focus:border-tertiary/50 focus:bg-surface-container-highest transition-all rounded-lg font-mono text-center"
                                                                placeholder="-"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-on-surface-variant/80 uppercase tracking-wider font-semibold">FAT</Label>
                                                            <Input
                                                                type="number"
                                                                value={grade.fat || ''}
                                                                onChange={(e) => updateGrade(i, 'fat', parseFloat(e.target.value) || undefined)}
                                                                className="h-8 text-xs bg-surface-container-highest/50 border-transparent focus:border-tertiary/50 focus:bg-surface-container-highest transition-all rounded-lg font-mono text-center"
                                                                placeholder="-"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-on-surface-variant/80 uppercase tracking-wider font-semibold">Lab Int</Label>
                                                            <Input
                                                                type="number"
                                                                value={grade.labInternal || ''}
                                                                onChange={(e) => updateGrade(i, 'labInternal', parseFloat(e.target.value) || undefined)}
                                                                className="h-8 text-xs bg-surface-container-highest/50 border-transparent focus:border-tertiary/50 focus:bg-surface-container-highest transition-all rounded-lg font-mono text-center"
                                                                placeholder="-"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-on-surface-variant/80 uppercase tracking-wider font-semibold">Lab FAT</Label>
                                                            <Input
                                                                type="number"
                                                                value={grade.labFat || ''}
                                                                onChange={(e) => updateGrade(i, 'labFat', parseFloat(e.target.value) || undefined)}
                                                                className="h-8 text-xs bg-surface-container-highest/50 border-transparent focus:border-tertiary/50 focus:bg-surface-container-highest transition-all rounded-lg font-mono text-center"
                                                                placeholder="-"
                                                            />
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
                    <DialogFooter className="shrink-0 p-6 pt-4 border-t border-border/50 flex-row gap-3 sm:justify-end bg-surface-container-low/50 backdrop-blur-sm">
                        <Button variant="outline" onClick={resetState} className="rounded-full border-border/50">Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving || parsedGrades.length === 0} className="gap-2 rounded-full shadow-lg shadow-tertiary/20 bg-tertiary hover:bg-tertiary/90 text-on-tertiary">
                            {isSaving ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
                            Update Marks
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}
