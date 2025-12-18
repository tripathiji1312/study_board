"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    IconLayoutDashboard,
    IconChecklist,
    IconSchool,
    IconBook2,
    IconBulb,
    IconCalendarEvent,
    IconBooks,
    IconSettings,
    IconLogout,
    IconMenu2,
    IconTargetArrow,
    IconCode,
    IconNotes,
    IconClipboardList,
    IconFlame,
    IconSparkles,
    IconUserBolt
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"
import { XPWidget } from "@/components/xp-widget"
import { GlobalSearch } from "@/components/global-search"
import { useStore } from "@/components/providers/store-provider"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

// Route Groups
const mainRoutes = [
    { label: "Dashboard", icon: IconLayoutDashboard, href: "/" },
    { label: "Laser Mode", icon: IconTargetArrow, href: "/focus", highlight: true },
]

const productivityRoutes = [
    { label: "To-Do List", icon: IconChecklist, href: "/todos" },
    { label: "Assignments", icon: IconClipboardList, href: "/assignments" },
    { label: "Projects", icon: IconBulb, href: "/projects" },
    { label: "Schedule", icon: IconCalendarEvent, href: "/schedule" },
]

const academicRoutes = [
    { label: "Academics", icon: IconSchool, href: "/academics" },
    { label: "Exams", icon: IconFlame, href: "/academics/exams" },
    { label: "Resources", icon: IconBooks, href: "/resources" },
]

const toolRoutes = [
    { label: "Library", icon: IconBook2, href: "/library" },
    { label: "Ideas", icon: IconNotes, href: "/ideas" },
    { label: "Snippets", icon: IconCode, href: "/snippets" },
]

export function AppSidebar({ className }: SidebarProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = React.useState(false)
    const { settings } = useStore()

    const NavItem = ({ route }: { route: typeof mainRoutes[0] & { highlight?: boolean } }) => (
        <Button
            variant={pathname === route.href ? "secondary" : "ghost"}
            className={cn(
                "w-full justify-start gap-3 h-9",
                pathname === route.href && "font-semibold bg-primary/10 text-primary",
                route.highlight && pathname !== route.href && "text-primary/80 hover:text-primary hover:bg-primary/5"
            )}
            asChild
            onClick={() => setIsOpen(false)}
        >
            <Link href={route.href}>
                <route.icon className={cn("h-4 w-4", pathname === route.href && "text-primary")} />
                {route.label}
            </Link>
        </Button>
    )

    const NavGroup = ({ label, routes }: { label: string, routes: typeof mainRoutes }) => (
        <div className="space-y-1">
            <p className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                {label}
            </p>
            {routes.map((route) => <NavItem key={route.href} route={route} />)}
        </div>
    )

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b px-4">
                <Link className="flex items-center gap-2 font-bold text-lg" href="/">
                    <div className="relative w-8 h-8 flex items-center justify-center mr-2">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50" />
                        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-white/20 group-hover:scale-110 transition-all duration-300">
                            <IconSparkles className="w-5 h-5 text-white drop-shadow-md" strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                        <span className="font-bold text-lg tracking-tight text-foreground">
                            Study<span className="text-primary font-extrabold">Board</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase opacity-80">
                            Premium
                        </span>
                    </div>
                </Link>
                <ModeToggle />
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4">
                <div className="flex flex-col gap-4 px-3">
                    {/* Global Search */}
                    <GlobalSearch />

                    <NavGroup label="Main" routes={mainRoutes} />
                    <NavGroup label="Productivity" routes={productivityRoutes} />
                    <NavGroup label="Academic" routes={academicRoutes} />
                    <NavGroup label="Tools" routes={toolRoutes} />
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-4 space-y-4">
                {/* XP Widget */}
                <XPWidget />

                {/* User + Settings */}
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center shadow-md ring-2 ring-white/10">
                        <IconUserBolt className="h-5 w-5 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">{settings?.displayName || "Student"}</span>
                        <span className="text-[10px] text-muted-foreground">CSE Dept</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href="/settings">
                            <IconSettings className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* Mobile Trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-40 shadow-lg">
                        <IconMenu2 className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <div className={cn("hidden border-r bg-card/50 backdrop-blur-sm md:block w-64 fixed inset-y-0 z-30", className)}>
                <SidebarContent />
            </div>
        </>
    )
}
