import { NextResponse } from 'next/server'
// @ts-ignore
import Groq from 'groq-sdk'
// @ts-ignore
import PDFParser from 'pdf2json'

// Force Node.js runtime
export const runtime = 'nodejs'

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        console.log("Starting PDF parsing for file:", file.name, "Size:", file.size)

        // 1. Extract Text from PDF using pdf2json
        const buffer = Buffer.from(await file.arrayBuffer())

        const text = await new Promise<string>((resolve, reject) => {
            const pdfParser = new PDFParser(null, 1); // 1 = raw text

            pdfParser.on("pdfParser_dataError", (errData: any) => {
                console.error("pdf2json error:", errData.parserError)
                reject(errData.parserError)
            });

            pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                const raw = pdfParser.getRawTextContent()
                console.log("pdf2json ready. Text length:", raw?.length)
                resolve(raw || "")
            });

            pdfParser.parseBuffer(buffer);
        })

        if (!text || text.trim().length === 0) {
            console.warn("Extracted text is empty")
            return NextResponse.json({
                error: 'No text found in PDF',
                debugText: "The PDF parser successfully ran but found 0 characters of text.\n\nPossible reasons:\n1. The PDF is a scanned image (requires OCR).\n2. The PDF is encrypted/protected.\n3. The file is corrupted."
            })
        }

        // 2. Clean and Truncate Text
        // The PDF has huge gaps (e.g. "Module:1                                Introduction") which bloats the character count.
        // We compress multiple spaces into one to save context window.
        const cleanedText = text
            .replace(/Page \(\d+\) Break/g, '') // Remove page breaks like "Page (0) Break"
            .replace(/\s\s+/g, ' ') // Collapse multiple spaces/newlines into single space
            .trim()

        console.log("Original length:", text.length, "Cleaned length:", cleanedText.length)

        // Groq Llama 3.3 has 128k context, so we can send a lot. 
        // 1 token ~= 4 chars, so 100k chars is safe.
        const truncatedText = cleanedText.substring(0, 100000)
        console.log("Sending text to Groq, length:", truncatedText.length)

        // 3. AI Parsing with Groq
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a strict JSON parser for academic syllabi. 
                    Your goal is to extract ALL modules/units and their topics.
                    
                    CRITICAL INSTRUCTIONS:
                    - The input text has been compressed (extra spaces removed), so headers might look like "Module:1 Introduction".
                    - You must find EVERY module (e.g. Module 1 to Module 7).
                    - Do not stop early. Scan the entire text.
                    - If the text is messy, look for patterns like "Module X", "Unit X", "Chapter X".
                    - Ignore junk like "Agenda Item", "Annexure", or "Page Break".
                    
                    Output valid JSON:
                    {
                        "modules": [
                            {
                                "title": "Module 1: Name",
                                "topics": ["topic 1", "topic 2"]
                            }
                        ]
                    }`
                },
                {
                    role: "user",
                    content: `Extract course modules from this text:\n\n${truncatedText}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            response_format: { type: "json_object" }
        })

        const content = completion.choices[0]?.message?.content
        if (!content) throw new Error('No content from AI')

        console.log("Groq response received")
        const parsed = JSON.parse(content)

        return NextResponse.json({ ...parsed, debugText: truncatedText })

    } catch (error: any) {
        console.error('Syllabus AI Parse Error:', error)
        return NextResponse.json({
            error: 'Failed to parse syllabus',
            details: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
