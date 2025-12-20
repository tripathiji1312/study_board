"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { toast } from "sonner"

// --- Types ---
export type Priority = "Low" | "Medium" | "High" | "Urgent"
export type Status = "Pending" | "In Progress" | "Completed"

export interface UserSettings {
    id: number
    displayName: string
    email?: string
    department: string
    currentSemId?: number
    focusDuration: number
    breakDuration: number
    emailNotifications?: boolean
    notificationEmail?: string
}

export interface Semester {
    id: number
    name: string
    startDate: string
    endDate: string
    isCurrent: boolean
    subjects?: Subject[]
}

export interface Subject {
    id: string
    name: string
    code: string
    credits: number
    type: "Theory" | "Lab" | "Embedded"
    slot?: string
    teacherEmail?: string
    cabinNo?: string
    labRoom?: string
    classRoom?: string
    semesterId?: number
    teacherName?: string
    modules?: Module[]
    marks: {
        CAT1?: number
        CAT2?: number
        DA?: number
        FAT?: number
        LabInternal?: number
        LabFAT?: number
    }
}

export interface Module {
    id: string
    title: string
    topics?: string[]
    status: "Pending" | "In Progress" | "Completed" | "Revised"
}

// ========== TAG (Site-wide) ==========
export interface Tag {
    id: string
    name: string
    color: string
    usageCount?: number
}

// ========== TODO (Enhanced - Todoist Style) ==========
export interface Todo {
    id: string
    text: string
    description?: string
    completed: boolean
    completedAt?: string // ISO string
    dueDate?: string      // "2024-12-25"
    dueTime?: string      // "14:30"
    priority: 1 | 2 | 3 | 4
    subjectId?: string
    parentId?: string     // For subtasks
    subtasks?: Todo[]
    tags?: Tag[]
    updatedAt?: string
    isOptimistic?: boolean
    rescheduleCount?: number
}

// Added missing interfaces
export interface Book {
    id: string
    title: string
    author: string
    status: "toread" | "reading" | "completed"
    progress: number
    total: number
    dueDate?: string
}

export interface Idea {
    id: string
    content: string
    status: "brainstorm" | "planned" | "done"
}

export interface Snippet {
    id: string
    title: string
    content: string
    type: "text" | "code"
    language: string
    tags?: Tag[]
}

export interface Assignment {
    id: number
    title: string
    course: string
    dueDate: string
    priority: Priority
    status: Status
}

export interface Project {
    id: number
    title: string
    description: string
    tech: string[]
    status: Status
    progress: number
    dueDate: string
    updated?: string
    githubUrl?: string
    tags?: Tag[]
}

export interface ScheduleEvent {
    id: number
    title: string
    type: "Lecture" | "Lab" | "Study" | "Personal" | "Exam"
    day: string
    startTime: string
    endTime: string
    location?: string
    subjectId?: string
}

export interface Resource {
    id: number
    title: string
    url: string
    type: string
    category: string
    subjectId?: string
    syllabusModuleId?: string
    scoutedByAi?: boolean
}

export interface Exam {
    id: number
    title: string
    subjectId: string
    type: "CAT1" | "CAT2" | "FAT" | "Lab"
    date: string
    time?: string
    syllabus?: string
}

export interface DailyLog {
    id: number
    date: string
    mood: number
    studyTime: number
    note?: string
    sleep?: number
    subjectId?: string
}

interface StoreContextType {
    // Data
    settings: UserSettings | null
    semesters: Semester[]
    currentSemester: Semester | null
    subjects: Subject[]
    todos: Todo[]
    assignments: Assignment[]
    projects: Project[]
    schedule: ScheduleEvent[]
    resources: Resource[]
    exams: Exam[]
    dailyLogs: DailyLog[]
    isLoading: boolean // New state

    // Library
    books: Book[]
    ideas: Idea[]
    snippets: Snippet[]

    // Tags (site-wide)
    tags: Tag[]

    // Settings
    updateSettings: (settings: Partial<UserSettings>) => void

    // Semesters
    addSemester: (semester: any) => void
    updateSemester: (semester: Semester) => void
    deleteSemester: (id: number) => void
    setCurrentSemester: (id: number) => void

