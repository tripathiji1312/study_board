import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import DailyDigestEmail from '@/emails/DailyDigestEmail'
import prisma from '@/lib/prisma'
import { startOfDay, endOfDay, addDays, differenceInHours, differenceInDays, parseISO, format } from 'date-fns'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')
    const emailType = searchParams.get('type') || 'morning'

    const expectedSecret = process.env.CRON_SECRET || 'studyboard_cron_secret_2024'
    if (secret !== expectedSecret && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const settings = await prisma.userSettings.findMany({
            where: { emailNotifications: true, notificationEmail: { not: null } }
        })

        const now = new Date()
        const today = startOfDay(now)
        const tomorrow = addDays(today, 1)
        const todayStr = format(today, 'yyyy-MM-dd')
        const tomorrowStr = format(tomorrow, 'yyyy-MM-dd')

        const results = []

        for (const setting of settings) {
            if (!setting.notificationEmail) continue

            // Fetch all incomplete assignments
            const assignments = await prisma.assignment.findMany({
                where: { status: { not: 'Completed' } }
            })

            // Fetch incomplete todos with due dates
            const todos = await prisma.todo.findMany({
                where: { completed: false }
            })

            // Fetch upcoming exams
            const exams = await prisma.exam.findMany({
                where: {
                    date: { gte: today, lte: addDays(today, 7) }
                }
            })

            // Categorize by urgency
            const overdue: any[] = []
            const dueTodayUrgent: any[] = []  // Due in < 6 hours
            const dueToday: any[] = []
            const dueTomorrow: any[] = []
            const dueThisWeek: any[] = []

            assignments.forEach(a => {
                try {
                    const dueDate = parseISO(a.due)
                    const hoursLeft = differenceInHours(dueDate, now)
                    const daysLeft = differenceInDays(dueDate, today)

                    if (daysLeft < 0) {
                        overdue.push({ ...a, hoursOverdue: Math.abs(hoursLeft) })
                    } else if (a.due === todayStr) {
                        if (hoursLeft <= 6) {
                            dueTodayUrgent.push({ ...a, hoursLeft })
                        } else {
                            dueToday.push(a)
                        }
                    } else if (a.due === tomorrowStr) {
                        dueTomorrow.push(a)
                    } else if (daysLeft <= 7) {
                        dueThisWeek.push(a)
                    }
                } catch { }
            })

            // Categorize todos
            const pendingTodos = todos.filter(t => {
                if (!t.dueDate) return false
                return t.dueDate === todayStr || t.dueDate < todayStr
            }).map(t => ({ id: t.id, text: t.text, dueDate: t.dueDate }))

            // Categorize exams
            const upcomingExams = exams.map(e => {
                const examDate = new Date(e.date)
                const daysLeft = differenceInDays(examDate, today)
                return {
                    ...e,
                    daysUntil: daysLeft,
                    date: format(examDate, 'MMM d, yyyy')
                }
            }).sort((a, b) => a.daysUntil - b.daysUntil)

            // Determine if we should send based on urgency and time of day
            const hasUrgent = overdue.length > 0 || dueTodayUrgent.length > 0
            const hasCriticalExam = upcomingExams.some(e => e.daysUntil <= 1)
            const totalItems = overdue.length + dueTodayUrgent.length + dueToday.length + dueTomorrow.length + pendingTodos.length

            console.log(`[Cron Debug] User: ${setting.notificationEmail}, Type: ${emailType}`)
            console.log(`[Cron Debug] Stats: Overdue=${overdue.length}, Urgent=${dueTodayUrgent.length}, Today=${dueToday.length}, Tomorrow=${dueTomorrow.length}, Exams=${upcomingExams.length}`)

            // Smart sending logic based on time of day
            let shouldSend = false
            let subjectLine = ''
            let urgencyEmoji = ''

            if (emailType === 'morning') {
                // Always send morning briefing if there's anything
                shouldSend = totalItems > 0 || upcomingExams.length > 0
                if (overdue.length > 0) {
                    urgencyEmoji = '🚨'
                    subjectLine = `${overdue.length} OVERDUE! Morning Briefing`
                } else if (hasCriticalExam) {
                    urgencyEmoji = '📚'
                    subjectLine = `EXAM ${upcomingExams[0].daysUntil === 0 ? 'TODAY' : 'TOMORROW'}! Get ready`
                } else if (dueToday.length > 0 || dueTodayUrgent.length > 0) {
                    urgencyEmoji = '⏰'
                    subjectLine = `${dueToday.length + dueTodayUrgent.length} item(s) due today`
                } else {
                    urgencyEmoji = '☀️'
                    subjectLine = `Your day ahead - ${totalItems} pending items`
                }
            } else if (emailType === 'midday') {
                // Midday: only send if urgent items exist
                shouldSend = overdue.length > 0 || dueTodayUrgent.length > 0 || hasCriticalExam
                if (overdue.length > 0) {
                    urgencyEmoji = '🚨'
                    subjectLine = `STILL OVERDUE: ${overdue.length} item(s) need attention NOW`
                } else if (dueTodayUrgent.length > 0) {
                    urgencyEmoji = '⚠️'
                    subjectLine = `${dueTodayUrgent.length} item(s) due in a few hours!`
                } else if (hasCriticalExam) {
                    urgencyEmoji = '📖'
                    subjectLine = `Exam reminder: ${upcomingExams[0].title}`
                }
            } else if (emailType === 'afternoon') {
                // Afternoon check-in
                shouldSend = overdue.length > 0 || dueTodayUrgent.length > 0 || dueToday.length > 0
                if (overdue.length > 0) {
                    urgencyEmoji = '🔴'
                    subjectLine = `Action needed: ${overdue.length} overdue, ${dueToday.length + dueTodayUrgent.length} due today`
                } else if (dueTodayUrgent.length > 0) {
                    urgencyEmoji = '🟠'
                    subjectLine = `Hours left! ${dueTodayUrgent.length} item(s) need your attention`
                } else if (dueToday.length > 0) {
                    urgencyEmoji = '🟡'
                    subjectLine = `Afternoon check: ${dueToday.length} still due today`
                }
            } else if (emailType === 'evening') {
                // Evening: URGENT check for items due tonight + prep for tomorrow
                const dueTonight = dueTodayUrgent.length + dueToday.length
                shouldSend = overdue.length > 0 || dueTonight > 0 || dueTomorrow.length > 0

                if (overdue.length > 0 && dueTonight > 0) {
                    urgencyEmoji = '🚨'
                    subjectLine = `CRITICAL: ${overdue.length} overdue + ${dueTonight} due TONIGHT!`
                } else if (dueTonight > 0) {
                    urgencyEmoji = '⏰'
                    subjectLine = `${dueTonight} task(s) due TONIGHT - finish them now!`
                } else if (overdue.length > 0) {
                    urgencyEmoji = '🔴'
                    subjectLine = `${overdue.length} overdue item(s) need attention!`
                } else if (dueTomorrow.length > 0) {
                    urgencyEmoji = '📋'
                    subjectLine = `Heads up: ${dueTomorrow.length} item(s) due tomorrow`
                }
            } else if (emailType === 'night') {
                // Night: only critical/overdue
                shouldSend = overdue.length > 0 || dueTodayUrgent.length > 0
                if (overdue.length > 0 || dueTodayUrgent.length > 0) {
                    urgencyEmoji = '🚨'
                    subjectLine = `URGENT: ${overdue.length + dueTodayUrgent.length} item(s) still incomplete!`
                }
            }

            console.log(`[Cron Debug] Should Send: ${shouldSend}, Subject: ${subjectLine}`)

            if (!shouldSend) {
                console.log(`[Cron Debug] Skipping email - not enough urgency`)
                results.push({ email: setting.notificationEmail, status: 'skipped_no_urgent' })
                continue
            }

            if (!resend) {
                console.error(`[Cron Debug] FATAL: Resend client not initialized. Check RESEND_API_KEY.`)
                results.push({ email: setting.notificationEmail, status: 'skipped_no_key' })
                continue
            }

            console.log(`[Cron Debug] Attempting to send email via Resend...`)
            const { data, error } = await resend.emails.send({
                from: 'Study Board <onboarding@resend.dev>',
                to: [setting.notificationEmail],
                subject: `${urgencyEmoji} ${subjectLine}`,
                react: DailyDigestEmail({
                    userName: setting.displayName,
                    overdue: overdue.map(a => ({ ...a, due: format(parseISO(a.due), 'MMM d') })),
                    dueToday: [...dueTodayUrgent, ...dueToday].map(a => ({ ...a, due: 'Today' })),
                    dueTomorrow: dueTomorrow.map(a => ({ ...a, due: 'Tomorrow' })),
                    dueThisWeek: dueThisWeek.map(a => ({ ...a, due: format(parseISO(a.due), 'MMM d') })),
                    upcomingExams: upcomingExams as any,
                    pendingTodos: pendingTodos as any,
                    stats: {
                        completedToday: 0,
                        pendingTotal: totalItems
                    }
                })
            })

            if (error) {
                console.error("Email failed:", error)
                results.push({ email: setting.notificationEmail, status: 'failed', error: error.message })
            } else {
                console.log(`[Cron Debug] Email sent successfully! ID: ${data?.id}`)
                results.push({ email: setting.notificationEmail, status: 'sent', id: data?.id, type: emailType })
            }
        }

        return NextResponse.json({ success: true, results, type: emailType })
    } catch (error: any) {
        console.error("Cron Job Error:", error)
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
