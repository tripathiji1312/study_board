import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const ideas = await prisma.idea.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(ideas)
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const body = await req.json()
        const idea = await prisma.idea.create({
            data: {
                userId: session.user.id,
                content: body.content,
                status: body.status || "brainstorm"
            }
        })
        return NextResponse.json(idea)
    } catch (e) {
        return NextResponse.json({ error: "Failed to create idea" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const body = await req.json()
        if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        // Verify ownership
        const existing = await prisma.idea.findFirst({
            where: { id: body.id, userId: session.user.id }
        })
        if (!existing) return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 })

        const idea = await prisma.idea.update({
            where: { id: body.id, userId: session.user.id },
            data: {
                content: body.content,
                status: body.status
            }
        })
        return NextResponse.json(idea)
    } catch (e) {
        return NextResponse.json({ error: "Failed to update idea" }, { status: 500 })
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
        const existing = await prisma.idea.findFirst({
            where: { id, userId: session.user.id }
        })
        if (!existing) return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 })

        await prisma.idea.delete({ where: { id, userId: session.user.id } })
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete idea" }, { status: 500 })
    }
}
