import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const events = await prisma.scheduleEvent.findMany({
        where: { userId: session.user.id }
    })
    return NextResponse.json(events)
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const event = await prisma.scheduleEvent.create({
        data: {
            userId: session.user.id,
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
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const parsedId = parseInt(id)
    const existing = await prisma.scheduleEvent.findFirst({
        where: { id: parsedId, userId: session.user.id }
    })
    if (!existing) return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 })

    await prisma.scheduleEvent.delete({
        where: { id: parsedId }
    })
    return NextResponse.json({ success: true })
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const existing = await prisma.scheduleEvent.findFirst({
        where: { id: body.id, userId: session.user.id }
    })
    if (!existing) return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 })

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
