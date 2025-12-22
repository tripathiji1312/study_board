import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get or create settings for the logged-in user
    let settings = await prisma.userSettings.findUnique({
        where: { userId: session.user.id }
    })

    if (!settings) {
        settings = await prisma.userSettings.create({
            data: {
                userId: session.user.id,
                displayName: session.user.name || "Student",
                email: session.user.email,
                department: "CSE",
                focusDuration: 25,
                breakDuration: 5
            }
        })
    }
    return NextResponse.json(settings)
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const userId = session.user.id

        // Get or create settings
        let settings = await prisma.userSettings.findUnique({
            where: { userId: userId }
        })

        if (!settings) {
            settings = await prisma.userSettings.create({
                data: {
                    user: { connect: { id: userId } },
                    displayName: body.displayName || session.user.name || "Student",
                    email: body.email || session.user.email,
                    department: body.department || "CSE",
                    currentSemId: body.currentSemId ?? undefined,
                    focusDuration: body.focusDuration || 25,
                    breakDuration: body.breakDuration || 5,
                    emailNotifications: body.emailNotifications || false,
                    notificationEmail: body.notificationEmail,
                    groqApiKey: body.groqApiKey,
                    resendApiKey: body.resendApiKey,
                    theme: body.theme || "light",
                    hasSeenWalkthrough: body.hasSeenWalkthrough ?? false,
                }
            })
        } else {
            settings = await prisma.userSettings.update({
                where: { id: settings.id },
                data: {
                    displayName: body.displayName,
                    email: body.email,
                    department: body.department,
                    currentSemId: body.currentSemId,
                    focusDuration: body.focusDuration,
                    breakDuration: body.breakDuration,
                    emailNotifications: body.emailNotifications,
                    notificationEmail: body.notificationEmail,
                    groqApiKey: body.groqApiKey,
                    resendApiKey: body.resendApiKey,
                    theme: body.theme,
                    hasSeenWalkthrough: body.hasSeenWalkthrough,
                }
            })
        }

        return NextResponse.json(settings)
    } catch (error: any) {
        console.error("Settings Update Error:", error)
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
    }
}
