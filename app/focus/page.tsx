"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { IconPlayerPlay, IconPlayerPause, IconPlayerStop, IconMaximize, IconMinimize, IconArrowLeft, IconVolume } from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"
import { AmbienceWidget } from "@/components/dashboard/ambience-widget"
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

    // Ambience state
    const [showAmbience, setShowAmbience] = React.useState(false)

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
            {/* Dynamic Background - Refined for "Less Distracting" */}
            <div className="absolute inset-0 pointer-events-none transition-all duration-1000">
                <div className={cn(
                    "absolute inset-0 transition-opacity duration-[2000ms]",
                    isActive ? "opacity-30" : "opacity-20"
                )}
                    style={{
                        background: currentTheme.gradient,
                        filter: "blur(80px)",
                    }}
                />
                {currentTheme.grain && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay"></div>}
            </div>

            {/* Top Bar - Refined Subject Selector */}
            <div className="flex items-center justify-between p-8 z-20">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="sm" asChild className="text-muted-foreground/60 hover:text-white hover:bg-white/5 transition-all text-xs tracking-widest uppercase">
                        <a href="/"><IconArrowLeft className="w-3 h-3 mr-2" /> Dashboard</a>
                    </Button>
                    <div className="h-4 w-[1px] bg-white/5" />
                    <ThemeSelector currentTheme={theme} onThemeChange={handleThemeChange} />

                    {/* Subject Selector - Fixed Interactivity */}
                    <div className="relative group z-30">
                        <select
                            className={cn(
                                "bg-transparent border border-transparent hover:border-white/10 rounded-full text-[10px] tracking-widest uppercase px-4 py-2 outline-none focus:border-white/20 transition-all appearance-none cursor-pointer pr-8",
                                isActive ? "text-white/30 pointer-events-none" : "text-white/50 hover:text-white"
                            )}
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                        >
                            <option value="none" className="bg-black text-white/50">Subject</option>
                            {subjects.map(sub => (
                                <option key={sub.id} value={sub.id} className="bg-black text-white">{sub.code}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 3L4 6L7 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative">
                    {/* Ambience Toggle */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "rounded-full transition-colors",
                                showAmbience ? "text-white bg-white/10" : "text-white/30 hover:text-white hover:bg-white/5"
                            )}
                            onClick={() => setShowAmbience(!showAmbience)}
                        >
                            <IconVolume className="w-4 h-4" />
                        </Button>

                        {/* Persistent Ambience Mixer (Always mounted, just hidden) */}
                        <div className={cn(
                            "absolute top-full right-0 mt-4 w-80 bg-black/90 border border-white/10 backdrop-blur-xl text-white p-4 rounded-xl shadow-2xl z-50 transition-all duration-200 origin-top-right",
                            showAmbience ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible pointer-events-none"
                        )}>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-light tracking-widest uppercase opacity-60">Ambience Mixer</h4>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/40 hover:text-white" onClick={() => setShowAmbience(false)}>
                                    <IconMinimize className="w-3 h-3" />
                                </Button>
                            </div>
                            <AmbienceWidget />
                        </div>
                    </div>

                    <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white/30 hover:text-white hover:bg-white/5 rounded-full">
                        {isFullscreen ? <IconMinimize className="w-4 h-4" /> : <IconMaximize className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 flex flex-col md:flex-row items-stretch justify-center p-6 gap-8 z-10">

                {/* Left: Task List */}
                <div className="hidden md:flex flex-col items-start w-[250px] lg:w-[300px] h-full justify-center pt-20">
                    <FocusTaskList
                        todos={todos.filter(t => t.dueDate === new Date().toISOString().split('T')[0])}
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
