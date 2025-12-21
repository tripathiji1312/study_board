
"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { TourOverlay } from "@/components/walkthrough/tour-overlay"
import { TOUR_STEPS, TourStep } from "@/lib/tour-steps"
import { toast } from "sonner"

interface WalkthroughContextType {
    startTour: () => void
    endTour: () => void
    nextStep: () => void
    prevStep: () => void
    currentStep: number
    isActive: boolean
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined)

export function WalkthroughProvider({ children, hasSeenInitial }: { children: ReactNode, hasSeenInitial: boolean }) {
    const [isActive, setIsActive] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [hasSeen, setHasSeen] = useState(hasSeenInitial)
    const path = usePathname()

    const { data: session, status } = useSession()

    useEffect(() => {
        // Only start tour automatically if:
        // 1. User is authenticated (session exists)
        // 2. User hasn't seen it yet
        // 3. User is on path "/" (Dashboard)
        // 4. Tour isn't already active
        // 5. App isn't loading auth state
        if (status === "authenticated" && !hasSeen && path === "/" && !isActive) {
            // Small delay to let page load
            const timer = setTimeout(() => {
                setIsActive(true)
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [path, hasSeen, isActive, status])

    const startTour = () => {
        setCurrentStep(0)
        setIsActive(true)
    }

    const endTour = async () => {
        setIsActive(false)
        setHasSeen(true)

        // Persist to DB
        try {
            await fetch("/api/user/walkthrough", { method: "POST" })
        } catch (e) {
            console.error("Failed to save walkthrough status", e)
        }

        toast.success("You're all set!", {
            description: "You can restart this tour anytime from Settings.",
            icon: "🎉"
        })
    }

    const nextStep = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(c => c + 1)
        } else {
            endTour()
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(c => c - 1)
        }
    }

    return (
        <WalkthroughContext.Provider value={{ startTour, endTour, nextStep, prevStep, currentStep, isActive }}>
            {children}
            {isActive && (
                <TourOverlay
                    step={TOUR_STEPS[currentStep]}
                    stepIndex={currentStep}
                    totalSteps={TOUR_STEPS.length}
                    onNext={nextStep}
                    onSkip={endTour}
                />
            )}
        </WalkthroughContext.Provider>
    )
}

export function useWalkthrough() {
    const context = useContext(WalkthroughContext)
    if (!context) {
        throw new Error("useWalkthrough must be used within a WalkthroughProvider")
    }
    return context
}
