import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const logs = await prisma.dailyLog.findMany({
            orderBy: { date: 'desc' },
            take: 365 // Last year only
        })
        return NextResponse.json(logs)
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const log = await prisma.dailyLog.create({
            data: {
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
