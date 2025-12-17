import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const exams = await prisma.exam.findMany({
            orderBy: { date: 'asc' }
        })
        return NextResponse.json(exams)
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch exams" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const exam = await prisma.exam.create({
            data: {
                title: body.title,
                date: new Date(body.date),
                subjectId: body.subjectId,
                syllabus: body.syllabus,
                room: body.room,
                seat: body.seat
            }
        })
        return NextResponse.json(exam)
    } catch (e) {
        return NextResponse.json({ error: "Failed to create exam" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        await prisma.exam.delete({
            where: { id: Number(id) }
        })
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 })
    }
}
