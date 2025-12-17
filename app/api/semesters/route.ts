import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    const semesters = await prisma.semester.findMany({
        include: { subjects: true },
        orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(semesters)
}

export async function POST(request: Request) {
    const body = await request.json()

    // If setting as current, unset all others first
    if (body.isCurrent) {
        await prisma.semester.updateMany({
            data: { isCurrent: false }
        })
    }

    const semester = await prisma.semester.create({
        data: {
            name: body.name,
            startDate: body.startDate,
            endDate: body.endDate,
            isCurrent: body.isCurrent || false
        }
    })
    return NextResponse.json(semester)
}

export async function PUT(request: Request) {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // If setting as current, unset all others first
    if (body.isCurrent) {
        await prisma.semester.updateMany({
            where: { id: { not: body.id } },
            data: { isCurrent: false }
        })
    }

    const semester = await prisma.semester.update({
        where: { id: body.id },
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.semester.delete({
        where: { id: parseInt(id) }
    })
    return NextResponse.json({ success: true })
}
