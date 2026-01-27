"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { IconPalette, IconCheck } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export type ThemeType = "gradient" | "spotlight" | "beams" | "particles"

export interface FocusTheme {
    name: string
    type: ThemeType
    bg: string
    gradient?: string
    accent: string
    grain?: boolean
}

export const THEMES = {
    aurora: {
        name: "Aurora Drift",
        type: "gradient",
        bg: "bg-[#050309]",
        gradient: "radial-gradient(1200px circle at 15% 20%, rgba(56, 189, 248, 0.35), rgba(56, 189, 248, 0) 60%), radial-gradient(900px circle at 85% 10%, rgba(129, 140, 248, 0.35), rgba(129, 140, 248, 0) 55%), radial-gradient(900px circle at 50% 80%, rgba(16, 185, 129, 0.22), rgba(16, 185, 129, 0) 60%)",
        accent: "text-cyan-300",
        grain: true,
    },
    midnight: {
        name: "Midnight Focus",
        type: "spotlight",
        bg: "bg-[#020611]",
        gradient: "radial-gradient(900px circle at 50% 120%, rgba(30, 64, 175, 0.35), rgba(2, 6, 23, 0.9) 60%)",
        accent: "text-blue-300",
        grain: false,
    },
    cyber: {
        name: "Cyber Noir",
        type: "beams",
        bg: "bg-zinc-950",
        gradient: "radial-gradient(900px circle at 18% 18%, rgba(14, 116, 144, 0.2), rgba(14, 116, 144, 0) 55%), radial-gradient(900px circle at 85% 85%, rgba(20, 83, 45, 0.2), rgba(20, 83, 45, 0) 60%)",
        accent: "text-emerald-300",
        grain: false,
    },
    lofi: {
        name: "Lo-fi Amber",
        type: "gradient",
        bg: "bg-[#1a0f0a]",
        gradient: "radial-gradient(1000px circle at 22% 25%, rgba(251, 191, 36, 0.25), rgba(251, 191, 36, 0) 55%), radial-gradient(900px circle at 80% 80%, rgba(248, 113, 113, 0.25), rgba(248, 113, 113, 0) 60%)",
        accent: "text-amber-300",
        grain: true,
    },
    monochrome: {
        name: "Noir",
        type: "gradient",
        bg: "bg-[#000000]",
        gradient: "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 70%)",
        accent: "text-white",
        grain: true,
    },
    nebula: {
        name: "Cosmic Nebula",
        type: "particles",
        bg: "bg-[#0f0518]",
        gradient: "radial-gradient(circle at 20% 30%, rgba(216, 180, 254, 0.2), rgba(216, 180, 254, 0) 50%), radial-gradient(circle at 80% 70%, rgba(129, 140, 248, 0.2), rgba(129, 140, 248, 0) 50%)",
        accent: "text-purple-200",
        grain: true,
    },
    zen: {
        name: "Zen Garden",
        type: "gradient",
        bg: "bg-[#1c1c1a]",
        gradient: "radial-gradient(circle at 50% 100%, rgba(180, 180, 160, 0.15), rgba(180, 180, 160, 0) 60%)",
        accent: "text-stone-300",
        grain: true,
    }
} satisfies Record<string, FocusTheme>

export type ThemeKey = keyof typeof THEMES

interface ThemeSelectorProps {
    currentTheme: ThemeKey
    onThemeChange: (theme: ThemeKey) => void
}

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
    const entries = Object.entries(THEMES) as [ThemeKey, FocusTheme][]

    return (
        <Dialog modal={false}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full border border-white/5 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all duration-300 w-9 h-9"
                >
                    <IconPalette className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-zinc-950/80 border-white/10 backdrop-blur-2xl text-white p-6 shadow-2xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-light tracking-wide text-center">Select Atmosphere</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                    {entries.map(([key, theme]) => (
                        <button
                            key={key}
                            onClick={() => onThemeChange(key as ThemeKey)}
                            className={cn(
                                "relative h-24 rounded-2xl overflow-hidden border transition-all duration-300 group",
                                currentTheme === key 
                                    ? "border-white/50 ring-4 ring-white/10 scale-[1.02] shadow-xl" 
                                    : "border-white/5 hover:border-white/20 hover:scale-[1.02] opacity-70 hover:opacity-100"
                            )}
                        >
                            <div className={cn("absolute inset-0", theme.bg)} />
                            {theme.gradient && (
                                <div
                                    className="absolute inset-0 opacity-70"
                                    style={{ background: theme.gradient }}
                                />
                            )}
                            {theme.grain && (
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                            )}

                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center p-2 z-10">
                                <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/50 group-hover:text-white/70 transition-colors">{theme.type}</span>
                                <span className="font-medium text-sm text-white drop-shadow-lg tracking-wide">{theme.name}</span>
                            </div>

                            {currentTheme === key && (
                                <div className="absolute top-2 right-2 bg-white text-black rounded-full p-1 shadow-lg animate-in fade-in zoom-in duration-300">
                                    <IconCheck className="w-3 h-3" strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
