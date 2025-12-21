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
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"
import { XPWidget } from "@/components/xp-widget"
import { GlobalSearch } from "@/components/global-search"
import { Logo } from "@/components/ui/logo"
import { useStore } from "@/components/providers/store-provider"
import { Skeleton } from "@/components/ui/skeleton"

import { signOut } from "next-auth/react"

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
    const { settings, isLoading } = useStore()

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

    const content = (
        <div className="flex h-screen flex-col bg-card/50 backdrop-blur-sm border-r">
            {/* Header - Fixed */}
            <div className="flex h-14 items-center justify-between border-b px-4 shrink-0 bg-background/50">
                <Link className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity" href="/" onClick={() => setIsOpen(false)}>
                    <Logo />
                </Link>
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(false)}>
                        <IconMenu2 className="h-5 w-5 rotate-90" />
                    </Button>
                </div>
            </div>

            {/* Scrollable Content - Navigation */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div className="flex flex-col gap-4 px-3 py-4">
                    {/* Global Search */}
                    <div id="quick-actions-menu">
                        <GlobalSearch />
                    </div>

                    <NavGroup label="Main" routes={mainRoutes} />
                    <NavGroup label="Productivity" routes={productivityRoutes} />
                    <NavGroup label="Academic" routes={academicRoutes} />
                    <NavGroup label="Tools" routes={toolRoutes} />
                </div>
            </div>

            {/* Fixed Footer */}
            <div className="border-t p-4 space-y-4 shrink-0 bg-background/50">
                {/* XP Widget */}
                <XPWidget />

                {/* User + Settings */}
                {isLoading ? (
                    <div className="flex items-center gap-3 px-1">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-1 flex-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-1 group">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center shadow-sm shrink-0">
                            <IconUserBolt className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold truncate leading-none">{settings?.displayName || "Student"}</span>
                                <Button variant="ghost" size="icon" className="h-4 w-4 rounded-md hover:bg-muted" asChild id="sidebar-settings">
                                    <Link href="/settings" onClick={() => setIsOpen(false)}>
                                        <IconSettings className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                                    </Link>
                                </Button>
                            </div>
                            <span className="text-[9px] text-muted-foreground truncate mt-0.5">{settings?.department || "Student"} Dept</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <>
            {/* Mobile Trigger */}
            <div className="md:hidden fixed top-3 left-4 z-50">
                <Button
                    variant="ghost"
                    size="icon"
                    className="bg-background/80 backdrop-blur-md border shadow-sm rounded-full"
                    onClick={() => setIsOpen(true)}
                >
                    <IconMenu2 className="h-5 w-5" />
                </Button>
            </div>

            {/* Mobile Sidebar */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="left" className="p-0 w-64 bg-card">
                    <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                    {content}
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <aside className={cn("hidden md:block w-64 fixed inset-y-0 left-0 z-30", className)}>
                {content}
            </aside>
        </>
    )
}
