import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        const books = await prisma.book.findMany({
            orderBy: { updatedAt: 'desc' }
        })
        return NextResponse.json(books)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const book = await prisma.book.create({
            data: {
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
    try {
        const body = await req.json()
        const book = await prisma.book.update({
            where: { id: body.id },
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
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        await prisma.book.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete book" }, { status: 500 })
    }
}
