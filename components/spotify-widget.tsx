"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconBrandSpotify, IconPlayerPlay, IconPlayerPause } from "@tabler/icons-react"

interface SpotifyTrack {
    name: string
    artist: string
    album: string
    albumArt: string
    url: string
    progress: number
    duration: number
}

interface SpotifyData {
    connected: boolean
    isPlaying: boolean
    track?: SpotifyTrack
}

export function SpotifyWidget() {
    const [data, setData] = React.useState<SpotifyData | null>(null)
    const [loading, setLoading] = React.useState(true)

    const fetchNowPlaying = React.useCallback(async () => {
        try {
            const res = await fetch('/api/spotify/now-playing')
            if (!res.ok) {
                // API returned error status - treat as not connected
                setData({ connected: false, isPlaying: false })
                return
            }
            const json = await res.json()
            setData(json)
        } catch (error) {
            console.error('Failed to fetch Spotify data:', error)
            setData({ connected: false, isPlaying: false })
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchNowPlaying()
        // Poll every 10 seconds
        const interval = setInterval(fetchNowPlaying, 10000)
        return () => clearInterval(interval)
    }, [fetchNowPlaying])

    const progressPercent = data?.track
        ? (data.track.progress / data.track.duration) * 100
        : 0

    if (loading) {
        return (
            <Card className="h-full flex flex-col justify-center">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <IconBrandSpotify className="w-4 h-4 text-[#1DB954]" />
                        Now Playing
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 animate-pulse">
                        <div className="w-14 h-14 rounded bg-muted" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Not connected - show connect button
    if (!data?.connected) {
        return (
            <Card className="h-full flex flex-col justify-center">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <IconBrandSpotify className="w-4 h-4 text-[#1DB954]" />
                        Now Playing
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-[#1DB954]/10 flex items-center justify-center shrink-0">
                            <IconBrandSpotify className="w-7 h-7 text-[#1DB954]" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">Connect Spotify</p>
                            <p className="text-xs text-muted-foreground mb-2">Show what you're playing</p>
                            <Button size="sm" className="h-7 text-xs bg-[#1DB954] hover:bg-[#1aa34a]" asChild>
                                <a href="/api/spotify/login">Connect</a>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Connected but nothing playing
    if (!data.isPlaying || !data.track) {
        return (
            <Card className="h-full flex flex-col justify-center">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <IconBrandSpotify className="w-4 h-4 text-[#1DB954]" />
                        Now Playing
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <IconPlayerPause className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground">Not playing</p>
                            <p className="text-xs text-muted-foreground">Play something on Spotify</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Playing!
    return (
        <Card className="overflow-hidden h-full flex flex-col justify-center">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <IconBrandSpotify className="w-4 h-4 text-[#1DB954]" />
                    Now Playing
                    <div className="ml-auto flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <a
                    href={data.track.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 group"
                >
                    <img
                        src={data.track.albumArt}
                        alt={data.track.album}
                        className="w-14 h-14 rounded shadow-md shrink-0 group-hover:shadow-lg transition-shadow"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-[#1DB954] transition-colors">
                            {data.track.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{data.track.artist}</p>
                        {/* Progress bar */}
                        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#1DB954] transition-all duration-1000"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </a>
            </CardContent>
        </Card>
    )
}
