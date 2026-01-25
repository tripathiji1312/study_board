"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { IconPlayerPlay, IconPlayerPause, IconPlayerStop, IconMaximize, IconMinimize, IconArrowLeft, IconVolume } from "@tabler/icons-react"
import { useStore } from "@/components/providers/store-provider"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"
import { AmbienceWidget } from "@/components/dashboard/ambience-widget"
import { FocusQuote } from "@/components/focus/focus-quote"
import { GamificationWidget } from "@/components/focus/gamification"
import { ThemeSelector, ThemeKey, THEMES } from "@/components/focus/theme-selector"
import { FocusTaskList } from "@/components/focus/task-list"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { FocusHistory } from "@/components/dashboard/focus-history"
import { IconChartBar, IconShieldLock } from "@tabler/icons-react"
import { DistractionBlocker } from "@/components/focus/distraction-blocker"

export default function FocusPage() {
    const { dailyLogs, addDailyLog, todos, toggleTodo, subjects } = useStore()
    const logs = dailyLogs || []

    // Timer State
    const [seconds, setSeconds] = React.useState(0) // displayed seconds
    const [isActive, setIsActive] = React.useState(false)
    const [startedAtMs, setStartedAtMs] = React.useState<number | null>(null)
    const [savedSeconds, setSavedSeconds] = React.useState(0)
    const [lastAutosavedMinute, setLastAutosavedMinute] = React.useState(0)
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
    const [showBlocker, setShowBlocker] = React.useState(false)

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

    const FOCUS_SESSION_STORAGE_KEY = "focus_session_v1"

    const computeSeconds = React.useCallback(() => {
        if (!isActive || !startedAtMs) return savedSeconds
        const elapsed = Math.floor((Date.now() - startedAtMs) / 1000)
        return savedSeconds + Math.max(0, elapsed)
    }, [isActive, savedSeconds, startedAtMs])

    const syncSeconds = React.useCallback(() => {
        setSeconds(computeSeconds())
    }, [computeSeconds])

    // Persist/restore session (survives tab suspension + refresh)
    React.useEffect(() => {
        try {
            const raw = localStorage.getItem(FOCUS_SESSION_STORAGE_KEY)
            if (!raw) return
            const session = JSON.parse(raw) as {
                isActive?: boolean
                startedAtMs?: number | null
                savedSeconds?: number
                lastAutosavedMinute?: number
                selectedTaskId?: string | null
                selectedTaskText?: string
                selectedSubjectId?: string | "none"
            }

            setIsActive(Boolean(session.isActive))
            setStartedAtMs(session.startedAtMs ?? null)
            setSavedSeconds(typeof session.savedSeconds === "number" ? session.savedSeconds : 0)
            setLastAutosavedMinute(typeof session.lastAutosavedMinute === "number" ? session.lastAutosavedMinute : 0)
            if (typeof session.selectedTaskId !== "undefined") setSelectedTaskId(session.selectedTaskId)
            if (typeof session.selectedTaskText === "string") setSelectedTaskText(session.selectedTaskText)
            if (typeof session.selectedSubjectId !== "undefined") setSelectedSubjectId(session.selectedSubjectId)
        } catch {
            // ignore corrupted storage
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    React.useEffect(() => {
        try {
            localStorage.setItem(
                FOCUS_SESSION_STORAGE_KEY,
                JSON.stringify({
                    isActive,
                    startedAtMs,
                    savedSeconds,
                    lastAutosavedMinute,
                    selectedTaskId,
                    selectedTaskText,
                    selectedSubjectId,
                })
            )
        } catch {
            // ignore quota / storage errors
        }
    }, [isActive, startedAtMs, savedSeconds, lastAutosavedMinute, selectedTaskId, selectedTaskText, selectedSubjectId])

    // Timer display refresh (uses real elapsed time)
    React.useEffect(() => {
        if (!isActive) {
            setSeconds(savedSeconds)
            return
        }

        syncSeconds()
        const interval = setInterval(syncSeconds, 1000)
        return () => clearInterval(interval)
    }, [isActive, savedSeconds, syncSeconds])

    // When returning to the tab, resync immediately
    React.useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === "visible") syncSeconds()
        }
        document.addEventListener("visibilitychange", onVisibility)
        return () => document.removeEventListener("visibilitychange", onVisibility)
    }, [syncSeconds])

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const s = totalSeconds % 60
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const toggleTimer = () => {
        if (isActive) {
            // pause
            setSavedSeconds(computeSeconds())
            setStartedAtMs(null)
            setIsActive(false)
            return
        }

        // resume/start
        setStartedAtMs(Date.now())
        setIsActive(true)
    }

    const handleTaskSelect = (id: string, text: string) => {
        if (selectedTaskId !== id) {
            if (!isActive) {
                setStartedAtMs(Date.now())
                setIsActive(true)
            }
        }
        setSelectedTaskId(id)
        setSelectedTaskText(text)
    }

    const handleClearFocus = () => {
        setSelectedTaskId(null)
        setSelectedTaskText("Just Focusing")
    }

    const stopSession = async () => {
        const finalSeconds = computeSeconds()
        setIsActive(false)
        setStartedAtMs(null)
        setSavedSeconds(0)
        setLastAutosavedMinute(0)

        try {
            localStorage.removeItem(FOCUS_SESSION_STORAGE_KEY)
        } catch {
            // ignore
        }

        const minutes = Math.floor(finalSeconds / 60)
        const remainderSeconds = finalSeconds % 60

        // If we autosaved some whole minutes already, only save the remainder here.
        const minutesAlreadySaved = lastAutosavedMinute
        const remainingWholeMinutes = Math.max(0, minutes - minutesAlreadySaved)
        const shouldSaveSecondsAsMinute = remainderSeconds >= 30 ? 1 : 0
        const additionalMinutes = remainingWholeMinutes + shouldSaveSecondsAsMinute

        if (additionalMinutes >= 1) {
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#a78bfa', '#fb7185', '#34d399']
            })

            await addDailyLog({
                mood: 3,
                studyTime: additionalMinutes,
                note: `Deep Work: ${selectedTaskText}${minutesAlreadySaved > 0 ? " (continued)" : ""}`,
                date: new Date().toISOString(),
                subjectId: selectedSubjectId === "none" ? undefined : selectedSubjectId
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

    // Autosave: every completed minute, write to daily log
    React.useEffect(() => {
        if (!isActive) return

        const maybeAutosave = async () => {
            const currentSeconds = computeSeconds()
            const minutesCompleted = Math.floor(currentSeconds / 60)

            if (minutesCompleted <= 0) return
            if (minutesCompleted <= lastAutosavedMinute) return

            const minutesToSave = minutesCompleted - lastAutosavedMinute
            setLastAutosavedMinute(minutesCompleted)

            await addDailyLog({
                mood: 3,
                studyTime: minutesToSave,
                note: `Deep Work: ${selectedTaskText}${lastAutosavedMinute > 0 ? " (continued)" : ""}`,
                date: new Date().toISOString(),
                subjectId: selectedSubjectId === "none" ? undefined : selectedSubjectId
            })
        }

        // check every 15s so the log stays near-real-time,
        // but only writes when a new minute completes
        const interval = setInterval(() => {
            maybeAutosave().catch(() => { })
        }, 15000)

        // also check immediately when we start/resume
        maybeAutosave().catch(() => { })

        return () => clearInterval(interval)
    }, [addDailyLog, computeSeconds, isActive, lastAutosavedMinute, selectedSubjectId, selectedTaskText])

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
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 md:p-8 z-20">
                <div className="flex items-center gap-3 md:gap-6 flex-wrap">
                    <Button variant="ghost" size="sm" asChild className="text-muted-foreground/60 hover:text-white hover:bg-white/5 transition-all text-xs tracking-widest uppercase">
                        <Link href="/"><IconArrowLeft className="w-3 h-3 mr-2" />Dashboard</Link>
                    </Button>
                    <div className="hidden md:block h-4 w-[1px] bg-white/5" />
                    <div className="hidden md:block h-4 w-[1px] bg-white/5" />
                    <ThemeSelector currentTheme={theme} onThemeChange={handleThemeChange} />

                    {/* History Sheet */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-muted-foreground/60 hover:text-white hover:bg-white/5 transition-all text-xs tracking-widest uppercase">
                                <IconChartBar className="w-3 h-3 mr-2" />History
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[300px] sm:w-[400px] md:w-[540px] border-l border-white/10 bg-black/90 backdrop-blur-xl text-white">
                            <SheetHeader>
                                <SheetTitle className="text-white uppercase tracking-widest font-light text-sm">Session History</SheetTitle>
                            </SheetHeader>
                            <div className="mt-8">
                                <FocusHistory />
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Subject Selector - Fixed Interactivity */}
                    <div className="relative group z-30">
                        <select
                            className={cn(
                                "bg-transparent border border-transparent hover:border-white/10 rounded-full text-[10px] tracking-widest uppercase px-3 md:px-4 py-2 outline-none focus:border-white/20 transition-all appearance-none cursor-pointer pr-8",
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

                <div className="flex items-center gap-2 md:gap-4 relative">
                    {/* Blocker Toggle */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "rounded-full transition-colors",
                                showBlocker ? "text-red-400 bg-red-400/10" : "text-white/30 hover:text-white hover:bg-white/5"
                            )}
                            onClick={() => {
                                setShowBlocker(!showBlocker)
                                setShowAmbience(false) // Close others
                            }}
                        >
                            <IconShieldLock className="w-4 h-4" />
                        </Button>

                        <div className={cn(
                            "absolute top-full right-0 mt-4 origin-top-right transition-all duration-200 z-50",
                            showBlocker ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible pointer-events-none"
                        )}>
                            <DistractionBlocker />
                        </div>
                    </div>

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
                            "absolute top-full right-0 mt-4 w-72 md:w-80 bg-black/90 border border-white/10 backdrop-blur-xl text-white p-4 rounded-xl shadow-2xl z-50 transition-all duration-200 origin-top-right",
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

                {/* Mobile: Quick Task Selection (visible on mobile only) */}
                <div className="md:hidden w-full mb-4">
                    <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                        <h4 className="text-xs font-medium tracking-widest uppercase opacity-50 mb-3">Today&apos;s Tasks</h4>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto">
                            {todos.filter(t => t.dueDate === new Date().toISOString().split('T')[0] && !t.completed).slice(0, 5).map(todo => (
                                <button
                                    key={todo.id}
                                    onClick={() => handleTaskSelect(todo.id, todo.text)}
                                    className={cn(
                                        "w-full text-left p-2 rounded-lg text-sm transition-all",
                                        selectedTaskId === todo.id
                                            ? "bg-white/10 text-white"
                                            : "text-white/50 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    {todo.text}
                                </button>
                            ))}
                            {todos.filter(t => t.dueDate === new Date().toISOString().split('T')[0] && !t.completed).length === 0 && (
                                <p className="text-white/30 text-sm text-center py-2">No tasks for today</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Left: Task List (Desktop only) */}
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

                {/* Right: Gamification (Desktop only) */}
                <div className="hidden md:flex flex-col items-end w-[250px] lg:w-[300px] h-full justify-center">
                    <GamificationWidget todayMinutes={todayMinutes} />
                </div>

                {/* Mobile: Bottom Stats Bar */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-4 z-40">
                    <div className="flex items-center justify-around">
                        <div className="text-center">
                            <p className="text-2xl font-light text-white">{todayMinutes}</p>
                            <p className="text-[10px] uppercase tracking-wider text-white/50">Min Today</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <p className="text-2xl font-light text-white">{Math.floor(totalMinutes / 60)}</p>
                            <p className="text-[10px] uppercase tracking-wider text-white/50">Hours Total</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <p className="text-2xl font-light text-white">{selectedSubjectId !== "none" ? subjects.find(s => s.id === selectedSubjectId)?.code || "—" : "—"}</p>
                            <p className="text-[10px] uppercase tracking-wider text-white/50">Subject</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
