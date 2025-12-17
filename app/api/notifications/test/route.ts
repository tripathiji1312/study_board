import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
    try {
        const { email } = await req.json()
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

        const { data, error } = await resend.emails.send({
            from: 'Study Board <onboarding@resend.dev>',
            to: [email],
            subject: '🧪 Study Board Test Email',
            html: `
        <h1>It Works! 🎉</h1>
        <p>This is a test email from your Study Board app.</p>
        <p>You will receive notifications here for:</p>
        <ul>
          <li>Assignments due in 24 hours</li>
          <li>Important tasks</li>
        </ul>
      `,
        })

        if (error) {
            console.error('Resend error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ message: 'Email sent', id: data?.id })

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
