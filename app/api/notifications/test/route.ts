import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import prisma from '@/lib/prisma'
import { render } from '@react-email/components'
import { TestEmail } from '@/emails/TestEmail'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { email } = await req.json()
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

        // Get authenticated user settings
        const settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id }
        })

        if (!settings) {
            return NextResponse.json({ error: 'User settings not found' }, { status: 404 })
        }

        // Determine which Resend key to use: User's BYOK preferred
        const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'Email service not configured (No API Key)' }, { status: 503 })
        }

        const resendInstance = new Resend(apiKey)
        const userName = settings.displayName || undefined

        // Render the beautiful test email
        const emailHtml = await render(
            TestEmail({ userName })
        )

        const { data, error } = await resendInstance.emails.send({
            from: 'Study Board <onboarding@resend.dev>',
            to: [email],
            subject: '🧪 Study Board Notifications Active!',
            html: emailHtml,
        })

        if (error) {
            console.error('Resend error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            message: 'Test email sent successfully!',
            id: data?.id,
            usedUserKey: !!settings.resendApiKey
        })

    } catch (error) {
        console.error('Test email error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
