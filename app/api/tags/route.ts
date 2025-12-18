import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET all tags with usage counts
export async function GET() {
    const tags = await prisma.tag.findMany({
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
    const body = await request.json()

    if (!body.name) {
        return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
    }

    // Check if tag already exists
    const existing = await prisma.tag.findUnique({
        where: { name: body.name.toLowerCase().trim() }
    })

    if (existing) {
        return NextResponse.json(existing)
    }

    const tag = await prisma.tag.create({
        data: {
            name: body.name.toLowerCase().trim(),
            color: body.color || '#6366f1'
        }
    })

    return NextResponse.json(tag)
}

// UPDATE a tag
export async function PUT(request: Request) {
    const body = await request.json()

    if (!body.id) {
        return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    const tag = await prisma.tag.update({
        where: { id: body.id },
        data: {
            name: body.name?.toLowerCase().trim(),
            color: body.color
        }
    })

    return NextResponse.json(tag)
}

// DELETE a tag
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    await prisma.tag.delete({
        where: { id }
    })

    return NextResponse.json({ success: true })
}
