import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const snippets = await prisma.snippet.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(snippets)
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch snippets" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const body = await req.json()
        const snippet = await prisma.snippet.create({
            data: {
                userId: session.user.id,
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
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        // Verify ownership
        const existing = await prisma.snippet.findFirst({
            where: { id, userId: session.user.id }
        })
        if (!existing) return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 })

        await prisma.snippet.delete({ where: { id, userId: session.user.id } })
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete snippet" }, { status: 500 })
    }
}
