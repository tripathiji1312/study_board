import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/spotify/callback'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
        return NextResponse.redirect(new URL('/?spotify_error=access_denied', request.url))
    }

    if (!code) {
        return NextResponse.redirect(new URL('/?spotify_error=no_code', request.url))
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI
            })
        })

        if (!tokenResponse.ok) {
            throw new Error('Failed to get tokens')
        }

        const tokens = await tokenResponse.json()

        // Store tokens in cookies (httpOnly for security)
        const cookieStore = await cookies()
        cookieStore.set('spotify_access_token', tokens.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: tokens.expires_in,
            path: '/'
        })
        cookieStore.set('spotify_refresh_token', tokens.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/'
        })

        return NextResponse.redirect(new URL('/?spotify_connected=true', request.url))
    } catch (error) {
        console.error('Spotify callback error:', error)
        return NextResponse.redirect(new URL('/?spotify_error=auth_failed', request.url))
    }
}
