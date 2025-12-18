import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET all todos with subtasks and tags
export async function GET(request: Request) {
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

    // Base where clause - only get parent todos (not subtasks)
    let where: any = { parentId: null }

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
        where.OR = [
            { text: { contains: search } },
            { description: { contains: search } },
            { tags: { some: { tag: { name: { contains: search.toLowerCase() } } } } }
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
    const body = await request.json()

    const todo = await prisma.todo.create({
        data: {
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

    // Add tags if provided
    if (body.tagIds && body.tagIds.length > 0) {
        await Promise.all(
            body.tagIds.map((tagId: string) =>
                prisma.todoTag.create({
                    data: { todoId: todo.id, tagId }
                })
            )
        )
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
    const body = await request.json()

    if (!body.id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const existingTodo = await prisma.todo.findUnique({
        where: { id: body.id }
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
        // Remove existing tags
        await prisma.todoTag.deleteMany({
            where: { todoId: body.id }
        })

        // Add new tags
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

    // Fetch updated todo with relations
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    // Cascade delete will handle subtasks and tags
    await prisma.todo.delete({
        where: { id }
    })

    return NextResponse.json({ success: true })
}
