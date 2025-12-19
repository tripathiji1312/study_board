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
        if (isPast) return "bg-muted text-muted-foreground border-transparent"
        if (isToday) return "bg-red-500/10 text-red-600 border-red-200 animate-pulse"
        if (isUrgent) return "bg-orange-500/10 text-orange-600 border-orange-200"
        return "bg-primary/10 text-primary border-primary/20"
    }

    return (
        <Card className={cn("group transition-all hover:shadow-md h-full flex flex-col", isUrgent && "border-orange-200 shadow-orange-100")}>
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div>
                    <Badge variant="outline" className={cn("mb-2", getUrgencyColor())}>
                        {isPast ? "Completed" : isToday ? "Today!" : `${daysLeft} days left`}
                    </Badge>
                    <CardTitle className="text-lg font-bold leading-tight">
                        {exam.title || subject?.name || "Untitled Exam"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-medium mt-1">
                        {subject ? `${subject.name} - ${exam.type || 'Exam'}` : (exam.type || 'Exam')}
                    </p>
                </div>
                <div className="flex flex-col items-end text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <IconCalendar className="w-4 h-4" />
                        <span>{format(parseISO(exam.date), "MMM d")}</span>
                    </div>
                    {exam.time && (
                        <div className="flex items-center gap-1 mt-1">
                            <IconClock className="w-4 h-4" />
                            <span>{exam.time}</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pb-3">
                {/* Syllabus / Notes Section */}
                <div className="space-y-3">
                    {exam.syllabus ? (
                        <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                            <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                                <IconBook className="w-3 h-3" />
                                <span className="text-xs uppercase tracking-wider font-semibold">Syllabus</span>
                            </div>
                            <p className="line-clamp-2 text-foreground/90">{exam.syllabus}</p>
                        </div>
                    ) : (
                        <div className="p-3 border border-dashed rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">No syllabus details added.</p>
                        </div>
                    )}

                    {/* Subject Progress Integration (Optional - showing subject completion if available) */}
                    {subject?.modules && subject.modules.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Subject Preparation</span>
                                <span className="font-medium">
                                    {Math.round((subject.modules.filter(m => m.status === 'Completed' || m.status === 'Revised').length / subject.modules.length) * 100)}%
                                </span>
                            </div>
                            <Progress
                                value={(subject.modules.filter(m => m.status === 'Completed' || m.status === 'Revised').length / subject.modules.length) * 100}
                                className="h-1.5"
                            />
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-0 flex justify-between mt-auto">
                {subject && !isPast && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        onClick={() => setShowPlanner(true)}
                    >
                        <IconSparkles className="w-3.5 h-3.5" />
                        Generate Plan
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive h-8 px-2"
                    onClick={() => deleteExam(exam.id)}
                >
                    <IconTrash className="w-4 h-4 mr-2" />
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
