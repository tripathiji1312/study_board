"use client"

import * as React from "react"
import { useStore } from "@/components/providers/store-provider"
import { Shell } from "@/components/ui/shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { IconCode, IconFileText, IconTrash, IconCopy, IconPlus, IconSearch, IconCheck, IconEye, IconEdit, IconArrowLeft } from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

const LANGUAGES = [
    { value: "javascript", label: "JavaScript", color: "bg-yellow-500" },
    { value: "typescript", label: "TypeScript", color: "bg-blue-500" },
    { value: "python", label: "Python", color: "bg-green-500" },
    { value: "html", label: "HTML", color: "bg-orange-500" },
    { value: "css", label: "CSS", color: "bg-purple-500" },
    { value: "sql", label: "SQL", color: "bg-pink-500" },
    { value: "json", label: "JSON", color: "bg-gray-500" },
    { value: "markdown", label: "Markdown", color: "bg-teal-500" },
    { value: "text", label: "Plain Text", color: "bg-slate-500" },
    { value: "bash", label: "Bash/Shell", color: "bg-emerald-500" },
    { value: "java", label: "Java", color: "bg-red-500" },
    { value: "cpp", label: "C/C++", color: "bg-indigo-500" },
]

type Snippet = {
    id: string
    title: string
    content: string
    language: string
    type: string
}

