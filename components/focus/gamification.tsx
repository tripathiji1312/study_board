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
        <div className="h-full max-h-[60vh] w-full flex flex-col items-center justify-center relative pr-4 transition-opacity duration-500 opacity-20 hover:opacity-100">
            <div className="text-right w-full mb-10 pr-12 opacity-80">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40 mb-1">Today's Focus</p>
                <div className="flex items-baseline justify-end gap-1">
                    <p className="text-4xl font-extralight text-white drop-shadow-lg">{Math.floor(todayMinutes / 60)}<span className="text-sm font-thin opacity-50 ml-0.5">h</span> {todayMinutes % 60}<span className="text-sm font-thin opacity-50 ml-0.5">m</span></p>
                </div>
            </div>

            {/* Vertical Path Container */}
            <div className="relative flex flex-col gap-12 pr-10">
                {/* Background Track */}
                <div className="absolute top-2 right-[calc(2.5rem+3px)] bottom-2 w-[1px] bg-white/10 rounded-full" />

                {DAILY_STEPS.map((step, i) => {
                    const isUnlocked = todayMinutes >= step.minutes
                    const isNext = !isUnlocked && (i === 0 || todayMinutes >= DAILY_STEPS[i - 1].minutes)

                    return (
                        <div key={step.name} className="relative flex items-center justify-end gap-4 group z-10">
                            {/* Label */}
                            <div className={cn(
                                "text-right transition-all duration-500 absolute right-14 whitespace-nowrap",
                                isNext ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
                            )}>
                                <p className={cn("text-[10px] uppercase tracking-[0.2em] font-medium transition-colors", isUnlocked ? "text-white/30" : isNext ? "text-white shadow-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-white/20")}>
                                    {step.name} <span className="text-[9px] opacity-40 ml-1 font-light tracking-normal">{step.minutes >= 60 ? `${step.minutes / 60}h` : `${step.minutes}m`}</span>
                                </p>
                            </div>

                            {/* Node */}
                            <div className={cn(
                                "w-2.5 h-2.5 rounded-full border transition-all duration-700 bg-black z-20",
                                isUnlocked ? "border-white bg-white shadow-[0_0_15px_white]" : isNext ? "border-white/80 bg-black animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "border-white/10 bg-black"
                            )} />

                            {/* Filling Line Segment (Downwards from this node to next) */}
                            {i < DAILY_STEPS.length - 1 && (
                                <div className="absolute top-2.5 right-[0.35rem] w-[1px] h-12 -z-10">
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
                                            className="w-full bg-gradient-to-b from-white via-white/50 to-white/10 shadow-[0_0_10px_white]"
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
