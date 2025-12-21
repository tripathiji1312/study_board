import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import Groq from 'groq-sdk'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id

    try {
        const { mood } = await req.json()

        // Fetch user's API key from settings (fallback to env var)
        const settings = await prisma.userSettings.findUnique({
            where: { userId }
        })
        const apiKey = settings?.groqApiKey || process.env.GROQ_API_KEY

        if (!apiKey) {
            return NextResponse.json({
                error: "No API key configured. Add your GROQ API key in Settings."
            }, { status: 400 })
        }

        const groq = new Groq({ apiKey })

        // Fetch pending tasks for THIS user
        const todos = await prisma.todo.findMany({
            where: { userId, completed: false },
            take: 20,
            orderBy: { priority: 'asc' }, // Get high priority first just in case
            select: { id: true, text: true, priority: true, dueDate: true }
        })

        if (todos.length === 0) {
            return NextResponse.json({ recommendations: [] })
        }

        const moodLabels: Record<number, string> = {
            1: "Terrible (Low Energy, exhausted)",
            2: "Bad (Low Energy, distracted)",
            3: "Okay (Medium Energy)",
            4: "Good (High Energy, focused)",
            5: "Great (Peak Energy, flow state)"
        }

        const prompt = `You are an intelligent productivity assistant.
The user's current energy/mood level is: ${mood}/5 - ${moodLabels[mood] || 'Unknown'}.

Select exactly 3 tasks from the list below that are MOST appropriate for this energy level.

Logic:
- Mood 1-2 (Low Energy): Select easy, administrative, "quick win", or fun tasks. Avoid deep work.
- Mood 4-5 (High Energy): Select "Eat the Frog" candidates - high priority, difficult, or complex tasks.
- Mood 3: Balanced mix.

Tasks:
${todos.map(t => `- ID: ${t.id} | Task: "${t.text}" | Priority: ${t.priority}`).join('\n')}

Return a strict JSON array:
[
  { "id": "exact_task_id", "reason": "Short reason (max 6 words)" }
]
`

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            response_format: { type: 'json_object' }
        })

        const content = completion.choices[0]?.message?.content || '[]'
        console.log("AI Response:", content)
        let recommendations = []
        try {
            const parsed = JSON.parse(content)
            if (Array.isArray(parsed)) {
                recommendations = parsed
            } else if (parsed.recommendations) {
                recommendations = parsed.recommendations
            } else if (parsed.tasks) {
                recommendations = parsed.tasks
            } else {
                const keys = Object.keys(parsed)
                for (const key of keys) {
                    if (Array.isArray(parsed[key])) {
                        recommendations = parsed[key]
                        break
                    }
                }
            }
        } catch (e) {
            console.error("AI Parse Error", e, "Raw:", content)
            recommendations = []
        }

        return NextResponse.json({ recommendations })

    } catch (error) {
        console.error("Mood Rec Error:", error)
        return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
    }
}
