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
    IconSettings,
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
    const [seconds, setSeconds] = React.useState(0)
    const [isActive, setIsActive] = React.useState(false)
    const [startedAtMs, setStartedAtMs] = React.useState<number | null>(null)
    const [savedSeconds, setSavedSeconds] = React.useState(0)
    const [lastAutosavedMinute, setLastAutosavedMinute] = React.useState(0)
    const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null)
    const [selectedTaskText, setSelectedTaskText] = React.useState<string>("Just Focusing")
    const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | "none">("none")

    // Theme State
    const [theme, setTheme] = React.useState<ThemeKey>("aurora")

    // UI State
    const [showAmbience, setShowAmbience] = React.useState(false)
    const [showBlocker, setShowBlocker] = React.useState(false)
    const [isFullscreen, setIsFullscreen] = React.useState(false)
    const [showControls, setShowControls] = React.useState(false)
    const [currentTime, setCurrentTime] = React.useState(new Date())

    // Load theme from local storage
    React.useEffect(() => {
        const savedTheme = localStorage.getItem("focus_theme") as ThemeKey
        if (savedTheme && THEMES[savedTheme]) {
            setTheme(savedTheme)
        }
    }, [])

    // Update current time every second
    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const handleThemeChange = (newTheme: ThemeKey) => {
        setTheme(newTheme)
        localStorage.setItem("focus_theme", newTheme)
    }

    // Calculate daily study time
    const todayMinutes = React.useMemo(() => {
        const today = new Date().toISOString().split('T')[0]
        return logs
            .filter(log => log.date?.toString().startsWith(today))
            .reduce((acc, log) => acc + (log.studyTime || 0), 0)
    }, [logs])

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

    // Persist/restore session
    React.useEffect(() => {
        try {
            const raw = localStorage.getItem(FOCUS_SESSION_STORAGE_KEY)
            if (!raw) return
            const session = JSON.parse(raw)
            setIsActive(Boolean(session.isActive))
            setStartedAtMs(session.startedAtMs ?? null)
            setSavedSeconds(typeof session.savedSeconds === "number" ? session.savedSeconds : 0)
            setLastAutosavedMinute(typeof session.lastAutosavedMinute === "number" ? session.lastAutosavedMinute : 0)
            if (typeof session.selectedTaskId !== "undefined") setSelectedTaskId(session.selectedTaskId)
            if (typeof session.selectedTaskText === "string") setSelectedTaskText(session.selectedTaskText)
            if (typeof session.selectedSubjectId !== "undefined") setSelectedSubjectId(session.selectedSubjectId)
        } catch {
            // ignore
        }
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
            // ignore
        }
    }, [isActive, startedAtMs, savedSeconds, lastAutosavedMinute, selectedTaskId, selectedTaskText, selectedSubjectId])

    // Timer display refresh
    React.useEffect(() => {
        if (!isActive) {
            setSeconds(savedSeconds)
            return
        }
        syncSeconds()
        const interval = setInterval(syncSeconds, 1000)
        return () => clearInterval(interval)
    }, [isActive, savedSeconds, syncSeconds])

    // Resync on tab visibility
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

    const formatClockTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        })
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric'
        })
    }

    const toggleTimer = () => {
        if (isActive) {
            setSavedSeconds(computeSeconds())
            setStartedAtMs(null)
            setIsActive(false)
            return
        }
        // Start timer and enter fullscreen
        setStartedAtMs(Date.now())
        setIsActive(true)
        
        // Auto-enter fullscreen when starting (requires user gesture, which this click provides)
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {
                // Silently fail if fullscreen is not supported or denied
            })
        }
    }

    const handleTaskSelect = (id: string, text: string) => {
        if (selectedTaskId !== id) {
            if (!isActive) {
                setStartedAtMs(Date.now())
                setIsActive(true)
                // Auto-enter fullscreen when starting via task selection
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {})
                }
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
        const minutesAlreadySaved = lastAutosavedMinute
        const remainingWholeMinutes = Math.max(0, minutes - minutesAlreadySaved)
        const shouldSaveSecondsAsMinute = remainderSeconds >= 30 ? 1 : 0
        const additionalMinutes = remainingWholeMinutes + shouldSaveSecondsAsMinute

        if (additionalMinutes >= 1) {
            const confettiColors = theme === 'monochrome' 
                ? ['#ffffff', '#aaaaaa', '#555555'] 
                : ['#a78bfa', '#fb7185', '#34d399']

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

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {})
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {})
            }
        }
    }

    // Sync fullscreen state
    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener("fullscreenchange", handleFullscreenChange)
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }, [])

    // Autosave
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

        const interval = setInterval(() => {
            maybeAutosave().catch(() => {})
        }, 15000)
        maybeAutosave().catch(() => {})

        return () => clearInterval(interval)
    }, [addDailyLog, computeSeconds, isActive, lastAutosavedMinute, selectedSubjectId, selectedTaskText])

    const currentTheme = THEMES[theme]
    const spotlightFill = theme === "midnight" ? "#60a5fa" : "#ffffff"

    // Hide controls after 3 seconds of no mouse movement when timer is active
    React.useEffect(() => {
        if (!isActive) {
            setShowControls(true)
            return
        }

        let timeout: NodeJS.Timeout

        const handleMouseMove = () => {
            setShowControls(true)
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                setShowControls(false)
            }, 3000)
        }

        // Initially hide after 3 seconds
        timeout = setTimeout(() => {
            setShowControls(false)
        }, 3000)

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('touchstart', handleMouseMove)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('touchstart', handleMouseMove)
            clearTimeout(timeout)
        }
    }, [isActive])

    return (
        <div className={cn("min-h-screen text-foreground flex flex-col relative overflow-hidden font-sans selection:bg-white/20", currentTheme.bg)}>
            {/* Dynamic Background */}
            <div className="absolute inset-0 pointer-events-none transition-all duration-1000 overflow-hidden">
                {currentTheme.type === "beams" && (
                    <div className="absolute inset-0 h-[100vh]">
                        <BackgroundBeams className={cn(isActive ? "opacity-40" : "opacity-30")} />
                    </div>
                )}
                {currentTheme.type === "spotlight" && (
                    <Spotlight
                        className="left-0 md:left-60 top-[-20%] md:top-[-5%] opacity-100"
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
                        style={{ background: currentTheme.gradient }}
                    />
                )}
                {currentTheme.grain && (
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150 mix-blend-overlay" />
                )}
            </div>

            {/* Top Bar - Fades out when timer is active */}
            <div className={cn(
                "flex flex-wrap items-center justify-between gap-4 p-6 md:p-8 z-20 w-full max-w-[1800px] mx-auto transition-all duration-700",
                isActive && !showControls ? "opacity-0 pointer-events-none translate-y-[-20px]" : "opacity-100 translate-y-0"
            )}>
                <div className="flex items-center gap-3 md:gap-6 flex-wrap">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="rounded-full border border-white/10 bg-surface-container/20 text-muted-foreground hover:text-foreground hover:bg-surface-container hover:border-white/20 transition-all duration-300 text-[10px] font-bold tracking-[0.2em] uppercase px-5 h-10 shadow-sm"
                        onClick={() => {
                            if (document.fullscreenElement && document.exitFullscreen) {
                                document.exitFullscreen().catch(() => {})
                            }
                        }}
                    >
                        <Link href="/"><IconArrowLeft className="w-3.5 h-3.5 mr-2" />Dashboard</Link>
                    </Button>
                    <div className="hidden md:block h-6 w-[1px] bg-white/10" />
                    <ThemeSelector currentTheme={theme} onThemeChange={handleThemeChange} />

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full border border-white/10 bg-surface-container/20 text-muted-foreground hover:text-foreground hover:bg-surface-container hover:border-white/20 transition-all duration-300 text-[10px] font-bold tracking-[0.2em] uppercase px-5 h-10 shadow-sm"
                            >
                                <IconChartBar className="w-3.5 h-3.5 mr-2" />History
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[300px] sm:w-[400px] md:w-[540px] border-l border-white/10 bg-surface-container-high/95 backdrop-blur-2xl text-foreground shadow-expressive p-6">
                            <SheetHeader className="mb-6">
                                <SheetTitle className="text-foreground/70 uppercase tracking-[0.2em] font-bold text-xs">Session History</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4">
                                <FocusHistory />
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Subject Selector */}
                    <div className="relative group z-30">
                        <select
                            className="rounded-full border border-white/10 bg-surface-container/20 text-[10px] font-bold tracking-[0.2em] uppercase px-5 py-2 outline-none focus:border-primary/50 transition-all duration-300 appearance-none cursor-pointer pr-10 h-10 text-muted-foreground hover:text-foreground hover:bg-surface-container hover:border-white/20 shadow-sm"
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                        >
                            <option value="none" className="bg-surface-container-high text-muted-foreground">Subject</option>
                            {subjects.map(sub => (
                                <option key={sub.id} value={sub.id} className="bg-surface-container-high text-foreground">{sub.code}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-300 text-muted-foreground">
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
                                "rounded-full transition-all duration-300 w-10 h-10 shadow-sm border border-transparent",
                                showBlocker ? "text-red-500 bg-red-500/10 border-red-500/20" : "text-muted-foreground hover:text-foreground hover:bg-surface-container hover:border-white/10"
                            )}
                            onClick={() => {
                                setShowBlocker(!showBlocker)
                                setShowAmbience(false)
                            }}
                        >
                            <IconShieldLock className="w-5 h-5" />
                        </Button>
                        <div className={cn(
                            "absolute top-full right-0 mt-4 origin-top-right transition-all duration-300 z-50",
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
                                "rounded-full transition-all duration-300 w-10 h-10 shadow-sm border border-transparent",
                                showAmbience ? "text-primary bg-primary/10 border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-surface-container hover:border-white/10"
                            )}
                            onClick={() => setShowAmbience(!showAmbience)}
                        >
                            <IconVolume className="w-5 h-5" />
                        </Button>
                        <div className={cn(
                            "absolute top-full right-0 mt-4 w-80 md:w-96 bg-surface-container-high/95 border border-white/10 backdrop-blur-2xl text-foreground p-6 rounded-3xl shadow-expressive z-50 transition-all duration-300 origin-top-right",
                            showAmbience ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible pointer-events-none"
                        )}>
                            <div className="flex items-center justify-between mb-5">
                                <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60 text-muted-foreground">Ambience Mixer</h4>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full hover:bg-white/10 transition-colors" onClick={() => setShowAmbience(false)}>
                                    <IconMinimize className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            <AmbienceWidget />
                        </div>
                    </div>

                    <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-muted-foreground hover:text-foreground hover:bg-surface-container hover:border-white/10 border border-transparent rounded-full w-10 h-10 transition-all duration-300 shadow-sm">
                        {isFullscreen ? <IconMinimize className="w-5 h-5" /> : <IconMaximize className="w-5 h-5" />}
                    </Button>
                </div>
            </div>

            {/* Main Layout */}
            <div className={cn(
                "flex-1 flex flex-col md:flex-row items-stretch justify-center p-6 gap-8 z-10 w-full max-w-[1800px] mx-auto transition-all duration-700",
                theme === 'monochrome' ? "grayscale contrast-125" : ""
            )}>

                {/* Left: Task List (Desktop only) - Hidden when active */}
                <div className={cn(
                    "hidden md:flex flex-col items-start w-[300px] lg:w-[350px] h-full justify-center pt-20 transition-all duration-700",
                    isActive && !showControls ? "opacity-0 pointer-events-none translate-x-[-40px]" : "opacity-100 translate-x-0"
                )}>
                    <FocusTaskList
                        todos={todos.filter(t => t.dueDate === new Date().toISOString().split('T')[0])}
                        activeTaskId={selectedTaskId}
                        onSelectTask={handleTaskSelect}
                        onToggleTodo={toggleTodo}
                        onClearFocus={handleClearFocus}
                    />
                </div>

                    {/* Center: Timer & Clock Display */}
                <div className="flex flex-col items-center justify-center flex-1 min-w-0 z-50 relative">
                    
                    {/* Task & Status */}
                    <div className={cn(
                        "text-center mb-10 space-y-4 transition-all duration-700",
                        isActive ? "mt-0" : "mt-0"
                    )}>
                        <span className={cn(
                            "inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full border transition-all duration-300",
                            isActive ? "animate-pulse bg-primary/20 text-primary border-primary/20" : "bg-white/10 text-white/60 border-white/5"
                        )}>
                            {isActive ? "Flow State" : "Ready to Focus"}
                        </span>
                        <h2 className={cn(
                            "text-xl md:text-5xl font-black text-white tracking-tighter uppercase transition-all duration-500 drop-shadow-sm max-w-2xl mx-auto leading-tight",
                            isActive && !showControls ? "opacity-90" : "opacity-100"
                        )}>
                            {selectedTaskText}
                        </h2>
                        {selectedSubjectId !== "none" && (
                            <p className="text-sm font-bold text-white/50 tracking-[0.2em] uppercase">
                                {subjects.find(s => s.id === selectedSubjectId)?.name || subjects.find(s => s.id === selectedSubjectId)?.code}
                            </p>
                        )}
                    </div>

                    {/* Main Timer */}
                    <div
                        className="relative group cursor-pointer mb-12 select-none"
                        onClick={toggleTimer}
                    >
                        <div className={cn(
                            "text-[12rem] sm:text-[15rem] md:text-[20rem] leading-none tabular-nums tracking-tighter transition-all duration-500 select-none font-black",
                            isActive 
                                ? "text-white scale-110 drop-shadow-[0_0_40px_rgba(var(--primary),0.2)]" 
                                : "text-white/20 scale-100 group-hover:text-white/30 group-hover:scale-105"
                        )}>
                            {formatTime(seconds)}
                        </div>
                    </div>

                    {/* Controls - Always centered */}
                    <div className={cn(
                        "flex items-center gap-8 transition-all duration-500",
                        isActive && !showControls ? "opacity-30 blur-[2px] hover:opacity-100 hover:blur-0" : "opacity-100 blur-0"
                    )}>
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                                "w-24 h-24 rounded-full border-2 transition-all duration-300",
                                isActive 
                                    ? "border-white text-white hover:bg-white hover:text-black hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                                    : "border-white/20 text-white/40 hover:text-white hover:border-white hover:bg-white/10"
                            )}
                            onClick={toggleTimer}
                        >
                            {isActive ? <IconPlayerPause className="w-10 h-10 fill-current" /> : <IconPlayerPlay className="w-10 h-10 ml-1 fill-current" />}
                        </Button>

                        {(seconds > 0 || isActive) && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="w-16 h-16 rounded-full border-2 border-white/10 bg-transparent text-white/30 hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-all duration-300"
                                onClick={stopSession}
                                title="Finish Session"
                            >
                                <IconPlayerStop className="w-7 h-7 fill-current" />
                            </Button>
                        )}
                    </div>

                    {/* Fullscreen Button - Always visible when active */}
                    <div className={cn(
                        "absolute bottom-4 right-4 transition-all duration-500",
                        isActive ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={toggleFullscreen} 
                            className="text-white/40 hover:text-white hover:bg-white/10 rounded-full w-12 h-12 transition-all duration-300 border border-white/5 backdrop-blur-sm"
                        >
                            {isFullscreen ? <IconMinimize className="w-5 h-5" /> : <IconMaximize className="w-5 h-5" />}
                        </Button>
                    </div>

                    {/* Quote - Fades when active */}
                    <div className={cn(
                        "mt-12 transition-all duration-700",
                        isActive && !showControls ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                    )}>
                        <FocusQuote active={isActive} />
                    </div>

                    {/* Date/Time Widget (Bottom Left) */}
                    <div className={cn(
                        "absolute bottom-4 left-4 text-left transition-all duration-1000",
                        isActive ? "opacity-80 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
                    )}>
                        <div className="flex flex-col items-start gap-0.5">
                            <p className="text-7xl font-black text-white/10 tracking-tighter tabular-nums select-none">
                                {formatClockTime(currentTime)}
                            </p>
                            <p className="text-sm font-bold text-white/30 tracking-[0.2em] uppercase pl-1">
                                {formatDate(currentTime)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Gamification (Desktop only) - Hidden when active */}
                <div className={cn(
                    "hidden md:flex flex-col items-end w-[300px] lg:w-[350px] h-full justify-center transition-all duration-700",
                    isActive && !showControls ? "opacity-0 pointer-events-none translate-x-[40px]" : "opacity-100 translate-x-0"
                )}>
                    <GamificationWidget todayMinutes={todayMinutes} />
                </div>

                {/* Mobile: Bottom Stats Bar - Hidden when active */}
                <div className={cn(
                    "md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-high/90 backdrop-blur-xl border-t border-white/10 p-4 z-40 transition-all duration-500 shadow-expressive",
                    isActive ? "opacity-0 pointer-events-none translate-y-full" : "opacity-100 translate-y-0"
                )}>
                    <div className="flex items-center justify-around">
                        <div className="text-center">
                            <p className="text-2xl font-light text-foreground">{todayMinutes}</p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Min Today</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <p className="text-2xl font-light text-foreground">{Math.floor(totalMinutes / 60)}</p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Hours Total</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="text-center">
                            <p className="text-2xl font-light text-foreground">{selectedSubjectId !== "none" ? subjects.find(s => s.id === selectedSubjectId)?.code || "—" : "—"}</p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Subject</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
