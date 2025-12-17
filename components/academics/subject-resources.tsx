"use client"

import { useState } from "react"
import { useStore } from "@/components/providers/store-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent
} from "@/components/ui/card"
import { IconLink, IconVideo, IconFileText, IconTrash, IconPlus } from "@tabler/icons-react"
import { Resource } from "@/components/providers/store-provider"

interface SubjectResourcesProps {
    subjectId: string
}

export function SubjectResources({ subjectId }: SubjectResourcesProps) {
    const { resources, addResource, deleteResource } = useStore()
    const [title, setTitle] = useState("")
    const [url, setUrl] = useState("")
    const [type, setType] = useState("link")

    const subjectResources = resources.filter(r => r.subjectId === subjectId)

    const handleAdd = () => {
        if (!title) return
        addResource({
            title,
            url,
            type: type as any,
            category: "General",
            subjectId
        })
        setTitle("")
        setUrl("")
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-2 p-4 border rounded-lg bg-muted/20">
                <h4 className="font-medium text-sm">Add New Resource</h4>
                <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="link">Link</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="pdf">PDF/Doc</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Input placeholder="URL (Optional)" value={url} onChange={e => setUrl(e.target.value)} />
                    <Button size="icon" onClick={handleAdd}>
                        <IconPlus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                {subjectResources.map(resource => (
                    <Card key={resource.id}>
                        <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded">
                                    {resource.type === 'video' ? <IconVideo className="w-4 h-4" /> :
                                        resource.type === 'pdf' ? <IconFileText className="w-4 h-4" /> :
                                            <IconLink className="w-4 h-4" />}
                                </div>
                                <div className="text-sm">
                                    <div className="font-medium">{resource.title}</div>
                                    {resource.url && <a href={resource.url} target="_blank" className="text-xs text-primary hover:underline">{resource.url}</a>}
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteResource(resource.id)}>
                                <IconTrash className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {subjectResources.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No resources added yet.</p>
                )}
            </div>
        </div>
    )
}
