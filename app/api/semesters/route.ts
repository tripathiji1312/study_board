import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function getSession() {
    return await getServerSession(authOptions)
}

export async function GET() {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const semesters = await prisma.semester.findMany({
        where: { userId: session.user.id },
        include: { subjects: true },
        orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(semesters)
}

export async function POST(request: Request) {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // If setting as current, unset all others first for THIS user
    if (body.isCurrent) {
        await prisma.semester.updateMany({
            where: { userId: session.user.id },
            data: { isCurrent: false }
        })
    }

    const semester = await prisma.semester.create({
        data: {
            name: body.name,
            startDate: body.startDate,
            endDate: body.endDate,
            isCurrent: body.isCurrent || false,
            userId: session.user.id
        }
    })
    return NextResponse.json(semester)
}

export async function PUT(request: Request) {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Verify ownership
    const existing = await prisma.semester.findUnique({
        where: { id: body.id, userId: session.user.id }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // If setting as current, unset all others first
    if (body.isCurrent) {
        await prisma.semester.updateMany({
            where: { userId: session.user.id, id: { not: body.id } },
            data: { isCurrent: false }
        })
    }

    const semester = await prisma.semester.update({
        where: { id: body.id, userId: session.user.id },
        data: {
            name: body.name,
            startDate: body.startDate,
            endDate: body.endDate,
            isCurrent: body.isCurrent
        }
    })
    return NextResponse.json(semester)
}

export async function DELETE(request: Request) {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const semesterId = parseInt(id)

    // Verify ownership
    const existing = await prisma.semester.findUnique({
        where: { id: semesterId, userId: session.user.id }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.semester.delete({
        where: { id: semesterId, userId: session.user.id }
    })
    return NextResponse.json({ success: true })
}
