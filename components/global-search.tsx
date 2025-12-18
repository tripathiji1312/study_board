"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    IconSearch,
    IconX,
    IconCheck,
    IconFolder,
    IconBulb,
    IconCode,
    IconFiles,
    IconTag,
    IconArrowRight,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface SearchResult {
    id: string | number
    _type: "todo" | "project" | "idea" | "snippet" | "resource" | "tag"
    text?: string
    title?: string
    content?: string
    description?: string
    name?: string
    color?: string
    usageCount?: number
    tags?: Array<{ id: string; name: string; color: string }>
}

interface SearchResponse {
    todos?: SearchResult[]
    projects?: SearchResult[]
    ideas?: SearchResult[]
    snippets?: SearchResult[]
    resources?: SearchResult[]
    tags?: SearchResult[]
    all?: SearchResult[]
    totalCount?: number
}

const TYPE_ICONS = {
    todo: IconCheck,
    project: IconFolder,
    idea: IconBulb,
    snippet: IconCode,
    resource: IconFiles,
    tag: IconTag,
}

const TYPE_LABELS = {
    todo: "Task",
    project: "Project",
    idea: "Idea",
    snippet: "Snippet",
    resource: "Resource",
    tag: "Tag",
}

const TYPE_ROUTES = {
    todo: "/todos",
    project: "/projects",
    idea: "/library?tab=ideas",
    snippet: "/library?tab=snippets",
    resource: "/resources",
    tag: "/todos?tag=",
}

export function GlobalSearch() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<SearchResponse | null>(null)
    const [loading, setLoading] = React.useState(false)
    const router = useRouter()

    // Keyboard shortcut
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    // Search debounce
    React.useEffect(() => {
        if (!query || query.length < 2) {
            setResults(null)
            return
        }

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
                if (res.ok) {
                    const data = await res.json()
                    setResults(data)
                }
            } catch (error) {
                console.error("Search failed:", error)
            }
            setLoading(false)
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = (result: SearchResult) => {
        const route = TYPE_ROUTES[result._type]
        if (result._type === "tag") {
            router.push(`${route}${result.id}`)
        } else {
            router.push(route)
        }
        setOpen(false)
        setQuery("")
    }

    const getResultTitle = (result: SearchResult) => {
        return result.text || result.title || result.content || result.name || "Untitled"
    }

    const getResultDescription = (result: SearchResult) => {
        if (result._type === "tag") {
            return `${result.usageCount || 0} items with this tag`
        }
        return result.description || result.content?.slice(0, 100)
    }

    return (
        <>
            {/* Search Trigger Button */}
            <Button
                variant="outline"
                className="relative h-9 w-full justify-start rounded-lg bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12"
                onClick={() => setOpen(true)}
            >
                <IconSearch className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline-flex">Search everything...</span>
                <span className="inline-flex lg:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>

            {/* Search Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="overflow-hidden p-0 shadow-lg sm:max-w-xl">
                    <DialogTitle className="sr-only">Global Search</DialogTitle>
                    <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                        <div className="flex items-center border-b px-3">
                            <IconSearch className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search tasks, projects, ideas, tags..."
                                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery("")}
                                    className="p-1 hover:bg-muted rounded"
                                >
                                    <IconX className="h-4 w-4 opacity-50" />
                                </button>
                            )}
                        </div>

                        <CommandList className="max-h-[400px]">
                            {!query && (
                                <div className="p-8 text-center text-muted-foreground">
                                    <IconSearch className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-sm">Start typing to search across all your content</p>
                                    <p className="text-xs mt-2">Search by name, tag, or description</p>
                                </div>
                            )}

                            {query && loading && (
                                <div className="p-8 text-center text-muted-foreground">
                                    <div className="animate-spin h-8 w-8 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full" />
                                    <p className="text-sm">Searching...</p>
                                </div>
                            )}

                            {query && !loading && (!results || results.totalCount === 0) && (
                                <CommandEmpty>
                                    <div className="p-8 text-center">
                                        <p>No results found for "{query}"</p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Try searching for a different term or tag
                                        </p>
                                    </div>
                                </CommandEmpty>
                            )}

                            {/* Tags */}
                            {results?.tags && results.tags.length > 0 && (
                                <CommandGroup heading="Tags">
                                    {results.tags.map((tag) => {
                                        const Icon = TYPE_ICONS[tag._type]
                                        return (
                                            <CommandItem
                                                key={`tag-${tag.id}`}
                                                onSelect={() => handleSelect(tag)}
                                                className="flex items-center gap-3 cursor-pointer"
                                            >
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: tag.color }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium">#{tag.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {tag.usageCount || 0} items
                                                    </p>
                                                </div>
                                                <IconArrowRight className="h-4 w-4 opacity-50" />
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                            )}

                            {/* Unified Results */}
                            {results?.all && results.all.length > 0 && (
                                <CommandGroup heading="Results">
                                    {results.all.slice(0, 10).map((result) => {
                                        const Icon = TYPE_ICONS[result._type]
                                        return (
                                            <CommandItem
                                                key={`${result._type}-${result.id}`}
                                                onSelect={() => handleSelect(result)}
                                                className="flex items-center gap-3 cursor-pointer"
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium truncate">
                                                            {getResultTitle(result)}
                                                        </p>
                                                        <Badge variant="secondary" className="text-[10px] px-1.5">
                                                            {TYPE_LABELS[result._type]}
                                                        </Badge>
                                                    </div>
                                                    {getResultDescription(result) && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {getResultDescription(result)}
                                                        </p>
                                                    )}
                                                    {result.tags && result.tags.length > 0 && (
                                                        <div className="flex gap-1 mt-1">
                                                            {result.tags.slice(0, 3).map(tag => (
                                                                <Badge
                                                                    key={tag.id}
                                                                    variant="outline"
                                                                    className="text-[9px] h-4 px-1"
                                                                    style={{ borderColor: tag.color, color: tag.color }}
                                                                >
                                                                    #{tag.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <IconArrowRight className="h-4 w-4 opacity-50 flex-shrink-0" />
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                            )}
                        </CommandList>

                        <div className="border-t p-2 text-xs text-muted-foreground flex items-center justify-between">
                            <span>
                                <kbd className="px-1.5 py-0.5 rounded bg-muted">↑↓</kbd> Navigate
                                <kbd className="ml-2 px-1.5 py-0.5 rounded bg-muted">↵</kbd> Select
                            </span>
                            <span>
                                <kbd className="px-1.5 py-0.5 rounded bg-muted">Esc</kbd> Close
                            </span>
                        </div>
                    </Command>
                </DialogContent>
            </Dialog>
        </>
    )
}
