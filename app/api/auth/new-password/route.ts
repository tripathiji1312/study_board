import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json()

        if (!token || !password) {
            return NextResponse.json({ error: "Missing token or password" }, { status: 400 })
        }

        // Validate Token in Prisma
        // Note: VerificationToken primary key is usually identifier_token composite. 
        // We need to find by token. Prisma doesn't have a direct findUnique by token alone unless configured.
        // Let's check schema: @@unique([identifier, token]) and token @unique.

        const existingToken = await prisma.verificationToken.findUnique({
            where: { token }
        })

        if (!existingToken) {
            return NextResponse.json({ error: "Invalid token" }, { status: 400 })
        }

        const hasExpired = new Date() > existingToken.expires
        if (hasExpired) {
            await prisma.verificationToken.delete({ where: { token } })
            return NextResponse.json({ error: "Token has expired" }, { status: 400 })
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: existingToken.identifier }
        })

        if (!existingUser) {
            return NextResponse.json({ error: "User does not exist" }, { status: 400 })
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Update User
        await prisma.user.update({
            where: { id: existingUser.id },
            data: { password: hashedPassword }
        })

        // Delete Token
        await prisma.verificationToken.delete({
            where: { token }
        })

        return NextResponse.json({ message: "Password updated successfully" })

    } catch (error) {
        console.error("New Password Error:", error)
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
    }
}