    // Subjects
    addSubject: (subject: Omit<Subject, "id" | "marks" | "modules">) => void
    updateSubject: (subject: Partial<Subject> & { id: string }) => void
    deleteSubject: (id: string) => void

    // Modules (Syllabus)
    addModule: (subjectId: string, module: Omit<Module, "id">) => void
    updateModule: (subjectId: string, module: Module) => void
    deleteModule: (subjectId: string, moduleId: string) => void

    // Todos
    addTodo: (todo: Omit<Todo, "id" | "subtasks" | "tags"> & { tagIds?: string[] }) => void
    updateTodo: (id: string, updates: Partial<Todo> & { tagIds?: string[] }) => void
    toggleTodo: (id: string, completed: boolean) => void
    deleteTodo: (id: string) => void
    addSubtask: (parentId: string, text: string) => void
    rescheduleOverdue: (strategy: 'tomorrow' | 'spread' | 'ruthless' | 'ai') => Promise<void>

    // Tags
    fetchTags: () => void
    addTag: (tag: Omit<Tag, "id">) => Promise<Tag>
    updateTag: (id: string, updates: Partial<Tag>) => void
    deleteTag: (id: string) => void

    // Assignments
    addAssignment: (assignment: any) => void
    updateAssignment: (assignment: Assignment) => void
    deleteAssignment: (id: number) => void

    // Projects
    addProject: (project: any) => void
    updateProject: (project: Project) => void
    deleteProject: (id: number) => void
    updateProjectStatus: (id: string, status: any) => void

    // Schedule
    addScheduleEvent: (event: any) => void
    updateScheduleEvent: (event: any) => void
    deleteScheduleEvent: (id: number) => void

    // Resources
    addResource: (resource: any) => void
    deleteResource: (id: number) => void

    addExam: (exam: any) => void
    deleteExam: (id: number) => void
    addDailyLog: (log: Omit<DailyLog, "id">) => void

    // New Features
    addBook: (book: Omit<Book, "id">) => void
    updateBook: (id: string, updates: Partial<Book>) => void
    deleteBook: (id: string) => void

    addIdea: (idea: Omit<Idea, "id">) => void
    updateIdea: (id: string, updates: Partial<Idea>) => void
    deleteIdea: (id: string) => void

    addSnippet: (snippet: Omit<Snippet, "id">) => void
    deleteSnippet: (id: string) => void

