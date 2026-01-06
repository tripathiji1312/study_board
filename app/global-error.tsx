"use client"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body>
                <div style={{ 
                    minHeight: "100vh", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    padding: "1rem",
                    fontFamily: "system-ui, sans-serif"
                }}>
                    <div style={{ maxWidth: "400px", textAlign: "center" }}>
                        <h2 style={{ color: "#dc2626", marginBottom: "1rem" }}>
                            Critical Error
                        </h2>
                        
                        <div style={{ 
                            padding: "1rem", 
                            background: "#fef2f2", 
                            borderRadius: "8px",
                            textAlign: "left",
                            marginBottom: "1rem",
                            wordBreak: "break-all"
                        }}>
                            <p style={{ fontSize: "14px", fontFamily: "monospace" }}>
                                <strong>Error:</strong> {error.message}
                            </p>
                            {error.digest && (
                                <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                                    Digest: {error.digest}
                                </p>
                            )}
                        </div>

                        <button 
                            onClick={reset}
                            style={{
                                padding: "8px 16px",
                                background: "#3b82f6",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer"
                            }}
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}
