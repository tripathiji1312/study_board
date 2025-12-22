import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { addDays, format } from 'date-fns'

export async function POST() {
    try {
        const email = "demo@example.com"
        const password = "password" // Simple password for demo
        const hashedPassword = await bcrypt.hash(password, 10)

        // 1. Check if demo user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
            include: { settings: true }
        })

        if (existingUser) {
            return NextResponse.json({ success: true, message: "Demo user exists" })
        }

        // 2. Create User
        const user = await prisma.user.create({
            data: {
                name: "Demo Student",
                email,
                password: hashedPassword,
                image: "https://github.com/shadcn.png"
            }
        })

        // 3. Create Settings
        await prisma.userSettings.create({
            data: {
                userId: user.id,
                displayName: "Demo Student",
                department: "Computer Science",
                focusDuration: 25,
                breakDuration: 5,
                currentSemId: 1 // Placeholder
            }
        })

        // 4. Create Semester
        const semester = await prisma.semester.create({
            data: {
                userId: user.id,
                name: "Spring 2024",
                startDate: new Date().toISOString(),
                endDate: addDays(new Date(), 90).toISOString(),
                isCurrent: true
            }
        })

        // 5. Create Subjects
        const subjectsData = [
            { name: "Operating Systems", code: "CS3001", credits: 4, type: "Theory", slot: "A1" },
            { name: "Database Systems", code: "CS3002", credits: 4, type: "Embedded", slot: "B1" },
            { name: "Linear Algebra", code: "MA2001", credits: 3, type: "Theory", slot: "C1" },
            { name: "Web Development", code: "CS3003", credits: 2, type: "Lab", slot: "L1" }
        ]

        const subjects: any[] = []
        for (const s of subjectsData) {
            const sub = await prisma.subject.create({
                data: {
                    userId: user.id,
                    semesterId: semester.id,
                    ...s
                }
            })
            subjects.push(sub)
        }

        // 6. Create Assignments
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd')
        const yesterdayStr = format(addDays(new Date(), -1), 'yyyy-MM-dd')

        await prisma.assignment.createMany({
            data: [
                {
                    userId: user.id,
                    title: "OS Kernel Project",
                    subject: "Operating Systems",
                    subjectId: subjects[0].id,
                    due: yesterdayStr, // Overdue
                    priority: "High",
                    status: "Pending",
                    platform: "Canvas"
                },
                {
                    userId: user.id,
                    title: "SQL Validation Form",
                    subject: "Database Systems",
                    subjectId: subjects[1].id,
                    due: todayStr,
                    priority: "Urgent",
                    status: "Pending",
                    platform: "Moodle"
                },
                {
                    userId: user.id,
                    title: "React Components Lab",
                    subject: "Web Development",
                    subjectId: subjects[3].id,
                    due: tomorrowStr,
                    priority: "Medium",
                    status: "Pending",
                    platform: "GitHub"
                }
            ]
        })

        // 7. Create Todos
        await prisma.todo.createMany({
            data: [
                { userId: user.id, text: "Buy groceries", priority: 2, dueDate: todayStr },
                { userId: user.id, text: "Call Mom", priority: 1, dueDate: todayStr },
                { userId: user.id, text: "Review Laundry calculus", priority: 3, dueDate: tomorrowStr }
            ]
        })

        // 8. Create Exams
        await prisma.exam.create({
            data: {
                userId: user.id,
                title: "CAT-1",
                subjectId: subjects[0].id,
                date: addDays(new Date(), 3),
                room: "AB1-204"
            }
        })

        // 9. Generate Week Schedule (Sample)
        // Simple loop to add a few classes
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        for (const day of days) {
            await prisma.scheduleEvent.create({
                data: {
                    userId: user.id,
                    title: subjects[0].name,
                    type: "Class",
                    time: "09:00",
                    duration: "60",
                    day: day,
                    subjectId: subjects[0].id,
                    location: "AB1-405"
                }
            })
        }

        return NextResponse.json({ success: true, message: "Demo account seeded" })

    } catch (error) {
        console.error("Demo Seed Error:", error)
        return NextResponse.json({ error: "Failed to seed demo account" }, { status: 500 })
    }
}
