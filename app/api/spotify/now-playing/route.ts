import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from '@/lib/prisma'

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

async function refreshAccessToken(refreshToken: string) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })
    })

    if (!response.ok) {
        throw new Error('Failed to refresh token')
    }

    return response.json()
}

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ connected: false })
    }

    const cookieStore = await cookies()
    let accessToken = cookieStore.get('spotify_access_token')?.value
    let refreshToken = cookieStore.get('spotify_refresh_token')?.value

    // If no tokens in cookies, check database
    if (!refreshToken) {
        try {
            const account = await prisma.account.findFirst({
                where: {
                    userId: session.user.id,
                    provider: 'spotify'
                }
            })

            if (account && account.refresh_token) {
                refreshToken = account.refresh_token
                accessToken = account.access_token || undefined

                // Restore cookies for this device
                cookieStore.set('spotify_refresh_token', refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 60 * 60 * 24 * 30, // 30 days
                    path: '/'
                })

                if (accessToken) {
                    cookieStore.set('spotify_access_token', accessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        maxAge: 3600,
                        path: '/'
                    })
                }
            }
        } catch (error) {
            console.error("Failed to fetch Spotify tokens from DB:", error)
        }
    }

    // Check if connected
    if (!refreshToken) {
        return NextResponse.json({ connected: false })
    }

    // Try to refresh if no access token
    if (!accessToken && refreshToken) {
        try {
            const tokens = await refreshAccessToken(refreshToken)
            accessToken = tokens.access_token

            // Update database with new tokens
            await prisma.account.updateMany({
                where: {
                    userId: session.user.id,
                    provider: 'spotify'
                },
                data: {
                    access_token: tokens.access_token,
                    expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
                    // Some providers rotate refresh tokens
                    ...(tokens.refresh_token && { refresh_token: tokens.refresh_token })
                }
            })

            // Update the access token cookie
            cookieStore.set('spotify_access_token', tokens.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: tokens.expires_in,
                path: '/'
            })

            if (tokens.refresh_token) {
                cookieStore.set('spotify_refresh_token', tokens.refresh_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 60 * 60 * 24 * 30,
                    path: '/'
                })
            }
        } catch (error) {
            return NextResponse.json({ connected: false, error: 'refresh_failed' })
        }
    }

    try {
        // Fetch currently playing
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })

        // 204 means nothing is playing
        if (response.status === 204) {
            return NextResponse.json({
                connected: true,
                isPlaying: false
            })
        }

        // 401 means token expired, try refresh
        if (response.status === 401 && refreshToken) {
            try {
                const tokens = await refreshAccessToken(refreshToken)
                accessToken = tokens.access_token

                // Update database
                await prisma.account.updateMany({
                    where: { userId: session.user.id, provider: 'spotify' },
                    data: {
                        access_token: tokens.access_token,
                        expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
                        ...(tokens.refresh_token && { refresh_token: tokens.refresh_token })
                    }
                })

                cookieStore.set('spotify_access_token', tokens.access_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: tokens.expires_in,
                    path: '/'
                })

                if (tokens.refresh_token) {
                    cookieStore.set('spotify_refresh_token', tokens.refresh_token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        maxAge: 60 * 60 * 24 * 30,
                        path: '/'
                    })
                }

                // Retry the request
                const retryResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                    headers: {
                        'Authorization': `Bearer ${tokens.access_token}`
                    }
                })

                if (retryResponse.status === 204) {
                    return NextResponse.json({ connected: true, isPlaying: false })
                }

                if (!retryResponse.ok) {
                    return NextResponse.json({ connected: true, isPlaying: false })
                }

                const data = await retryResponse.json()
                return NextResponse.json({
                    connected: true,
                    isPlaying: data.is_playing,
                    track: {
                        name: data.item?.name,
                        artist: data.item?.artists?.map((a: any) => a.name).join(', '),
                        album: data.item?.album?.name,
                        albumArt: data.item?.album?.images?.[0]?.url,
                        url: data.item?.external_urls?.spotify,
                        progress: data.progress_ms,
                        duration: data.item?.duration_ms
                    }
                })
            } catch {
                return NextResponse.json({ connected: false, error: 'refresh_failed' })
            }
        }

        if (!response.ok) {
            return NextResponse.json({ connected: true, isPlaying: false })
        }

        const data = await response.json()

        return NextResponse.json({
            connected: true,
            isPlaying: data.is_playing,
            track: {
                name: data.item?.name,
                artist: data.item?.artists?.map((a: any) => a.name).join(', '),
                album: data.item?.album?.name,
                albumArt: data.item?.album?.images?.[0]?.url,
                url: data.item?.external_urls?.spotify,
                progress: data.progress_ms,
                duration: data.item?.duration_ms
            }
        })
    } catch (error) {
        console.error('Now playing error:', error)
        return NextResponse.json({ connected: true, isPlaying: false, error: 'fetch_failed' })
    }
}
