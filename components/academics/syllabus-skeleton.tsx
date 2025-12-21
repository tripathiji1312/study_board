
import { Shell } from "@/components/ui/shell"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export function SyllabusSkeleton() {
    return (
        <Shell>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                {/* Back Button */}
                <Button variant="ghost" size="sm" className="-ml-2 pointer-events-none opacity-50">
                    <IconArrowLeft className="w-4 h-4 mr-2" />
                    Back to Academics
                </Button>

                {/* Hero Header */}
                <Card className="overflow-hidden border-0 bg-gradient-to-br from-muted/50 via-background to-background">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                </div>
                                <Skeleton className="h-8 w-64 md:w-96 rounded-lg" />
                                <Skeleton className="h-4 w-32 rounded" />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right space-y-1">
                                    <Skeleton className="h-8 w-24 ml-auto rounded" />
                                    <Skeleton className="h-4 w-32 ml-auto rounded" />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <Skeleton className="h-2 w-full rounded-full" />
                    </CardContent>
                </Card>

                {/* Import Section */}
                <Card>
                    <CardHeader className="pb-3">
                        <Skeleton className="h-6 w-48 rounded" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Skeleton className="h-10 flex-1 rounded-lg" />
                            <Skeleton className="h-10 w-32 rounded-lg" />
                        </div>
                        <Skeleton className="h-3 w-64 mt-3 rounded" />
                    </CardContent>
                </Card>

                <Separator />

                {/* Modules List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32 rounded" />
                        <Skeleton className="h-8 w-28 rounded-lg" />
                    </div>

                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="p-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-5 h-5 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-3/4 rounded" />
                                        <Skeleton className="h-3 w-24 rounded" />
                                    </div>
                                    <div className="flex gap-1">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                    </div>
                                    <Skeleton className="h-9 w-32 rounded-lg" />
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </Shell>
    )
}
