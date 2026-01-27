"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    IconArrowLeft,
    IconChartBar,
    IconMaximize,
    IconMinimize,
    IconPlayerPause,
    IconPlayerPlay,
    IconPlayerStop,
    IconShieldLock,
    IconVolume,
} from "@tabler/icons-react"
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
import { DistractionBlocker } from "@/components/focus/distraction-blocker"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Spotlight } from "@/components/ui/spotlight"
import { Particles } from "@/components/ui/particles"

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
            const confettiColors = theme === 'monochrome' 
                ? ['#ffffff', '#aaaaaa', '#555555'] 
                : ['#a78bfa', '#fb7185', '#34d399']

            // Use requestAnimationFrame to avoid fullscreen exit from DOM manipulation
            requestAnimationFrame(() => {
                confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: confettiColors,
                    disableForReducedMotion: true
                })
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

    // Track if user intentionally wants fullscreen
    const [userWantsFullscreen, setUserWantsFullscreen] = React.useState(false)

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            setUserWantsFullscreen(true)
            document.documentElement.requestFullscreen().catch(() => { 
                setUserWantsFullscreen(false)
            })
        } else {
            setUserWantsFullscreen(false)
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => { })
            }
        }
    }

    // Sync fullscreen state with actual browser fullscreen status
    React.useEffect(() => {
        const handleFullscreenChange = () => {
            const isNowFullscreen = !!document.fullscreenElement
            setIsFullscreen(isNowFullscreen)
            
            // If user wanted fullscreen but it exited (e.g., due to DOM changes),
            // don't auto-re-enter as that requires user gesture
            if (!isNowFullscreen && userWantsFullscreen) {
                // Reset the preference - user will need to click again
                setUserWantsFullscreen(false)
            }
        }
        document.addEventListener("fullscreenchange", handleFullscreenChange)
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }, [userWantsFullscreen])

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
    const spotlightFill = theme === "midnight" ? "#60a5fa" : "#ffffff"

    return (
        <div className={cn("min-h-screen text-foreground flex flex-col relative overflow-hidden font-sans selection:bg-white/20", currentTheme.bg)}>
            {/* Dynamic Background - Refined for "Less Distracting" */}
            <div className="absolute inset-0 pointer-events-none transition-all duration-1000 overflow-hidden">
                {currentTheme.type === "beams" && (
                    <div className="absolute inset-0 h-[100vh]">
                        <BackgroundBeams className={cn(isActive ? "opacity-40" : "opacity-30")} />
                    </div>
                )}
                {currentTheme.type === "spotlight" && (
                    <Spotlight
                        className={cn(
                            "left-0 md:left-60 top-[-20%] md:top-[-5%] opacity-0 transition-opacity duration-1000",
                             // Spotlight is tricky, let's just make it visible
                             "opacity-100" 
                        )}
                        fill={spotlightFill}
                    />
                )}
                {currentTheme.type === "particles" && (
                    <div className="absolute inset-0 h-full w-full">
                        <Particles
                            className="absolute inset-0"
                            quantity={100}
                            ease={80}
                            color={theme === "nebula" ? "#e9d5ff" : "#ffffff"}
                            refresh
                        />
                    </div>
                )}
                {currentTheme.gradient && (
                    <div
                        className={cn(
                            "absolute inset-0 transition-opacity duration-[2000ms]",
                            isActive ? "opacity-30" : "opacity-20"
                        )}
                        style={{
                            background: currentTheme.gradient,
                        }}
                    />
                )}
                {currentTheme.grain && (
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150 mix-blend-overlay" />
                )}
            </div>

            {/* Top Bar - Refined Subject Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-6 md:p-8 z-20 w-full max-w-[1800px] mx-auto">
                <div className="flex items-center gap-3 md:gap-6 flex-wrap">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="rounded-full border border-white/5 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all duration-300 text-[10px] font-medium tracking-[0.2em] uppercase px-4 h-9"
                        onClick={() => {
                            // Exit fullscreen before navigation to prevent abrupt exit
                            if (document.fullscreenElement && document.exitFullscreen) {
                                document.exitFullscreen().catch(() => {})
                            }
                        }}
                    >
                        <Link href="/"><IconArrowLeft className="w-3 h-3 mr-2" />Dashboard</Link>
                    </Button>
                    <div className="hidden md:block h-4 w-[1px] bg-white/5" />
                    <div className="hidden md:block h-4 w-[1px] bg-white/5" />
                    <ThemeSelector currentTheme={theme} onThemeChange={handleThemeChange} />

                    {/* History Sheet */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "rounded-full border border-white/5 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all duration-300 text-[10px] font-medium tracking-[0.2em] uppercase px-4 h-9",
                                    theme === 'monochrome' ? "grayscale contrast-125" : ""
                                )}
                            >
                                <IconChartBar className="w-3 h-3 mr-2" />History
                            </Button>
                        </SheetTrigger>
                        <SheetContent className={cn(
                            "w-[300px] sm:w-[400px] md:w-[540px] border-l border-white/10 bg-zinc-950/90 backdrop-blur-2xl text-white shadow-2xl p-6",
                            theme === 'monochrome' ? "grayscale contrast-125" : ""
                        )}>
                            <SheetHeader className="mb-6">
                                <SheetTitle className="text-white uppercase tracking-[0.2em] font-medium text-xs opacity-70">Session History</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4">
                                <FocusHistory />
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Subject Selector - Fixed Interactivity */}
                    <div className="relative group z-30">
                        {currentTheme.type === "particles" && (
                            <Spotlight
                                className={cn(
                                    "left-0 md:left-60 top-[-20%] md:top-[-5%] opacity-50",
                                )}
                                fill="#d8b4fe"
                            />
                        )}
                        <select
                            className={cn(
                                "rounded-full border border-white/5 bg-white/5 text-[10px] font-medium tracking-[0.2em] uppercase px-4 py-2 outline-none focus:border-white/20 transition-all duration-300 appearance-none cursor-pointer pr-10 h-9",
                                isActive ? "text-white/30 pointer-events-none" : "text-white/40 hover:text-white hover:bg-white/10 hover:border-white/10",
                                theme === 'monochrome' ? "grayscale contrast-125" : ""
                            )}
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                        >
                            <option value="none" className="bg-black text-white/50">Subject</option>
                            {subjects.map(sub => (
                                <option key={sub.id} value={sub.id} className="bg-black text-white">{sub.code}</option>
                            ))}
                        </select>
                        <div className={cn(
                            "absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300",
                            isActive ? "opacity-10" : "opacity-30 group-hover:opacity-100"
                        )}>
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
                                "rounded-full transition-all duration-300 w-9 h-9",
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
                            "absolute top-full right-0 mt-4 origin-top-right transition-all duration-200 z-50 shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-zinc-950/90 backdrop-blur-2xl",
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
                                "rounded-full transition-all duration-300 w-9 h-9",
                                showAmbience ? "text-white bg-white/10" : "text-white/30 hover:text-white hover:bg-white/5"
                            )}
                            onClick={() => setShowAmbience(!showAmbience)}
                        >
                            <IconVolume className="w-4 h-4" />
                        </Button>

                        {/* Persistent Ambience Mixer (Always mounted, just hidden) */}
                        <div className={cn(
                            "absolute top-full right-0 mt-4 w-72 md:w-80 bg-zinc-950/90 border border-white/10 backdrop-blur-2xl text-white p-5 rounded-2xl shadow-2xl z-50 transition-all duration-200 origin-top-right",
                            showAmbience ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible pointer-events-none"
                        )}>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-medium tracking-[0.2em] uppercase opacity-50 text-white">Ambience Mixer</h4>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors" onClick={() => setShowAmbience(false)}>
                                    <IconMinimize className="w-3 h-3" />
                                </Button>
                            </div>
                            <AmbienceWidget />
                        </div>
                    </div>

                    <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white/30 hover:text-white hover:bg-white/5 rounded-full w-9 h-9 transition-all duration-300">
                        {isFullscreen ? <IconMinimize className="w-4 h-4" /> : <IconMaximize className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Main Layout */}
                    <div className={cn(
                        "flex-1 flex flex-col md:flex-row items-stretch justify-center p-6 gap-8 z-10 w-full max-w-[1800px] mx-auto transition-all duration-700",
                        theme === 'monochrome' ? "grayscale contrast-125" : ""
                    )}>

                {/* Mobile: Quick Task Selection (visible on mobile only) */}
                <div className="md:hidden w-full mb-4">
                    <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                        <h4 className="text-[10px] font-medium tracking-widest uppercase opacity-40 mb-3 text-white">Today&apos;s Tasks</h4>
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
                <div
                    className={cn(
                        "hidden md:flex flex-col items-start w-[250px] lg:w-[300px] h-full justify-center pt-20 transition-all duration-700",
                        isActive ? "opacity-0 pointer-events-none" : "opacity-100"
                    )}
                >
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
                            "inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.4em] uppercase opacity-70 animate-pulse duration-[3000ms]",
                            currentTheme.accent
                        )}>
                            {isActive ? "Flow State" : "Ready"}
                        </span>
                        <h2 className="text-xl md:text-3xl font-light text-white/90 tracking-wide drop-shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500">{selectedTaskText}</h2>
                    </div>

                    <div
                        className="relative group cursor-pointer mb-16 select-none"
                        onClick={toggleTimer}
                    >
                        {/* Timer Text: Clean typography */}
                        <div className={cn(
                            "text-[12rem] sm:text-[14rem] md:text-[18rem] leading-none tabular-nums tracking-tighter transition-all duration-700 select-none font-light drop-shadow-2xl",
                            isActive ? "text-white opacity-100 scale-105" : "text-white/10 scale-100"
                        )}
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
                                "w-20 h-20 rounded-full border bg-white/5 backdrop-blur-xl shadow-2xl transition-all duration-300 group",
                                isActive 
                                    ? "border-white/20 text-white/90 hover:bg-white/10 hover:scale-105" 
                                    : "border-white/10 text-white/40 hover:text-white hover:border-white/20 hover:bg-white/10"
                            )}
                            onClick={toggleTimer}
                        >
                            {isActive ? <IconPlayerPause className="w-8 h-8 fill-current" /> : <IconPlayerPlay className="w-8 h-8 ml-1 fill-current" />}
                        </Button>

                        {(seconds > 0 || isActive) && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="w-14 h-14 rounded-full border border-white/5 bg-white/5 backdrop-blur-md text-white/20 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-all duration-300"
                                onClick={stopSession}
                                title="Finish Session"
                            >
                                <IconPlayerStop className="w-6 h-6 fill-current" />
                            </Button>
                        )}
                    </div>

                    <div className="mt-12 opacity-50">
                        <FocusQuote active={isActive} />
                    </div>
                </div>

                {/* Right: Gamification (Desktop only) */}
                <div
                    className={cn(
                        "hidden md:flex flex-col items-end w-[250px] lg:w-[300px] h-full justify-center transition-all duration-700",
                        isActive ? "opacity-0 pointer-events-none" : "opacity-100"
                    )}
                >
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
