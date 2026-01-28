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

import { themes } from "@/lib/themes"

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
