"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useStore } from "@/components/providers/store-provider"
import {
    IconBook,
    IconLink,
    IconArrowRight,
    IconFileText,
    IconVideo,
    IconPlus,
    IconBrandYoutube,
    IconBrandGithub
} from "@tabler/icons-react"

const RESOURCE_ICONS: Record<string, any> = {
    "Article": IconFileText,
    "Video": IconVideo,
    "Link": IconLink,
    "Book": IconBook,
    "YouTube": IconBrandYoutube,
    "GitHub": IconBrandGithub,
}

export function ResourcesWidget() {
    const { resources } = useStore()
    const recentResources = resources.slice(0, 4)

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <IconBook className="w-4 h-4 text-purple-500" />
                    Recent Resources
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs px-2 text-muted-foreground">
                    <Link href="/resources">
                        View All <IconArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {recentResources.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {recentResources.map(r => {
                            const Icon = RESOURCE_ICONS[r.type] || IconLink
                            return (
                                <a
                                    key={r.id}
                                    href={r.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col p-3 rounded-lg border bg-card hover:bg-secondary/50 transition-all group hover:-translate-y-0.5 hover:shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-1.5 rounded-md bg-secondary text-secondary-foreground group-hover:bg-background group-hover:text-primary transition-colors">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <Badge variant="outline" className="text-[10px] h-5 px-1 font-normal opacity-70">
                                            {r.type}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                            {r.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {r.category}
                                        </p>
                                    </div>
                                </a>
                            )
                        })}

                        {/* Add Button as the last card if < 4 resources */}
                        {recentResources.length < 4 && (
                            <Link href="/resources" className="flex flex-col items-center justify-center p-3 rounded-lg border border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary gap-1">
                                <IconPlus className="w-5 h-5" />
                                <span className="text-xs font-medium">Add New</span>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-lg border border-dashed">
                        <div className="p-3 rounded-full bg-background mb-3">
                            <IconLink className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">No resources saved</p>
                        <p className="text-xs text-muted-foreground mb-3">Keep your study materials handy.</p>
                        <Button variant="outline" size="sm" asChild className="h-8">
                            <Link href="/resources">
                                <IconPlus className="w-3.5 h-3.5 mr-1.5" />
                                Add Resource
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
