import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { addDays, format, startOfToday } from 'date-fns'
import Groq from 'groq-sdk'

export async function POST(req: Request) {
    try {
        const { strategy } = await req.json()

        const today = startOfToday()
        const todayStr = format(today, 'yyyy-MM-dd')

        const overdueTasks = await prisma.todo.findMany({
            where: {
                completed: false,
                dueDate: {
                    lt: todayStr
                }
            },
            include: {
                tags: true
            }
        })

        if (overdueTasks.length === 0) {
            return NextResponse.json({ message: "No overdue tasks found", count: 0 })
        }

        let updateCount = 0
        const tomorrow = addDays(today, 1)
        const tomorrowStr = format(tomorrow, 'yyyy-MM-dd')

        if (strategy === 'tomorrow') {
            const res = await prisma.todo.updateMany({
                where: { id: { in: overdueTasks.map(t => t.id) } },
                data: { dueDate: tomorrowStr }
            })
            updateCount = res.count

        } else if (strategy === 'spread') {
            const updates = overdueTasks.map((task, index) => {
                const daysToAdd = 1 + (index % 3)
                const newDate = format(addDays(today, daysToAdd), 'yyyy-MM-dd')
                return prisma.todo.update({
                    where: { id: task.id },
                    data: { dueDate: newDate }
                })
            })
            await prisma.$transaction(updates)
            updateCount = updates.length

        } else if (strategy === 'ruthless') {
            const highPriorityIds = overdueTasks.filter(t => t.priority <= 2).map(t => t.id)
            const lowPriorityIds = overdueTasks.filter(t => t.priority > 2).map(t => t.id)

            if (highPriorityIds.length > 0) {
                await prisma.todo.updateMany({
                    where: { id: { in: highPriorityIds } },
                    data: { dueDate: todayStr }
                })
            }
            // Move low priority to +7 days instead of Inbox (so they don't disappear)
            if (lowPriorityIds.length > 0) {
                const nextWeek = format(addDays(today, 7), 'yyyy-MM-dd')
                await prisma.todo.updateMany({
                    where: { id: { in: lowPriorityIds } },
                    data: { dueDate: nextWeek }
                })
            }
            updateCount = overdueTasks.length

        } else if (strategy === 'ai') {
            // AI-powered smart rescheduling
            const taskSummary = overdueTasks.map(t => ({
                id: t.id,
                text: t.text,
                priority: t.priority,
                originalDue: t.dueDate
            }))

            const prompt = `You are a productivity expert. Reschedule these overdue tasks intelligently.

Today is: ${todayStr}

Overdue Tasks:
${taskSummary.map((t, i) => `${i + 1}. "${t.text}" (Priority ${t.priority}, was due ${t.originalDue})`).join('\n')}

Rules:
1. Priority 1-2 tasks should be scheduled within 1-2 days
2. Priority 3-4 tasks can be spread over 3-5 days
3. Max 3 high-priority tasks per day to avoid burnout
4. Consider task complexity based on text length

Return ONLY a valid JSON array with format:
[{"id": "task_id", "newDate": "YYYY-MM-DD"}]

No explanations, just the JSON array.`

            try {
                // Fetch user's API key
                const settings = await prisma.userSettings.findFirst()
                const apiKey = settings?.groqApiKey || process.env.GROQ_API_KEY

                if (!apiKey) {
                    // Fallback to spread strategy
                    const updates = overdueTasks.map((task, index) => {
                        const daysToAdd = 1 + (index % 4)
                        return prisma.todo.update({
                            where: { id: task.id },
                            data: { dueDate: format(addDays(today, daysToAdd), 'yyyy-MM-dd') }
                        })
                    })
                    await prisma.$transaction(updates)
                    updateCount = updates.length
                    return NextResponse.json({ success: true, count: updateCount, strategy: 'spread (no API key)' })
                }

                const groq = new Groq({ apiKey })

                const completion = await groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.3,
                    response_format: { type: 'json_object' }
                })

                const content = completion.choices[0]?.message?.content || '[]'
                let schedule: { id: string; newDate: string }[] = []

                try {
                    const parsed = JSON.parse(content)
                    schedule = Array.isArray(parsed) ? parsed : parsed.tasks || parsed.schedule || []
                } catch {
                    // Fallback to spread if AI fails
                    schedule = overdueTasks.map((task, index) => ({
                        id: task.id,
                        newDate: format(addDays(today, 1 + (index % 4)), 'yyyy-MM-dd')
                    }))
                }

                // Apply AI recommendations
                const updates = schedule.map(item =>
                    prisma.todo.update({
                        where: { id: item.id },
                        data: { dueDate: item.newDate }
                    })
                )
                await prisma.$transaction(updates)
                updateCount = updates.length
            } catch (aiError) {
                // Fallback to spread strategy
                const updates = overdueTasks.map((task, index) => {
                    const daysToAdd = 1 + (index % 4)
                    return prisma.todo.update({
                        where: { id: task.id },
                        data: { dueDate: format(addDays(today, daysToAdd), 'yyyy-MM-dd') }
                    })
                })
                await prisma.$transaction(updates)
                updateCount = updates.length
            }
        }

        return NextResponse.json({ success: true, count: updateCount, strategy })

    } catch (error) {
        console.error("Reschedule Error:", error)
        return NextResponse.json({ error: "Failed to reschedule" }, { status: 500 })
    }
}
