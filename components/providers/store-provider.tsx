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

export interface Todo {
    id: string
    text: string
    completed: boolean
    category: "today" | "upcoming" | "backlog"
    dueDate?: string
    subjectId?: string
}

// Added missing interfaces
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
    dueDate: string
    updated?: string
}

export interface ScheduleEvent {
    id: number
    title: string
    type: "Lecture" | "Lab" | "Study" | "Personal"
    day: string
    startTime: string
    endTime: string
    location?: string
}

export interface Resource {
    id: number
    title: string
    url: string
    type: "pdf" | "video" | "link"
    category: string
    subjectId?: string
}

export interface Exam {
    id: number
    subjectId: string
    type: "CAT1" | "CAT2" | "FAT" | "Lab"
    date: string
    time?: string
    syllabus?: string
}

export interface DailyLog {
    id: number
    date: string
    mood: number // 1-5 or similar
    focusMinutes: number
    notes?: string
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
    logs: DailyLog[]

    // Settings
    updateSettings: (settings: Partial<UserSettings>) => void

    // Semesters
    addSemester: (semester: Omit<Semester, "id">) => void
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
    addTodo: (todo: Omit<Todo, "id">) => void
    toggleTodo: (id: string, currentStatus: boolean) => void
    deleteTodo: (id: string) => void

    // Assignments
    addAssignment: (assignment: Omit<Assignment, "id">) => void
    updateAssignment: (assignment: Assignment) => void
    deleteAssignment: (id: number) => void

    // Projects
    addProject: (project: Omit<Project, "id" | "updated">) => void
    updateProject: (project: Project) => void
    deleteProject: (id: number) => void

    // Schedule
    addScheduleEvent: (event: Omit<ScheduleEvent, "id">) => void
    deleteScheduleEvent: (id: number) => void

    // Resources
    addResource: (resource: Omit<Resource, "id">) => void
    deleteResource: (id: number) => void

    addExam: (exam: Omit<Exam, "id">) => void
    deleteExam: (id: number) => void
    addLog: (log: Omit<DailyLog, "id">) => void
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
    const [logs, setLogs] = useState<DailyLog[]>([])

    const currentSemester = semesters.find(s => s.isCurrent) || null

    // --- Initial Data Fetch ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all data in parallel
                const [settingsRes, semsRes, todosRes, assignsRes, projectsRes, subjectsRes, scheduleRes, resourcesRes, examsRes, logsRes] = await Promise.all([
                    fetch('/api/settings'),
                    fetch('/api/semesters'),
                    fetch('/api/todos'),
                    fetch('/api/assignments'),
                    fetch('/api/projects'),
                    fetch('/api/academics'),
                    fetch('/api/schedule'),
                    fetch('/api/resources'),
                    fetch('/api/exams'),
                    fetch('/api/logs')
                ])

                // Parse each response safely
                const settingsData = settingsRes.ok ? await settingsRes.json() : null
                const semsData = semsRes.ok ? await semsRes.json() : []
                const todosData = todosRes.ok ? await todosRes.json() : []
                const assignsData = assignsRes.ok ? await assignsRes.json() : []
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
                setLogs(logsData)

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

            } catch (error) {
                console.error("Failed to fetch data:", error)
            }
        }
        fetchData()
    }, [])

    // === SETTINGS ===
    const updateSettings = async (data: Partial<UserSettings>) => {
        const updated = { ...settings, ...data }
        setSettings(updated as UserSettings)
        await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) })
        toast.success("Settings saved")
    }

    // === SEMESTERS ===
    const addSemester = async (semester: Omit<Semester, "id">) => {
        const res = await fetch('/api/semesters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(semester) })
        const saved = await res.json()
        setSemesters(prev => [saved, ...prev])
        if (semester.isCurrent) {
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
    const addSubject = async (subject: Omit<Subject, "id" | "marks">) => {
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
    const addTodo = async (todo: Omit<Todo, "id">) => {
        const tempId = Date.now().toString()
        setTodos([{ ...todo, id: tempId }, ...todos])
        const res = await fetch('/api/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(todo) })
        if (res.ok) {
            const saved = await res.json()
            setTodos(prev => prev.map(t => t.id === tempId ? saved : t))
            toast.success("Todo added")
        }
    }

    const toggleTodo = async (id: string, currentStatus: boolean) => {
        setTodos(todos.map(t => t.id === id ? { ...t, completed: !currentStatus } : t))
        await fetch('/api/todos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, completed: !currentStatus }) })
    }

    const deleteTodo = async (id: string) => {
        setTodos(todos.filter(t => t.id !== id))
        await fetch(`/api/todos?id=${id}`, { method: 'DELETE' })
        toast.info("Todo deleted")
    }

    // === ASSIGNMENTS ===
    const addAssignment = async (assignment: Omit<Assignment, "id">) => {
        const tempId = Date.now()
        setAssignments([{ ...assignment, id: tempId, status: "Pending" }, ...assignments])
        const res = await fetch('/api/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(assignment) })
        if (res.ok) {
            const saved = await res.json()
            setAssignments(prev => prev.map(a => a.id === tempId ? saved : a))
            toast.success("Assignment created")
        }
    }

    const updateAssignment = async (assignment: Assignment) => {
        setAssignments(prev => prev.map(a => a.id === assignment.id ? assignment : a))
        await fetch('/api/assignments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(assignment) })
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
            const data = await res.json()
            setExams(prev => [...prev, data])
            toast.success("Exam added")
        } catch (error) {
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

    const addLog = async (log: Omit<DailyLog, "id">) => {
        try {
            const res = await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(log)
            })
            const data = await res.json()
            setLogs(prev => [...prev, data])
            toast.success("Day logged")
        } catch (error) {
            toast.error("Failed to log day")
        }
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
            logs,
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
            toggleTodo,
            deleteTodo,
            addAssignment,
            updateAssignment,
            deleteAssignment,
            addProject,
            updateProject,
            deleteProject,
            addScheduleEvent,
            deleteScheduleEvent,
            addResource,
            deleteResource,
            addExam,
            deleteExam,
            addLog
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
