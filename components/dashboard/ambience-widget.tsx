"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconMusic, IconCloudRain, IconCampfire, IconCoffee, IconSun } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

const SOUNDS = [
    { id: "rain", name: "Rain", icon: IconCloudRain, url: "https://www.soundjay.com/nature/sounds/rain-03.mp3" },
    { id: "fire", name: "Campfire", icon: IconCampfire, url: "https://www.soundjay.com/nature/sounds/campfire-1.mp3" },
    { id: "spring", name: "Spring", icon: IconSun, url: "https://www.soundjay.com/ambient/sounds/spring-weather-1.mp3" },
    { id: "cafe", name: "Cafe", icon: IconCoffee, url: "/sounds/cafe.mp3" }
]

export function AmbienceWidget() {
    const [volumes, setVolumes] = React.useState<Record<string, number>>({
        rain: 0,
        fire: 0,
        spring: 0,
        cafe: 0
    })
    const audioRefs = React.useRef<Record<string, HTMLAudioElement>>({})

    // Initialize audio objects
    React.useEffect(() => {
        SOUNDS.forEach(s => {
            if (!audioRefs.current[s.id]) {
                const audio = new Audio(s.url)
                audio.loop = true
                audio.preload = "none" // Don't preload to avoid errors
                audioRefs.current[s.id] = audio
            }
        })

        return () => {
            Object.values(audioRefs.current).forEach(audio => {
                audio.pause()
            })
        }
    }, [])

    const handleVolumeChange = (id: string, val: number[]) => {
        const value = val[0]
        setVolumes(prev => ({ ...prev, [id]: value }))

        const audio = audioRefs.current[id]
        if (audio) {
            audio.volume = value / 100
            if (value > 0 && audio.paused) {
                audio.play().catch(e => {
                    if (e.name !== "AbortError") {
                        console.error(`Play failed for ${id}:`, e)
                    }
                })
            } else if (value === 0 && !audio.paused) {
                audio.pause()
            }
        }
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <IconMusic className="w-4 h-4" /> Ambience
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {SOUNDS.map(sound => (
                    <div key={sound.id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <sound.icon className={cn("w-3 h-3", volumes[sound.id] > 0 ? "text-primary" : "text-muted-foreground")} />
                                <span>{sound.name}</span>
                            </div>
                            <span className="text-muted-foreground">{volumes[sound.id]}%</span>
                        </div>
                        <div className="h-4">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volumes[sound.id]}
                                onChange={(e) => handleVolumeChange(sound.id, [parseInt(e.target.value)])}
                                className="w-full accent-primary h-1 bg-muted rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
