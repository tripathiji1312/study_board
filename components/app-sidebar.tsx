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
    IconMenu2
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function AppSidebar({ className }: SidebarProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = React.useState(false)

    const routes = [
        {
            label: "Dashboard",
            icon: IconLayoutDashboard,
            href: "/",
        },
        {
            label: "Assignments",
            icon: IconSchool,
            href: "/assignments",
        },
        {
            label: "To-Do List",
            icon: IconChecklist,
            href: "/todos",
        },
        {
            label: "Projects",
            icon: IconBulb,
            href: "/projects",
        },
        {
            label: "Schedule",
            icon: IconCalendarEvent,
            href: "/schedule",
        },
        {
            label: "Resources",
            icon: IconBooks,
            href: "/resources",
        },
        {
            label: "Academics",
            icon: IconSchool,
            href: "/academics",
        },
        {
            label: "Settings",
            href: "/settings",
            icon: IconSettings,
        },
    ]

    const SidebarContent = () => (
        <div className="flex h-full flex-col gap-4">
            <div className="flex h-[60px] items-center justify-between border-b px-6">
                <Link className="flex items-center gap-2 font-bold" href="/">
                    <span className="text-xl">StudyManager</span>
                </Link>
                <ModeToggle />
            </div>
            <ScrollArea className="flex-1 px-3">
                <div className="flex flex-col gap-2 py-4">
                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Overview
                    </p>
                    {routes.map((route) => (
                        <Button
                            key={route.href}
                            variant={pathname === route.href ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start gap-2",
                                pathname === route.href && "font-semibold"
                            )}
                            asChild
                            onClick={() => setIsOpen(false)}
                        >
                            <Link href={route.href}>
                                <route.icon className="h-5 w-5" />
                                {route.label}
                            </Link>
                        </Button>
                    ))}

                    <Separator className="my-4" />
                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        System
                    </p>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                        <IconSettings className="h-5 w-5" />
                        Settings
                    </Button>
                </div>
            </ScrollArea>
            <div className="mt-auto border-t p-4">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">Student User</span>
                        <span className="text-xs text-muted-foreground">CSE Dept</span>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-auto">
                        <IconLogout className="h-4 w-4" />
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
                    <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-40">
                        <IconMenu2 className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <div className={cn("hidden border-r bg-background md:block w-72 fixed inset-y-0 z-30", className)}>
                <SidebarContent />
            </div>
        </>
    )
}

function Separator({ className }: { className?: string }) {
    return <div className={cn("h-[1px] w-full bg-border", className)} />
}
