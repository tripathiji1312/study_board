import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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
    const cookieStore = await cookies()
    let accessToken = cookieStore.get('spotify_access_token')?.value
    const refreshToken = cookieStore.get('spotify_refresh_token')?.value

    // Check if connected
    if (!refreshToken) {
        return NextResponse.json({ connected: false })
    }

    // Try to refresh if no access token
    if (!accessToken && refreshToken) {
        try {
            const tokens = await refreshAccessToken(refreshToken)
            accessToken = tokens.access_token

            // Update the access token cookie
            cookieStore.set('spotify_access_token', tokens.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: tokens.expires_in,
                path: '/'
            })
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
                cookieStore.set('spotify_access_token', tokens.access_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: tokens.expires_in,
                    path: '/'
                })

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
