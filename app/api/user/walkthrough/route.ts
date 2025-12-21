
import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        await prisma.userSettings.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                hasSeenWalkthrough: true
            },
            update: {
                hasSeenWalkthrough: true
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to update walkthrough status:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
