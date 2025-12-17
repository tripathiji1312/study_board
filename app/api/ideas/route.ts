import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        const ideas = await prisma.idea.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(ideas)
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const idea = await prisma.idea.create({
            data: {
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
    try {
        const body = await req.json()
        const idea = await prisma.idea.update({
            where: { id: body.id },
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
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        await prisma.idea.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete idea" }, { status: 500 })
    }
}
