import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    // Get or create the singleton settings row
    let settings = await prisma.userSettings.findFirst()
    if (!settings) {
        settings = await prisma.userSettings.create({
            data: {
                displayName: "Student",
                department: "CSE",
                focusDuration: 25,
                breakDuration: 5
            }
        })
    }
    return NextResponse.json(settings)
}

export async function PUT(request: Request) {
    const body = await request.json()

    // Get or create settings
    let settings = await prisma.userSettings.findFirst()
    if (!settings) {
        settings = await prisma.userSettings.create({
            data: {
                displayName: body.displayName || "Student",
                email: body.email,
                department: body.department || "CSE",
                currentSemId: body.currentSemId,
                focusDuration: body.focusDuration || 25,
                breakDuration: body.breakDuration || 5,
                emailNotifications: body.emailNotifications || false,
                notificationEmail: body.notificationEmail,
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
            }
        })
    }

    return NextResponse.json(settings)
}
