import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function getSession() {
    return await getServerSession(authOptions)
}

export async function GET(request: Request) {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get('semesterId')

    const where: any = { userId: session.user.id }
    if (semesterId) {
        where.semesterId = parseInt(semesterId)
    }

    const subjects = await prisma.subject.findMany({
        where,
        include: {
            semester: true,
            modules: {
                orderBy: { order: 'asc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(subjects)
}

export async function POST(request: Request) {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const subject = await prisma.subject.create({
        data: {
            name: body.name,
            code: body.code,
            credits: body.credits,
            type: body.type,
            slot: body.slot,
            teacherName: body.teacherName,
            teacherEmail: body.teacherEmail,
            cabinNo: body.cabinNo,
            labRoom: body.labRoom,
            classRoom: body.classRoom,
            da: body.da,
            semesterId: body.semesterId ? parseInt(body.semesterId) : null,
            userId: session.user.id
        }
    })
    return NextResponse.json(subject)
}

export async function PUT(request: Request) {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Verify ownership
    const existing = await prisma.subject.findUnique({
        where: { id: body.id, userId: session.user.id }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const subject = await prisma.subject.update({
        where: { id: body.id, userId: session.user.id },
        data: {
            name: body.name,
            code: body.code,
            credits: body.credits,
            type: body.type,
            slot: body.slot,
            teacherName: body.teacherName,
            teacherEmail: body.teacherEmail,
            cabinNo: body.cabinNo,
            labRoom: body.labRoom,
            classRoom: body.classRoom,
            cat1: body.cat1,
            cat2: body.cat2,
            da: body.da,
            fat: body.fat,
            labInternal: body.labInternal,
            labFat: body.labFat,
            semesterId: body.semesterId ? parseInt(body.semesterId) : null
        }
    })
    return NextResponse.json(subject)
}

export async function DELETE(request: Request) {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Verify ownership
    const existing = await prisma.subject.findUnique({
        where: { id: id, userId: session.user.id }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.subject.delete({
        where: { id: id, userId: session.user.id }
    })
    return NextResponse.json({ success: true })
}
