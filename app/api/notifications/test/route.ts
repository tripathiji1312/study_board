import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { PrismaClient } from '@prisma/client'
import { render } from '@react-email/components'
import { TestEmail } from '@/emails/TestEmail'

const resend = new Resend(process.env.RESEND_API_KEY)
const prisma = new PrismaClient()

export async function POST(req: Request) {
    try {
        const { email } = await req.json()
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

        // Get user settings for personalization
        const settings = await prisma.userSettings.findFirst()
        const userName = settings?.displayName || undefined

        // Render the beautiful test email
        const emailHtml = await render(
            TestEmail({ userName })
        )

        const { data, error } = await resend.emails.send({
            from: 'Study Board <onboarding@resend.dev>',
            to: [email],
            subject: '🧪 Study Board Notifications Active!',
            html: emailHtml,
        })

        if (error) {
            console.error('Resend error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ message: 'Test email sent successfully!', id: data?.id })

    } catch (error) {
        console.error('Test email error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
