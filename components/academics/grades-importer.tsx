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
        } catch (error: any) {
            toast.error("Failed to save grades: " + error.message)
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

    const updateGrade = (index: number, field: keyof ParsedGrades, value: any) => {
        const newGrades = [...parsedGrades]
        // @ts-ignore
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
            <DialogContent className="w-[95vw] max-w-3xl h-[90vh] sm:h-[85vh] p-0 flex flex-col gap-0">
                <DialogHeader className="shrink-0 p-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <IconTrophy className="w-5 h-5" />
                        Import Grades
                        {isOcrActive && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 text-[10px] ml-2">
                                <IconLoader2 className="w-3 h-3 mr-1 animate-spin" /> OCR
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Upload a PDF or screenshot of your marks. We'll extract scores automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-6">
                    {step === "upload" ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                            {isParsing ? (
                                <div className="text-center space-y-3">
                                    <IconLoader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                                    <p className="text-lg font-medium">Analyzing grades...</p>
                                    <p className="text-sm text-muted-foreground">This may take a moment</p>
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
                                        <Button onClick={parseGrades} className="gap-2">
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
                                    Found marks for <span className="font-semibold text-foreground">{parsedGrades.length}</span> subjects
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)}>
                                        {showDebug ? "Show Grades" : "Debug"}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={resetState}>
                                        <IconRefresh className="w-4 h-4" />
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
                                        {parsedGrades.map((grade, i) => (
                                            <Card key={i} className="group relative p-3 sm:p-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                                                    onClick={() => removeGrade(i)}
                                                >
                                                    <IconX className="w-3 h-3" />
                                                </Button>

                                                <div className="space-y-2">
                                                    <div className="pr-6">
                                                        <p className="font-semibold text-sm truncate">{grade.name}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">{grade.code}</p>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <Label className="text-[10px] text-muted-foreground">CAT1</Label>
                                                            <Input
                                                                type="number"
                                                                value={grade.cat1 || ''}
                                                                onChange={(e) => updateGrade(i, 'cat1', parseFloat(e.target.value) || undefined)}
                                                                className="h-7 text-xs"
                                                                placeholder="-"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-muted-foreground">CAT2</Label>
                                                            <Input
                                                                type="number"
                                                                value={grade.cat2 || ''}
                                                                onChange={(e) => updateGrade(i, 'cat2', parseFloat(e.target.value) || undefined)}
                                                                className="h-7 text-xs"
                                                                placeholder="-"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-muted-foreground">DA</Label>
                                                            <Input
                                                                type="number"
                                                                value={grade.da || ''}
                                                                onChange={(e) => updateGrade(i, 'da', parseFloat(e.target.value) || undefined)}
                                                                className="h-7 text-xs"
                                                                placeholder="-"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-muted-foreground">FAT</Label>
                                                            <Input
                                                                type="number"
                                                                value={grade.fat || ''}
                                                                onChange={(e) => updateGrade(i, 'fat', parseFloat(e.target.value) || undefined)}
                                                                className="h-7 text-xs"
                                                                placeholder="-"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-muted-foreground">Lab Int</Label>
                                                            <Input
                                                                type="number"
                                                                value={grade.labInternal || ''}
                                                                onChange={(e) => updateGrade(i, 'labInternal', parseFloat(e.target.value) || undefined)}
                                                                className="h-7 text-xs"
                                                                placeholder="-"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-muted-foreground">Lab FAT</Label>
                                                            <Input
                                                                type="number"
                                                                value={grade.labFat || ''}
                                                                onChange={(e) => updateGrade(i, 'labFat', parseFloat(e.target.value) || undefined)}
                                                                className="h-7 text-xs"
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
                    <DialogFooter className="shrink-0 p-6 pt-4 border-t flex-row gap-2 sm:justify-end">
                        <Button variant="outline" onClick={resetState}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving || parsedGrades.length === 0} className="gap-2">
                            {isSaving ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
                            Update Marks
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}
