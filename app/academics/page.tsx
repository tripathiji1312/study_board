"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    IconSchool,
    IconUser,
    IconPencil,
    IconTrophy,
    IconTarget,
    IconBook,
    IconTrash,
    IconCalendarEvent,
    IconChartBar,
    IconDotsVertical,
    IconPlus,
    IconTrendingUp,
    IconCalculator
} from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { motion, AnimatePresence } from "framer-motion"
import { AcademicHeatmap } from "@/components/academics/heatmap"
import { TimetableImporter } from "@/components/academics/timetable-importer"
import { GradesImporter } from "@/components/academics/grades-importer"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function AcademicsPage() {
    const { subjects, currentSemester, updateSubject, deleteSubject, refreshData } = useStore()
    const [selectedSubject, setSelectedSubject] = React.useState<typeof subjects[0] | null>(null)
    const [isMarksDialogOpen, setIsMarksDialogOpen] = React.useState(false)

    // Marks form
    const [cat1, setCat1] = React.useState<number | "">("")
    const [cat2, setCat2] = React.useState<number | "">("")
    const [da, setDa] = React.useState<number | "">("")
    const [fat, setFat] = React.useState<number | "">("")
    const [labInternal, setLabInternal] = React.useState<number | "">("")
    const [labFat, setLabFat] = React.useState<number | "">("")

    const currentSubjects = React.useMemo(() =>
        subjects.filter(s => s.semesterId === currentSemester?.id),
        [subjects, currentSemester])

    const openMarksDialog = (subject: typeof subjects[0]) => {
        setSelectedSubject(subject)
        setCat1(subject.marks.CAT1 || "")
        setCat2(subject.marks.CAT2 || "")
        setDa(subject.marks.DA || "")
        setFat(subject.marks.FAT || "")
        setLabInternal(subject.marks.LabInternal || "")
        setLabFat(subject.marks.LabFAT || "")
        setIsMarksDialogOpen(true)
    }

    const handleSaveMarks = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedSubject) return

        updateSubject({
            id: selectedSubject.id,
            marks: {
                CAT1: cat1 === "" ? undefined : Number(cat1),
                CAT2: cat2 === "" ? undefined : Number(cat2),
                DA: da === "" ? undefined : Number(da),
                FAT: fat === "" ? undefined : Number(fat),
                LabInternal: labInternal === "" ? undefined : Number(labInternal),
                LabFAT: labFat === "" ? undefined : Number(labFat)
            }
        })
        setIsMarksDialogOpen(false)
    }

    // VIT Marks Calculation logic
    const calculateMarks = (sub: typeof subjects[0]) => {
        const { marks, type } = sub

        if (type === "Theory" || type === "Embedded") {
            const cat1Score = marks.CAT1 ? (marks.CAT1 / 50) * 15 : 0
            const cat2Score = marks.CAT2 ? (marks.CAT2 / 50) * 15 : 0
            const daScore = marks.DA ? marks.DA : 0
            const fatScore = marks.FAT ? (marks.FAT / 100) * 40 : 0

            const total = cat1Score + cat2Score + daScore + fatScore
            const maxPossible = (marks.CAT1 !== undefined ? 15 : 0) +
                (marks.CAT2 !== undefined ? 15 : 0) +
                (marks.DA !== undefined ? 20 : 0) +
                (marks.FAT !== undefined ? 40 : 0)

            return {
                components: [
                    { name: "CAT1 (15%)", raw: marks.CAT1, max: 50, converted: cat1Score, weight: 15, color: "bg-blue-500" },
                    { name: "CAT2 (15%)", raw: marks.CAT2, max: 50, converted: cat2Score, weight: 15, color: "bg-indigo-500" },
                    { name: "DA (20%)", raw: marks.DA, max: 20, converted: daScore, weight: 20, color: "bg-purple-500" },
                    { name: "FAT (40%)", raw: marks.FAT, max: 100, converted: fatScore, weight: 40, color: "bg-violet-500" },
                ],
                total: total.toFixed(1),
                percentage: maxPossible > 0 ? (total / maxPossible) * 100 : 0
            }
        } else {
            const labInt = marks.LabInternal ? (marks.LabInternal / 100) * 60 : 0
            const labFatScore = marks.LabFAT ? (marks.LabFAT / 100) * 40 : 0
            const total = labInt + labFatScore
            const maxPossible = (marks.LabInternal !== undefined ? 60 : 0) + (marks.LabFAT !== undefined ? 40 : 0)

            return {
                components: [
                    { name: "Internal (60%)", raw: marks.LabInternal, max: 100, converted: labInt, weight: 60, color: "bg-emerald-500" },
                    { name: "FAT (40%)", raw: marks.LabFAT, max: 100, converted: labFatScore, weight: 40, color: "bg-teal-500" },
                ],
                total: total.toFixed(1),
                percentage: maxPossible > 0 ? (total / maxPossible) * 100 : 0
            }
        }
    }

    const getGradeColor = (percentage: number) => {
        if (percentage >= 90) return "text-emerald-500"
        if (percentage >= 80) return "text-green-500"
        if (percentage >= 70) return "text-lime-500"
        if (percentage >= 60) return "text-yellow-500"
        if (percentage >= 50) return "text-orange-500"
        return "text-red-500"
    }

    return (
        <Shell>
            <div className="space-y-8 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <IconSchool className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Academic Dashboard</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            Perform.
                        </h1>
                        <p className="text-lg text-muted-foreground/80 font-medium max-w-md">
                            {currentSemester ? (
                                <span className="flex items-center gap-2">
                                    Current: <Badge variant="secondary" className="px-2 py-0.5 rounded-md text-sm">{currentSemester.name}</Badge>
                                </span>
                            ) : "Select a semester in settings to begin."}
                        </p>
                    </div>

                    {/* Action Toolbar */}
                    <div className="flex items-center gap-3 bg-background/50 backdrop-blur-xl p-2 rounded-2xl border shadow-sm">
                        <TimetableImporter onImportComplete={refreshData} />
                        <div className="w-px h-6 bg-border/50" />
                        <GradesImporter onImportComplete={refreshData} />
                        <div className="w-px h-6 bg-border/50" />
                        <Button asChild variant="ghost" size="sm" className="h-9 gap-2 rounded-xl hover:bg-muted/60">
                            <Link href="/academics/exams">
                                <IconCalendarEvent className="w-4 h-4 text-orange-500" />
                                <span className="hidden sm:inline">Exams</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Stats & Heatmap */}
                    <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                        {/* Heatmap Card */}
                        <div className="rounded-3xl border bg-gradient-to-br from-card/50 to-background/50 backdrop-blur-sm p-1 shadow-sm overflow-hidden">
                            <div className="p-5 border-b bg-muted/20">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <IconTrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Study Activity</h3>
                                        <p className="text-xs text-muted-foreground">Heatmap of your focus sessions</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <AcademicHeatmap />
                            </div>
                        </div>
                    </div>

                    {/* Right Column / Full Width: Subjects Grid */}
                    <div className="lg:col-span-12 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <IconBook className="w-5 h-5 text-indigo-500" />
                                My Subjects
                                <Badge variant="secondary" className="ml-2 rounded-full h-5 px-2 text-[10px] min-w-[20px] justify-center">
                                    {currentSubjects.length}
                                </Badge>
                            </h2>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <IconCalculator className="w-3.5 h-3.5" />
                                <span>VIT Evaluation Pattern Active</span>
                            </div>
                        </div>

                        {currentSubjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
                                <AnimatePresence mode="popLayout">
                                    {currentSubjects.map((sub, index) => {
                                        const calc = calculateMarks(sub)
                                        return (
                                            <motion.div
                                                key={sub.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                            >
                                                <Card className="h-full flex flex-col overflow-hidden border-border/60 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group bg-gradient-to-b from-card to-card/50">
                                                    <CardHeader className="p-5 pb-3">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider h-5">
                                                                        {sub.code}
                                                                    </Badge>
                                                                    <Badge className={cn("text-[10px] px-1.5 h-5 text-white border-0",
                                                                        sub.type === "Theory" ? "bg-indigo-500" :
                                                                            sub.type === "Lab" ? "bg-emerald-500" : "bg-violet-500"
                                                                    )}>
                                                                        {sub.type}
                                                                    </Badge>
                                                                </div>
                                                                <h3 className="font-bold text-lg leading-snug line-clamp-2" title={sub.name}>
                                                                    {sub.name}
                                                                </h3>
                                                            </div>
                                                            <div className="shrink-0 flex gap-1">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-primary transition-colors" onClick={() => openMarksDialog(sub)}>
                                                                    <IconPencil className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardHeader>

                                                    <CardContent className="p-5 pt-2 flex-1 flex flex-col">
                                                        {/* Stats Row */}
                                                        <div className="flex items-end justify-between mb-6 mt-auto">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Current Score</p>
                                                                <div className="flex items-baseline gap-1.5">
                                                                    <span className={cn("text-4xl font-black tracking-tighter", getGradeColor(calc.percentage))}>
                                                                        {calc.total}
                                                                    </span>
                                                                    <span className="text-sm text-muted-foreground font-medium">/ 100</span>
                                                                </div>
                                                            </div>
                                                            {/* Mini Vertical Bar Chart Visual */}
                                                            <div className="flex gap-1 items-end h-10 pb-1">
                                                                {calc.components.map((c, i) => (
                                                                    <div key={i} className="flex flex-col justify-end h-full gap-1 group/bar w-2">
                                                                        <div
                                                                            className={cn("w-full rounded-sm opacity-30 group-hover/bar:opacity-100 transition-all", c.color)}
                                                                            style={{ height: `${(c.converted / c.weight) * 100}%` }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Detail Bars */}
                                                        <div className="space-y-3 pb-4">
                                                            {calc.components.map(comp => (
                                                                <div key={comp.name} className="space-y-1.5">
                                                                    <div className="flex justify-between text-xs">
                                                                        <span className="text-muted-foreground font-medium">{comp.name}</span>
                                                                        <span className="font-mono opacity-80">
                                                                            {comp.raw !== undefined ? (
                                                                                <span className="font-semibold text-foreground">{comp.raw}</span>
                                                                            ) : (
                                                                                <span className="text-muted-foreground">-</span>
                                                                            )}
                                                                            <span className="text-muted-foreground">/{comp.max}</span>
                                                                        </span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${comp.raw !== undefined ? (comp.converted / comp.weight) * 100 : 0}%` }}
                                                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                                                            className={cn("h-full rounded-full", comp.color)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <Separator className="my-2 opacity-50" />

                                                        {/* Footer Actions */}
                                                        <div className="flex items-center justify-between gap-3 pt-2">
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                {sub.teacherName ? (
                                                                    <>
                                                                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                                                                            <IconUser className="w-3 h-3" />
                                                                        </div>
                                                                        <span className="truncate max-w-[80px]" title={sub.teacherName}>{sub.teacherName}</span>
                                                                    </>
                                                                ) : (
                                                                    <span className="italic opacity-50">No faculty info</span>
                                                                )}
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <Button asChild variant="secondary" size="sm" className="h-8 text-xs font-medium rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                                                                    <Link href={`/academics/syllabus/${sub.id}`}>
                                                                        <IconBook className="w-3.5 h-3.5 mr-1.5" />
                                                                        Syllabus
                                                                    </Link>
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                                                                            <IconDotsVertical className="w-4 h-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteSubject(sub.id)}>
                                                                            <IconTrash className="w-4 h-4 mr-2" />
                                                                            Delete Subject
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border-2 border-dashed rounded-3xl animate-in fade-in zoom-in duration-500">
                                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                    <IconSchool className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-bold text-xl mb-1">No Subjects Found</h3>
                                <p className="text-muted-foreground max-w-sm text-center mb-6">
                                    {currentSemester ? "Setup your subjects to start tracking grades and syllabus." : "First, create a semester in your settings."}
                                </p>
                                <Button asChild size="lg" className="rounded-full px-8">
                                    <Link href="/settings">
                                        Configure Semester
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Marks Dialog */}
                <Dialog open={isMarksDialogOpen} onOpenChange={setIsMarksDialogOpen}>
                    <DialogContent className="max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <IconTarget className="w-5 h-5" />
                                </div>
                                <span>Update Marks</span>
                            </DialogTitle>
                        </DialogHeader>

                        {selectedSubject && (
                            <form onSubmit={handleSaveMarks} className="space-y-6 pt-2">
                                <div className="p-4 bg-muted/30 rounded-xl border space-y-1">
                                    <p className="font-medium">{selectedSubject.name}</p>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="text-[10px]">{selectedSubject.code}</Badge>
                                        <Badge variant="secondary" className="text-[10px]">{selectedSubject.type}</Badge>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {selectedSubject.type !== "Lab" && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-muted-foreground uppercase">CAT1 (50)</Label>
                                                    <div className="relative">
                                                        <Input type="number" step="0.5" min="0" max="50" value={cat1} onChange={e => setCat1(e.target.value === "" ? "" : Number(e.target.value))} className="pl-3 h-11 text-lg font-mono" placeholder="-" />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">/ 50</div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-muted-foreground uppercase">CAT2 (50)</Label>
                                                    <div className="relative">
                                                        <Input type="number" step="0.5" min="0" max="50" value={cat2} onChange={e => setCat2(e.target.value === "" ? "" : Number(e.target.value))} className="pl-3 h-11 text-lg font-mono" placeholder="-" />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">/ 50</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-muted-foreground uppercase">DA (20)</Label>
                                                    <div className="relative">
                                                        <Input type="number" step="0.5" min="0" max="20" value={da} onChange={e => setDa(e.target.value === "" ? "" : Number(e.target.value))} className="pl-3 h-11 text-lg font-mono" placeholder="-" />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">/ 20</div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-muted-foreground uppercase">FAT (100)</Label>
                                                    <div className="relative">
                                                        <Input type="number" step="0.5" min="0" max="100" value={fat} onChange={e => setFat(e.target.value === "" ? "" : Number(e.target.value))} className="pl-3 h-11 text-lg font-mono" placeholder="-" />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">/ 100</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {selectedSubject.type !== "Theory" && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground uppercase">Lab Internal (100)</Label>
                                                <div className="relative">
                                                    <Input type="number" step="0.5" min="0" max="100" value={labInternal} onChange={e => setLabInternal(e.target.value === "" ? "" : Number(e.target.value))} className="pl-3 h-11 text-lg font-mono" placeholder="-" />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">/ 100</div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-muted-foreground uppercase">Lab FAT (100)</Label>
                                                <div className="relative">
                                                    <Input type="number" step="0.5" min="0" max="100" value={labFat} onChange={e => setLabFat(e.target.value === "" ? "" : Number(e.target.value))} className="pl-3 h-11 text-lg font-mono" placeholder="-" />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">/ 100</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsMarksDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit">Save Changes</Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </Shell>
    )
}
