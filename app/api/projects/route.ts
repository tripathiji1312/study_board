
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    const projects = await prisma.project.findMany({
        orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(projects)
}

export async function POST(request: Request) {
    const body = await request.json()
    const project = await prisma.project.create({
        data: {
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
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const project = await prisma.project.update({
        where: { id: body.id },
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.project.delete({
        where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
}