export default function SnippetsPage() {
    const { snippets, addSnippet, deleteSnippet } = useStore()
    const [search, setSearch] = React.useState("")
    const [selectedId, setSelectedId] = React.useState<string | null>(null)
    const [isCreating, setIsCreating] = React.useState(false)
    const [viewMode, setViewMode] = React.useState<"preview" | "raw">("preview")

    // New snippet form
    const [newTitle, setNewTitle] = React.useState("")
    const [newContent, setNewContent] = React.useState("")
    const [newLanguage, setNewLanguage] = React.useState("javascript")

    const safeSnippets = snippets || []

    const filtered = safeSnippets.filter(s =>
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.content?.toLowerCase().includes(search.toLowerCase())
    )

    const selectedSnippet = safeSnippets.find(s => s.id === selectedId) as Snippet | undefined

    const getLangConfig = (lang: string) =>
        LANGUAGES.find(l => l.value === lang) || LANGUAGES[LANGUAGES.length - 1]

    const handleCreate = () => {
        if (!newTitle.trim()) {
            toast.error("Please add a title")
            return
        }
        addSnippet({
            title: newTitle,
            content: newContent,
            type: newLanguage === 'text' || newLanguage === 'markdown' ? 'text' : 'code',
            language: newLanguage
        })
        setNewTitle("")
        setNewContent("")
        setIsCreating(false)
        toast.success("Snippet created! ✨")
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard!")
    }

    const handleDelete = (id: string) => {
        deleteSnippet(id)
        if (selectedId === id) setSelectedId(null)
        toast.success("Snippet deleted")
    }

    // Render content based on language
    const renderContent = (snippet: Snippet) => {
        if (snippet.language === "markdown") {
            return (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                        components={{
                            code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || "")
                                return !inline && match ? (
                                    <SyntaxHighlighter
                                        style={oneDark as any}
                                        language={match[1]}
                                        PreTag="div"
                                        className="rounded-lg !bg-muted/50 !p-4"
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                ) : (
                                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>
                                        {children}
                                    </code>
                                )
                            },
                        }}
                    >
                        {snippet.content}
                    </ReactMarkdown>
                </div>
            )
        }

        if (snippet.language === "text") {
            return (
                <pre className="font-mono text-sm whitespace-pre-wrap p-4 rounded-lg bg-muted/50 border">
                    {snippet.content}
                </pre>
            )
        }

        // Code with syntax highlighting
        return (
            <SyntaxHighlighter
                style={oneDark as any}
                language={snippet.language}
                showLineNumbers
                wrapLines
                className="rounded-lg !text-sm"
                customStyle={{
                    margin: 0,
                    padding: "1rem",
                    background: "hsl(var(--muted) / 0.5)",
                    border: "1px solid hsl(var(--border))",
                }}
            >
                {snippet.content}
            </SyntaxHighlighter>
        )
    }

    return (
        <Shell className="p-0 md:p-0">
            <div className="flex h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] overflow-hidden">
                {/* Left Panel - List */}
                <div className={cn(
                    "flex-col border-r bg-card flex-shrink-0 transition-all duration-300",
                    (selectedId || isCreating) ? "hidden md:flex w-72 lg:w-80" : "flex w-full md:w-72 lg:w-80"
                )}>
                    {/* Header */}
                    <div className="p-4 border-b space-y-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-lg font-bold flex items-center gap-2">
                                <IconCode className="w-5 h-5 text-primary" />
                                Snippets
                            </h1>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setIsCreating(true)
                                    setSelectedId(null)
                                }}
                            >
                                <IconPlus className="w-4 h-4 mr-1" />
                                New
                            </Button>
                        </div>
                        <div className="relative">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search snippets..."
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Snippet List */}
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {filtered.map(item => {
                                const langConfig = getLangConfig(item.language)
                                const isSelected = selectedId === item.id
                                const preview = item.content?.substring(0, 60) + (item.content?.length > 60 ? '...' : '')

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setSelectedId(item.id)
                                            setIsCreating(false)
                                        }}
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg transition-colors",
                                            isSelected
                                                ? "bg-primary/10 ring-1 ring-primary/20"
                                                : "hover:bg-muted/50"
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <div className={cn("w-1 self-stretch rounded-full flex-shrink-0", langConfig.color)} />
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <h3 className="font-medium text-sm truncate">{item.title}</h3>
                                                <p className="text-xs text-muted-foreground line-clamp-2 font-mono">{preview}</p>
                                                <Badge variant="secondary" className="text-[10px] h-5 mt-1">
                                                    {langConfig.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}

                            {filtered.length === 0 && !isCreating && (
                                <div className="p-8 text-center text-muted-foreground">
                                    <IconCode className="w-8 h-8 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No snippets yet</p>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => setIsCreating(true)}
                                    >
                                        Create your first snippet
                                    </Button>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Right Panel - Detail / Editor */}
                <div className={cn(
                    "flex-col bg-background min-w-0 transition-all duration-300",
                    (selectedId || isCreating) ? "flex flex-1" : "hidden md:flex flex-1"
                )}>
                    {isCreating ? (
                        // New Snippet Editor
                        <>
                            <div className="h-14 px-4 md:px-6 border-b flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden -ml-2"
                                        onClick={() => setIsCreating(false)}
                                    >
                                        <IconArrowLeft className="w-5 h-5" />
                                    </Button>
                                    <Select value={newLanguage} onValueChange={setNewLanguage}>
                                        <SelectTrigger className="w-32 md:w-44">
                                            <div className="flex items-center gap-2">
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LANGUAGES.map(lang => (
                                                <SelectItem key={lang.value} value={lang.value}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("w-2 h-2 rounded-full", lang.color)} />
                                                        {lang.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleCreate}>
                                        <IconCheck className="w-4 h-4 mr-1" /> Save
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="px-6 pt-6 pb-2">
                                    <Input
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        placeholder="Untitled Snippet"
                                        className="text-xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40 bg-transparent"
                                    />
                                </div>
                                <div className="flex-1 px-6 pb-6">
                                    <Textarea
                                        value={newContent}
                                        onChange={e => setNewContent(e.target.value)}
                                        placeholder={newLanguage === "markdown"
                                            ? "# Heading\n\nWrite your markdown here...\n\n```javascript\nconst code = 'highlighted';\n```"
                                            : "Start typing your code here..."
                                        }
                                        className="w-full h-full resize-none font-mono text-sm border rounded-lg p-4 focus-visible:ring-1 bg-muted/30"
                                    />
                                </div>
                            </div>
                        </>
                    ) : selectedSnippet ? (
                        // View Selected Snippet
                        <>
                            <div className="h-14 px-4 md:px-6 border-b flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden -ml-2 shrink-0"
                                        onClick={() => setSelectedId(null)}
                                    >
                                        <IconArrowLeft className="w-5 h-5" />
                                    </Button>
                                    <div className={cn("w-3 h-3 rounded-full shrink-0", getLangConfig(selectedSnippet.language).color)} />
                                    <span className="font-medium text-sm hidden md:inline">{getLangConfig(selectedSnippet.language).label}</span>
                                    {selectedSnippet.language === "markdown" && (
                                        <div className="flex items-center border rounded-lg p-0.5 ml-2">
                                            <Button
                                                variant={viewMode === "preview" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-7 px-2"
                                                onClick={() => setViewMode("preview")}
                                            >
                                                <IconEye className="w-3 h-3 mr-1" />
                                                <span className="hidden sm:inline">Preview</span>
                                            </Button>
                                            <Button
                                                variant={viewMode === "raw" ? "secondary" : "ghost"}
                                                size="sm"
                                                className="h-7 px-2"
                                                onClick={() => setViewMode("raw")}
                                            >
                                                <IconEdit className="w-3 h-3 mr-1" />
                                                <span className="hidden sm:inline">Raw</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(selectedSnippet.content)}
                                    >
                                        <IconCopy className="w-4 h-4 mr-1" />
                                        <span className="hidden sm:inline">Copy</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDelete(selectedSnippet.id)}
                                    >
                                        <IconTrash className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-6">
                                    <h1 className="text-xl font-bold mb-4">{selectedSnippet.title}</h1>
                                    {selectedSnippet.language === "markdown" && viewMode === "raw" ? (
                                        <pre className="font-mono text-sm whitespace-pre-wrap p-4 rounded-lg bg-muted/50 border">
                                            {selectedSnippet.content}
                                        </pre>
                                    ) : (
                                        renderContent(selectedSnippet)
                                    )}
                                </div>
                            </ScrollArea>
                        </>
                    ) : (
                        // Empty State
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            <div className="text-center space-y-2">
                                <IconFileText className="w-12 h-12 mx-auto opacity-20" />
                                <p className="font-medium">Select a snippet</p>
                                <p className="text-sm">or create a new one</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Shell>
    )
}
