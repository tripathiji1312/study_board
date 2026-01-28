"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

// Daily Checkpoints (Reset every day)
const DAILY_STEPS = [
    { name: "Warming Up", minutes: 0 },
    { name: "Focused", minutes: 30 },
    { name: "Deep Dive", minutes: 60 },
    { name: "Flow State", minutes: 120 },
    { name: "Unstoppable", minutes: 240 }, // 4 hours
    { name: "Limitless", minutes: 360 }   // 6 hours
]

export function GamificationWidget({ todayMinutes }: { todayMinutes: number }) {

    return (
        <div className="h-full max-h-[60vh] w-full flex flex-col items-center justify-center relative pr-4 transition-opacity duration-500 opacity-60 hover:opacity-100">
            <div className="text-right w-full mb-10 pr-12 opacity-90">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Today's Focus</p>
                <div className="flex items-baseline justify-end gap-1">
                    <p className="text-5xl font-black text-foreground tracking-tighter drop-shadow-sm">{Math.floor(todayMinutes / 60)}<span className="text-lg font-medium text-muted-foreground ml-0.5">h</span> {todayMinutes % 60}<span className="text-lg font-medium text-muted-foreground ml-0.5">m</span></p>
                </div>
            </div>

            {/* Vertical Path Container */}
            <div className="relative flex flex-col gap-12 pr-10">
                {/* Background Track */}
                <div className="absolute top-2 right-[calc(2.5rem+3px)] bottom-2 w-[2px] bg-surface-container-highest rounded-full" />

                {DAILY_STEPS.map((step, i) => {
                    const isUnlocked = todayMinutes >= step.minutes
                    const isNext = !isUnlocked && (i === 0 || todayMinutes >= DAILY_STEPS[i - 1].minutes)

                    return (
                        <div key={step.name} className="relative flex items-center justify-end gap-4 group z-10">
                            {/* Label */}
                            <div className={cn(
                                "text-right transition-all duration-500 absolute right-16 whitespace-nowrap",
                                isNext ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
                            )}>
                                <p className={cn("text-[10px] uppercase tracking-[0.2em] font-bold transition-colors", 
                                    isUnlocked ? "text-muted-foreground/50" : isNext ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "text-muted-foreground/30")}>
                                    {step.name} <span className="text-[9px] opacity-60 ml-1 font-mono">{step.minutes >= 60 ? `${step.minutes / 60}h` : `${step.minutes}m`}</span>
                                </p>
                            </div>

                            {/* Node */}
                            <div className={cn(
                                "w-3 h-3 rounded-full border-2 transition-all duration-700 z-20",
                                isUnlocked 
                                    ? "border-primary bg-primary shadow-[0_0_15px_rgba(var(--primary),0.6)]" 
                                    : isNext 
                                        ? "border-primary bg-background animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.3)] scale-125" 
                                        : "border-surface-container-highest bg-surface-container"
                            )} />

                            {/* Filling Line Segment (Downwards from this node to next) */}
                            {i < DAILY_STEPS.length - 1 && (
                                <div className="absolute top-3 right-[calc(0.375rem-1px)] w-[2px] h-12 -z-10 bg-surface-container-highest overflow-hidden rounded-full">
                                    {/* Only render fill if we are past this rank */}
                                    {isUnlocked && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{
                                                height: todayMinutes >= DAILY_STEPS[i + 1].minutes
                                                    ? "100%"
                                                    : `${Math.min(100, Math.max(0, (todayMinutes - step.minutes) / (DAILY_STEPS[i + 1].minutes - step.minutes) * 100))}%`
                                            }}
                                            transition={{ duration: 1.5, ease: "easeInOut" }}
                                            className="w-full bg-gradient-to-b from-primary via-primary/80 to-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
