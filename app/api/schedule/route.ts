
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    const events = await prisma.scheduleEvent.findMany()
    return NextResponse.json(events)
}

export async function POST(request: Request) {
    const body = await request.json()
    const event = await prisma.scheduleEvent.create({
        data: {
            title: body.title,
            type: body.type,
            time: body.time,
            duration: body.duration,
            location: body.location,
            day: body.day,
            subjectId: body.subjectId
        }
    })
    return NextResponse.json(event)
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.scheduleEvent.delete({
        where: { id: parseInt(id) }
    })
    return NextResponse.json({ success: true })
}

export async function PUT(request: Request) {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const event = await prisma.scheduleEvent.update({
        where: { id: body.id },
        data: {
            title: body.title,
            type: body.type,
            time: body.time,
            duration: body.duration,
            location: body.location,
            day: body.day,
            subjectId: body.subjectId
        }
    })
    return NextResponse.json(event)
}
