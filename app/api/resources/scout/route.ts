import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Helper to extract JSON from potentially markdown-wrapped response
function extractJSON(text: string): string {
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonBlockMatch) {
        return jsonBlockMatch[1].trim()
    }
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
        return jsonMatch[0]
    }
    return text
}

// Build a proper Google search URL
function buildGoogleSearchUrl(query: string): string {
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}

// Build flexible search query - avoid exact quotes to ensure results
function buildSearchQuery(
    category: string,
    title: string,
    author: string,
    moduleTitle: string,
    subjectName: string
): string {
    // Clean up title - remove special chars that break search
    const cleanTitle = (title?.trim() || moduleTitle)
        .replace(/[""'']/g, '')
        .replace(/[^\w\s-]/g, ' ')
        .trim()
    const cleanAuthor = (author?.trim() || '')
        .replace(/[""'']/g, '')
        .trim()
    const cleanModule = moduleTitle.replace(/[^\w\s-]/g, ' ').trim()

    switch (category) {
        case 'VISUAL_INTUITION':
            // YouTube search - broad to find related videos
            if (cleanAuthor) {
                return `${cleanModule} ${cleanAuthor} youtube tutorial`
            }
            return `${cleanModule} ${subjectName} youtube tutorial video`

        case 'OFFICIAL_DOCS':
            // Documentation - include common sources
            return `${cleanModule} ${subjectName} official documentation tutorial`

        case 'HANDS_ON_PRACTICE':
            // Practice - focus on the topic
            return `${cleanModule} practice problems coding exercises`

        case 'DEEP_DIVE_ARTICLE':
            // Articles - broad search
            return `${cleanModule} ${subjectName} tutorial guide explained`

        case 'TEXTBOOK_REFERENCE':
            // Textbook - include PDF for free access
            if (cleanAuthor) {
                return `${cleanTitle} ${cleanAuthor} textbook PDF`
            }
            return `${cleanModule} ${subjectName} textbook PDF free`

        default:
            return `${cleanModule} ${subjectName} tutorial guide`.trim()
    }
}


// Validate URL by making a HEAD request (fast, doesn't download content)
async function validateUrl(url: string): Promise<boolean> {
    if (!url || url === 'null' || url === '' || !url.startsWith('http')) {
        return false
    }

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; StudyBoard/1.0)'
            }
        })

        clearTimeout(timeoutId)

        // Success if 2xx or 3xx status
        return response.status >= 200 && response.status < 400
    } catch (error) {
        // URL doesn't work (timeout, DNS error, blocked, etc.)
        return false
    }
}

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

        const settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id }
        })
        const apiKey = settings?.groqApiKey

        if (!apiKey) {
            return NextResponse.json({ error: 'Groq API Key not configured. Please add it in Settings.' }, { status: 400 })
        }

        const groq = new Groq({ apiKey })

        // Ask AI for URLs - we'll validate them
        const prompt = `You are a learning resource curator with web search. Search the web and find the BEST resources for:

**Subject:** ${subjectName}
**Module:** ${moduleTitle}
**Topics:** ${topics?.join(', ') || 'General overview'}

USE YOUR WEB SEARCH to find REAL URLs. Verify each URL actually exists before including it.

**FIND 5 RESOURCES (one per category):**
1. VISUAL_INTUITION (video) - YouTube video (prefer: 3Blue1Brown, Fireship, Reducible, Abdul Bari, Computerphile)
2. OFFICIAL_DOCS (docs) - Official documentation, MIT OCW, or authoritative source
3. HANDS_ON_PRACTICE (interactive) - LeetCode, HackerRank, Exercism, or practice problems
4. DEEP_DIVE_ARTICLE (article) - GeeksForGeeks, freeCodeCamp, Real Python tutorial
5. TEXTBOOK_REFERENCE (book) - Classic textbook (link to archive.org, Amazon, or official page)

**RESPOND WITH ONLY THIS JSON:**
{
    "resources": [
        {
            "category": "VISUAL_INTUITION",
            "title": "Exact title of the resource",
            "type": "video",
            "author": "Channel or author name",
            "description": "Why this is recommended",
            "url": "https://actual-url-you-found.com/path"
        }
    ],
    "studyOrder": "Recommended order to study"
}

CRITICAL: Only include URLs you verified exist. If unsure, leave url as empty string "".`

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'groq/compound-mini',
            temperature: 0.2,
            tool_choice: 'auto'
        })

        const content = completion.choices[0]?.message?.content
        if (!content) throw new Error("No AI response")

        console.log("Raw AI response:", content)

        const jsonStr = extractJSON(content)
        const result = JSON.parse(jsonStr)

        // Process and VALIDATE each resource URL
        if (result.resources && Array.isArray(result.resources)) {
            const processedResources = await Promise.all(
                result.resources.map(async (r: {
                    category?: string
                    url?: string | null
                    title?: string
                    author?: string
                    type?: string
                    description?: string
                }) => {
                    const aiUrl = r.url?.trim() || ''

                    // TEST if the URL actually works
                    let isValidUrl = false
                    let finalUrl = ''

                    if (aiUrl && aiUrl.startsWith('http')) {
                        console.log(`Validating URL: ${aiUrl}`)
                        isValidUrl = await validateUrl(aiUrl)
                        console.log(`URL valid: ${isValidUrl}`)
                    }

                    if (isValidUrl) {
                        // URL works! Use it directly
                        finalUrl = aiUrl
                    } else {
                        // URL doesn't work - create a Google search
                        const searchQuery = buildSearchQuery(
                            r.category || '',
                            r.title || '',
                            r.author || '',
                            moduleTitle,
                            subjectName
                        )
                        finalUrl = buildGoogleSearchUrl(searchQuery)
                    }

                    return {
                        category: r.category || 'GENERAL',
                        title: r.title || moduleTitle,
                        type: r.type || 'article',
                        author: r.author || 'Unknown',
                        description: r.description || `Resource for ${moduleTitle}`,
                        url: finalUrl,
                        isDirectLink: isValidUrl
                    }
                })
            )

            result.resources = processedResources
        }

        return NextResponse.json(result)

    } catch (error) {
        console.error("Resource Scout Error:", error)
        return NextResponse.json({ error: "Failed to scout resources" }, { status: 500 })
    }
}

