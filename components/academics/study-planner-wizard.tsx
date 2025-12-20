"use client"

import * as React from "react"
import {
    IconBrain, IconBook, IconCalendarTime, IconChecklist, IconChevronRight,
    IconLoader2, IconSparkles, IconClock, IconUpload, IconFileText, IconX,
    IconCircleCheck, IconCircle, IconTarget, IconFlame, IconBolt
} from "@tabler/icons-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStore } from "@/components/providers/store-provider"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format, addDays, differenceInDays, parseISO } from "date-fns"

// --- Types ---
type Step = "scope" | "context" | "schedule" | "review"

const STEPS = [
    { id: "scope" as Step, label: "Select Topics", icon: IconBook, description: "Choose what to study" },
    { id: "context" as Step, label: "Add Context", icon: IconBrain, description: "Upload PYQs, notes" },
    { id: "schedule" as Step, label: "Set Schedule", icon: IconCalendarTime, description: "Define your timeline" },
    { id: "review" as Step, label: "Review Plan", icon: IconChecklist, description: "Accept your roadmap" },
]

interface StudyPlannerWizardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultSubjectId?: string
    defaultExamId?: string
}

export function StudyPlannerWizard({ open, onOpenChange, defaultSubjectId }: StudyPlannerWizardProps) {
    const { subjects, refreshData, exams } = useStore()
    const [step, setStep] = React.useState<Step>("scope")
    const [loading, setLoading] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)

    // File upload ref
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // State
    const [selectedSubjectId, setSelectedSubjectId] = React.useState(defaultSubjectId || "")
    const [selectedTopics, setSelectedTopics] = React.useState<string[]>([])
    const [strategyPrompt, setStrategyPrompt] = React.useState("")
    const [uploadedFile, setUploadedFile] = React.useState<File | null>(null)
    const [hoursPerDay, setHoursPerDay] = React.useState([4])
    const [examDate, setExamDate] = React.useState("")
    const [intensity, setIntensity] = React.useState<"chill" | "balanced" | "intense">("balanced")
    const [aiPlan, setAiPlan] = React.useState<any>(null)

    const subject = subjects.find(s => s.id === selectedSubjectId)
    const modules = subject?.modules || []
    const daysLeft = examDate ? Math.max(1, differenceInDays(parseISO(examDate), new Date())) : 7

    // Reset on open
    React.useEffect(() => {
        if (open) {
            setStep("scope")
            setAiPlan(null)
            setUploadedFile(null)
            setStrategyPrompt("")
            if (defaultSubjectId) {
                setSelectedSubjectId(defaultSubjectId)
            }
        }
    }, [open, defaultSubjectId])

    // Auto-select all modules & Pre-fill Exam Date when subject changes
    React.useEffect(() => {
        if (subject?.modules) {
            setSelectedTopics(subject.modules.map(m => m.id))
        }

        // Find existing exam for this subject
        if (selectedSubjectId) {
            const existingExam = exams.find(e => e.subjectId === selectedSubjectId)
            if (existingExam) {
                setExamDate(existingExam.date)
                toast.info("Exam date found and auto-filled!")
            }
        }
    }, [selectedSubjectId, subject, exams])

    // File upload handler
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setUploadedFile(file)
            toast.success(`Uploaded: ${file.name}`)
        }
    }

    const handleGenerate = async () => {
        if (selectedTopics.length === 0) {
            toast.error("Please select at least one module")
            return
        }

        setLoading(true)
        try {
            const targetDate = examDate || format(addDays(new Date(), 7), 'yyyy-MM-dd')

            // Build FormData to support file upload
            const formData = new FormData()
            formData.append('examDate', targetDate)
            formData.append('subjectId', selectedSubjectId)
            formData.append('selectedModuleIds', JSON.stringify(selectedTopics))
            formData.append('availableHoursPerDay', hoursPerDay[0].toString())
            formData.append('strategyPrompt', strategyPrompt)
            formData.append('intensity', intensity)

            // Include actual file for AI processing
            if (uploadedFile) {
                formData.append('file', uploadedFile)
            }

            const res = await fetch('/api/ai/plan', {
                method: 'POST',
                body: formData // No Content-Type header - browser sets it with boundary
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setAiPlan(data.plan)
        } catch (error) {
            toast.error("Failed to generate plan")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!aiPlan) return
        setIsSaving(true)
        try {
            // Create Todos from Tasks (only todos, no schedule events per user request)
            const todos = aiPlan.flatMap((day: any) =>
                day.sessions.flatMap((session: any) =>
                    (session.tasks || []).map((task: any) => {
                        const taskTitle = typeof task === 'string' ? task : task.title
                        const taskReasoning = typeof task === 'object' ? task.reasoning : null

                        return {
                            text: `[${session.moduleTitle}] ${taskTitle}`,
                            description: taskReasoning ? `💡 ${taskReasoning}` : session.notes,
                            dueDate: day.date,
                            priority: session.priority === 'high' ? 1 : session.priority === 'low' ? 4 : 2,
                            subjectId: selectedSubjectId
                        }
                    })
                )
            )

            // Save todos
            await Promise.all(todos.map((todo: any) =>
                fetch('/api/todos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(todo)
                })
            ))

            toast.success(`Study plan saved! Created ${todos.length} tasks.`)
            await refreshData()
            onOpenChange(false)
        } catch (error) {
            console.error('Save error:', error)
            toast.error("Failed to save plan")
        } finally {
            setIsSaving(false)
        }
    }

    const goNext = () => {
        const idx = STEPS.findIndex(s => s.id === step)
        if (idx < STEPS.length - 1) {
            const nextStep = STEPS[idx + 1].id
            setStep(nextStep)
            if (nextStep === "review") handleGenerate()
        }
    }

    const goBack = () => {
        const idx = STEPS.findIndex(s => s.id === step)
        if (idx > 0) setStep(STEPS[idx - 1].id)
    }

    const currentStepIndex = STEPS.findIndex(s => s.id === step)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="full" className="flex flex-col p-0 gap-0 overflow-hidden">
                {/* HEADER with Step Progress */}
                <DialogHeader className="p-4 md:p-6 border-b bg-card/50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-2 bg-primary rounded-lg">
                                <IconSparkles className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div>
                                <span className="text-lg font-bold">Study Architect</span>
                                <Badge variant="outline" className="ml-2 text-[10px]">AI Powered</Badge>
                            </div>
                        </DialogTitle>

                        {/* Step Progress Bar */}
                        <div className="flex items-center gap-1 md:gap-2">
                            {STEPS.map((s, i) => (
                                <React.Fragment key={s.id}>
                                    <button
                                        onClick={() => i < currentStepIndex && setStep(s.id)}
                                        disabled={i > currentStepIndex}
                                        className={cn(
                                            "flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                            i === currentStepIndex && "bg-primary text-primary-foreground",
                                            i < currentStepIndex && "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30",
                                            i > currentStepIndex && "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        <s.icon className="w-3.5 h-3.5" />
                                        <span className="hidden md:inline">{s.label}</span>
                                    </button>
                                    {i < STEPS.length - 1 && (
                                        <div className={cn("w-4 md:w-8 h-0.5 rounded", i < currentStepIndex ? "bg-primary" : "bg-muted")} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </DialogHeader>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 md:p-8 max-w-4xl mx-auto">

                        {/* STEP 1: SCOPE */}
                        {step === "scope" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold mb-2">What do you want to study?</h2>
                                    <p className="text-muted-foreground">Select the modules you want to include in your plan</p>
                                </div>

                                {/* Subject Info */}
                                {subject && (
                                    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="p-3 bg-primary/10 rounded-xl">
                                                <IconBook className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg">{subject.name}</h3>
                                                <p className="text-sm text-muted-foreground">{modules.length} modules • {subject.code}</p>
                                            </div>
                                            <Badge variant="secondary">{selectedTopics.length}/{modules.length} selected</Badge>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Module Selection Grid */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Modules</Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                if (selectedTopics.length === modules.length) setSelectedTopics([])
                                                else setSelectedTopics(modules.map(m => m.id))
                                            }}
                                        >
                                            {selectedTopics.length === modules.length ? "Deselect All" : "Select All"}
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {modules.map((module, i) => {
                                            const isSelected = selectedTopics.includes(module.id)
                                            return (
                                                <Card
                                                    key={module.id}
                                                    onClick={() => {
                                                        if (isSelected) setSelectedTopics(selectedTopics.filter(id => id !== module.id))
                                                        else setSelectedTopics([...selectedTopics, module.id])
                                                    }}
                                                    className={cn(
                                                        "cursor-pointer transition-all hover:shadow-md",
                                                        isSelected && "ring-2 ring-primary bg-primary/5"
                                                    )}
                                                >
                                                    <CardContent className="p-4 flex items-start gap-3">
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                                            isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                                        )}>
                                                            {isSelected && <IconCircleCheck className="w-4 h-4 text-primary-foreground" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0 overflow-hidden">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-mono text-muted-foreground shrink-0">M{i + 1}</span>
                                                                <h4 className="font-medium text-sm line-clamp-2 break-words">{module.title}</h4>
                                                            </div>
                                                            {module.topics && (
                                                                <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                                                                    {module.topics.join(" • ")}
                                                                </p>
                                                            )}
                                                            <Badge variant="outline" className="mt-2 text-[10px]">{module.status}</Badge>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>

                                    {modules.length === 0 && (
                                        <Card className="border-dashed">
                                            <CardContent className="p-8 text-center text-muted-foreground">
                                                <IconBook className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                                <p>No syllabus modules found.</p>
                                                <p className="text-sm">Add modules via the Syllabus page first.</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: CONTEXT */}
                        {step === "context" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold mb-2">Add Context & Materials</h2>
                                    <p className="text-muted-foreground">Upload PYQs, notes, or describe your strategy</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* File Upload */}
                                    <Card>
                                        <CardContent className="p-6">
                                            <Label className="mb-4 block">Upload Reference Material</Label>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".pdf,.png,.jpg,.jpeg"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />

                                            {uploadedFile ? (
                                                <div className="border-2 border-primary/30 bg-primary/5 rounded-xl p-6 text-center">
                                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <IconFileText className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <p className="font-medium text-sm truncate">{uploadedFile.name}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {(uploadedFile.size / 1024).toFixed(1)} KB
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="mt-3"
                                                        onClick={() => setUploadedFile(null)}
                                                    >
                                                        <IconX className="w-3 h-3 mr-1" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all group"
                                                >
                                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                                                        <IconUpload className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                                                    </div>
                                                    <p className="font-medium text-sm">Upload PYQs or Notes</p>
                                                    <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG (max 10MB)</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Strategy Text */}
                                    <Card>
                                        <CardContent className="p-6">
                                            <Label className="mb-4 block">Strategy Instructions</Label>
                                            <Textarea
                                                className="min-h-[180px] resize-none"
                                                placeholder="Examples:
• I'm weak in Module 2, give it extra time
• Focus on numerical problems
• I have a test on integration formulas
• Prepare me for a difficult exam"
                                                value={strategyPrompt}
                                                onChange={(e) => setStrategyPrompt(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground mt-3">
                                                This helps AI personalize your study plan
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: SCHEDULE */}
                        {step === "schedule" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold mb-2">Set Your Timeline</h2>
                                    <p className="text-muted-foreground">When is your exam and how much can you study?</p>
                                </div>

                                <Card className="max-w-xl mx-auto">
                                    <CardContent className="p-6 space-y-8">
                                        {/* Exam Date */}
                                        <div className="space-y-3">
                                            <Label>Exam Date</Label>
                                            <Input
                                                type="date"
                                                value={examDate}
                                                onChange={(e) => setExamDate(e.target.value)}
                                                className="text-lg"
                                            />
                                            {examDate && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <IconClock className="w-4 h-4 text-primary" />
                                                    <span className="font-medium text-primary">{daysLeft} days</span>
                                                    <span className="text-muted-foreground">to prepare</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Hours per day */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <Label>Daily Study Hours</Label>
                                                <span className="text-2xl font-bold text-primary">{hoursPerDay[0]}h</span>
                                            </div>
                                            <Slider
                                                value={hoursPerDay}
                                                onValueChange={setHoursPerDay}
                                                max={12}
                                                min={1}
                                                step={1}
                                                className="py-2"
                                            />
                                        </div>

                                        {/* Intensity Selection */}
                                        <div className="space-y-3">
                                            <Label>Study Intensity</Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { id: "chill", label: "Chill", icon: IconTarget, desc: "Relaxed pace" },
                                                    { id: "balanced", label: "Balanced", icon: IconBolt, desc: "Recommended" },
                                                    { id: "intense", label: "Intense", icon: IconFlame, desc: "Maximum effort" },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setIntensity(opt.id as any)}
                                                        className={cn(
                                                            "p-4 rounded-xl border text-center transition-all",
                                                            intensity === opt.id
                                                                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                                : "border-border hover:bg-muted/50"
                                                        )}
                                                    >
                                                        <opt.icon className={cn("w-5 h-5 mx-auto mb-2", intensity === opt.id && "text-primary")} />
                                                        <div className="font-medium text-sm">{opt.label}</div>
                                                        <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* STEP 4: REVIEW */}
                        {step === "review" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <div className="relative mb-6">
                                            <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin" />
                                            <IconBrain className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Creating Your Plan...</h3>
                                        <p className="text-muted-foreground">Analyzing {selectedTopics.length} modules for {daysLeft} days</p>
                                    </div>
                                ) : aiPlan ? (
                                    <>
                                        {/* Stats Header */}
                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                            <Card className="bg-primary/5 border-primary/20">
                                                <CardContent className="p-4 text-center">
                                                    <div className="text-3xl font-bold text-primary">{aiPlan.length}</div>
                                                    <div className="text-xs text-muted-foreground">Study Days</div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="p-4 text-center">
                                                    <div className="text-3xl font-bold">{selectedTopics.length}</div>
                                                    <div className="text-xs text-muted-foreground">Modules</div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="p-4 text-center">
                                                    <div className="text-3xl font-bold">{hoursPerDay[0] * aiPlan.length}h</div>
                                                    <div className="text-xs text-muted-foreground">Total Time</div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Timeline */}
                                        <ScrollArea className="h-[400px] pr-4">
                                            <div className="space-y-6 relative pl-6 border-l-2 border-primary/20 ml-2">
                                                {aiPlan.map((day: any, i: number) => (
                                                    <div key={i} className="relative">
                                                        {/* Timeline Dot */}
                                                        <div className="absolute -left-[29px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-background" />

                                                        {/* Day Header */}
                                                        <div className="mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold">{format(parseISO(day.date), "EEEE")}</span>
                                                                <span className="text-sm text-muted-foreground">{format(parseISO(day.date), "MMM d")}</span>
                                                            </div>
                                                            {day.focus && (
                                                                <Badge variant="secondary" className="mt-1">{day.focus}</Badge>
                                                            )}
                                                        </div>

                                                        {/* Sessions */}
                                                        <div className="space-y-3">
                                                            {day.sessions.map((session: any, j: number) => (
                                                                <Card key={j} className="overflow-hidden">
                                                                    <div className={cn(
                                                                        "h-1 bg-gradient-to-r",
                                                                        session.priority === 'high' ? "from-red-500 to-orange-500" :
                                                                            session.priority === 'low' ? "from-green-500 to-emerald-500" :
                                                                                "from-primary to-primary/50"
                                                                    )} />
                                                                    <CardContent className="p-4">
                                                                        <div className="flex items-start justify-between mb-3">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                                                    <IconBook className="w-4 h-4 text-primary" />
                                                                                </div>
                                                                                <div>
                                                                                    <h4 className="font-semibold">{session.moduleTitle}</h4>
                                                                                    <p className="text-xs text-muted-foreground">{session.topic}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {session.difficulty && (
                                                                                    <Badge variant="outline" className={cn(
                                                                                        "text-[10px]",
                                                                                        session.difficulty === 'hard' && "border-red-500/50 text-red-400",
                                                                                        session.difficulty === 'easy' && "border-green-500/50 text-green-400"
                                                                                    )}>
                                                                                        {session.difficulty}
                                                                                    </Badge>
                                                                                )}
                                                                                <Badge>{session.durationMinutes}m</Badge>
                                                                            </div>
                                                                        </div>

                                                                        {/* Action Items / Todos with Reasoning */}
                                                                        {session.tasks && session.tasks.length > 0 && (
                                                                            <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                                                                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                                                    <IconChecklist className="w-3 h-3" />
                                                                                    Action Items
                                                                                </div>
                                                                                {session.tasks.map((task: any, k: number) => {
                                                                                    const taskTitle = typeof task === 'string' ? task : task.title
                                                                                    const taskReasoning = typeof task === 'object' ? task.reasoning : null
                                                                                    const taskMinutes = typeof task === 'object' ? task.estimatedMinutes : null

                                                                                    return (
                                                                                        <div key={k} className="group">
                                                                                            <div className="flex items-start gap-2 text-sm">
                                                                                                <IconCircle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                                                                                                <div className="flex-1 min-w-0 overflow-hidden">
                                                                                                    <div className="flex items-start justify-between gap-2">
                                                                                                        <span className="text-foreground font-medium break-words">{taskTitle}</span>
                                                                                                        {taskMinutes && (
                                                                                                            <span className="text-[10px] text-muted-foreground shrink-0">{taskMinutes}min</span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    {taskReasoning && (
                                                                                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed break-words">
                                                                                                            💡 {taskReasoning}
                                                                                                        </p>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        )}

                                                                        {session.notes && (
                                                                            <p className="text-xs text-muted-foreground italic mt-3 border-l-2 border-primary/30 pl-2">
                                                                                {session.notes}
                                                                            </p>
                                                                        )}
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground">Failed to generate plan. Please go back and try again.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <DialogFooter className="p-4 md:p-6 border-t bg-card/50">
                    <div className="flex w-full justify-between">
                        <Button variant="outline" onClick={goBack} disabled={step === "scope"}>
                            Back
                        </Button>

                        {step === "review" ? (
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !aiPlan}
                                size="lg"
                                className="gap-2"
                            >
                                {isSaving ? (
                                    <IconLoader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <IconSparkles className="w-4 h-4" />
                                )}
                                {isSaving ? "Saving..." : "Accept & Add to Calendar"}
                            </Button>
                        ) : (
                            <Button
                                onClick={goNext}
                                disabled={step === "scope" && selectedTopics.length === 0}
                                size="lg"
                                className="gap-2"
                            >
                                Continue
                                <IconChevronRight className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
