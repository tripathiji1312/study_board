"use client"

import * as React from "react"
import { Shell } from "@/components/ui/shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { IconSchool, IconUser, IconPencil, IconTrophy, IconTarget, IconBook, IconTrash, IconCalendarEvent } from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { motion } from "framer-motion"
import { AcademicHeatmap } from "@/components/academics/heatmap"
import Link from "next/link"

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

    const currentSubjects = subjects.filter(s => s.semesterId === currentSemester?.id)

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

    // VIT Marks Calculation: CAT1(50→15%) + CAT2(50→15%) + DA(20→20%) + FAT(100→40%) = 100%
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
                    { name: "CAT1", raw: marks.CAT1, max: 50, converted: cat1Score, weight: 15, color: "bg-blue-500" },
                    { name: "CAT2", raw: marks.CAT2, max: 50, converted: cat2Score, weight: 15, color: "bg-indigo-500" },
                    { name: "DA", raw: marks.DA, max: 20, converted: daScore, weight: 20, color: "bg-purple-500" },
                    { name: "FAT", raw: marks.FAT, max: 100, converted: fatScore, weight: 40, color: "bg-violet-500" },
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
                    { name: "Lab Internal", raw: marks.LabInternal, max: 100, converted: labInt, weight: 60, color: "bg-emerald-500" },
                    { name: "Lab FAT", raw: marks.LabFAT, max: 100, converted: labFatScore, weight: 40, color: "bg-teal-500" },
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
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Academics</h1>
                        <p className="text-muted-foreground">
                            {currentSemester ? `${currentSemester.name} — VIT Evaluation` : "Set semester in Settings"}
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/academics/exams">
                            <IconCalendarEvent className="w-4 h-4 mr-2" />
                            Exam Manager
                        </Link>
                    </Button>
                </div>

                {/* Study Heatmap */}
                <AcademicHeatmap />

                {/* Legend */}
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                    <span className="font-medium text-muted-foreground">VIT Pattern:</span>
                    <Badge variant="outline">CAT1: 50→15%</Badge>
                    <Badge variant="outline">CAT2: 50→15%</Badge>
                    <Badge variant="outline">DA: 20→20%</Badge>
                    <Badge variant="outline">FAT: 100→40%</Badge>
                </div>

                {currentSubjects.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {currentSubjects.map((sub, index) => {
                            const calc = calculateMarks(sub)

                            return (
                                <motion.div
                                    key={sub.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="hover:shadow-md transition-all cursor-pointer group" onClick={() => openMarksDialog(sub)}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-base">{sub.name}</CardTitle>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">{sub.code}</Badge>
                                                        <Badge variant="secondary" className="text-xs">{sub.type}</Badge>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); openMarksDialog(sub) }}>
                                                    <IconPencil className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {/* Score Display */}
                                            <div className="text-center py-2">
                                                <p className={`text-3xl font-bold ${getGradeColor(calc.percentage)}`}>
                                                    {calc.total}
                                                </p>
                                                <p className="text-xs text-muted-foreground">out of 100</p>
                                            </div>

                                            {/* Progress Bars */}
                                            <div className="space-y-2">
                                                {calc.components.map(comp => (
                                                    <div key={comp.name} className="text-xs">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-muted-foreground">{comp.name}</span>
                                                            <span className="font-medium">
                                                                {comp.raw !== undefined ? `${comp.raw}/${comp.max}` : "—"}
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${comp.color} transition-all duration-500`}
                                                                style={{ width: `${comp.raw !== undefined ? (comp.converted / comp.weight) * 100 : 0}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {sub.teacherName && (
                                                <p className="text-xs text-muted-foreground pt-2 border-t flex items-center gap-1">
                                                    <IconUser className="w-3 h-3" /> {sub.teacherName}
                                                </p>
                                            )}
                                        </CardContent>

                                        {/* Actions Footer */}
                                        <div className="p-4 pt-0 flex justify-between gap-2 mt-auto">
                                            <Button variant="outline" size="sm" className="w-full" asChild onClick={(e) => e.stopPropagation()}>
                                                <Link href={`/academics/syllabus/${sub.id}`}>
                                                    <IconBook className="w-4 h-4 mr-2" />
                                                    Syllabus
                                                </Link>
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive shrink-0"
                                                onClick={(e) => { e.stopPropagation(); deleteSubject(sub.id) }}
                                            >
                                                <IconTrash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </div>
                ) : (
                    <Card className="py-12">
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <IconSchool className="w-12 h-12 text-muted-foreground mb-4" />
                            <h3 className="font-semibold text-lg mb-2">No Subjects</h3>
                            <p className="text-muted-foreground mb-4">
                                {currentSemester ? "Add subjects in Settings first." : "Create a semester in Settings."}
                            </p>
                            <Button asChild>
                                <a href="/settings">Go to Settings</a>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Marks Edit Dialog */}
                <Dialog open={isMarksDialogOpen} onOpenChange={setIsMarksDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <IconTarget className="w-5 h-5" /> {selectedSubject?.name}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSaveMarks} className="space-y-4">
                            {selectedSubject?.type !== "Lab" && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">CAT1 (out of 50)</Label>
                                            <Input type="number" min="0" max="50" value={cat1} onChange={e => setCat1(e.target.value === "" ? "" : Number(e.target.value))} placeholder="—" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">CAT2 (out of 50)</Label>
                                            <Input type="number" min="0" max="50" value={cat2} onChange={e => setCat2(e.target.value === "" ? "" : Number(e.target.value))} placeholder="—" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">DA (out of 20)</Label>
                                            <Input type="number" min="0" max="20" value={da} onChange={e => setDa(e.target.value === "" ? "" : Number(e.target.value))} placeholder="—" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">FAT (out of 100)</Label>
                                            <Input type="number" min="0" max="100" value={fat} onChange={e => setFat(e.target.value === "" ? "" : Number(e.target.value))} placeholder="—" />
                                        </div>
                                    </div>
                                </>
                            )}
                            {selectedSubject?.type !== "Theory" && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Lab Internal (out of 100)</Label>
                                        <Input type="number" min="0" max="100" value={labInternal} onChange={e => setLabInternal(e.target.value === "" ? "" : Number(e.target.value))} placeholder="—" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Lab FAT (out of 100)</Label>
                                        <Input type="number" min="0" max="100" value={labFat} onChange={e => setLabFat(e.target.value === "" ? "" : Number(e.target.value))} placeholder="—" />
                                    </div>
                                </div>
                            )}
                            <DialogFooter>
                                <Button type="submit" className="w-full">Save Marks</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </Shell>
    )
}
