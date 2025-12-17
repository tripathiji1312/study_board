import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    const todos = await prisma.todo.findMany({
        orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(todos)
}

export async function POST(request: Request) {
    const body = await request.json()
    const todo = await prisma.todo.create({
        data: {
            text: body.text,
            completed: body.completed || false,
            category: body.category || "today",
            dueDate: body.dueDate,
            subjectId: body.subjectId
        }
    })
    return NextResponse.json(todo)
}

export async function PUT(request: Request) {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const todo = await prisma.todo.update({
        where: { id: body.id },
        data: {
            text: body.text,
            completed: body.completed,
            category: body.category,
            dueDate: body.dueDate,
            subjectId: body.subjectId
        }
    })
    return NextResponse.json(todo)
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.todo.delete({
        where: { id }
    })

    return NextResponse.json({ success: true })
}
