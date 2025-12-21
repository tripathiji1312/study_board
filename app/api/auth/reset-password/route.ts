import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email }
        })

        // Don't reveal if user exists
        if (!user) {
            return NextResponse.json({ message: "If an account exists, a reset link has been sent." })
        }

        // Generate token
        const token = crypto.randomUUID()
        const expires = new Date(new Date().getTime() + 3600 * 1000) // 1 hour

        // Save token
        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires
            }
        })

        const resetLink = `${process.env.NEXTAUTH_URL}/auth/new-password?token=${token}`

        // Send Email
        await resend.emails.send({
            from: "StudyBoard <onboarding@resend.dev>", // Default Resend test email
            to: email,
            subject: "Reset your password",
            html: `
                <p>Click the link below to reset your password:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>This link will expire in 1 hour.</p>
            `
        })

        return NextResponse.json({ message: "If an account exists, a reset link has been sent." })

    } catch (error) {
        console.error("Reset Password Error:", error)
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
    }
}
