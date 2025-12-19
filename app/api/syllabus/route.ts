import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/syllabus?subjectId=...
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    if (!subjectId) {
        return NextResponse.json({ error: 'Subject ID required' }, { status: 400 })
    }

    try {
        const modules = await prisma.syllabusModule.findMany({
            where: { subjectId },
            orderBy: { order: 'asc' }
        })
        return NextResponse.json(modules)
    } catch (error) {
        console.error("Failed to fetch syllabus:", error)
        return NextResponse.json({ error: "Failed to fetch syllabus" }, { status: 500 })
    }
}

// POST /api/syllabus
// Body: { subjectId, modules: [{ title, topics }], mode: 'replace' | 'append' }
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { subjectId, modules, mode = 'replace' } = body

        if (!subjectId || !modules) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 })
        }

        // Transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            if (mode === 'replace') {
                // Delete existing modules for this subject
                await tx.syllabusModule.deleteMany({
                    where: { subjectId }
                })
            }

            // Get current count if appending (to set order correctly)
            let startOrder = 0
            if (mode === 'append') {
                const count = await tx.syllabusModule.count({ where: { subjectId } })
                startOrder = count
            }

            // Create new modules
            // Create new modules efficiently
            if (modules.length > 0) {
                await tx.syllabusModule.createMany({
                    data: modules.map((mod: any, i: number) => ({
                        title: mod.title,
                        topics: mod.topics,
                        subjectId,
                        order: startOrder + i,
                        status: 'Pending'
                    }))
                })
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Failed to save syllabus:", error)
        return NextResponse.json({ error: "Failed to save syllabus" }, { status: 500 })
    }
}

// PATCH /api/syllabus
// Body: { id, status, topics } - Update a specific module
export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const updated = await prisma.syllabusModule.update({
            where: { id },
            data: updates
        })

        return NextResponse.json(updated)

    } catch (error) {
        console.error("Failed to update module:", error)
        return NextResponse.json({ error: "Failed to update module" }, { status: 500 })
    }
}

// DELETE /api/syllabus?id=...
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    try {
        await prisma.syllabusModule.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to delete module:", error)
        return NextResponse.json({ error: "Failed to delete module" }, { status: 500 })
    }
}
