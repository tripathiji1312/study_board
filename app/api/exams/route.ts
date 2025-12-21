import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const exams = await prisma.exam.findMany({
            where: { userId: session.user.id },
            orderBy: { date: 'asc' }
        })
        return NextResponse.json(exams)
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch exams" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const body = await req.json()

        const title = body.title || body.type || "Exam"

        const dateObj = new Date(body.date)
        if (body.time) {
            const [hours, minutes] = body.time.split(':').map(Number)
            if (!isNaN(hours) && !isNaN(minutes)) {
                dateObj.setHours(hours, minutes)
            }
        }

        const exam = await prisma.exam.create({
            data: {
                userId: session.user.id,
                title: title,
                date: dateObj,
                subjectId: body.subjectId,
                syllabus: body.syllabus,
                room: body.room,
                seat: body.seat
            }
        })
        return NextResponse.json(exam)
    } catch (e) {
        console.error("Exam API Error:", e)
        return NextResponse.json({ error: "Failed to create exam" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        const parsedId = Number(id)

        // Verify ownership
        const existing = await prisma.exam.findFirst({
            where: { id: parsedId, userId: session.user.id }
        })
        if (!existing) return NextResponse.json({ error: "Not found or Unauthorized" }, { status: 404 })

        await prisma.exam.delete({
            where: { id: parsedId }
        })
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 })
    }
}
