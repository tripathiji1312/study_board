import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import prisma from '@/lib/prisma'
import { differenceInDays, parseISO, format, isBefore, startOfDay, addDays, endOfDay } from 'date-fns'
import { render } from '@react-email/components'
import { DailyDigestEmail } from '@/emails/DailyDigestEmail'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Store sent notifications in memory to avoid spamming 
// (In production, use a Database table "NotificationLogs")
const sentNotifications = new Map<string, Date>()

// Clean old entries every hour (simple cleanup)
function cleanupOldNotifications() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    for (const [key, date] of sentNotifications.entries()) {
        if (isBefore(date, oneDayAgo)) {
            sentNotifications.delete(key)
        }
    }
}

interface AssignmentWithDays {
    id: number
    title: string
    subject: string
    due: string
    priority: string
    platform?: string | null
    daysUntil: number
}

interface ExamWithDays {
    id: number
    title: string
    date: string
    room?: string | null
    seat?: string | null
    daysUntil: number
}


export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id

    try {
        const body = await req.json()
        const email = body.email || session.user.email
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

        cleanupOldNotifications()
        const today = startOfDay(new Date())
        const endOfWeek = endOfDay(addDays(today, 7))

        // Fetch user settings for personalization and API keys
        const settings = await prisma.userSettings.findUnique({
            where: { userId }
        })
        const userName = settings?.displayName || undefined
        const resendApiKey = settings?.resendApiKey || process.env.RESEND_API_KEY

        const userResend = resendApiKey ? new Resend(resendApiKey) : null
        if (!userResend) {
            return NextResponse.json({ error: 'Email service not configured. Please add Resend API Key in Settings.' }, { status: 400 })
        }

        // ============ FETCH USER DATA ============

        // Assignments
        const assignments = await prisma.assignment.findMany({
            where: { userId, status: { not: 'Completed' } }
        })

        // Exams within next 7 days
        const exams = await prisma.exam.findMany({
            where: {
                userId,
                date: {
                    gte: today,
                    lte: endOfWeek
                }
            }
        })

        // Todos (incomplete, with due dates)
        const todos = await prisma.todo.findMany({
            where: { userId, completed: false }
        })

        // Get completed todos today for stats
        const completedToday = await prisma.todo.count({
            where: {
                userId,
                completed: true,
                updatedAt: {
                    gte: today
                }
            }
        })

        // ============ CATEGORIZE ASSIGNMENTS ============
        const overdue: AssignmentWithDays[] = []
        const dueToday: AssignmentWithDays[] = []
        const dueTomorrow: AssignmentWithDays[] = []
        const dueThisWeek: AssignmentWithDays[] = []

        assignments.forEach(a => {
            try {
                const dueDate = parseISO(a.due)
                const days = differenceInDays(dueDate, today)

                // User-scoped notification key
                const key = `assign_${userId}_${a.id}_${format(today, 'yyyy-MM-dd')}`
                if (sentNotifications.has(key)) return // Skip if already sent today

                const item: AssignmentWithDays = {
                    id: a.id,
                    title: a.title,
                    subject: a.subject,
                    due: format(dueDate, 'MMM d'),
                    priority: a.priority,
                    platform: a.platform,
                    daysUntil: days
                }

                if (days < 0) {
                    overdue.push(item)
                    sentNotifications.set(key, new Date())
                } else if (days === 0) {
                    dueToday.push(item)
                    sentNotifications.set(key, new Date())
                } else if (days === 1) {
                    dueTomorrow.push(item)
                    sentNotifications.set(key, new Date())
                } else if (days <= 7) {
                    dueThisWeek.push(item)
                }
            } catch (e) {
                console.error('Error parsing assignment date:', e)
            }
        })

        // ============ CATEGORIZE EXAMS ============
        const upcomingExams: ExamWithDays[] = exams.map(exam => {
            const examDate = new Date(exam.date)
            const days = differenceInDays(examDate, today)
            return {
                id: exam.id,
                title: exam.title,
                date: format(examDate, 'MMM d, yyyy'),
                room: exam.room,
                seat: exam.seat,
                daysUntil: days
            }
        }).sort((a, b) => a.daysUntil - b.daysUntil)

        // Mark exam notifications as sent
        upcomingExams.forEach(exam => {
            if (exam.daysUntil <= 3) {
                const key = `exam_${userId}_${exam.id}_${format(today, 'yyyy-MM-dd')}`
                if (!sentNotifications.has(key)) {
                    sentNotifications.set(key, new Date())
                }
            }
        })

        // ============ CATEGORIZE TODOS ============
        const pendingTodos = todos.map(t => ({
            id: t.id,
            text: t.text,
            dueDate: t.dueDate ? format(parseISO(t.dueDate), 'MMM d') : undefined
        }))

        // ============ CHECK IF WE HAVE ANYTHING TO SEND ============
        const urgentCount = overdue.length + dueToday.length
        const totalCount = urgentCount + dueTomorrow.length + dueThisWeek.length + upcomingExams.length

        if (totalCount === 0 && pendingTodos.length === 0) {
            return NextResponse.json({ message: 'No new notifications' })
        }

        // ============ GENERATE EMAIL ============
        const emailHtml = await render(
            DailyDigestEmail({
                userName,
                overdue,
                dueToday,
                dueTomorrow,
                dueThisWeek,
                upcomingExams,
                pendingTodos,
                stats: {
                    completedToday,
                    pendingTotal: assignments.length + todos.length
                }
            })
        )

        // Generate smart subject line
        let subject = ''
        if (overdue.length > 0) {
            subject = `🚨 ${overdue.length} OVERDUE + ${dueToday.length} Due Today!`
        } else if (dueToday.length > 0) {
            subject = `⚡ ${dueToday.length} item${dueToday.length > 1 ? 's' : ''} due TODAY!`
        } else if (dueTomorrow.length > 0) {
            subject = `🟠 ${dueTomorrow.length} item${dueTomorrow.length > 1 ? 's' : ''} due tomorrow`
        } else if (upcomingExams.length > 0) {
            const nearestExam = upcomingExams[0]
            subject = `📚 Exam Alert: ${nearestExam.title} in ${nearestExam.daysUntil} days`
        } else {
            subject = `📋 Your Study Board Daily Digest`
        }

        // ============ SEND EMAIL ============
        const { data, error } = await userResend.emails.send({
            from: 'Study Board <onboarding@resend.dev>',
            to: [email],
            subject,
            html: emailHtml,
        })

        if (error) {
            console.error('Resend error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            message: 'Email sent',
            id: data?.id,
            summary: {
                overdue: overdue.length,
                dueToday: dueToday.length,
                dueTomorrow: dueTomorrow.length,
                dueThisWeek: dueThisWeek.length,
                exams: upcomingExams.length,
                todos: pendingTodos.length
            }
        })

    } catch (error) {
        console.error('Notification check error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
