"use client"

import * as React from "react"
import { IconPalette, IconCheck } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const themes = [
    { name: "Default", value: "light", color: "bg-white border-gray-200" },
    { name: "Dark", value: "dark", color: "bg-slate-950 border-slate-800" },
    { name: "System", value: "system", color: "bg-gradient-to-br from-white to-slate-950 border-gray-200" },
    { name: "Amethyst (Pro)", value: "theme-purple", color: "bg-[#12081d] border-[#3d1a6d]" },
    { name: "Sakura (Light)", value: "theme-pink", color: "bg-[#fff5f7] border-[#ffb6c1]" },
    { name: "Rose Noir (Dark)", value: "theme-pink-dark", color: "bg-[#1a0a14] border-[#3a1a2a]" },
    { name: "Midnight", value: "theme-midnight", color: "bg-[#0a0a23] border-[#1a1a3a]" },
    { name: "Forest", value: "theme-forest", color: "bg-[#0b1a0b] border-[#1a3a1a]" },
    { name: "Sunset", value: "theme-sunset", color: "bg-[#1a0b0b] border-[#3a1a1a]" },
]

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                    <IconPalette className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Switch theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                    Designer Themes
                </DropdownMenuLabel>
                <div className="grid grid-cols-1 gap-1">
                    {themes.map((t) => (
                        <DropdownMenuItem
                            key={t.value}
                            onClick={() => setTheme(t.value)}
                            className={cn(
                                "flex items-center justify-between gap-2 px-2 py-1.5 cursor-pointer rounded-md transition-colors",
                                theme === t.value ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <div className={cn("h-4 w-4 rounded-full border", t.color)} />
                                <span className="text-sm font-medium">{t.name}</span>
                            </div>
                            {theme === t.value && <IconCheck className="h-4 w-4" />}
                        </DropdownMenuItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
