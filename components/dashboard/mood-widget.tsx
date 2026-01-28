"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStore } from "@/components/providers/store-provider"
import { isSameDay, format } from "date-fns"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { IconLoader2, IconCircleCheck, IconCircle, IconSparkles } from "@tabler/icons-react"
import { toast } from "sonner"

const MOODS = [
    { level: 1, color: "bg-red-400", hover: "hover:bg-red-500", label: "Terrible", emoji: "😫" },
    { level: 2, color: "bg-orange-400", hover: "hover:bg-orange-500", label: "Bad", emoji: "😞" },
    { level: 3, color: "bg-yellow-400", hover: "hover:bg-yellow-500", label: "Okay", emoji: "😐" },
    { level: 4, color: "bg-lime-400", hover: "hover:bg-lime-500", label: "Good", emoji: "🙂" },
    { level: 5, color: "bg-green-400", hover: "hover:bg-green-500", label: "Great", emoji: "🤩" },
]

export function MoodWidget() {
    const { dailyLogs, addDailyLog, todos, toggleTodo, updateTodo } = useStore()
    const [recommendations, setRecommendations] = React.useState<{ id: string, reason: string }[]>([])
    const [loadingRecs, setLoadingRecs] = React.useState(false)
    const [showDialog, setShowDialog] = React.useState(false)
    const [currentMoodLevel, setCurrentMoodLevel] = React.useState(0)

    const logs = dailyLogs || []
    const today = new Date()

    const todayLog = logs.find(l => l.date && isSameDay(new Date(l.date), today))

    const fetchRecommendations = React.useCallback(async (level: number) => {
        if (level === 0) {
            setRecommendations([])
            return
        }
        setLoadingRecs(true)
        setShowDialog(true)
        setCurrentMoodLevel(level)
        try {
            const res = await fetch('/api/ai/recommend-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mood: level })
            })
            if (res.ok) {
                const data = await res.json()
                setRecommendations(data.recommendations || [])
            } else {
                const data = await res.json()
                if (res.status === 400 && data.error?.includes("API")) {
                    toast.error("AI Features Disabled", {
                        description: "Please configure your Groq API Key in Settings to use this feature.",
                        duration: 5000,
                    })
                    setShowDialog(false)
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingRecs(false)
        }
    }, [])

    const handleLog = async (level: number) => {
        await addDailyLog({
            mood: level,
            studyTime: 0,
            note: "",
            date: new Date().toISOString()
        })
        if (level > 0) {
            fetchRecommendations(level)
        }
    }

    // Grid for last 30 days
    const recentLogs = React.useMemo(() => {
        const days = []
        for (let i = 29; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const log = logs.filter(l => isSameDay(new Date(l.date), d)).sort((a, b) => b.id - a.id)[0]
            days.push({ date: d, log })
        }
        return days
    }, [logs])

    const moodLabel = MOODS.find(m => m.level === currentMoodLevel)?.label || "Unknown"

    return (
        <>
            <Card className="flex flex-col h-full bg-surface-container-low shadow-none border-0 overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium">Daily Mood</CardTitle>
                    {todayLog && (
                        <Button variant="ghost" size="sm" onClick={() => handleLog(0)} className="h-6 text-[10px] px-2 text-muted-foreground hover:text-destructive hover:bg-surface-container-high rounded-full">
                            Reset
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between p-4 pt-0">
                    <div className="flex justify-between gap-1 mb-4 px-1">
                        {MOODS.map(m => (
                            <TooltipProvider key={m.level}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => handleLog(m.level)}
                                            className={cn(
                                                "w-9 h-9 rounded-full transition-all flex items-center justify-center text-xl shadow-sm border border-transparent hover-lift",
                                                todayLog?.mood === m.level ? "scale-110 ring-4 ring-primary/20 bg-accent shadow-expressive-sm" : "grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:scale-110",
                                                todayLog?.mood === m.level ? "" : "bg-transparent"
                                            )}
                                        >
                                            {m.emoji}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-surface-container-highest border-none shadow-expressive-sm">
                                        <p>{m.label}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>

                    <div className="flex gap-[3px] flex-wrap justify-end">
                        {recentLogs.map((item, i) => (
                            <TooltipProvider key={i}>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div
                                            className={cn(
                                                "w-2.5 h-2.5 rounded-[2px] transition-colors",
                                                item.log ? MOODS.find(m => m.level === item.log!.mood)?.color : "bg-surface-container-high hover:bg-surface-container-highest"
                                            )}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-surface-container-highest border-none shadow-expressive-sm">
                                        <p className="text-xs font-semibold">
                                            {format(item.date, "MMM d")}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.log ? MOODS.find(m => m.level === item.log.mood)?.label : "No log"}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Suggestions Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-md bg-surface-container-high border-none shadow-expressive-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IconSparkles className="w-5 h-5 text-primary" />
                            AI Task Suggestions
                        </DialogTitle>
                        <DialogDescription>
                            Based on your <span className="font-semibold">{moodLabel}</span> energy level
                        </DialogDescription>
                    </DialogHeader>

                    {loadingRecs ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Analyzing your energy...</p>
                        </div>
                    ) : recommendations.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            <p>No specific recommendations found.</p>
                            <p className="text-xs mt-1">Make sure you have pending tasks!</p>
                        </div>
                    ) : (
                        <ScrollArea className="max-h-[300px]">
                            <div className="space-y-3 p-1">
                                {recommendations.map((rec, index) => {
                                    const todo = todos.find(t => t.id === rec.id)
                                    if (!todo) return null
                                    return (
                                        <div key={`${rec.id}-${index}`} className="group bg-surface-container p-3 rounded-lg border-0 hover:bg-surface-container-highest transition-colors shadow-sm">
                                            <div className="flex items-start gap-3">
                                                <button
                                                    onClick={() => toggleTodo(todo.id, !todo.completed)}
                                                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    {todo.completed ? <IconCircleCheck className="w-5 h-5 text-green-500" /> : <IconCircle className="w-5 h-5" />}
                                                </button>
                                                <div className="flex-1 min-w-0 overflow-hidden">
                                                    <div className={cn("font-medium text-sm line-clamp-2 break-words", todo.completed && "line-through opacity-50")}>
                                                        {todo.text}
                                                    </div>
                                                    <div className="text-xs text-primary/80 mt-1 flex items-start gap-1">
                                                        <IconSparkles className="w-3 h-3 shrink-0 mt-0.5" />
                                                        <span className="line-clamp-2 break-words">{rec.reason}</span>
                                                    </div>
                                                    <div className="flex gap-2 mt-2 flex-wrap">
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            className="h-6 text-[10px] px-2 shadow-sm"
                                                            onClick={() => {
                                                                const today = format(new Date(), 'yyyy-MM-dd')
                                                                updateTodo(todo.id, { dueDate: today })
                                                                setShowDialog(false)
                                                            }}
                                                        >
                                                            Add to Today
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="h-6 text-[10px] px-2 bg-surface-container-highest hover:bg-surface-container-highest/80"
                                                            onClick={() => {
                                                                const tomorrow = new Date()
                                                                tomorrow.setDate(tomorrow.getDate() + 1)
                                                                updateTodo(todo.id, { dueDate: format(tomorrow, 'yyyy-MM-dd') })
                                                                setShowDialog(false)
                                                            }}
                                                        >
                                                            Tomorrow
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-6 text-[10px] px-2 border-primary/20 hover:bg-primary/5"
                                                            onClick={() => {
                                                                toggleTodo(todo.id, true)
                                                            }}
                                                        >
                                                            Done ✓
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    )}

                    <div className="flex justify-end pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowDialog(false)} className="hover:bg-surface-container-highest">
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
