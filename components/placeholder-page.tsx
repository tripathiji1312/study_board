import { Shell } from "@/components/ui/shell"
import { IconCone } from "@tabler/icons-react"

export default function PlaceholderPage() {
    return (
        <Shell>
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
                <div className="p-4 rounded-full bg-muted">
                    <IconCone className="w-12 h-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold">Coming Soon</h2>
                <p className="text-muted-foreground max-w-md">
                    This feature is currently under development. Check back later for updates!
                </p>
            </div>
        </Shell>
    )
}
