import { Skeleton } from "./skeleton"
import { cn } from "@/lib/utils"

export function WidgetSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("h-full w-full p-4 border rounded-[28px] space-y-4 bg-card/50", className)}>
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-12 w-full rouned-lg" />
                <Skeleton className="h-12 w-full rouned-lg" />
                <Skeleton className="h-12 w-full rouned-lg" />
            </div>
        </div>
    )
}

export function StatCardSkeleton() {
    return (
        <div className="h-[120px] w-full p-4 border rounded-[28px] flex items-center justify-between bg-card/50">
            <div className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-12 w-12 rounded-[16px]" />
        </div>
    )
}

export function ChartSkeleton() {
    return (
        <div className="h-[300px] w-full p-4 border rounded-[28px] space-y-4 bg-card/50">
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-[140px]" />
                <Skeleton className="h-8 w-[100px]" />
            </div>
            <div className="flex items-end gap-2 h-[200px] pt-4">
                {[...Array(7)].map((_, i) => (
                    <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${Math.random() * 80 + 20}%` }} />
                ))}
            </div>
        </div>
    )
}
