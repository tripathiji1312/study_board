import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { PrismaClient } from '@prisma/client'
import { differenceInDays, parseISO } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)
const prisma = new PrismaClient()

// Store sent notifications in memory to avoid spamming 
// (In production, use a Database table "NotificationLogs")
let sentNotifications = new Set<string>()

export async function POST(req: Request) {
    try {
        const { email } = await req.json()
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

        const assignments = await prisma.assignment.findMany({
            where: { status: { not: 'Completed' } }
        })

        const todos = await prisma.todo.findMany({
            where: { completed: false }
        })

        const duelingItems: string[] = []
        const today = new Date()

        // Check Assignments
        assignments.forEach(a => {
            try {
                const days = differenceInDays(parseISO(a.due), today)
                if (days >= 0 && days <= 1) { // Due Today or Tomorrow
                    const key = `assign_${a.id}_${today.toDateString()}`
                    if (!sentNotifications.has(key)) {
                        duelingItems.push(`Assignment: ${a.title} (Due ${days === 0 ? 'Today' : 'Tomorrow'})`)
                        sentNotifications.add(key)
                    }
                }
            } catch (e) { }
        })

        // Check Todos (if they have due dates - assuming todos might not have due dates in our current schema, skipping)

        if (duelingItems.length === 0) {
            return NextResponse.json({ message: 'No new notifications' })
        }

        // Send Email
        const { data, error } = await resend.emails.send({
            from: 'Study Board <onboarding@resend.dev>', // Default Resend test domain
            to: [email],
            subject: `🚨 ${duelingItems.length} Items Due Soon!`,
            html: `
        <h1>Study Board Reminder</h1>
        <p>You have the following items due soon:</p>
        <ul>
          ${duelingItems.map(item => `<li><strong>${item}</strong></li>`).join('')}
        </ul>
        <p>Go crush it! 🚀</p>
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
