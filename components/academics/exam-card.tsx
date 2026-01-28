"use client"

import { IconCalendar, IconClock, IconBook, IconTrash, IconAlertTriangle, IconSparkles } from "@tabler/icons-react"
import { format, differenceInDays, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Exam, useStore } from "@/components/providers/store-provider"
import { StudyPlannerWizard } from "./study-planner-wizard"
import React from "react"

interface ExamCardProps {
    exam: Exam
}

export function ExamCard({ exam }: ExamCardProps) {
    const { subjects, deleteExam } = useStore()
    const [showPlanner, setShowPlanner] = React.useState(false)
    const subject = subjects.find(s => s.id === exam.subjectId)

    // DEBUG: Check why button is missing
    console.log(`Exam: ${exam.title}, ID: ${exam.id}, SubjectID: ${exam.subjectId}`)
    console.log(`Found Subject:`, subject)

    const daysLeft = differenceInDays(parseISO(exam.date), new Date())
    const isUrgent = daysLeft <= 3 && daysLeft >= 0
    const isToday = daysLeft === 0
    const isPast = daysLeft < 0

    const getUrgencyColor = () => {
        if (isPast) return "bg-surface-container text-on-surface-variant border-transparent"
        if (isToday) return "bg-error/10 text-error border-error/20 animate-pulse shadow-sm"
        if (isUrgent) return "bg-tertiary/10 text-tertiary border-tertiary/20 shadow-sm"
        return "bg-primary/10 text-primary border-primary/20 shadow-sm"
    }

    return (
        <Card className={cn("group transition-all duration-300 hover:shadow-expressive h-full flex flex-col bg-surface-container-low rounded-[1.5rem] border-border/40 overflow-hidden", isUrgent && !isPast && "border-tertiary/30 shadow-tertiary/5")}>
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 relative">
                <div className="space-y-1 z-10">
                    <Badge variant="outline" className={cn("mb-3 rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider", getUrgencyColor())}>
                        {isPast ? "Completed" : isToday ? "Today!" : `${daysLeft} days left`}
                    </Badge>
                    <CardTitle className="text-xl font-bold leading-tight line-clamp-2 text-on-surface">
                        {exam.title || subject?.name || "Untitled Exam"}
                    </CardTitle>
                    <p className="text-sm text-on-surface-variant font-medium mt-1 flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", (exam.type as string) === 'Theory' ? 'bg-primary' : 'bg-secondary')}></span>
                        {subject ? `${subject.name} • ${exam.type || 'Exam'}` : (exam.type || 'Exam')}
                    </p>
                </div>
                <div className="flex flex-col items-end text-sm text-on-surface-variant/80 z-10 bg-surface-container/50 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-border/30">
                    <div className="flex items-center gap-1.5 font-medium">
                        <IconCalendar className="w-4 h-4 text-primary" />
                        <span>{format(parseISO(exam.date), "MMM d")}</span>
                    </div>
                    {exam.time && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs opacity-80">
                            <IconClock className="w-3.5 h-3.5" />
                            <span>{exam.time}</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pb-4 flex-1">
                {/* Syllabus / Notes Section */}
                <div className="space-y-4">
                    {exam.syllabus ? (
                        <div className="p-4 bg-surface-container/50 rounded-2xl text-sm border border-border/20 group-hover:bg-surface-container transition-colors">
                            <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
                                <IconBook className="w-3.5 h-3.5 text-secondary" />
                                <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">Syllabus</span>
                            </div>
                            <p className="line-clamp-3 text-on-surface/90 leading-relaxed text-sm">{exam.syllabus}</p>
                        </div>
                    ) : (
                        <div className="p-4 border border-dashed border-border/40 rounded-2xl text-center flex flex-col items-center justify-center h-24 bg-surface-container-lowest/50">
                            <p className="text-xs text-on-surface-variant/50 italic">No syllabus details added yet.</p>
                        </div>
                    )}

                    {/* Subject Progress Integration (Optional - showing subject completion if available) */}
                    {subject?.modules && subject.modules.length > 0 && (
                        <div className="space-y-2 pt-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-on-surface-variant font-medium">Preparation</span>
                                <span className="font-bold text-primary">
                                    {Math.round((subject.modules.filter(m => m.status === 'Completed' || m.status === 'Revised').length / subject.modules.length) * 100)}%
                                </span>
                            </div>
                            <Progress
                                value={(subject.modules.filter(m => m.status === 'Completed' || m.status === 'Revised').length / subject.modules.length) * 100}
                                className="h-2 rounded-full bg-surface-container-highest"
                            />
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-3 pb-5 px-6 flex justify-between mt-auto border-t border-border/30 bg-surface-container-low/50">
                {subject && !isPast && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 gap-2 text-primary bg-primary/5 hover:bg-primary/10 hover:text-primary-dark rounded-xl px-3 font-medium transition-all"
                        onClick={() => setShowPlanner(true)}
                    >
                        <IconSparkles className="w-4 h-4" />
                        Generate Plan
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-on-surface-variant/70 hover:text-error hover:bg-error/10 h-9 px-3 rounded-xl ml-auto transition-colors"
                    onClick={() => deleteExam(exam.id)}
                >
                    <IconTrash className="w-4 h-4 mr-1.5" />
                    Remove
                </Button>
            </CardFooter>

            {subject && !isPast && (
                <StudyPlannerWizard
                    open={showPlanner}
                    onOpenChange={setShowPlanner}
                    defaultSubjectId={subject.id}
                    defaultExamId={String(exam.id)}
                />
            )}
        </Card>
    )
}
