import { Shell } from "@/components/ui/shell"
import { Skeleton } from "@/components/ui/skeleton"
import { WidgetSkeleton, StatCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton-loaders"

export default function Loading() {
    return (
        <Shell>
            <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in-0">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-72" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-28 rounded-full" />
                        <Skeleton className="h-10 w-28 rounded-full" />
                        <Skeleton className="h-10 w-36 rounded-full" />
                    </div>
                </header>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <StatCardSkeleton key={i} />
                    ))}
                </div>

                <div>
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-6 h-auto md:h-[500px]">
                        <WidgetSkeleton className="flex-1" />
                        <WidgetSkeleton className="h-[200px]" />
                    </div>
                    <div className="h-[500px]">
                        <WidgetSkeleton className="h-full" />
                    </div>
                    <div className="flex flex-col gap-6 h-auto md:h-[500px] md:col-span-2 xl:col-span-1">
                        <WidgetSkeleton className="flex-1" />
                        <WidgetSkeleton className="h-[200px]" />
                    </div>
                </div>

                <ChartSkeleton />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <WidgetSkeleton className="h-[320px]" />
                    </div>
                    <div className="md:col-span-1">
                        <WidgetSkeleton className="h-[320px]" />
                    </div>
                </div>
            </div>
        </Shell>
    )
}