    refreshData: () => Promise<void>
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<UserSettings | null>(null)
    const [semesters, setSemesters] = useState<Semester[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [todos, setTodos] = useState<Todo[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [schedule, setSchedule] = useState<ScheduleEvent[]>([])
    const [resources, setResources] = useState<Resource[]>([])
    const [exams, setExams] = useState<Exam[]>([])
    const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // NEW STATE
    const [books, setBooks] = useState<Book[]>([])
    const [ideas, setIdeas] = useState<Idea[]>([])
    const [snippets, setSnippets] = useState<Snippet[]>([])
    const [tags, setTags] = useState<Tag[]>([])

    const currentSemester = semesters.find(s => s.isCurrent) || null

    // --- Initial Data Fetch ---
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Fetch all data in parallel
            const [settingsRes, semsRes, todosRes, assignsRes, projectsRes, subjectsRes, scheduleRes, resourcesRes, examsRes, logsRes, booksRes, ideasRes, snippetsRes] = await Promise.all([
                fetch('/api/settings'),
                fetch('/api/semesters'),
                fetch('/api/todos'),
                fetch('/api/assignments'),
                fetch('/api/projects'),
                fetch('/api/academics'),
                fetch('/api/schedule'),
                fetch('/api/resources'),
                fetch('/api/exams'),
                fetch('/api/logs'),
                fetch('/api/library'),
                fetch('/api/ideas'),
                fetch('/api/snippets')
            ])

            // Parse each response safely
            const settingsData = settingsRes.ok ? await settingsRes.json() : null
            const semsData = semsRes.ok ? await semsRes.json() : []
            const todosData = todosRes.ok ? await todosRes.json() : []
            const rawAssigns = assignsRes.ok ? await assignsRes.json() : []
            // Map backend fields (subject, due) to frontend (course, dueDate)
            const assignsData = rawAssigns.map((a: any) => ({
                ...a,
                course: a.subject,
                dueDate: a.due
            }))
            const projectsData = projectsRes.ok ? await projectsRes.json() : []
            const subjectsData = subjectsRes.ok ? await subjectsRes.json() : []
            const scheduleData = scheduleRes.ok ? await scheduleRes.json() : []
            const resourcesData = resourcesRes.ok ? await resourcesRes.json() : []
            const examsData = examsRes.ok ? await examsRes.json() : []
            const logsData = logsRes.ok ? await logsRes.json() : []

            if (settingsData) setSettings(settingsData)
            setSemesters(semsData)
            setTodos(todosData)
            setAssignments(assignsData)
            setSchedule(scheduleData)
            setResources(resourcesData)
            setExams(examsData)
            setDailyLogs(logsData)

            // Transform projects tech
            const formattedProjects = projectsData.map((p: any) => ({
                ...p,
                tech: p.tech ? p.tech.split(',') : []
            }))
            setProjects(formattedProjects)

            // Transform subjects marks
            const formattedSubjects = subjectsData.map((s: any) => ({
                ...s,
                marks: {
                    CAT1: s.cat1,
                    CAT2: s.cat2,
                    DA: s.da,
                    FAT: s.fat,
                    LabInternal: s.labInternal,
                    LabFAT: s.labFat
                }
            }))
            setSubjects(formattedSubjects)

            // NEW DATA
            if (booksRes.ok) setBooks(await booksRes.json())
            if (ideasRes.ok) setIdeas(await ideasRes.json())
            if (snippetsRes.ok) setSnippets(await snippetsRes.json())

            // Fetch tags
            const tagsRes = await fetch('/api/tags')
            if (tagsRes.ok) setTags(await tagsRes.json())

        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // === SETTINGS ===
    const updateSettings = async (newSettings: Partial<UserSettings>) => {
        if (!settings) return
        const updated = { ...settings, ...newSettings }
        setSettings(updated as UserSettings)
        await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) })
        toast.success("Settings saved")
    }

    // === SEMESTERS ===
    const addSemester = async (sem: any) => {
        const res = await fetch('/api/semesters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sem) })
        const saved = await res.json()
        setSemesters(prev => [saved, ...prev])
        if (sem.isCurrent) {
            setSemesters(prev => prev.map(s => ({ ...s, isCurrent: s.id === saved.id })))
        }
        toast.success("Semester created")
    }

    const updateSemester = async (semester: Semester) => {
        setSemesters(prev => prev.map(s => s.id === semester.id ? semester : s))
        await fetch('/api/semesters', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(semester) })
        toast.success("Semester updated")
    }

    const deleteSemester = async (id: number) => {
        setSemesters(prev => prev.filter(s => s.id !== id))
        await fetch(`/api/semesters?id=${id}`, { method: 'DELETE' })
        toast.info("Semester deleted")
    }

    const setCurrentSemester = async (id: number) => {
        setSemesters(prev => prev.map(s => ({ ...s, isCurrent: s.id === id })))
        await fetch('/api/semesters', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isCurrent: true }) })
        toast.success("Current semester updated")
    }

    // === SUBJECTS ===
    const addSubject = async (subject: Omit<Subject, "id" | "marks" | "modules">) => {
        const res = await fetch('/api/academics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subject) })
        const saved = await res.json()
        setSubjects(prev => [{ ...saved, marks: {} }, ...prev])
        toast.success("Subject added")
    }

    const updateSubject = async (subject: Partial<Subject> & { id: string }) => {
        setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, ...subject } : s))
        // Flatten marks for API
        const payload = {
            ...subject,
            cat1: subject.marks?.CAT1,
            cat2: subject.marks?.CAT2,
            da: subject.marks?.DA,
            fat: subject.marks?.FAT,
            labInternal: subject.marks?.LabInternal,
            labFat: subject.marks?.LabFAT
        }
        await fetch('/api/academics', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        toast.success("Subject updated")
    }

    const deleteSubject = async (id: string) => {
        setSubjects(prev => prev.filter(s => s.id !== id))
        await fetch(`/api/academics?id=${id}`, { method: 'DELETE' })
        toast.info("Subject deleted")
    }

    // Modules (Syllabus)
    const addModule = (subjectId: string, module: Omit<Module, "id">) => {
        setSubjects(prev => prev.map(sub => {
            if (sub.id === subjectId) {
                const newModule = { ...module, id: Date.now().toString() }
                return { ...sub, modules: [...(sub.modules || []), newModule] }
            }
            return sub
        }))
    }

    const updateModule = (subjectId: string, module: Module) => {
        setSubjects(prev => prev.map(sub => {
            if (sub.id === subjectId) {
                return {
                    ...sub,
                    modules: sub.modules?.map(m => m.id === module.id ? module : m)
                }
            }
            return sub
        }))
    }

    const deleteModule = (subjectId: string, moduleId: string) => {
        setSubjects(prev => prev.map(sub => {
            if (sub.id === subjectId) {
                return {
                    ...sub,
                    modules: sub.modules?.filter(m => m.id !== moduleId)
                }
            }
            return sub
        }))
        toast.success("Module deleted")
    }

    // === TODOS ===
    const addTodo = async (todo: Omit<Todo, "id" | "subtasks" | "tags"> & { tagIds?: string[] }) => {
        const tempId = Date.now().toString()
        const newTodo: Todo = { ...todo, id: tempId, priority: todo.priority || 4, subtasks: [], tags: [], isOptimistic: true }
        setTodos([newTodo, ...todos])
        const res = await fetch('/api/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(todo) })
        if (res.ok) {
            const saved = await res.json()
            setTodos(prev => prev.map(t => t.id === tempId ? saved : t))
            toast.success("Task added")
        }
    }

    const updateTodo = async (id: string, updates: Partial<Todo> & { tagIds?: string[] }) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
        await fetch('/api/todos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) })
        toast.success("Task updated")
    }

    const toggleTodo = async (id: string, currentStatus: boolean) => {
        setTodos(todos.map(t => t.id === id ? { ...t, completed: !currentStatus } : t))
        await fetch('/api/todos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, completed: !currentStatus }) })
    }

    const deleteTodo = async (id: string) => {
        setTodos(todos.filter(t => t.id !== id))
        await fetch(`/api/todos?id=${id}`, { method: 'DELETE' })
        toast.info("Task deleted")
    }

    const addSubtask = async (parentId: string, text: string) => {
        const res = await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, parentId, priority: 4 })
        })
        if (res.ok) {
            const saved = await res.json()
            setTodos(prev => prev.map(t =>
                t.id === parentId
                    ? { ...t, subtasks: [...(t.subtasks || []), saved] }
                    : t
            ))
            toast.success("Subtask added")
        }
    }

    const rescheduleOverdue = async (strategy: 'tomorrow' | 'spread' | 'ruthless' | 'ai') => {
        const res = await fetch('/api/ai/reschedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strategy })
        })
        if (res.ok) {
            const data = await res.json()
            toast.success(`Rescheduled ${data.count} tasks!`)
            // Refetch todos
            const todosRes = await fetch('/api/todos')
            if (todosRes.ok) {
                const todosData = await todosRes.json()
                setTodos(todosData)
            }
        } else {
            toast.error("Failed to reschedule")
        }
    }

    // === TAGS ===
    const fetchTags = async () => {
        const res = await fetch('/api/tags')
        if (res.ok) {
            const data = await res.json()
            setTags(data)
        }
    }

    const addTag = async (tag: Omit<Tag, "id">): Promise<Tag> => {
        const res = await fetch('/api/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tag) })
        const saved = await res.json()
        setTags(prev => [...prev, saved])
        toast.success("Tag created")
        return saved
    }

    const updateTag = async (id: string, updates: Partial<Tag>) => {
        setTags(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
        await fetch('/api/tags', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) })
        toast.success("Tag updated")
    }

    const deleteTag = async (id: string) => {
        setTags(prev => prev.filter(t => t.id !== id))
        await fetch(`/api/tags?id=${id}`, { method: 'DELETE' })
        toast.info("Tag deleted")
    }

    // === ASSIGNMENTS ===
    const addAssignment = async (assignment: Omit<Assignment, "id">) => {
        const tempId = Date.now()
        setAssignments([{ ...assignment, id: tempId, status: "Pending" }, ...assignments])

        // Map frontend fields to backend
        const backendData = {
            ...assignment,
            subject: assignment.course,
            due: assignment.dueDate
        }

        const res = await fetch('/api/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(backendData) })
        if (res.ok) {
            const saved = await res.json()
            // Map back to frontend
            const savedFrontend = { ...saved, course: saved.subject, dueDate: saved.due }
            setAssignments(prev => prev.map(a => a.id === tempId ? savedFrontend : a))
            toast.success("Assignment created")
        }
    }

    const updateAssignment = async (assignment: Assignment) => {
        setAssignments(prev => prev.map(a => a.id === assignment.id ? assignment : a))

        // Map frontend fields to backend
        const backendData = {
            ...assignment,
            subject: assignment.course,
            due: assignment.dueDate
        }

        await fetch('/api/assignments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(backendData) })
        toast.success("Assignment updated")
    }

    const deleteAssignment = async (id: number) => {
        setAssignments(prev => prev.filter(a => a.id !== id))
        await fetch(`/api/assignments?id=${id}`, { method: 'DELETE' })
        toast.info("Assignment deleted")
    }

    // === PROJECTS ===
    const addProject = async (project: Omit<Project, "id" | "updated">) => {
        const tempId = Date.now()
        setProjects([{ ...project, id: tempId, updated: "Just now" }, ...projects])
        const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(project) })
        if (res.ok) {
            const saved = await res.json()
            const formatted = { ...saved, tech: saved.tech ? saved.tech.split(',') : [] }
            setProjects(prev => prev.map(p => p.id === tempId ? formatted : p))
            toast.success("Project created")
        }
    }

    const updateProject = async (project: Project) => {
        setProjects(prev => prev.map(p => p.id === project.id ? project : p))
        const res = await fetch('/api/projects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(project) })
        if (res.ok) {
            const saved = await res.json()
            const formatted = { ...saved, tech: saved.tech ? saved.tech.split(',') : [] }
            setProjects(prev => prev.map(p => p.id === project.id ? formatted : p))
        }
    }

    const deleteProject = async (id: number) => {
        setProjects(projects.filter(p => p.id !== id))
        await fetch(`/api/projects?id=${id}`, { method: 'DELETE' })
        toast.info("Project deleted")
    }

    // === SCHEDULE ===
    const addScheduleEvent = async (event: Omit<ScheduleEvent, "id">) => {
        const tempId = Date.now()
        setSchedule([...schedule, { ...event, id: tempId }])
        const res = await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) })
        if (res.ok) {
            const saved = await res.json()
            setSchedule(prev => prev.map(s => s.id === tempId ? saved : s))
            toast.success("Event scheduled")
        }
    }

    const updateScheduleEvent = async (event: ScheduleEvent) => {
        setSchedule(prev => prev.map(s => s.id === event.id ? event : s))
        const res = await fetch('/api/schedule', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) })
        if (res.ok) {
            toast.success("Event updated")
        } else {
            toast.error("Failed to update event")
        }
    }

    const deleteScheduleEvent = async (id: number) => {
        setSchedule(schedule.filter(s => s.id !== id))
        await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' })
        toast.info("Event removed")
    }

    // === RESOURCES ===
    const addResource = async (resource: Omit<Resource, "id">) => {
        const tempId = Date.now()
        setResources([...resources, { ...resource, id: tempId }])
        const res = await fetch('/api/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resource) })
        if (res.ok) {
            const saved = await res.json()
            setResources(prev => prev.map(r => r.id === tempId ? saved : r))
            toast.success("Resource saved")
        }
    }

    const deleteResource = async (id: number) => {
        try {
            await fetch(`/api/resources?id=${id}`, { method: 'DELETE' })
            setResources(prev => prev.filter(r => r.id !== id))
            toast.success("Resource deleted")
        } catch (error) {
            toast.error("Failed to delete resource")
        }
    }

    const addExam = async (exam: Omit<Exam, "id">) => {
        try {
            const res = await fetch('/api/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(exam)
            })

            if (!res.ok) throw new Error("Failed to add exam")

            const data = await res.json()
            setExams(prev => [...prev, data])
            toast.success("Exam added")
        } catch (error) {
            console.error(error)
            toast.error("Failed to add exam")
        }
    }

    const deleteExam = async (id: number) => {
        try {
            await fetch(`/api/exams?id=${id}`, { method: 'DELETE' })
            setExams(prev => prev.filter(e => e.id !== id))
            toast.success("Exam deleted")
        } catch (error) {
            toast.error("Failed to delete exam")
        }
    }

    const addDailyLog = async (log: Omit<DailyLog, "id">) => {
        try {
            const res = await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(log)
            })
            const data = await res.json()
            setDailyLogs(prev => [data, ...prev])
            toast.success("Day logged")
        } catch (error) {
            toast.error("Failed to log day")
        }
    }

    const updateProjectStatus = async (id: string, status: any) => {
        setProjects(prev => prev.map(p => p.id === Number(id) ? { ...p, status } : p))
        await fetch('/api/projects', { method: 'PUT', body: JSON.stringify({ id, status }) })
    }

    // Library Methods
    const addBook = async (book: Omit<Book, "id">) => {
        const res = await fetch('/api/library', { method: 'POST', body: JSON.stringify(book) })
        if (res.ok) {
            const newBook = await res.json()
            setBooks(prev => [newBook, ...prev])
        }
    }

    const updateBook = async (id: string, updates: Partial<Book>) => {
        setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
        await fetch('/api/library', { method: 'PUT', body: JSON.stringify({ id, ...updates }) })
    }

    const deleteBook = async (id: string) => {
        setBooks(prev => prev.filter(b => b.id !== id))
        await fetch(`/api/library?id=${id}`, { method: 'DELETE' })
    }

    // Idea Methods
    const addIdea = async (idea: Omit<Idea, "id">) => {
        const res = await fetch('/api/ideas', { method: 'POST', body: JSON.stringify(idea) })
        if (res.ok) {
            const newIdea = await res.json()
            setIdeas(prev => [newIdea, ...prev])
        }
    }

    const updateIdea = async (id: string, updates: Partial<Idea>) => {
        setIdeas(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
        await fetch('/api/ideas', { method: 'PUT', body: JSON.stringify({ id, ...updates }) })
    }

    const deleteIdea = async (id: string) => {
        setIdeas(prev => prev.filter(i => i.id !== id))
        await fetch(`/api/ideas?id=${id}`, { method: 'DELETE' })
    }

    // Snippet Methods
    const addSnippet = async (snippet: Omit<Snippet, "id">) => {
        const res = await fetch('/api/snippets', { method: 'POST', body: JSON.stringify(snippet) })
        if (res.ok) {
            const newSnippet = await res.json()
            setSnippets(prev => [newSnippet, ...prev])
        }
    }

    const deleteSnippet = async (id: string) => {
        setSnippets(prev => prev.filter(s => s.id !== id))
        await fetch(`/api/snippets?id=${id}`, { method: 'DELETE' })
    }

    return (
        <StoreContext.Provider value={{
            settings,
            semesters,
            currentSemester,
            subjects,
            todos,
            assignments,
            projects,
            schedule,
            resources,
            exams,
            dailyLogs,
            isLoading,
            books,
            ideas,
            snippets,
            tags,
            updateSettings,
            addSemester,
            updateSemester,
            deleteSemester,
            setCurrentSemester,
            addSubject,
            updateSubject,
            deleteSubject,
            addModule,
            updateModule,
            deleteModule,
            addTodo,
            updateTodo,
            toggleTodo,
            deleteTodo,
            addSubtask,
            rescheduleOverdue,
            fetchTags,
            addTag,
            updateTag,
            deleteTag,
            addAssignment,
            updateAssignment,
            deleteAssignment,
            addProject,
            updateProject,
            deleteProject,
            updateProjectStatus,
            addScheduleEvent,
            updateScheduleEvent,
            deleteScheduleEvent,
            addResource,
            deleteResource,
            addExam,
            deleteExam,
            addDailyLog,
            addBook,
            updateBook,
            deleteBook,
            addIdea,
            updateIdea,
            deleteIdea,
            addSnippet,
            deleteSnippet,
            refreshData: fetchData
        }}>
            {children}
        </StoreContext.Provider>
    )
}

export function useStore() {
    const context = useContext(StoreContext)
    if (context === undefined) {
        throw new Error("useStore must be used within a StoreProvider")
    }
    return context
}
