import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// GET all tags with usage counts for the current user
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const tags = await prisma.tag.findMany({
        where: { userId: session.user.id },
        include: {
            _count: {
                select: {
                    todos: true,
                    projects: true,
                    ideas: true,
                    snippets: true,
                    resources: true,
                }
            }
        },
        orderBy: { name: 'asc' }
    })

    // Transform to include total count
    const tagsWithCounts = tags.map(tag => ({
        ...tag,
        usageCount:
            tag._count.todos +
            tag._count.projects +
            tag._count.ideas +
            tag._count.snippets +
            tag._count.resources
    }))

    return NextResponse.json(tagsWithCounts)
}

// CREATE a new tag
export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()

    if (!body.name) {
        return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
    }

    const tagName = body.name.toLowerCase().trim()

    // Check if tag already exists for THIS user
    const existing = await prisma.tag.findUnique({
        where: { userId_name: { userId: session.user.id, name: tagName } }
    })

    if (existing) {
        return NextResponse.json(existing)
    }

    const tag = await prisma.tag.create({
        data: {
            userId: session.user.id,
            name: tagName,
            color: body.color || '#6366f1'
        }
    })

    return NextResponse.json(tag)
}

// UPDATE a tag
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()

    if (!body.id) {
        return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.tag.findUnique({
        where: { id: body.id, userId: session.user.id }
    })
    if (!existing) return NextResponse.json({ error: "Not Found" }, { status: 404 })

    const tag = await prisma.tag.update({
        where: { id: body.id, userId: session.user.id },
        data: {
            name: body.name?.toLowerCase().trim(),
            color: body.color
        }
    })

    return NextResponse.json(tag)
}

// DELETE a tag
export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.tag.findUnique({
        where: { id: id, userId: session.user.id }
    })
    if (!existing) return NextResponse.json({ error: "Not Found" }, { status: 404 })

    await prisma.tag.delete({
        where: { id: id, userId: session.user.id }
    })

    return NextResponse.json({ success: true })
}
