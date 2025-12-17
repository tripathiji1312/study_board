import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    const assignments = await prisma.assignment.findMany({
        orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(assignments)
}

export async function POST(request: Request) {
    const body = await request.json()
    const assignment = await prisma.assignment.create({
        data: {
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
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.assignment.delete({
        where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
}
