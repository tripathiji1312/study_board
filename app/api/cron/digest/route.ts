import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import DailyDigestEmail from '@/emails/DailyDigestEmail'
import prisma from '@/lib/prisma'
import { startOfDay, endOfDay, addDays } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: Request) {
    // Basic authorization using a secret query param to prevent unauthorized triggers
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // 1. Fetch users who have notifications enabled
        const settings = await prisma.userSettings.findMany({
            where: { emailNotifications: true, notificationEmail: { not: null } }
        })

        const today = new Date()
        const tomorrow = addDays(today, 1)

        const results = []

        for (const setting of settings) {
            if (!setting.notificationEmail) continue

            // 2. Fetch User Data
            // Note: In a real app with Auth, we would filter by userId. 
            // Here assuming single user or shared DB for simplicity as per existing schema lacking userId on Assignment/Todo?
            // Actually schema `Todo` etc have no userId? Prisma schema shows NO userId on Todo/Assignment.
            // This suggests it's a single-user Personal Dashboard or strict silo.
            // I will assume global data for the "user" (Personal usage).

            const todos = await prisma.todo.findMany({
                where: {
                    completed: false,
                    OR: [
                        { dueDate: { equals: today.toISOString().split('T')[0] } }, // "YYYY-MM-DD"
                        { dueDate: { equals: null } } // Inbox
                    ]
                }
            })

            const assignments = await prisma.assignment.findMany({
                where: {
                    status: { not: 'Completed' },
                    due: { lte: tomorrow.toISOString().split('T')[0] } // Due by tomorrow
                }
            })

            const exams = await prisma.exam.findMany({
                where: {
                    date: {
                        gte: startOfDay(today),
                        lte: addDays(today, 7) // Next 7 days
                    }
                }
            })

            const stats = {
                completedToday: 0, // Placeholder
                pendingTotal: todos.length
            }

            // 3. Send Email
            const { data, error } = await resend.emails.send({
                from: 'Study Board <digest@resend.dev>', // Update domain
                to: [setting.notificationEmail],
                subject: `Your Daily Briefing for ${today.toLocaleDateString()}`,
                react: DailyDigestEmail({
                    userName: setting.displayName,
                    overdue: [],
                    dueToday: assignments.filter(a => a.due === today.toISOString().split('T')[0]),
                    dueTomorrow: assignments.filter(a => a.due === tomorrow.toISOString().split('T')[0]),
                    dueThisWeek: assignments.filter(a => a.due > tomorrow.toISOString().split('T')[0]),
                    upcomingExams: exams as any,
                    pendingTodos: todos as any,
                    stats
                })
            })

            if (error) {
                console.error("Email failed:", error)
                results.push({ email: setting.notificationEmail, status: 'failed' })
            } else {
                results.push({ email: setting.notificationEmail, status: 'sent', id: data?.id })
            }
        }

        return NextResponse.json({ success: true, results })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
