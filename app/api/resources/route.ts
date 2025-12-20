
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    const resources = await prisma.resource.findMany()
    return NextResponse.json(resources)
}

export async function POST(request: Request) {
    const body = await request.json()
    const resource = await prisma.resource.create({
        data: {
            title: body.title,
            type: body.type,
            url: body.url,
            category: body.category,
            meta: body.meta,
            subjectId: body.subjectId,
            syllabusModuleId: body.syllabusModuleId,
            scoutedByAi: body.scoutedByAi
        }
    })
    return NextResponse.json(resource)
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.resource.delete({
        where: { id: parseInt(id) }
    })
    return NextResponse.json({ success: true })
}
