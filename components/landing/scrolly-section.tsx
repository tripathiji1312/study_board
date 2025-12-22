"use client"

import React, { useRef } from "react"
import { useScroll, useTransform, motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ScrollySectionProps {
    features: {
        title: string
        description: string
        content?: React.ReactNode
        icon?: React.ElementType
    }[]
}

export const ScrollySection = ({ features }: ScrollySectionProps) => {
    return (
        <div className="w-full">
            {features.map((feature, index) => (
                <div key={index} className="flex flex-col md:flex-row min-h-screen items-center justify-center p-10 gap-10">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        viewport={{ once: false, margin: "-100px" }}
                        className="w-full md:w-1/2 space-y-4"
                    >
                        {feature.icon && (
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                <feature.icon className="w-6 h-6" />
                            </div>
                        )}
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                            {feature.title}
                        </h2>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            {feature.description}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.7, type: "spring" }}
                        viewport={{ once: false, margin: "-100px" }}
                        className="w-full md:w-1/2 relative aspect-square md:aspect-video rounded-3xl overflow-hidden shadow-2xl border bg-card/50 backdrop-blur-sm"
                    >
                        {feature.content ? (
                            feature.content
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                                <span className="text-muted-foreground font-mono text-sm">Visual Demo</span>
                            </div>
                        )}
                    </motion.div>
                </div>
            ))}
        </div>
    )
}
