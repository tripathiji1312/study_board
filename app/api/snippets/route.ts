import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        const snippets = await prisma.snippet.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(snippets)
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch snippets" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const snippet = await prisma.snippet.create({
            data: {
                title: body.title,
                content: body.content,
                type: body.type || 'text',
                language: body.language || 'text'
            }
        })
        return NextResponse.json(snippet)
    } catch (e) {
        return NextResponse.json({ error: "Failed to create snippet" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        await prisma.snippet.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete snippet" }, { status: 500 })
    }
}
