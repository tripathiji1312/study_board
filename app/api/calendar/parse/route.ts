import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import prisma from '@/lib/prisma'
import { addDays, parse, format, eachDayOfInterval, parseISO } from 'date-fns'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
// @ts-ignore
import PDFParser from 'pdf2json'

const execAsync = promisify(exec)

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null

export const runtime = 'nodejs'

function isJunkText(text: string): boolean {
    if (!text || text.trim().length < 20) return true

    // Remove whitespace for better ratio calculation
    const stripped = text.replace(/\s/g, '')
    if (stripped.length < 10) return true

    // Check ratio of alphanumeric characters
    // Scanned PDFs often result in just lines (---) or random symbols (!!!)
    const alphaNum = stripped.replace(/[^a-zA-Z0-9]/g, '').length
    const ratio = alphaNum / stripped.length

    // If less than 25% of text is alphanumeric, it's likely junk
    if (ratio < 0.25) return true

    // Check for dominant dash/table line patterns
    const dashes = (stripped.match(/-/g) || []).length
    if (dashes / stripped.length > 0.4) return true

    return false
}

interface CalendarEvent {
    title: string
    type: 'exam' | 'holiday' | 'event' | 'deadline'
    startDate: string  // YYYY-MM-DD
    endDate?: string   // YYYY-MM-DD for ranges
    time?: string
    description?: string
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const textContent = formData.get('text') as string | null

        let rawText = ''

        if (file) {
            // Handle PDF or image
            const buffer = Buffer.from(await file.arrayBuffer())

            if (file.type === 'application/pdf') {
                try {
                    // 1. Try traditional text extraction
                    rawText = await new Promise<string>((resolve, reject) => {
                        const pdfParser = new (PDFParser as any)(null, 1);
                        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
                        pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent() || ""));
                        pdfParser.parseBuffer(buffer);
                    });

                    // 2. Check if we got "junk" (likely a scanned PDF)
                    if (isJunkText(rawText)) {
                        console.log("Junk text detected from PDF, falling back to OCR/Vision...")

                        // Use pdftoppm to convert first 2 pages to images
                        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'calendar-'))
                        const inputPdf = path.join(tempDir, 'input.pdf')
                        await fs.writeFile(inputPdf, buffer)

