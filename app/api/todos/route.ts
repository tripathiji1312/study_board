import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import Groq from 'groq-sdk'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Helper to get Groq client for user
async function getGroqClient(userId: string) {
    const settings = await prisma.userSettings.findUnique({
        where: { userId },
        select: { groqApiKey: true }
    })
    const apiKey = settings?.groqApiKey
    if (!apiKey) return null
    return new Groq({ apiKey })
}

// GET all todos with subtasks and tags
export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') // 'inbox' | 'today' | 'upcoming' | 'all'
    const tagId = searchParams.get('tagId')
    const search = searchParams.get('search')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().split('T')[0]

    // Base where clause - only get parent todos (not subtasks) AND belonging to user
    let where: any = {
        userId: userId,
        parentId: null
    }

    // Apply view filters
    if (view === 'inbox') {
        where.dueDate = null
    } else if (view === 'today') {
        where.OR = [
            { dueDate: todayStr },
            { dueDate: { lt: todayStr }, completed: false } // overdue
        ]
    } else if (view === 'upcoming') {
        where.dueDate = { gte: todayStr, lte: nextWeekStr }
    } else if (view === 'completed') {
        where.completed = true
    }

    // Apply tag filter
    if (tagId) {
        where.tags = { some: { tagId } }
    }

    // Apply search filter
    if (search) {
        where.AND = [
            {
                OR: [
                    { text: { contains: search } },
                    { description: { contains: search } },
                    { tags: { some: { tag: { name: { contains: search.toLowerCase() } } } } }
                ]
            }
        ]
    }

    const todos = await prisma.todo.findMany({
        where,
        include: {
            subtasks: {
                include: {
                    tags: { include: { tag: true } }
                },
                orderBy: { createdAt: 'asc' }
            },
            tags: {
                include: { tag: true }
            }
        },
        orderBy: [
            { completed: 'asc' },
            { priority: 'asc' },
            { dueDate: 'asc' },
            { createdAt: 'desc' }
        ]
    })

    // Transform tags to flat array
    const transformed = todos.map(todo => ({
        ...todo,
        tags: todo.tags.map(t => t.tag),
        subtasks: todo.subtasks.map(sub => ({
            ...sub,
            tags: sub.tags.map(t => t.tag)
        }))
    }))

    return NextResponse.json(transformed)
}

// CREATE a new todo
export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await request.json()

    const todo = await prisma.todo.create({
        data: {
            userId: userId, // Link to User
            text: body.text,
            description: body.description,
            completed: body.completed ?? false,
            completedAt: body.completed ? new Date() : null,
            dueDate: body.dueDate,
            dueTime: body.dueTime,
            priority: body.priority ?? 4,
            subjectId: body.subjectId,
            parentId: body.parentId, // For subtasks
        },
        include: {
            subtasks: true,
            tags: { include: { tag: true } }
        }
    })

    // Add tags if provided, otherwise AUTO-TAG with AI
    if (body.tagIds && body.tagIds.length > 0) {
        await Promise.all(
            body.tagIds.map((tagId: string) =>
                prisma.todoTag.create({
                    data: { todoId: todo.id, tagId }
                })
            )
        )
    } else if (body.text.length > 5) {
        try {
            const groq = await getGroqClient(userId)
            if (groq) {
                // 1. Get existing tags for context (USER specific)
                const existingTags = await prisma.tag.findMany({
                    where: { userId },
                    select: { name: true }
                })
                const tagNames = existingTags.map(t => t.name).join(', ')

                // 2. Ask AI
                const completion = await groq.chat.completions.create({
                    messages: [{
                        role: 'user',
                        content: `
                        Task: "${body.text}"
                        Description: "${body.description || ''}"
                        Existing Tags: [${tagNames}]
                        
                        Classify this task into 1 or 2 tags.
                        - Prefer using Existing Tags if they fit perfectly.
                        - If no existing tag fits, create a NEW short, single-word tag.
                        - For NEW tags, suggest a valid hex color code.
                        - JSON ONLY.
                        
                        Output format:
                        { "tags": [{ "name": "tagname", "isNew": boolean, "color": "#hex" }] }
                        `
                    }],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.3,
                    response_format: { type: 'json_object' }
                })

                const aiContent = completion.choices[0]?.message?.content
                if (aiContent) {
                    const result = JSON.parse(aiContent)

                    // 3. Process Tags
                    for (const tag of result.tags || []) {
                        const tagName = tag.name.toLowerCase().trim()

                        // Upsert tag (find or create) for USER
                        let tagRecord = await prisma.tag.findUnique({
                            where: { userId_name: { userId, name: tagName } } // Composite unique
                        })

                        if (!tagRecord) {
                            tagRecord = await prisma.tag.create({
                                data: {
                                    userId,
                                    name: tagName,
                                    color: tag.color || '#6366f1'
                                }
                            })
                        }

                        // Link to Todo
                        await prisma.todoTag.create({
                            data: { todoId: todo.id, tagId: tagRecord.id }
                        })
                    }
                }
            }
        } catch (error) {
            console.error("Auto-tagging failed:", error)
        }
    }

    // Fetch updated todo with tags
    const updatedTodo = await prisma.todo.findUnique({
        where: { id: todo.id },
        include: {
            subtasks: true,
            tags: { include: { tag: true } }
        }
    })

    return NextResponse.json({
        ...updatedTodo,
        tags: updatedTodo?.tags.map(t => t.tag) || []
    })
}

// UPDATE a todo
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id

    const body = await request.json()

    if (!body.id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    // Ensure todo belongs to user
    const existingTodo = await prisma.todo.findFirst({
        where: { id: body.id, userId }
    })

    if (!existingTodo) {
        return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    let completionUpdate = {}
    if (body.completed !== undefined && body.completed !== existingTodo.completed) {
        completionUpdate = {
            completedAt: body.completed ? new Date() : null
        }
    }

    const todo = await prisma.todo.update({
        where: { id: body.id },
        data: {
            text: body.text,
            description: body.description,
            completed: body.completed,
            ...completionUpdate,
            dueDate: body.dueDate,
            dueTime: body.dueTime,
            priority: body.priority,
            subjectId: body.subjectId,
            parentId: body.parentId,
        }
    })

    // Update tags if provided
    if (body.tagIds !== undefined) {
        await prisma.todoTag.deleteMany({
            where: { todoId: body.id }
        })

        if (body.tagIds.length > 0) {
            await Promise.all(
                body.tagIds.map((tagId: string) =>
                    prisma.todoTag.create({
                        data: { todoId: body.id, tagId }
                    })
                )
            )
        }
    }

    // Fetch updated todo
    const updatedTodo = await prisma.todo.findUnique({
        where: { id: body.id },
        include: {
            subtasks: { include: { tags: { include: { tag: true } } } },
            tags: { include: { tag: true } }
        }
    })

    return NextResponse.json({
        ...updatedTodo,
        tags: updatedTodo?.tags.map(t => t.tag) || [],
        subtasks: updatedTodo?.subtasks.map(sub => ({
            ...sub,
            tags: sub.tags.map(t => t.tag)
        })) || []
    })
}

// DELETE a todo
export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    // Ensure ownership before delete
    const existing = await prisma.todo.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: "Not Found" }, { status: 404 })

    try {
        await prisma.todo.delete({
            where: { id }
        })
    } catch (error: any) {
        if (error.code !== 'P2025') {
            throw error
        }
    }

    return NextResponse.json({ success: true })
}
