"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconTrash, IconPlus, IconBan, IconExternalLink, IconShieldLock } from "@tabler/icons-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function DistractionBlocker() {
    const [sites, setSites] = React.useState<string[]>([])
    const [newSite, setNewSite] = React.useState("")

    React.useEffect(() => {
        if (typeof window === "undefined") return
        try {
            const saved = localStorage.getItem("blocked_sites")
            if (saved) {
                setSites(JSON.parse(saved))
            } else {
                setSites(["twitter.com", "instagram.com", "reddit.com", "youtube.com", "tiktok.com"])
            }
        } catch (e) {
            console.error("Failed to load blocked sites:", e)
            setSites(["twitter.com", "instagram.com", "reddit.com", "youtube.com", "tiktok.com"])
        }
    }, [])

    const saveSites = (updated: string[]) => {
        setSites(updated)
        try {
            localStorage.setItem("blocked_sites", JSON.stringify(updated))
        } catch (e) {
            console.error("Failed to save blocked sites:", e)
        }
    }

    const addSite = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSite.trim()) return
        const domain = newSite.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0]

        if (sites.includes(domain)) {
            toast.error("Site already listed")
            return
        }

        saveSites([...sites, domain])
        setNewSite("")
        toast.success("Added to your focus list")
    }

    const removeSite = (site: string) => {
        saveSites(sites.filter(s => s !== site))
        toast("Removed from list")
    }

    return (
        <div className="w-[340px] p-5 bg-surface-container-high/95 border border-white/10 backdrop-blur-2xl rounded-3xl text-foreground shadow-expressive">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <IconBan className="w-5 h-5 text-red-500" />
                </div>
                <div>
                    <h3 className="font-bold text-sm tracking-tight">Focus Blocklist</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Sites to avoid during focus</p>
                </div>
            </div>

            {/* Add Form */}
            <form onSubmit={addSite} className="flex gap-2 mb-4">
                <Input
                    value={newSite}
                    onChange={(e) => setNewSite(e.target.value)}
                    placeholder="Add site (e.g. twitter.com)"
                    className="h-10 text-xs bg-surface-container-highest border-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl"
                />
                <Button type="submit" size="icon" className="h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shrink-0 shadow-sm">
                    <IconPlus className="w-5 h-5" />
                </Button>
            </form>

            {/* Sites List */}
            <ScrollArea className="h-[200px] -mr-3 pr-3">
                <div className="space-y-1.5">
                    {sites.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center opacity-40">
                            <IconShieldLock className="w-8 h-8 mb-2 stroke-1" />
                            <p className="text-xs">No sites blocked yet.</p>
                        </div>
                    )}
                    {sites.map(site => (
                        <div
                            key={site}
                            className={cn(
                                "flex items-center justify-between group px-3 py-2.5 rounded-xl border border-transparent bg-surface-container-highest/30",
                                "hover:bg-surface-container-highest hover:border-white/5 transition-all"
                            )}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <IconExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs font-mono text-foreground/80 truncate">{site}</span>
                            </div>
                            <button
                                onClick={() => removeSite(site)}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all p-1.5"
                            >
                                <IconTrash className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Tip */}
            <p className="text-[10px] text-muted-foreground/50 mt-4 text-center italic font-medium">
                Tip: Keep this list visible during focus to stay mindful.
            </p>
        </div>
    )
}
