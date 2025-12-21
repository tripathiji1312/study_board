import { NextResponse } from 'next/server'
// @ts-ignore
import Groq from 'groq-sdk'
// @ts-ignore
import PDFParser from 'pdf2json'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)
export const runtime = 'nodejs'

function isJunkText(text: string): boolean {
    if (!text || text.trim().length < 20) return true
    const stripped = text.replace(/\s/g, '')
    if (stripped.length < 10) return true
    const alphaNum = stripped.replace(/[^a-zA-Z0-9]/g, '').length
    const ratio = alphaNum / stripped.length
    if (ratio < 0.25) return true
    return false
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null

        // Fetch user settings for API key
        const settings = await prisma.userSettings.findUnique({ where: { userId } })
        const apiKey = settings?.groqApiKey
        if (!apiKey) return NextResponse.json({ error: 'Groq API Key not configured' }, { status: 400 })

        const groq = new Groq({ apiKey })
        let rawText = ''
        let isOcr = false

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        const buffer = Buffer.from(await file.arrayBuffer())

        if (file.type === 'application/pdf') {
            try {
                rawText = await new Promise<string>((resolve, reject) => {
                    const pdfParser = new (PDFParser as any)(null, 1);
                    pdfParser.on("pdfParser_dataError", (err: any) => reject(err.parserError));
                    pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent() || ""));
                    pdfParser.parseBuffer(buffer);
                });

                if (isJunkText(rawText)) {
                    isOcr = true
                    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tt-'))
                    const inputPdf = path.join(tempDir, 'input.pdf')
                    await fs.writeFile(inputPdf, buffer)

                    try {
                        await execAsync(`pdftoppm -jpeg -r 150 -f 1 -l 2 "${inputPdf}" "${tempDir}/page"`)
                        const files = await fs.readdir(tempDir)
                        const pageImages = files.filter(f => f.startsWith('page-') && f.endsWith('.jpg')).sort()

                        let combinedOcrText = ''
                        for (const imgName of pageImages) {
                            const imgPath = path.join(tempDir, imgName)
                            const imgBuffer = await fs.readFile(imgPath)
                            const base64 = imgBuffer.toString('base64')
                            const dataUrl = `data:image/jpeg;base64,${base64}`

                            const visionResponse = await groq.chat.completions.create({
                                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                                messages: [{
                                    role: 'user',
                                    content: [
                                        { type: 'image_url', image_url: { url: dataUrl } },
                                        { type: 'text', text: 'Extract timetable data. Look for Course Code, Course Title, Slot, Venue, and Faculty Name in the table.' }
                                    ]
                                }]
                            })
                            combinedOcrText += (visionResponse?.choices[0]?.message?.content || '') + '\n'
                        }
                        if (combinedOcrText.trim()) rawText = combinedOcrText
                    } finally {
                        await fs.rm(tempDir, { recursive: true, force: true })
                    }
                }
            } catch (e) {
                return NextResponse.json({ error: 'PDF Parse Failed' }, { status: 400 })
            }
        } else if (file.type.startsWith('image/')) {
            isOcr = true
            const base64 = buffer.toString('base64')
            const dataUrl = `data:${file.type};base64,${base64}`
            const visionResponse = await groq.chat.completions.create({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'image_url', image_url: { url: dataUrl } },
                        { type: 'text', text: 'Extract timetable data. Look for Course Code, Course Title, Slot, Venue, and Faculty Name in the table.' }
                    ]
                }]
            })
            rawText = visionResponse.choices[0]?.message?.content || ''
        } else {
            return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
        }

        const cleanedText = rawText.replace(/\s\s+/g, ' ').trim().substring(0, 15000)

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are a timetable parser. Extract course details.
                    Output JSON: { "subjects": [{ "code": "CSE1001", "name": "Python", "type": "Theory/Lab/Embedded", "slot": "A1+TA1", "teacher": "Dr. X", "room": "SJT 101" }] }
                    Clean up course names. If type is unclear, infer from slot (L slots are Labs usually).`
                },
                { role: 'user', content: cleanedText }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
        })

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}')
        return NextResponse.json({ success: true, subjects: result.subjects || [], debugText: cleanedText, ocrActive: isOcr })

    } catch (error: any) {
        console.error("Timetable Parse Error:", error)
        return NextResponse.json({ error: 'Server Error: ' + error.message }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id

    try {
        const { subjects } = await req.json()
        let updated = 0
        let created = 0

        // Get current semester
        const userSettings = await prisma.userSettings.findUnique({ where: { userId } })
        let semesterId = userSettings?.currentSemId

        // Verify the semester actually exists (could be orphaned reference)
        if (semesterId) {
            const semesterExists = await prisma.semester.findUnique({ where: { id: semesterId } })
            if (!semesterExists) {
                semesterId = null // Reset if orphaned
            }
        }

        // If no valid semester, find or create one
        if (!semesterId) {
            const existingSemester = await prisma.semester.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            })
            if (existingSemester) {
                semesterId = existingSemester.id
            } else {
                // Create a default semester
                const newSemester = await prisma.semester.create({
                    data: {
                        userId,
                        name: "Current Semester",
                        startDate: new Date().toISOString(),
                        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                        isCurrent: true
                    }
                })
                semesterId = newSemester.id
            }
        }

        for (const sub of subjects) {
            // Try determine type from slot if missing
            let type = sub.type || "Theory"
            if (sub.slot && sub.slot.startsWith('L')) type = "Lab"

            // Try find existing subject by code
            const existing = await prisma.subject.findFirst({
                where: { userId, code: sub.code, semesterId }
            })

            if (existing) {
                await prisma.subject.update({
                    where: { id: existing.id },
                    data: {
                        slot: sub.slot,
                        teacherName: sub.teacher,
                        classRoom: type === "Lab" ? undefined : sub.room,
                        labRoom: type === "Lab" ? sub.room : undefined,
                        type: type // Update type if it was vague before? Maybe safer to keep existing type unless explicitly different.
                    }
                })
                updated++
            } else {
                await prisma.subject.create({
                    data: {
                        userId,
                        semesterId,
                        name: sub.name,
                        code: sub.code,
                        type: type,
                        credits: 3, // Default
                        slot: sub.slot,
                        teacherName: sub.teacher,
                        classRoom: type === "Lab" ? undefined : sub.room,
                        labRoom: type === "Lab" ? sub.room : undefined,
                    }
                })
                created++
            }
        }
        return NextResponse.json({ success: true, updated, created })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
