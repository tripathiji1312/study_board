"use client"

import * as React from "react"
import { IconUpload, IconFileText, IconLoader2, IconX, IconCheck, IconRefresh, IconArrowRight } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface ParsedModule {
    title: string
    topics: string[]
}

interface SyllabusImporterProps {
    subjectId: string
    onImportComplete?: () => void
}

export function SyllabusImporter({ subjectId, onImportComplete }: SyllabusImporterProps) {
    const [file, setFile] = React.useState<File | null>(null)
    const [isParsing, setIsParsing] = React.useState(false)
    const [parsedModules, setParsedModules] = React.useState<ParsedModule[]>([])
    const [step, setStep] = React.useState<"upload" | "review">("upload")
    const [open, setOpen] = React.useState(false)
    const [showDebug, setShowDebug] = React.useState(false)
    const [debugText, setDebugText] = React.useState<string>("")
    const [isSaving, setIsSaving] = React.useState(false)

    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const parseSyllabus = async () => {
        if (!file) return

        setIsParsing(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/syllabus/parse', { method: 'POST', body: formData })
            const data = await res.json()

            if (!res.ok) throw new Error(data.details || data.error || 'Failed to parse')

            if (data.debugText) setDebugText(data.debugText)

            if (data.modules && data.modules.length > 0) {
                setParsedModules(data.modules)
                setStep("review")
            } else {
                toast.error("Could not find any modules. Check Debug view.")
                if (data.debugText) {
                    setStep("review")
                    setShowDebug(true)
                }
            }
        } catch (error: any) {
            if (error.message?.includes("API Key")) {
                toast.error("AI Features Disabled", {
                    description: "Please configure your Groq API Key in Settings to parse PDFs.",
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
            const res = await fetch('/api/syllabus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subjectId,
                    modules: parsedModules,
                    mode: 'replace'
                })
            })

            if (!res.ok) throw new Error('Failed to save to database')

            toast.success("Syllabus imported successfully!")
            setOpen(false)
            setStep("upload")
            setFile(null)
            setParsedModules([])
            setDebugText("")
            onImportComplete?.()
        } catch (error: any) {
            toast.error("Failed to save syllabus: " + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const updateModule = (index: number, field: keyof ParsedModule, value: any) => {
        const newModules = [...parsedModules]
        newModules[index] = { ...newModules[index], [field]: value }
        setParsedModules(newModules)
    }

    const removeModule = (index: number) => {
        setParsedModules(parsedModules.filter((_, i) => i !== index))
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <IconUpload className="w-4 h-4" />
                    Import Syllabus with AI
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden outline-none bg-background/95 backdrop-blur-xl">
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle>Import Syllabus PDF</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {step === "upload" ? (
                        <div className="h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                {isParsing ? (
                                    <IconLoader2 className="w-10 h-10 animate-spin text-primary" />
                                ) : (
                                    <IconFileText className="w-10 h-10 text-primary" />
                                )}
                            </div>

                            {isParsing ? (
                                <div className="text-center space-y-2">
                                    <p className="text-xl font-medium animate-pulse">Analyzing document...</p>
                                    <p className="text-sm text-muted-foreground">Extracting modules and topics</p>
                                </div>
                            ) : file ? (
                                <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
                                    <div>
                                        <p className="text-lg font-medium">{file.name}</p>
                                        <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <div className="flex gap-3 justify-center">
                                        <Button variant="outline" onClick={() => setFile(null)}>Change File</Button>
                                        <Button onClick={parseSyllabus} className="gap-2">
                                            Start Parsing <IconArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-3">
                                    <p className="text-xl font-medium">Drop your PDF here</p>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                                        Upload your course syllabus PDF. Our AI will automatically extract modules and topics.
                                    </p>
                                    <Button size="lg" onClick={() => inputRef.current?.click()} className="rounded-full px-8">
                                        Select PDF File
                                    </Button>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        ref={inputRef}
                                        onChange={handleFileChange}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between sticky top-0 z-10 py-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Found <span className="text-foreground">{parsedModules.length}</span> modules
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)}>
                                        {showDebug ? "Hide Debug" : "Show Debug"}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
                                        <IconRefresh className="w-4 h-4 mr-2" />
                                        Reset
                                    </Button>
                                </div>
                            </div>

                            {showDebug && (
                                <div className="p-4 bg-muted/50 rounded-lg border font-mono text-xs whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                                    {debugText || "No debug text received."}
                                </div>
                            )}

                            <div className="grid gap-4 pb-20">
                                {parsedModules.map((mod, i) => (
                                    <Card key={i} className="group relative border-muted-foreground/20 hover:border-primary/50 transition-colors">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 z-10"
                                            onClick={() => removeModule(i)}
                                        >
                                            <IconX className="w-4 h-4" />
                                        </Button>
                                        <div className="p-5 space-y-4">
                                            <div className="flex gap-4">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 space-y-4">
                                                    <div>
                                                        <Input
                                                            value={mod.title}
                                                            onChange={(e) => updateModule(i, 'title', e.target.value)}
                                                            className="text-lg font-semibold bg-transparent border-0 px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30 rounded-none border-b border-transparent focus:border-primary/50"
                                                            placeholder={`Module ${i + 1}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Topics</p>
                                                        <Textarea
                                                            value={mod.topics.join('\n')}
                                                            onChange={(e) => updateModule(i, 'topics', e.target.value.split('\n'))}
                                                            className="min-h-[100px] bg-muted/30 font-mono text-sm leading-relaxed resize-y"
                                                            placeholder="Enter topics, one per line..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {step === "review" && (
                    <div className="p-4 border-t bg-background/95 backdrop-blur flex justify-end gap-3 sticky bottom-0 z-20">
                        <Button variant="outline" onClick={() => setStep("upload")}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="gap-2 min-w-[140px]">
                            {isSaving ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
                            Save Syllabus
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
