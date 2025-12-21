import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const assignments = await prisma.assignment.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(assignments)
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const assignment = await prisma.assignment.create({
        data: {
            userId: session.user.id,
            title: body.title,
            subject: body.subject,
            subjectId: body.subjectId,
            due: body.due,
            priority: body.priority,
            status: body.status || "Pending",
            platform: body.platform,
            description: body.description
        }
    })
    return NextResponse.json(assignment)
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Verify ownership
    const existing = await prisma.assignment.findFirst({
        where: { id: body.id, userId: session.user.id }
    })
    if (!existing) return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 })

    const assignment = await prisma.assignment.update({
        where: { id: body.id },
        data: {
            title: body.title,
            subject: body.subject,
            subjectId: body.subjectId,
            due: body.due,
            priority: body.priority,
            status: body.status,
            platform: body.platform,
            description: body.description
        }
    })
    return NextResponse.json(assignment)
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const parsedId = parseInt(id)

    // Verify ownership
    const existing = await prisma.assignment.findFirst({
        where: { id: parsedId, userId: session.user.id }
    })
    if (!existing) return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 })

    await prisma.assignment.delete({
        where: { id: parsedId }
    })

    return NextResponse.json({ success: true })
}
