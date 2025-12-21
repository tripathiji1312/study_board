import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // Delete the user and all cascade relations
        await prisma.user.delete({
            where: {
                id: session.user.id
            }
        })

        return NextResponse.json({ success: true, message: "Account deleted successfully" })
    } catch (error) {
        console.error("Delete Account Error:", error)
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
    }
}
