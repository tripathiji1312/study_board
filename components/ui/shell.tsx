import { AppSidebar } from "@/components/app-sidebar"
import { cn } from "@/lib/utils"

interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function Shell({ children, className, ...props }: ShellProps) {
    return (
        <div className="min-h-screen bg-background">
            <AppSidebar />
            <main className={cn("md:pl-72 min-h-screen transition-all duration-300 ease-in-out", className)} {...props}>
                <div className="container mx-auto p-4 md:p-8 pt-16 md:pt-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
