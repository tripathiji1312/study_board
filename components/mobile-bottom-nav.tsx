"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    IconLayoutDashboard,
    IconChecklist,
    IconClipboardList,
    IconCalendarEvent,
    IconMenu2,
} from "@tabler/icons-react"
import { motion } from "framer-motion"

interface NavItem {
    label: string
    href: string
    icon: React.ElementType
    matchPaths?: string[]
}

const navItems: NavItem[] = [
    {
        label: "Home",
        href: "/",
        icon: IconLayoutDashboard,
        matchPaths: ["/"]
    },
    {
        label: "Tasks",
        href: "/todos",
        icon: IconChecklist,
        matchPaths: ["/todos", "/projects"]
    },
    {
        label: "Work",
        href: "/assignments",
        icon: IconClipboardList,
        matchPaths: ["/assignments"]
    },
    {
        label: "Schedule",
        href: "/schedule",
        icon: IconCalendarEvent,
        matchPaths: ["/schedule", "/academics"]
    },
]

interface MobileBottomNavProps {
    onMoreClick: () => void
}

export function MobileBottomNav({ onMoreClick }: MobileBottomNavProps) {
    const pathname = usePathname()

    const isActive = (item: NavItem) => {
        if (item.matchPaths) {
            return item.matchPaths.some(path =>
                path === "/" ? pathname === "/" : pathname.startsWith(path)
            )
        }
        return pathname === item.href
    }

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const active = isActive(item)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1 rounded-xl transition-all",
                                "active:scale-95 touch-manipulation",
                                active
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className="relative">
                                <item.icon
                                    className={cn(
                                        "w-6 h-6 transition-transform",
                                        active && "scale-110"
                                    )}
                                    strokeWidth={active ? 2.5 : 2}
                                />
                                {active && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium transition-colors",
                                active && "text-primary font-semibold"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}

                {/* More button for sidebar access */}
                <button
                    onClick={onMoreClick}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1 rounded-xl transition-all",
                        "active:scale-95 touch-manipulation",
                        "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <IconMenu2 className="w-6 h-6" strokeWidth={2} />
                    <span className="text-[10px] font-medium">More</span>
                </button>
            </div>
        </nav>
    )
}
