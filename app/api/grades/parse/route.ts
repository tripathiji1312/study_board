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
                    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gr-'))
                    const inputPdf = path.join(tempDir, 'input.pdf')
                    await fs.writeFile(inputPdf, buffer)

                    try {
                        try {
                            await execAsync(`pdftoppm -jpeg -r 150 -f 1 -l 2 \"${inputPdf}\" \"${tempDir}/page\"`)
                        } catch (err: any) {
                            const stderr = String(err?.stderr || '')
                            const message = String(err?.message || '')
                            const missing = err?.code === 127 || /pdftoppm: command not found/i.test(stderr) || /pdftoppm: not found/i.test(stderr) || /spawn pdftoppm/i.test(message)

                            if (missing) {
                                return NextResponse.json({
                                    error: 'PDF needs OCR, but the server is missing `pdftoppm` (poppler-utils).',
                                    details: 'Install poppler-utils (provides pdftoppm) or upload a screenshot/image instead of PDF.'
                                }, { status: 500 })
                            }

                            throw err
                        }

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
                                        { type: 'text', text: 'Extract grades data. Look for Course Code, Course Title, CAT1, CAT2, FAT, Lab Internal, Lab FAT, etc.' }
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
                        { type: 'text', text: 'Extract grades data. Look for Course Code, Course Title, CAT1, CAT2, FAT, Lab Internal, Lab FAT, etc.' }
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
                    content: `You are a grades parser. Extract marks.
                    Output JSON: { "grades": [{ "code": "CSE1001", "name": "Python", "cat1": 45, "cat2": 42, "da": 18, "fat": 88, "labInternal": 55, "labFat": 89 }] }
                    Use null if a mark is missing. "cat1" max 50, "cat2" max 50, "da" max 20, "fat" max 100, "labInternal" max 100, "labFat" max 100.
                    Be careful extracting numbers from text.`
                },
                { role: 'user', content: cleanedText }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
        })

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}')
        return NextResponse.json({ success: true, grades: result.grades || [], debugText: cleanedText, ocrActive: isOcr })

    } catch (error: any) {
        console.error("Grades Parse Error:", error)
        return NextResponse.json({ error: 'Server Error: ' + error.message }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id

    try {
        const { grades } = await req.json()
        let updated = 0

        // Get current semester
        const userSettings = await prisma.userSettings.findUnique({ where: { userId } })
        const semesterId = userSettings?.currentSemId

        for (const g of grades) {
            // Find existing subject by code
            const existing = await prisma.subject.findFirst({
                where: { userId, semesterId, code: g.code }
            })

            if (existing) {
                await prisma.subject.update({
                    where: { id: existing.id },
                    data: {
                        cat1: g.cat1,
                        cat2: g.cat2,
                        da: g.da,
                        fat: g.fat,
                        labInternal: g.labInternal,
                        labFat: g.labFat
                    }
                })
                updated++
            }
            // We do not create new subjects here, only update marks for existing ones
        }
        return NextResponse.json({ success: true, updated })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
