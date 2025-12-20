"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconTrash, IconPlus, IconBan, IconExternalLink } from "@tabler/icons-react"
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
        <div className="w-[320px] p-5 bg-zinc-900/95 border border-white/10 backdrop-blur-xl rounded-2xl text-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-500/20">
                    <IconBan className="w-5 h-5 text-red-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-sm">Focus Blocklist</h3>
                    <p className="text-[10px] text-white/40">Sites to avoid during focus</p>
                </div>
            </div>

            {/* Add Form */}
            <form onSubmit={addSite} className="flex gap-2 mb-4">
                <Input
                    value={newSite}
                    onChange={(e) => setNewSite(e.target.value)}
                    placeholder="Add site (e.g. twitter.com)"
                    className="h-9 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-white/30 rounded-lg"
                />
                <Button type="submit" size="icon" className="h-9 w-9 bg-white/10 hover:bg-white/20 text-white rounded-lg shrink-0">
                    <IconPlus className="w-4 h-4" />
                </Button>
            </form>

            {/* Sites List */}
            <ScrollArea className="h-[180px]">
                <div className="space-y-1.5 pr-2">
                    {sites.length === 0 && (
                        <p className="text-xs text-white/30 text-center py-4">No sites added yet.</p>
                    )}
                    {sites.map(site => (
                        <div
                            key={site}
                            className={cn(
                                "flex items-center justify-between group p-2.5 rounded-lg border border-transparent",
                                "hover:bg-white/5 hover:border-white/10 transition-all"
                            )}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <IconExternalLink className="w-3.5 h-3.5 text-white/20 shrink-0" />
                                <span className="text-xs font-mono text-white/70 truncate">{site}</span>
                            </div>
                            <button
                                onClick={() => removeSite(site)}
                                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all p-1"
                            >
                                <IconTrash className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Tip */}
            <p className="text-[10px] text-white/25 mt-4 text-center italic">
                Tip: Keep this list visible during focus to stay mindful.
            </p>
        </div>
    )
}
