import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { google } from "googleapis"
import { GET as authOptions } from "../../auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET() {
    const session = await getServerSession(authOptions as any) as { user?: { id?: string } } | null

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get User's Account to find the specific Access Token
    // @ts-ignore
    const userId = session.user.id

    const account = await prisma.account.findFirst({
        where: {
            userId: userId,
            provider: "google"
        }
    })

    if (!account || !account.access_token) {
        return NextResponse.json({ error: "No Google Account Linked" }, { status: 400 })
    }

    try {
        const auth = new google.auth.OAuth2()
        auth.setCredentials({
            access_token: account.access_token,
            refresh_token: account.refresh_token
            // expiry_date: account.expires_at // Handled automatically by googleapis if refresh token present?
            // Actually googleapis might need force refresh if expired. 
            // For simplicity in this demo, we assume token is valid or we'd handle refresh flow manually.
        })

        const calendar = google.calendar({ version: "v3", auth })

        // Fetch upcoming events
        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: new Date().toISOString(),
            maxResults: 20,
            singleEvents: true,
            orderBy: "startTime",
        })

        const events = response.data.items || []

        // Transform to our widget format
        const formattedEvents = events.map(event => ({
            id: event.id,
            title: event.summary || "No Title",
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            location: event.location,
            link: event.htmlLink,
            source: "google"
        }))

        return NextResponse.json(formattedEvents)
    } catch (error) {
        console.error("GCal Error:", error)
        return NextResponse.json({ error: "Failed to fetch from Google" }, { status: 500 })
    }
}
