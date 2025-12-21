import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { moduleTitle, topics, subjectName } = body

        if (!moduleTitle || !subjectName) {
            return NextResponse.json({ error: 'Missing topic info' }, { status: 400 })
        }

        // Fetch user's API key
        const settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id }
        })
        const apiKey = settings?.groqApiKey

        if (!apiKey) {
            return NextResponse.json({ error: 'Groq API Key not configured. Please add it in Settings.' }, { status: 400 })
        }

        const groq = new Groq({ apiKey })

        const prompt = `
**ROLE**: You are an elite Curriculum Architect who has designed courses at MIT, Stanford, and trained engineers at Google. You have encyclopedic knowledge of the best educators in every CS domain.

**MISSION**: Curate exactly 5 GOLD STANDARD resources for this module. Every recommendation must be a recognized authority - no generic results.

**CONTEXT**:
- Subject: ${subjectName}
- Module: ${moduleTitle}
- Topics: ${topics?.join(', ') || 'General overview'}

**MANDATORY CATEGORIES** (one resource per category):

1. **VISUAL INTUITION** (type: "video"): The single best YouTube video/playlist that builds visual/geometric intuition. Prioritize: 3Blue1Brown, Reducible, Fireship, Abdul Bari, Ben Eater, Computerphile, Two Minute Papers, Welch Labs.

2. **OFFICIAL DOCUMENTATION** (type: "docs"): The authoritative source - official docs, MDN, Python docs, or the original research paper if it's a famous algorithm.

3. **HANDS-ON PRACTICE** (type: "interactive"): Where to practice - LeetCode, HackerRank, Exercism, or a GitHub repo with exercises. Must have immediate feedback.

4. **DEEP DIVE ARTICLE** (type: "article"): The best long-form explanation - GeeksForGeeks, Real Python, freeCodeCamp, dev.to, or a famous blog post that "everyone" references.

5. **TEXTBOOK REFERENCE** (type: "book"): The gold-standard textbook chapter (e.g., CLRS for algorithms, SICP for programming, Tanenbaum for OS, K&R for C).

**QUALITY SIGNALS** (you MUST consider):
- Creator is a known expert (professor, principal engineer, core maintainer)
- Resource is frequently cited/recommended in the community
- Explanations are clear, not just correct
- Prefer content updated in last 3 years unless it's a timeless classic

**OUTPUT FORMAT** (STRICT JSON, no markdown):
{
    "resources": [
        {
            "category": "VISUAL_INTUITION",
            "title": "Exact title of video/article",
            "type": "video",
            "author": "Channel or Author name",
            "description": "One sentence: WHY this is the best (e.g., 'Uses animations to explain recursion visually, 2M views')",
            "searchQuery": "site:youtube.com recursion 3Blue1Brown"
        }
    ],
    "studyOrder": "Brief 1-2 sentence recommendation on what order to consume these"
}

Remember: You are recommending resources a Stanford TA would use. No filler. Only legends.
`

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            response_format: { type: 'json_object' }
        })

        const content = completion.choices[0]?.message?.content
        if (!content) throw new Error("No AI response")

        const result = JSON.parse(content)
        return NextResponse.json(result)

    } catch (error) {
        console.error("Resource Scout Error:", error)
        return NextResponse.json({ error: "Failed to scout resources" }, { status: 500 })
    }
}
