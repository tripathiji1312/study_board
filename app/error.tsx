"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to console for debugging
        console.error("App Error:", error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="max-w-md w-full space-y-4 text-center">
                <h2 className="text-2xl font-bold text-destructive">Something went wrong!</h2>
                
                {/* Show actual error for debugging - remove in production later */}
                <div className="p-4 bg-destructive/10 rounded-lg text-left overflow-auto max-h-64">
                    <p className="text-sm font-mono text-destructive break-all">
                        <strong>Error:</strong> {error.message}
                    </p>
                    {error.stack && (
                        <pre className="text-xs mt-2 text-muted-foreground whitespace-pre-wrap break-all">
                            {error.stack}
                        </pre>
                    )}
                    {error.digest && (
                        <p className="text-xs mt-2 text-muted-foreground">
                            Digest: {error.digest}
                        </p>
                    )}
                </div>

                <Button onClick={reset} variant="default">
                    Try again
                </Button>
            </div>
        </div>
    )
}
