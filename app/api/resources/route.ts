import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const resources = await prisma.resource.findMany({
        where: { userId: session.user.id }
    })
    return NextResponse.json(resources)
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const resource = await prisma.resource.create({
        data: {
            userId: session.user.id,
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
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const parsedId = parseInt(id)

    // Verify ownership
    const existing = await prisma.resource.findFirst({
        where: { id: parsedId, userId: session.user.id }
    })
    if (!existing) return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 })

    await prisma.resource.delete({
        where: { id: parsedId, userId: session.user.id }
    })
    return NextResponse.json({ success: true })
}
