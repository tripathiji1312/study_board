
"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TourStep } from "@/lib/tour-steps"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { IconX, IconChevronRight } from "@tabler/icons-react"

interface TourOverlayProps {
    step: TourStep
    stepIndex: number
    totalSteps: number
    onNext: () => void
    onSkip: () => void
}

export function TourOverlay({ step, stepIndex, totalSteps, onNext, onSkip }: TourOverlayProps) {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

    useEffect(() => {
        const updateRect = () => {
            if (step.targetId === "center") {
                setTargetRect(null)
                return
            }

            const element = document.getElementById(step.targetId)
            if (element) {
                // Scroll into view if needed
                element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' })

                const rect = element.getBoundingClientRect()
                // Add some padding
                setTargetRect({
                    ...rect,
                    left: rect.left - 4,
                    top: rect.top - 4,
                    width: rect.width + 8,
                    height: rect.height + 8,
                    bottom: rect.bottom + 4,
                    right: rect.right + 4,
                    x: rect.x - 4,
                    y: rect.y - 4,
                    toJSON: rect.toJSON
                })
            } else {
                setTargetRect(null)
            }
        }

        // Slight delay to allow layout to settle (e.g. if sidebar expanding)
        setTimeout(updateRect, 100)

        window.addEventListener("resize", updateRect)
        window.addEventListener("scroll", updateRect, { capture: true })

        return () => {
            window.removeEventListener("resize", updateRect)
            window.removeEventListener("scroll", updateRect, { capture: true })
        }
    }, [step.targetId, stepIndex]) // Re-run on step change

    const getPopoverStyles = () => {
        if (!targetRect || step.targetId === "center") {
            return {
                top: "50%",
                left: "50%",
                x: "-50%",
                y: "-50%"
            }
        }

        const popoverHeight = 250
        const viewportHeight = windowSize.height
        const gap = 12

        // Helper to keep within viewport
        // Simple logic for now, can be improved with floating-ui

        switch (step.position) {
            case "top":
                return {
                    top: targetRect.top - gap,
                    left: targetRect.left + targetRect.width / 2,
                    x: "-50%",
                    y: "-100%"
                }
            case "bottom":
                // Check if bottom overflow
                if (targetRect.bottom + gap + popoverHeight > viewportHeight) {
                    return {
                        top: targetRect.top - gap,
                        left: targetRect.left + targetRect.width / 2,
                        x: "-50%",
                        y: "-100%"
                    }
                }
                return {
                    top: targetRect.bottom + gap,
                    left: targetRect.left + targetRect.width / 2,
                    x: "-50%",
                    y: 0
                }
            case "left":
                return {
                    top: targetRect.top + targetRect.height / 2,
                    left: targetRect.left - gap,
                    x: "-100%",
                    y: "-50%"
                }
            case "right":
                const isNearBottom = targetRect.top + popoverHeight / 2 > viewportHeight - 100
                if (isNearBottom) {
                    return {
                        top: targetRect.bottom,
                        left: targetRect.right + gap,
                        x: 0,
                        y: "-100%"
                    }
                }
                return {
                    top: targetRect.top + targetRect.height / 2,
                    left: targetRect.right + gap,
                    x: 0,
                    y: "-50%"
                }
            default:
                return {
                    top: "50%",
                    left: "50%",
                    x: "-50%",
                    y: "-50%"
                }
        }
    }

    // Construct SVG Path for "Donut" mask
    // M 0 0 h width v height h -width Z (outer clock-wise)
    // M x y v h h w v -h Z (inner counter-clock-wise to create hole)
    // Or just use fill-rule="evenodd" and two Rects

    // SSR-safe: track window dimensions in state
    const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 })

    useEffect(() => {
        const updateSize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight })
        }
        updateSize()
        window.addEventListener("resize", updateSize)
        return () => window.removeEventListener("resize", updateSize)
    }, [])

    const windowWidth = windowSize.width
    const windowHeight = windowSize.height

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 transition-colors duration-500"
            >
                <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none">
                    <defs>
                        <mask id="hole-mask">
                            <rect width="100%" height="100%" fill="white" />
                            {targetRect && (
                                <rect
                                    x={targetRect.left}
                                    y={targetRect.top}
                                    width={targetRect.width}
                                    height={targetRect.height}
                                    rx="8"
                                    fill="black"
                                />
                            )}
                        </mask>
                    </defs>
                    <rect
                        width="100%"
                        height="100%"
                        fill="black"
                        fillOpacity="0.7"
                        mask="url(#hole-mask)"
                    />
                </svg>
            </motion.div>

            {/* Target Highlight Border */}
            {targetRect && (
                <motion.div
                    layoutId="highlight-box"
                    className="absolute border-2 border-orange-400 bg-transparent rounded-lg shadow-[0_0_20px_rgba(251,146,60,0.3)] pointer-events-none z-[101]"
                    initial={false}
                    animate={{
                        top: targetRect.top,
                        left: targetRect.left,
                        width: targetRect.width,
                        height: targetRect.height,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}

            {/* Popover Card */}
            <motion.div
                className="absolute w-[350px] max-w-[90vw]"
                animate={getPopoverStyles()}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <Card className="p-5 border-white/10 bg-black/80 backdrop-blur-xl text-white shadow-2xl relative overflow-hidden group">
                    {/* Gradient border effect */}
                    <div className="absolute inset-0 rounded-xl p-[1px] bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-semibold text-primary/80 uppercase tracking-widest">
                                Step {stepIndex + 1} of {totalSteps}
                            </span>
                            <button onClick={onSkip} className="text-muted-foreground hover:text-white transition-colors">
                                <IconX size={16} />
                            </button>
                        </div>

                        <h3 className="text-xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            {step.title}
                        </h3>
                        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                            {step.description}
                        </p>

                        <div className="flex justify-between items-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onSkip}
                                className="text-gray-400 hover:text-white"
                            >
                                Skip Tour
                            </Button>
                            <Button
                                size="sm"
                                onClick={onNext}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground group/btn"
                            >
                                {stepIndex === totalSteps - 1 ? "Finish" : "Next"}
                                <IconChevronRight size={16} className="ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    )
}
