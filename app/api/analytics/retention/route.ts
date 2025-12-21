import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        // Fetch all Completed or Revised modules for THIS user
        const modules = await prisma.syllabusModule.findMany({
            where: {
                subject: { userId: session.user.id },
                status: { in: ['Completed', 'Revised'] }
            },
            include: { subject: true }
        })

        const now = new Date()

        const retentionData = modules.map(mod => {
            // Ebbinghaus Formula: R = e^(-t/S)
            // t = days since last studied
            // S = strength (stability)

            if (!mod.lastStudiedAt) return { ...mod, retention: 0, daysSince: 0 }

            const diffTime = Math.abs(now.getTime() - mod.lastStudiedAt.getTime())
            const diffDays = diffTime / (1000 * 60 * 60 * 24)

            // Avoid division by zero, default strength 1.0
            const strength = mod.strength || 1.0

            // Base decay constant (adjust as needed, usually e^-t)
            // Ideally R should be 100% at t=0
            const retention = Math.exp(-diffDays / strength) * 100

            return {
                ...mod,
                daysSince: Math.round(diffDays * 10) / 10,
                retention: Math.round(retention)
            }
        })

        // Sort by lowest retention first (Highest Urgency)
        retentionData.sort((a, b) => a.retention - b.retention)

        return NextResponse.json(retentionData)

    } catch (error) {
        console.error("Retention Analytics Error:", error)
        return NextResponse.json({ error: "Failed to fetch retention data" }, { status: 500 })
    }
}
