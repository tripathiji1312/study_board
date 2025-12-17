import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get('semesterId')

    const where = semesterId ? { semesterId: parseInt(semesterId) } : {}

    const subjects = await prisma.subject.findMany({
        where,
        include: { semester: true },
        orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(subjects)
}

export async function POST(request: Request) {
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
            semesterId: body.semesterId ? parseInt(body.semesterId) : null
        }
    })
    return NextResponse.json(subject)
}

export async function PUT(request: Request) {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const subject = await prisma.subject.update({
        where: { id: body.id },
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.subject.delete({
        where: { id }
    })
    return NextResponse.json({ success: true })
}
