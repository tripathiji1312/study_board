import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Global search API - searches across all entities including tags
export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') // 'all' | 'todos' | 'projects' | 'ideas' | 'snippets' | 'resources' | 'tags'

    if (!query || query.length < 2) {
        return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 })
    }

    const searchQuery = query.toLowerCase()
    const results: any = {}

    // Search Todos
    if (!type || type === 'all' || type === 'todos') {
        const todos = await prisma.todo.findMany({
            where: {
                userId,
                OR: [
                    { text: { contains: searchQuery } },
                    { description: { contains: searchQuery } },
                    { tags: { some: { tag: { name: { contains: searchQuery } } } } }
                ],
                parentId: null // Only parent todos
            },
            include: {
                tags: { include: { tag: true } },
                subtasks: true
            },
            take: 10
        })
        results.todos = todos.map(t => ({
            ...t,
            tags: t.tags.map(tt => tt.tag),
            _type: 'todo'
        }))
    }

    // Search Projects
    if (!type || type === 'all' || type === 'projects') {
        const projects = await prisma.project.findMany({
            where: {
                userId,
                OR: [
                    { title: { contains: searchQuery } },
                    { description: { contains: searchQuery } },
                    { tech: { contains: searchQuery } },
                    { tags: { some: { tag: { name: { contains: searchQuery } } } } }
                ]
            },
            include: {
                tags: { include: { tag: true } }
            },
            take: 10
        })
        results.projects = projects.map(p => ({
            ...p,
            tags: p.tags.map(pt => pt.tag),
            _type: 'project'
        }))
    }

    // Search Ideas
    if (!type || type === 'all' || type === 'ideas') {
        const ideas = await prisma.idea.findMany({
            where: {
                userId,
                OR: [
                    { content: { contains: searchQuery } },
                    { tags: { some: { tag: { name: { contains: searchQuery } } } } }
                ]
            },
            include: {
                tags: { include: { tag: true } }
            },
            take: 10
        })
        results.ideas = ideas.map(i => ({
            ...i,
            tags: i.tags.map(it => it.tag),
            _type: 'idea'
        }))
    }

    // Search Snippets
    if (!type || type === 'all' || type === 'snippets') {
        const snippets = await prisma.snippet.findMany({
            where: {
                userId,
                OR: [
                    { title: { contains: searchQuery } },
                    { content: { contains: searchQuery } },
                    { tags: { some: { tag: { name: { contains: searchQuery } } } } }
                ]
            },
            include: {
                tags: { include: { tag: true } }
            },
            take: 10
        })
        results.snippets = snippets.map(s => ({
            ...s,
            tags: s.tags.map(st => st.tag),
            _type: 'snippet'
        }))
    }

    // Search Resources
    if (!type || type === 'all' || type === 'resources') {
        const resources = await prisma.resource.findMany({
            where: {
                userId,
                OR: [
                    { title: { contains: searchQuery } },
                    { category: { contains: searchQuery } },
                    { tags: { some: { tag: { name: { contains: searchQuery } } } } }
                ]
            },
            include: {
                tags: { include: { tag: true } }
            },
            take: 10
        })
        results.resources = resources.map(r => ({
            ...r,
            tags: r.tags.map(rt => rt.tag),
            _type: 'resource'
        }))
    }

    // Search Tags themselves
    if (!type || type === 'all' || type === 'tags') {
        const tags = await prisma.tag.findMany({
            where: {
                userId,
                name: { contains: searchQuery }
            },
            include: {
                _count: {
                    select: {
                        todos: true,
                        projects: true,
                        ideas: true,
                        snippets: true,
                        resources: true,
                    }
                }
            },
            take: 10
        })
        results.tags = tags.map(tag => ({
            ...tag,
            usageCount:
                tag._count.todos +
                tag._count.projects +
                tag._count.ideas +
                tag._count.snippets +
                tag._count.resources,
            _type: 'tag'
        }))
    }

    // Flatten for unified results
    if (type === 'all' || !type) {
        const allResults = [
            ...(results.todos || []),
            ...(results.projects || []),
            ...(results.ideas || []),
            ...(results.snippets || []),
            ...(results.resources || []),
        ]
        results.all = allResults
        results.totalCount = allResults.length + (results.tags?.length || 0)
    }

    return NextResponse.json(results)
}
