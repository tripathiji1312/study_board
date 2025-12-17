"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { IconPalette, IconCheck } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export const THEMES = {
    "aurora": {
        name: "Cosmic Aurora",
        bg: "bg-black",
        gradient: "radial-gradient(circle at 50% 50%, #5b21b6 0%, #000000 60%)",
        accent: "text-purple-400",
        grain: true
    },
    "midnight": {
        name: "Midnight Blue",
        bg: "bg-[#020617]",
        gradient: "radial-gradient(circle at 50% 120%, #1e40af 0%, #020617 50%)",
        accent: "text-blue-400",
        grain: true
    },
    "forest": {
        name: "Deep Forest",
        bg: "bg-[#022c22]",
        gradient: "radial-gradient(circle at 50% -20%, #10b981 0%, #022c22 60%)",
        accent: "text-emerald-400",
        grain: true
    },
    "sunset": {
        name: "Cyber Sunset",
        bg: "bg-[#2a0a18]",
        gradient: "radial-gradient(circle at 50% 100%, #db2777 0%, #2a0a18 60%)",
        accent: "text-pink-400",
        grain: true
    },
    "minimal": {
        name: "True Black",
        bg: "bg-black",
        gradient: "none",
        accent: "text-white",
        grain: false
    }
}

export type ThemeKey = keyof typeof THEMES

interface ThemeSelectorProps {
    currentTheme: ThemeKey
    onThemeChange: (theme: ThemeKey) => void
}

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white hover:bg-white/10">
                    <IconPalette className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-black/90 border-white/10 backdrop-blur-xl text-white">
                <DialogHeader><DialogTitle>Customize Vibe</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    {Object.entries(THEMES).map(([key, theme]) => (
                        <button
                            key={key}
                            onClick={() => onThemeChange(key as ThemeKey)}
                            className={cn(
                                "relative h-20 rounded-xl overflow-hidden border transition-all hover:scale-105",
                                currentTheme === key ? "border-white ring-2 ring-white/20" : "border-white/10 hover:border-white/30"
                            )}
                        >
                            <div className={cn("absolute inset-0", theme.bg)} />
                            <div
                                className="absolute inset-0 opacity-50"
                                style={{ background: theme.gradient }}
                            />
                            {theme.grain && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />}

                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="font-bold text-sm shadow-black drop-shadow-md">{theme.name}</span>
                            </div>

                            {currentTheme === key && (
                                <div className="absolute top-2 right-2 bg-white text-black rounded-full p-0.5">
                                    <IconCheck className="w-3 h-3" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
