"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { IconSchool } from "@tabler/icons-react"

export function ParticleLoader() {
    const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

    useEffect(() => {
        // Generate random particles
        const newParticles = Array.from({ length: 12 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100 - 50, // -50 to 50
            y: Math.random() * 100 - 50, // -50 to 50
            delay: Math.random() * 2,
        }))
        setParticles(newParticles)
    }, [])

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="relative">
                {/* Central Icon */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-xl shadow-primary/20"
                >
                    <IconSchool className="h-8 w-8 text-primary-foreground" />
                </motion.div>

                {/* Pulsing Rings */}
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 -z-10 rounded-2xl bg-primary/20 blur-xl"
                />

                {/* Orbiting Particles */}
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            x: particle.x,
                            y: particle.y,
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: particle.delay,
                            ease: "easeInOut",
                        }}
                        className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-primary"
                    />
                ))}

                {/* Loading Bar */}
                <div className="absolute -bottom-12 left-1/2 h-1 w-24 -translate-x-1/2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="h-full w-full bg-primary"
                    />
                </div>
            </div>
        </div>
    )
}