                        try {
                            // -jpeg = output jpeg, -r 150 = 150 DPI for good balance of speed/quality
                            // -f 1 -l 2 = first 2 pages
                            await execAsync(`pdftoppm -jpeg -r 150 -f 1 -l 2 "${inputPdf}" "${tempDir}/page"`)

                            const files = await fs.readdir(tempDir)
                            const pageImages = files
                                .filter(f => f.startsWith('page-') && f.endsWith('.jpg'))
                                .sort()

                            let combinedOcrText = ''

                            for (const imgName of pageImages) {
                                const imgPath = path.join(tempDir, imgName)
                                const imgBuffer = await fs.readFile(imgPath)
                                const base64 = imgBuffer.toString('base64')
                                const dataUrl = `data:image/jpeg;base64,${base64}`

                                const visionResponse = await groq?.chat.completions.create({
                                    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                                    messages: [
                                        {
                                            role: 'user',
                                            content: [
                                                { type: 'image_url', image_url: { url: dataUrl } },
                                                { type: 'text', text: 'Extract all data from this academic calendar. Be precise with dates and event titles in the table.' }
                                            ]
                                        }
                                    ]
                                })
                                combinedOcrText += (visionResponse?.choices[0]?.message?.content || '') + '\n'
                            }

                            if (combinedOcrText.trim()) {
                                rawText = 'OCR_FALLBACK_ACTIVE\n' + combinedOcrText
                            }
                        } finally {
                            // Cleanup
                            await fs.rm(tempDir, { recursive: true, force: true })
                        }
                    }
                } catch (pdfError) {
                    console.error('PDF parse error:', pdfError)
                    return NextResponse.json({
                        error: 'Failed to parse PDF. Try uploading as image instead.',
                        details: pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'
                    }, { status: 400 })
                }
            } else if (file.type.startsWith('image/')) {
                // For images, we'll use Groq's vision capability
                const base64 = buffer.toString('base64')
                const dataUrl = `data:${file.type};base64,${base64}`

                if (!groq) {
                    return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 })
                }

                try {
                    const visionResponse = await groq.chat.completions.create({
                        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'image_url',
                                        image_url: { url: dataUrl }
                                    },
                                    {
                                        type: 'text',
                                        text: 'Extract all text from this academic calendar image. List all dates, events, exams, holidays, and deadlines you can see. Format as plain text.'
                                    }
                                ]
                            }
                        ],
                        max_tokens: 4000
                    })

                    rawText = visionResponse.choices[0]?.message?.content || ''
                } catch (visionError) {
                    console.error('Vision API error:', visionError)
                    return NextResponse.json({
                        error: 'Failed to process image. Try a clearer image or PDF.',
                        details: visionError instanceof Error ? visionError.message : 'Vision API error'
                    }, { status: 400 })
                }
            } else {
                return NextResponse.json({ error: `Unsupported file type: ${file.type}. Use PDF or image.` }, { status: 400 })
            }
        } else if (textContent) {
            rawText = textContent
        } else {
            return NextResponse.json({ error: 'No file or text provided' }, { status: 400 })
        }

        if (!rawText || rawText.trim().length === 0) {
            console.warn("Extracted text is empty")
            return NextResponse.json({
                error: 'No text found in PDF',
                debugText: "The PDF parser successfully ran but found 0 characters of text.\n\nPossible reasons:\n1. The PDF is a scanned image (requires OCR).\n2. The PDF is encrypted/protected.\n3. The file is corrupted."
            }, { status: 400 })
        }

        // Clean and Truncate Text
        // The PDF often has huge gaps which bloat the character count.
        // We compress multiple spaces into one to save context window.
        const cleanedText = rawText
            .replace(/Page \(\d+\) Break/g, '') // Remove page breaks
            .replace(/\s\s+/g, ' ') // Collapse multiple spaces/newlines into single space
            .trim()

        console.log("Original length:", rawText.length, "Cleaned length:", cleanedText.length)

        // Groq Llama 3.3 has 128k context, so 100k chars is safe.
        const truncatedText = cleanedText.substring(0, 100000)
        console.log("Sending text to Groq, length:", truncatedText.length)

        // Use Groq to parse calendar events
        if (!groq) {
            return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 })
        }

        const currentYear = new Date().getFullYear()

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are a strict academic calendar parser for extracted PDF text. 
                    
                    CRITICAL INSTRUCTIONS:
                    - The input text has been compressed (extra spaces removed), so table headers and data might look like "Event Date Description CAT1 Oct25 Exam".
                    - Identify ALL events, exams, holidays, and deadlines.
                    - Look for patterns like "Date - Event", "Event ... Date", or table row patterns.
                    - Dates are extremely important. Assume year ${currentYear} or ${currentYear + 1} based on context.
                    
                    Extract:
                    - title: Event name
                    - type: "exam" | "holiday" | "event" | "deadline"
                    - startDate: YYYY-MM-DD format
                    - endDate: YYYY-MM-DD (only if it's a date range)
                    - time: HH:MM format if specified
                    - description: Additional details
                    
                    Output valid JSON object:
                    {
                        "events": [
                            { ...event1 },
                            { ...event2 }
                        ]
                    }`
                },
                {
                    role: 'user',
                    content: `Parse this academic calendar text and extract all events:\n\n${truncatedText}`
                }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
        })

        const responseText = completion.choices[0]?.message?.content || '{}'

        // Extract JSON from response
        let events: CalendarEvent[] = []
        try {
            const parsed = JSON.parse(responseText)
            events = (parsed.events || []).map((e: any) => ({
                ...e,
                selected: true
            }))
        } catch (e) {
            console.error('Failed to parse AI response:', e)
            return NextResponse.json({
                error: 'Failed to parse calendar events',
                rawText: truncatedText.slice(0, 500)
            }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            events,
            debugText: truncatedText,
            rawTextPreview: truncatedText.slice(0, 500)
        })

    } catch (error) {
        console.error('Calendar parse error:', error)
        return NextResponse.json({
            error: 'Failed to parse calendar',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// POST to save parsed events
export async function PUT(req: Request) {
    try {
        const { events } = await req.json() as { events: CalendarEvent[] }

        if (!events || !Array.isArray(events)) {
            return NextResponse.json({ error: 'Invalid events array' }, { status: 400 })
        }

        const results = {
            exams: 0,
            scheduleEvents: 0,
            errors: 0
        }

        for (const event of events) {
            try {
                if (event.type === 'exam') {
                    // Add as exam
                    await prisma.exam.create({
                        data: {
                            title: event.title,
                            date: new Date(event.startDate),
                            syllabus: event.description || null
                        }
                    })
                    results.exams++
                } else {
                    // Add as schedule event(s)
                    if (event.endDate && event.endDate !== event.startDate) {
                        // Date range - create events for each day
                        const days = eachDayOfInterval({
                            start: new Date(event.startDate),
                            end: new Date(event.endDate)
                        })

                        for (const day of days) {
                            await prisma.scheduleEvent.create({
                                data: {
                                    title: event.title,
                                    type: event.type === 'holiday' ? 'Personal' : 'Study',
                                    day: format(day, 'yyyy-MM-dd'),
                                    time: event.time || '09:00',
                                    duration: '8h',
                                    location: event.description || null
                                }
                            })
                            results.scheduleEvents++
                        }
                    } else {
                        // Single day event
                        await prisma.scheduleEvent.create({
                            data: {
                                title: event.title,
                                type: event.type === 'holiday' ? 'Personal' : 'Study',
                                day: event.startDate,
                                time: event.time || '09:00',
                                duration: '1h',
                                location: event.description || null
                            }
                        })
                        results.scheduleEvents++
                    }
                }
            } catch (e) {
                console.error('Failed to save event:', event, e)
                results.errors++
            }
        }

        return NextResponse.json({ success: true, results })

    } catch (error) {
        console.error('Save calendar error:', error)
        return NextResponse.json({ error: 'Failed to save events' }, { status: 500 })
    }
}
