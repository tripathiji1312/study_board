import { cn } from "@/lib/utils"

export function Logo({ className, collapsed = false }: { className?: string, collapsed?: boolean }) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative flex items-center justify-center w-8 h-8">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full text-primary"
                >
                    <defs>
                        <linearGradient id="logo-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="currentColor" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M12 2L2 7L12 12L22 7L12 2Z"
                        fill="currentColor"
                        className="opacity-80"
                    />
                    <path
                        d="M2 17L12 22L22 17"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M2 12L12 17L22 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50 -z-10" />
            </div>
            {!collapsed && (
                <div className="flex flex-col gap-0.5 leading-none select-none">
                    <span className="font-bold text-lg tracking-tight text-foreground">
                        Study<span className="text-primary font-extrabold">Board</span>
                    </span>
                </div>
            )}
        </div>
    )
}
