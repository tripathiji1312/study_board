"use client"

import { SWRConfig } from "swr"
import React, { useEffect } from "react"

// Fetcher with error handling
const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.')
        throw error
    }
    return res.json()
}

// SWR configuration for optimal performance
const swrConfig = {
    fetcher,
    revalidateOnFocus: false,        // Don't refetch on window focus (saves bandwidth)
    revalidateIfStale: false,        // Use cache first, revalidate in background
    dedupingInterval: 10000,         // Dedupe requests within 10 seconds
    errorRetryCount: 2,              // Retry failed requests twice
    keepPreviousData: true,          // Show stale data while revalidating
    revalidateOnReconnect: true,     // Revalidate when network reconnects
    focusThrottleInterval: 30000,    // Throttle revalidation on focus
}

// Preload critical data
function usePreload() {
    useEffect(() => {
        // Preload critical API endpoints in parallel
        Promise.all([
            fetch('/api/academics'),
            fetch('/api/todos'),
            fetch('/api/settings'),
        ]).catch(() => {
            // Silently ignore preload errors
        })
    }, [])
}

interface SWRProviderProps {
    children: React.ReactNode
}

export function SWRProvider({ children }: SWRProviderProps) {
    usePreload()

    return (
        <SWRConfig value={swrConfig}>
            {children}
        </SWRConfig>
    )
}
