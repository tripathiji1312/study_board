"use client"

import * as React from "react"
import { IconUpload, IconFileText, IconLoader2, IconX, IconCheck, IconRefresh } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useStore } from "@/components/providers/store-provider"

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

    const { addModule } = useStore()
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
            console.log("Starting upload...")
            const res = await fetch('/api/syllabus/parse', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            console.log("Server response:", data)

            if (!res.ok) {
                console.error("Server Error:", data)
                throw new Error(data.details || data.error || 'Failed to parse')
            }

            if (data.debugText) {
                setDebugText(data.debugText)
            }

            if (data.modules && data.modules.length > 0) {
                setParsedModules(data.modules)
                setStep("review")
            } else {
                toast.error("Could not find any modules. Check Debug view.")
                // Go to review anyway if we have text to show debugging
                if (data.debugText) {
                    setStep("review")
                    setShowDebug(true)
                }
            }
        } catch (error: any) {
            toast.error(`Parsing failed: ${error.message}`)
            console.error(error)
        } finally {
            setIsParsing(false)
        }
    }

    const handleSave = () => {
        // Save all modules to the store
        parsedModules.forEach(mod => {
            addModule(subjectId, {
                title: mod.title,
                topics: mod.topics,
                status: "Pending"
            })
        })

        toast.success(`Imported ${parsedModules.length} modules!`)
        setOpen(false)
        setStep("upload")
        setFile(null)
        setParsedModules([])
        setDebugText("")
        onImportComplete?.()
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
                    Import Syllabus
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Import Syllabus PDF</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-0">
                    {step === "upload" ? (
                        <div className="h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-muted/30 mt-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                {isParsing ? (
                                    <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
                                ) : (
                                    <IconFileText className="w-8 h-8 text-primary" />
                                )}
                            </div>

                            {isParsing ? (
                                <p className="text-lg font-medium animate-pulse">Analyzing syllabus structure...</p>
                            ) : file ? (
                                <div className="text-center space-y-4">
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                    <div className="flex gap-2 justify-center">
                                        <Button variant="ghost" onClick={() => setFile(null)}>Change</Button>
                                        <Button onClick={parseSyllabus}>Start Parsing</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-2">
                                    <p className="text-lg font-medium">Drop your PDF here</p>
                                    <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                                    <Button onClick={() => inputRef.current?.click()}>
                                        Choose File
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
                            <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-2 border-b">
                                <p className="text-sm text-muted-foreground">
                                    Found {parsedModules.length} modules
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)}>
                                        {showDebug ? "Hide Debug" : "Show Debug"}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
                                        <IconRefresh className="w-4 h-4 mr-2" />
                                        Re-upload
                                    </Button>
                                </div>
                            </div>

                            {showDebug && (
                                <div className="p-4 bg-muted/50 rounded-md border font-mono text-xs whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                                    {debugText || "No debug text received from server."}
                                </div>
                            )}

                            <div className="space-y-6 pb-20">
                                {parsedModules.map((mod, i) => (
                                    <Card key={i} className="relative group">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                                            onClick={() => removeModule(i)}
                                        >
                                            <IconX className="w-4 h-4" />
                                        </Button>
                                        <CardContent className="p-4 space-y-3">
                                            <Input
                                                value={mod.title}
                                                onChange={(e) => updateModule(i, 'title', e.target.value)}
                                                className="font-semibold bg-transparent border-none px-0 h-auto text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50"
                                                placeholder="Module Title"
                                            />
                                            <Textarea
                                                value={mod.topics.join('\n')}
                                                onChange={(e) => updateModule(i, 'topics', e.target.value.split('\n'))}
                                                className="min-h-[100px] font-mono text-sm leading-relaxed"
                                                placeholder="Enter topics, one per line"
                                            />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {step === "review" && (
                    <div className="p-4 border-t bg-background flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setStep("upload")}>Cancel</Button>
                        <Button onClick={handleSave} className="gap-2">
                            <IconCheck className="w-4 h-4" />
                            Save to Subject
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
