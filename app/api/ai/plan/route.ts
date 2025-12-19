import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import prisma from '@/lib/prisma'
import { addDays, differenceInDays, format, parseISO } from 'date-fns'
// @ts-ignore
import PDFParser from 'pdf2json'

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null

export const runtime = 'nodejs'

// Helper to extract text from PDF
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const pdfParser = new (PDFParser as any)(null, 1)

        pdfParser.on('pdfParser_dataError', (err: any) => {
            console.error('PDF Parse Error:', err)
            resolve('') // Don't fail, just return empty
        })

        pdfParser.on('pdfParser_dataReady', () => {
            const rawText = pdfParser.getRawTextContent()
            resolve(rawText || '')
        })

        pdfParser.parseBuffer(buffer)
    })
}

// Helper to extract text from image using Groq Vision
async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<string> {
    if (!groq) return ''

    try {
        const base64 = buffer.toString('base64')
        const response = await groq.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: 'Extract all text from this image. Return ONLY the text content, no explanations.' },
                    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
                ]
            }],
            max_tokens: 2000
        })
        return response.choices[0]?.message?.content || ''
    } catch (e) {
        console.error('Vision extraction error:', e)
        return ''
    }
}

export async function POST(req: Request) {
    if (!groq) {
        return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 })
    }

    try {
        // Support both JSON and FormData
        const contentType = req.headers.get('content-type') || ''

        let examDate: string
        let subjectId: string
        let selectedModuleIds: string[]
        let availableHoursPerDay: number
        let strategyPrompt: string = ''
        let intensity: 'chill' | 'balanced' | 'intense' = 'balanced'
        let extractedFileContent: string = ''

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData()
            examDate = formData.get('examDate') as string
            subjectId = formData.get('subjectId') as string
            selectedModuleIds = JSON.parse(formData.get('selectedModuleIds') as string || '[]')
            availableHoursPerDay = parseInt(formData.get('availableHoursPerDay') as string) || 4
            strategyPrompt = formData.get('strategyPrompt') as string || ''
            intensity = (formData.get('intensity') as 'chill' | 'balanced' | 'intense') || 'balanced'

            // Process uploaded file
            const file = formData.get('file') as File | null
            if (file && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer())

                if (file.type === 'application/pdf') {
                    extractedFileContent = await extractTextFromPDF(buffer)
                } else if (file.type.startsWith('image/')) {
                    extractedFileContent = await extractTextFromImage(buffer, file.type)
                }

                // Truncate if too long
                if (extractedFileContent.length > 8000) {
                    extractedFileContent = extractedFileContent.substring(0, 8000) + '\n... [content truncated]'
                }
            }
        } else {
            // JSON fallback
            const body = await req.json()
            examDate = body.examDate
            subjectId = body.subjectId
            selectedModuleIds = body.selectedModuleIds
            availableHoursPerDay = body.availableHoursPerDay || 4
            strategyPrompt = body.strategyPrompt || ''
            intensity = body.intensity || 'balanced'
        }

        if (!examDate || !subjectId || !selectedModuleIds?.length) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Fetch Syllabus Modules
        const modules = await prisma.syllabusModule.findMany({
            where: {
                id: { in: selectedModuleIds },
                subjectId: subjectId
            },
            select: {
                id: true,
                title: true,
                topics: true,
                status: true
            }
        })

        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
            select: { name: true, code: true }
        })

        if (!modules.length) {
            return NextResponse.json({ error: 'No modules found' }, { status: 400 })
        }

        // 2. Calculate Timeline
        const today = new Date()
        const examDay = new Date(examDate)
        const daysRemaining = differenceInDays(examDay, today)

        if (daysRemaining <= 0) {
            return NextResponse.json({ error: 'Exam date must be in the future' }, { status: 400 })
        }

        // 3. Build enhanced prompt with intensity and context
        const moduleList = modules.map((m, i) =>
            `  ${i + 1}. ID: "${m.id}", Title: "${m.title}", Status: ${m.status}, Topics: [${m.topics?.join(', ') || 'General'}]`
        ).join('\n')

        const intensityGuide = {
            chill: 'relaxed pace with more breaks, fewer topics per day, focus on understanding over memorization',
            balanced: 'steady pace mixing theory and practice, reasonable coverage with regular reviews',
            intense: 'aggressive coverage, more topics per day, practice-heavy, maximize retention techniques'
        }

        const contextSection = extractedFileContent
            ? `\n### UPLOADED REFERENCE MATERIAL (PYQs/Notes):\n\`\`\`\n${extractedFileContent}\n\`\`\`\nAnalyze this content to identify:\n- Frequently asked topics or question patterns\n- Important formulas or definitions to focus on\n- Question types that appear often\n`
            : ''

        const prompt = `You are an expert academic study planner creating a personalized, actionable study schedule.

## CONTEXT
- Subject: ${subject?.name || 'Unknown'} (${subject?.code || ''})
- Exam Date: ${examDate} (${daysRemaining} days remaining)
- Daily Study Time: ${availableHoursPerDay} hours
- Intensity: ${intensity.toUpperCase()} - ${intensityGuide[intensity]}
- User's Strategy Notes: "${strategyPrompt || 'No specific preferences'}"
${contextSection}

## MODULES TO COVER
${moduleList}

## YOUR TASK
Create a COMPLETE study plan covering the FULL DURATION from today (${daysRemaining} days).
1. **FULL TIMELINE**: You MUST creating entries covering all days until the exam. Do not stop early.
2. **Task Generation**: Generate 3-5 SPECIFIC, ACTIONABLE tasks per session.
3. **Priorities**: VARY PRIORITIES INTELLIGENTLY.
   - **High**: Critical concepts, difficult topics, heavy weightage content.
   - **Medium**: Standard practice, reading, core syllabus.
   - **Low**: Revision, light reading, summaries.
   - **DO NOT** make everything High priority.
4. **Long Term Strategy**: If the duration is long (>14 days), you may group days where appropriate (e.g. "Week 2 Focus") but preferably provide daily breakdowns if possible within limits.
5. **Final Revision**: Reserve the LAST 2-3 DAYS for "Final Revision & Mock Test".

## REQUIRED JSON OUTPUT
{
    "plan": [
        {
            "dayOffset": 1,
            "focus": "Day's main theme (e.g., 'Core Concepts Deep Dive')",
            "sessions": [
                {
                    "moduleId": "exact_id_from_input",
                    "topic": "Specific subtopic focus",
                    "durationMinutes": 60,
                    "difficulty": "easy|medium|hard",
                    "priority": "high|medium|low",
                    "notes": "Strategy tip for this session",
                    "tasks": [
                        {
                            "title": "Clear, actionable task description",
                            "estimatedMinutes": 15,
                            "reasoning": "Why this task is important (e.g. 'Foundational concept', 'High PYQ frequency')"
                        }
                    ]
                }
            ]
        }
    ],
    "summary": {
        "totalSessions": 0,
        "keyFocusAreas": ["area1", "area2"],
        "examTips": ["tip1", "tip2"]
    }
}`

        // 4. Generate with Groq
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are a precise JSON generator for academic study planning. Always output valid JSON matching the exact schema provided.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 8000
        })

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}')

        // 5. Hydrate dates and add module titles
        const finalPlan = (result.plan || []).map((day: any) => {
            const date = addDays(today, day.dayOffset)
            return {
                date: format(date, 'yyyy-MM-dd'),
                focus: day.focus,
                sessions: (day.sessions || []).map((s: any) => ({
                    ...s,
                    moduleTitle: modules.find(m => m.id === s.moduleId)?.title || 'Review',
                    // Normalize tasks to always be array of objects
                    tasks: (s.tasks || []).map((t: any) =>
                        typeof t === 'string'
                            ? { title: t, estimatedMinutes: 15, reasoning: 'General study task' }
                            : t
                    )
                }))
            }
        })

        return NextResponse.json({
            success: true,
            plan: finalPlan,
            summary: result.summary || {},
            stats: {
                totalDays: daysRemaining,
                modulesCount: modules.length,
                intensity,
                subjectName: subject?.name
            }
        })

    } catch (error) {
        console.error('Study plan error:', error)
        return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
    }
}
