"use client"

import useSWR from "swr"

// Generic fetcher for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

// SWR configuration for optimal caching
const swrConfig = {
    revalidateOnFocus: false,      // Don't refetch on window focus
    revalidateIfStale: false,      // Use cache first
    dedupingInterval: 10000,       // Dedupe requests within 10s
    errorRetryCount: 2,            // Retry failed requests twice
    keepPreviousData: true,        // Keep stale data while revalidating
}

// Hook for fetching all subjects
export function useSubjects() {
    const { data, error, isLoading, mutate } = useSWR('/api/academics', fetcher, swrConfig)
    return {
        subjects: data || [],
        isLoading,
        isError: error,
        refresh: mutate
    }
}

// Hook for fetching todos
export function useTodos() {
    const { data, error, isLoading, mutate } = useSWR('/api/todos', fetcher, swrConfig)
    return {
        todos: data || [],
        isLoading,
        isError: error,
        refresh: mutate
    }
}

// Hook for fetching assignments
export function useAssignments() {
    const { data, error, isLoading, mutate } = useSWR('/api/assignments', fetcher, swrConfig)
    return {
        assignments: data || [],
        isLoading,
        isError: error,
        refresh: mutate
    }
}

// Hook for fetching exams
export function useExams() {
    const { data, error, isLoading, mutate } = useSWR('/api/exams', fetcher, swrConfig)
    return {
        exams: data || [],
        isLoading,
        isError: error,
        refresh: mutate
    }
}

// Hook for fetching daily logs
export function useDailyLogs() {
    const { data, error, isLoading, mutate } = useSWR('/api/logs', fetcher, swrConfig)
    return {
        logs: data || [],
        isLoading,
        isError: error,
        refresh: mutate
    }
}

// Hook for fetching syllabus modules
export function useSyllabusModules(subjectId: string) {
    const { data, error, isLoading, mutate } = useSWR(
        subjectId ? `/api/syllabus?subjectId=${subjectId}` : null,
        fetcher,
        swrConfig
    )
    return {
        modules: data || [],
        isLoading,
        isError: error,
        refresh: mutate
    }
}

// Preload function to warm up cache
export function preloadData() {
    // Trigger SWR to start fetching in background
    fetch('/api/academics')
    fetch('/api/todos')
    fetch('/api/assignments')
    fetch('/api/exams')
}
