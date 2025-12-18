"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { IconPlayerPlay, IconPlayerPause, IconPlayerStop, IconMaximize, IconMinimize, IconArrowLeft, IconVolume } from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"
import { AmbienceWidget } from "@/components/dashboard/ambience-widget"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FocusQuote } from "@/components/focus/focus-quote"
import { GamificationWidget } from "@/components/focus/gamification"
import { FocusTaskList } from "@/components/focus/task-list"
import { ThemeSelector, ThemeKey, THEMES } from "@/components/focus/theme-selector"

export default function FocusPage() {
    const { dailyLogs, addDailyLog, todos, toggleTodo, subjects } = useStore()
    const logs = dailyLogs || []

    // Timer State
    const [seconds, setSeconds] = React.useState(0)
    const [isActive, setIsActive] = React.useState(false)
    const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null)
    const [selectedTaskText, setSelectedTaskText] = React.useState<string>("Just Focusing")
    const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | "none">("none") // Subject state

    // Theme State
    const [theme, setTheme] = React.useState<ThemeKey>("aurora")

    // Load theme from local storage
    React.useEffect(() => {
        const savedTheme = localStorage.getItem("focus_theme") as ThemeKey
        if (savedTheme && THEMES[savedTheme]) {
            setTheme(savedTheme)
        }
    }, [])

    const handleThemeChange = (newTheme: ThemeKey) => {
        setTheme(newTheme)
        localStorage.setItem("focus_theme", newTheme)
    }

    // Fullscreen state
    const [isFullscreen, setIsFullscreen] = React.useState(false)

    // Calculate daily study time
    const todayMinutes = React.useMemo(() => {
        const today = new Date().toISOString().split('T')[0]
        return logs
            .filter(log => log.date?.toString().startsWith(today))
            .reduce((acc, log) => acc + (log.studyTime || 0), 0)
    }, [logs])

    // Calculate total study time from logs
    const totalMinutes = React.useMemo(() => {
        return logs.reduce((acc, log) => acc + (log.studyTime || 0), 0)
    }, [logs])

    // Timer Logic
    React.useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds(prev => prev + 1)
            }, 1000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isActive])

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const s = totalSeconds % 60
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const toggleTimer = () => {
        setIsActive(!isActive)
    }

    const handleTaskSelect = (id: string, text: string) => {
        if (selectedTaskId !== id) {
            if (!isActive) setIsActive(true)
        }
        setSelectedTaskId(id)
        setSelectedTaskText(text)
    }

    const handleClearFocus = () => {
        setSelectedTaskId(null)
        setSelectedTaskText("Just Focusing")
    }

    const stopSession = async () => {
        setIsActive(false)
        const minutes = Math.round(seconds / 60)

        if (minutes >= 1) {
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#a78bfa', '#fb7185', '#34d399']
            })

            await addDailyLog({
                mood: 3,
                studyTime: minutes,
                note: `Deep Work: ${selectedTaskText}`,
                date: new Date().toISOString()
            })

            setTimeout(() => {
                setSeconds(0)
                handleClearFocus()
            }, 3000)
        } else {
            setSeconds(0)
        }
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { })
            setIsFullscreen(true)
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => { })
                setIsFullscreen(false)
            }
        }
    }

    const currentTheme = THEMES[theme]

    return (
        <div className={cn("min-h-screen text-foreground flex flex-col relative overflow-hidden font-sans selection:bg-purple-500/30", currentTheme.bg)}>
            {/* Dynamic Background */}
            <div className="absolute inset-0 pointer-events-none transition-all duration-1000">
                {/* Spotlight/Aurora Gradient */}
                <div className={cn(
                    "absolute top-[-50%] left-[-50%] w-[200%] h-[200%] transition-opacity duration-[2000ms]",
                    isActive ? "opacity-40" : "opacity-20"
                )}
                    style={{
                        background: currentTheme.gradient,
                        filter: "blur(100px)",
                        animation: isActive ? "pulse 8s infinite" : "none"
                    }}
                />
                {currentTheme.grain && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>}
            </div>

            {/* Top Bar - ADDED SUBJECT SELECTOR */}
            <div className="flex items-center justify-between p-6 z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-white hover:bg-white/10 transition-colors">
                        <a href="/"><IconArrowLeft className="w-4 h-4 mr-2" /> Dashboard</a>
                    </Button>
                    <ThemeSelector currentTheme={theme} onThemeChange={handleThemeChange} />

                    {/* Subject Selector */}
                    <div className="relative">
                        <select
                            className={cn(
                                "bg-white/5 border border-white/10 rounded-md text-xs px-3 py-1.5 outline-none focus:border-white/20 transition-colors appearance-none cursor-pointer",
                                isActive ? "text-white/40 pointer-events-none" : "text-white/80"
                            )}
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                        >
                            <option value="none" className="bg-black text-white/50">Select Subject (Optional)</option>
                            {subjects.map(sub => (
                                <option key={sub.id} value={sub.id} className="bg-black text-white">{sub.code} - {sub.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white hover:bg-white/10"><IconVolume className="w-4 h-4" /></Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-black/90 border-white/10 backdrop-blur-xl text-white">
                            <DialogHeader><DialogTitle>Ambience Mixer</DialogTitle></DialogHeader>
                            <div className="py-4">
                                <AmbienceWidget />
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-muted-foreground hover:text-white hover:bg-white/10">
                        {isFullscreen ? <IconMinimize className="w-4 h-4" /> : <IconMaximize className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 flex flex-col md:flex-row items-stretch justify-center p-6 gap-8 z-10">

                {/* Left: Task List */}
                <div className="hidden md:flex flex-col items-start w-[250px] lg:w-[300px] h-full justify-center pt-20">
                    <FocusTaskList
                        todos={todos.filter(t => !t.completed || selectedTaskId === String(t.id))}
                        activeTaskId={selectedTaskId}
                        onSelectTask={handleTaskSelect}
                        onToggleTodo={toggleTodo}
                        onClearFocus={handleClearFocus}
                    />
                </div>

                {/* Center: Timer & Context - UPDATED: Cleaner, thinner, no glow */}
                <div className="flex flex-col items-center justify-center flex-1 min-w-0 z-50">
                    <div className="text-center mb-12 space-y-4">
                        <span className={cn(
                            "inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.3em] uppercase opacity-50",
                            currentTheme.accent
                        )}>
                            {isActive ? "Flow State" : "Ready"}
                        </span>
                        <h2 className="text-xl md:text-2xl font-extralight text-white/80 tracking-wide">{selectedTaskText}</h2>
                    </div>

                    <div
                        className="relative group cursor-pointer mb-16 select-none"
                        onClick={toggleTimer}
                    >
                        {/* Timer Text: Removed all drop-shadows and increased thinness */}
                        <div className={cn(
                            "text-[8rem] sm:text-[10rem] md:text-[14rem] leading-none font-thin tabular-nums tracking-tighter transition-all duration-700",
                            isActive ? "text-white opacity-100" : "text-white/20"
                        )}
                            style={{
                                fontWeight: 100 // Ultra hairline thin
                            }}
                        >
                            {formatTime(seconds)}
                        </div>

                        {/* Subtle play hint on hover/inactive */}
                        {!isActive && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <IconPlayerPlay className="w-12 h-12 text-white/10" />
                            </div>
                        )}
                    </div>

                    {/* Minimal Controls */}
                    <div className="flex items-center gap-12">
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                                "w-16 h-16 rounded-full transition-all duration-500",
                                isActive ? "bg-white/5 hover:bg-white/10 text-white/80" : "bg-transparent text-white/20 hover:text-white/50"
                            )}
                            onClick={toggleTimer}
                        >
                            {isActive ? <IconPlayerPause className="w-8 h-8" /> : <IconPlayerPlay className="w-8 h-8 ml-1" />}
                        </Button>

                        {(seconds > 0 || isActive) && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="w-12 h-12 rounded-full text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                onClick={stopSession}
                                title="Finish Session"
                            >
                                <IconPlayerStop className="w-5 h-5" />
                            </Button>
                        )}
                    </div>

                    <div className="mt-12 opacity-50">
                        <FocusQuote active={isActive} />
                    </div>
                </div>

                {/* Right: Gamification (Vertical Path) */}
                <div className="hidden md:flex flex-col items-end w-[250px] lg:w-[300px] h-full justify-center">
                    <GamificationWidget todayMinutes={todayMinutes} />
                </div>
            </div>

        </div>
    )
}
