import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const logs = await prisma.dailyLog.findMany({
            where: { userId: session.user.id },
            orderBy: { date: 'desc' },
            take: 365 // Last year only
        })
        return NextResponse.json(logs)
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const body = await req.json()
        const log = await prisma.dailyLog.create({
            data: {
                userId: session.user.id,
                date: new Date(body.date),
                mood: body.mood,
                note: body.note,
                sleep: body.sleep,
                studyTime: body.studyTime,
                subjectId: body.subjectId
            }
        })
        return NextResponse.json(log)
    } catch (e) {
        return NextResponse.json({ error: "Failed to create log" }, { status: 500 })
    }
}
