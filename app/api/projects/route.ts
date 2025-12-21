import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const projects = await prisma.project.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(projects)
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const project = await prisma.project.create({
        data: {
            userId: session.user.id,
            title: body.title,
            description: body.description || "",
            progress: body.progress || 0,
            status: body.status || "Planning",
            tech: Array.isArray(body.tech) ? body.tech.join(",") : body.tech || "",
            githubUrl: body.githubUrl,
            updated: new Date().toISOString(),
        }
    })
    return NextResponse.json(project)
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Verify ownership
    const existing = await prisma.project.findFirst({
        where: { id: body.id, userId: session.user.id }
    })
    if (!existing) return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 })

    const project = await prisma.project.update({
        where: { id: body.id, userId: session.user.id },
        data: {
            title: body.title,
            description: body.description,
            progress: body.progress,
            status: body.status,
            tech: Array.isArray(body.tech) ? body.tech.join(',') : body.tech,
            updated: "Updated just now",
        }
    })
    return NextResponse.json(project)
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const parsedId = parseInt(id)

    // Verify ownership
    const existing = await prisma.project.findFirst({
        where: { id: parsedId, userId: session.user.id }
    })
    if (!existing) return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 })

    await prisma.project.delete({
        where: { id: parsedId, userId: session.user.id }
    })

    return NextResponse.json({ success: true })
}
