"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { IconMusic, IconVolume, IconVolumeOff, IconCloudRain, IconCampfire, IconCoffee } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

const SOUNDS = [
    { id: "rain", name: "Rain", icon: IconCloudRain, url: "https://www.soundjay.com/nature/sounds/rain-01.mp3" },
    { id: "fire", name: "Fire", icon: IconCampfire, url: "https://www.soundjay.com/nature/sounds/camp-fire-1.mp3" },
    { id: "cafe", name: "Cafe", icon: IconCoffee, url: "https://www.soundjay.com/human/sounds/restaurant-ambience-1.mp3" }
]

export function AmbienceWidget() {
    const [volumes, setVolumes] = React.useState<Record<string, number>>({
        rain: 0,
        fire: 0,
        cafe: 0
    })
    const audioRefs = React.useRef<Record<string, HTMLAudioElement>>({})

    // Initialize audio objects
    React.useEffect(() => {
        SOUNDS.forEach(s => {
            if (!audioRefs.current[s.id]) {
                const audio = new Audio(s.url)
                audio.loop = true
                audioRefs.current[s.id] = audio
            }
        })

        return () => {
            // Cleanup
            Object.values(audioRefs.current).forEach(audio => {
                audio.pause()
                audio.src = ""
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
                audio.play().catch(e => console.error("Play failed", e))
            } else if (value === 0 && !audio.paused) {
                audio.pause()
            }
        }
    }

    const toggleMute = () => {
        // Quick mute logic if needed
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
                        <div className="h-4"> {/* Container for slider height */}
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
