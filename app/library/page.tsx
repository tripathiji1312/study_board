"use client"

import * as React from "react"
import { useStore } from "@/components/providers/store-provider"
import { Shell } from "@/components/ui/shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { IconBook, IconPlus, IconTrash, IconCheck, IconBook2, IconClock } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function LibraryPage() {
    const { books, addBook, updateBook, deleteBook } = useStore()
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [filter, setFilter] = React.useState("all")

    // Form State
    const [title, setTitle] = React.useState("")
    const [author, setAuthor] = React.useState("")
    const [total, setTotal] = React.useState("300")
    const [dueDate, setDueDate] = React.useState("")

    const handleSubmit = () => {
        if (!title || !author) return
        addBook({
            title,
            author,
            total: parseInt(total),
            progress: 0,
            status: "toread",
            dueDate: dueDate || undefined
        })
        setIsDialogOpen(false)
        setTitle("")
        setAuthor("")
        setDueDate("")
    }

    const filteredBooks = books.filter(b => filter === "all" || b.status === filter)

    // Calculate overall stats
    const totalBooks = books.length
    const completed = books.filter(b => b.status === 'completed').length
    const reading = books.filter(b => b.status === 'reading').length

    return (
        <Shell>
            <div className="flex flex-col space-y-8 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <IconBook2 className="h-8 w-8 text-primary" />
                            </div>
                            Library Tracker
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl">
                            Track your reading journey. Keep tabs on your progress and never miss a library due date.
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="shadow-lg hover:shadow-primary/20 transition-all">
                                <IconPlus className="w-5 h-5 mr-2" />
                                Add New Book
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add to Library</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Book Title</label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Atomic Habits" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Author</label>
                                    <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="e.g. James Clear" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Total Pages</label>
                                        <Input type="number" value={total} onChange={e => setTotal(e.target.value)} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Due Date</label>
                                        <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSubmit} className="w-full">Add to Shelf</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-200/20 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Currently Reading</p>
                            <h3 className="text-3xl font-bold">{reading}</h3>
                        </div>
                        <IconBook className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-500/10 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-200/20 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Completed</p>
                            <h3 className="text-3xl font-bold">{completed}</h3>
                        </div>
                        <IconCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-green-500/10 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-200/20 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">Total Collection</p>
                            <h3 className="text-3xl font-bold">{totalBooks}</h3>
                        </div>
                        <IconBook2 className="absolute -right-4 -bottom-4 w-24 h-24 text-purple-500/10 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                </div>

                {/* Navigation & Filters */}
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 border-b flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {['all', 'reading', 'toread', 'completed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                                filter === f
                                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                                    : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                            )}
                        >
                            {f === 'toread' ? 'To Read' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Books Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {filteredBooks.map(book => {
                        const progressPercent = Math.round((book.progress / book.total) * 100)

                        return (
                            <div key={book.id} className="group flex flex-col bg-card hover:bg-accent/5 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                                {/* Spine/Header Color */}
                                <div className={cn(
                                    "h-2 w-full",
                                    book.status === 'reading' ? "bg-blue-500" :
                                        book.status === 'completed' ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
                                )} />

                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start gap-4 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg leading-tight truncate" title={book.title}>
                                                {book.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                                        </div>
                                        {book.dueDate && (
                                            <div className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded border border-red-100 dark:border-red-900/30">
                                                Due {format(new Date(book.dueDate), "MMM d")}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-6 space-y-3">
                                        <div className="flex items-end justify-between text-sm">
                                            <span className="font-mono text-muted-foreground text-xs">
                                                {book.progress} / {book.total} pages
                                            </span>
                                            <span className={cn(
                                                "font-bold",
                                                book.status === 'completed' ? "text-green-600" : "text-primary"
                                            )}>
                                                {progressPercent}%
                                            </span>
                                        </div>
                                        <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full transition-all duration-500",
                                                    book.status === 'completed' ? "bg-green-500" : "bg-primary"
                                                )}
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions Overlay */}
                                <div className="p-3 border-t bg-muted/20 flex items-center justify-between gap-2 opacity-100 transition-opacity">
                                    {book.status === 'toread' && (
                                        <Button size="sm" variant="default" className="w-full h-8 text-xs font-semibold" onClick={() => updateBook(book.id, { status: "reading" })}>
                                            Start Reading
                                        </Button>
                                    )}
                                    {book.status === 'reading' && (
                                        <div className="flex gap-2 w-full">
                                            <Button size="sm" variant="secondary" className="flex-1 h-8 text-xs" onClick={() => {
                                                const newPage = prompt("Update page count:", book.progress.toString())
                                                if (newPage && !isNaN(parseInt(newPage))) {
                                                    updateBook(book.id, { progress: parseInt(newPage) })
                                                }
                                            }}>
                                                Update
                                            </Button>
                                            <Button size="icon" variant="outline" className="h-8 w-8 shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => updateBook(book.id, { status: "completed", progress: book.total })}>
                                                <IconCheck className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                    {book.status === 'completed' && (
                                        <div className="w-full flex items-center justify-center gap-2 text-green-600 font-medium text-xs py-1.5">
                                            <IconCheck className="w-4 h-4" />
                                            Wait for it... Done!
                                        </div>
                                    )}

                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground/50 hover:text-destructive shrink-0" onClick={() => deleteBook(book.id)}>
                                        <IconTrash className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}

                    {filteredBooks.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
                            <div className="mb-4 p-4 rounded-full bg-background shadow-sm">
                                <IconBook className="w-10 h-10 opacity-20" />
                            </div>
                            <p className="font-medium">No books here yet.</p>
                            <p className="text-sm opacity-70">Add a book to start tracking your reading.</p>
                        </div>
                    )}
                </div>
            </div>
        </Shell>
    )
}
