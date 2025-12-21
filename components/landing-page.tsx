"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"
import { motion } from "framer-motion"
import {
    IconRocket,
    IconBrain,
    IconClock,
    IconChartBar
} from "@tabler/icons-react"
import { Shell } from "@/components/ui/shell"

export function LandingPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between mx-auto md:px-8">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <span>📚</span>
                        <span>Study Board</span>
                    </div>
                    <nav className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => signIn()}>
                            Login
                        </Button>
                        <Button onClick={() => signIn()}>
                            Get Started
                        </Button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1">
                <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                    <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center mx-auto">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400"
                        >
                            Master your academic life.
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8"
                        >
                            The all-in-one dashboard for students. Track assignments, manage exams, analyze focus, and get AI-powered briefings.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-x-4"
                        >
                            <Button size="lg" className="rounded-full px-8" onClick={() => signIn()}>
                                Start For Free
                            </Button>
                            <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
                                <Link href="https://github.com/tripathiji/study-board" target="_blank">
                                    GitHub
                                </Link>
                            </Button>
                        </motion.div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="container space-y-6 bg-slate-50 dark:bg-slate-900/50 py-8 dark:bg-transparent mx-auto md:px-8">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <FeatureCard
                            icon={IconRocket}
                            title="Daily Briefing"
                            description="Wake up to a personalized AI summary of your day's priorities."
                        />
                        <FeatureCard
                            icon={IconBrain}
                            title="Focus Mode"
                            description="Pomodoro timer with distraction blocking and analytics."
                        />
                        <FeatureCard
                            icon={IconClock}
                            title="Smart Scheduling"
                            description="Auto-generated study schedules based on your exams and assignments."
                        />
                        <FeatureCard
                            icon={IconChartBar}
                            title="Grade Tracking"
                            description="Visualize your academic performance and predict your GPA."
                        />
                    </div>
                </section>
            </main>
        </div>
    )
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <Icon className="h-12 w-12 text-primary" />
                <div className="space-y-2">
                    <h3 className="font-bold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
        </div>
    )
}
