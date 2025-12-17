import { NextResponse } from 'next/server'

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/spotify/callback'

const SCOPES = [
    'user-read-currently-playing',
    'user-read-playback-state',
].join(' ')

export async function GET() {
    const authUrl = new URL('https://accounts.spotify.com/authorize')
    authUrl.searchParams.append('client_id', CLIENT_ID!)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.append('scope', SCOPES)
    authUrl.searchParams.append('show_dialog', 'true')

    return NextResponse.redirect(authUrl.toString())
}
