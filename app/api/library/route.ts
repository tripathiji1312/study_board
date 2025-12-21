import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const books = await prisma.book.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: 'desc' }
        })
        return NextResponse.json(books)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const body = await req.json()
        const book = await prisma.book.create({
            data: {
                userId: session.user.id,
                title: body.title,
                author: body.author,
                status: body.status || "toread",
                total: Number(body.total) || 100,
                progress: Number(body.progress) || 0,
                dueDate: body.dueDate ? new Date(body.dueDate) : null
            }
        })
        return NextResponse.json(book)
    } catch (error) {
        return NextResponse.json({ error: "Failed to create book" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const body = await req.json()
        if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        // Verify ownership
        const existing = await prisma.book.findFirst({
            where: { id: body.id, userId: session.user.id }
        })
        if (!existing) return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 })

        const book = await prisma.book.update({
            where: { id: body.id, userId: session.user.id },
            data: {
                title: body.title,
                author: body.author,
                status: body.status,
                progress: Number(body.progress),
                total: Number(body.total),
                dueDate: body.dueDate ? new Date(body.dueDate) : null
            }
        })
        return NextResponse.json(book)
    } catch (error) {
        return NextResponse.json({ error: "Failed to update book" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        // Verify ownership
        const existing = await prisma.book.findFirst({
            where: { id, userId: session.user.id }
        })
        if (!existing) return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 })

        await prisma.book.delete({ where: { id, userId: session.user.id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete book" }, { status: 500 })
    }
}
