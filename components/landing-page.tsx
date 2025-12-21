"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import {
    IconRocket,
    IconBrain,
    IconClock,
    IconChartBar,
    IconArrowRight,
    IconBrandGithub,
    IconTrophy,
    IconSparkles,
    IconCheck,
    IconCalendarEvent,
    IconMoodHappy,
    IconListCheck,
    IconTargetArrow
} from "@tabler/icons-react"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Logo } from "@/components/ui/logo"
import { useState, useEffect } from "react"

export function LandingPage() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <div className="min-h-screen bg-background antialiased relative overflow-hidden text-foreground font-sans selection:bg-primary/30">

            {/* Animated Floating Navbar */}
            <motion.div
                className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                <motion.header
                    layout
                    className={`pointer-events-auto transition-all duration-500 ease-out border mt-4 ${scrolled ? 'bg-background/90 backdrop-blur-2xl rounded-full shadow-2xl shadow-primary/5 py-2.5 px-6 border-border/50' : 'w-full max-w-7xl bg-transparent py-4 px-4 border-transparent'}`}
                >
                    <div className="flex items-center justify-between gap-4">
                        <motion.div layout="position">
                            <Logo className={`transition-transform duration-300 ${scrolled ? 'scale-90' : ''}`} />
                        </motion.div>
                        <motion.nav layout="position" className="flex items-center gap-2 md:gap-3">
                            <Button variant="ghost" size="sm" onClick={() => signIn()} className="hidden sm:flex text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full px-4">
                                Log in
                            </Button>
                            <Button size="sm" asChild className="rounded-full px-6 font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/20 active:scale-95">
                                <Link href="/auth/signup">Get Started</Link>
                            </Button>
                        </motion.nav>
                    </div>
                </motion.header>
            </motion.div>

            {/* Hero Section with Classy Background */}
            <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
                {/* Gradient Orbs Background */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[180px]" />
                </div>

                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 z-0 opacity-30" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }} />

                {/* Hero Content */}
                <div className="relative z-10 max-w-5xl mx-auto px-4 text-center mt-20 md:mt-0 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                            <IconSparkles className="w-4 h-4" />
                            AI-Powered Student Productivity
                        </div>
                        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[0.95]">
                            Your Academic Life, <br />
                            <span className="text-primary">
                                Organized.
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed"
                    >
                        StudyBoard is your all-in-one command center for assignments, exams, focus sessions, and daily planning. Get personalized AI briefings to start each day with clarity.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
                    >
                        <Button size="lg" asChild className="rounded-full h-14 px-10 text-lg font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]">
                            <Link href="/auth/signup">Start Free <IconArrowRight className="ml-2 w-5 h-5" /></Link>
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-full h-14 px-10 text-lg border-border bg-card/50 backdrop-blur-sm hover:bg-accent/50 transition-all duration-300 hover:scale-[1.03]" asChild>
                            <Link href="https://github.com/tripathiji1312/study_board" target="_blank">
                                <IconBrandGithub className="mr-2 w-5 h-5" />
                                View on GitHub
                            </Link>
                        </Button>
                    </motion.div>

                    {/* Trust Indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="pt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground"
                    >
                        <div className="flex items-center gap-2">
                            <IconCheck className="w-5 h-5 text-primary" /> Free Forever Core
                        </div>
                        <div className="flex items-center gap-2">
                            <IconCheck className="w-5 h-5 text-primary" /> Open Source
                        </div>
                        <div className="flex items-center gap-2">
                            <IconCheck className="w-5 h-5 text-primary" /> Built for Privacy
                        </div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
                >
                    <div className="w-6 h-10 border-2 border-border rounded-full flex justify-center pt-2">
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-1.5 h-1.5 bg-primary rounded-full"
                        />
                    </div>
                </motion.div>
            </div>

            {/* Features Section with Filled Bento Cards */}
            <section className="py-32 relative z-10 bg-card/30 border-y border-border">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="mb-20 text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                            Everything you need to <span className="text-primary">excel.</span>
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Stop juggling between apps. StudyBoard combines task management, focus tools, scheduling, and AI insights into one seamless experience.
                        </p>
                    </div>

                    <BentoGrid className="max-w-6xl mx-auto">
                        {features.map((item, i) => (
                            <BentoGridItem
                                key={i}
                                title={item.title}
                                description={item.description}
                                header={item.header}
                                icon={item.icon}
                                className={i === 0 || i === 3 ? "md:col-span-2" : ""}
                            />
                        ))}
                    </BentoGrid>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-32 relative z-10">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="mb-16 text-center">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                            How StudyBoard Works
                        </h2>
                        <p className="text-muted-foreground text-lg">Simple to start, powerful as you grow.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.15, duration: 0.5 }}
                                viewport={{ once: true }}
                                className="relative p-6 rounded-2xl bg-card border border-border group hover:border-primary/50 transition-colors"
                            >
                                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                    {i + 1}
                                </div>
                                <div className="pt-4">
                                    <step.icon className="w-10 h-10 text-primary mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                                    <p className="text-muted-foreground text-sm">{step.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3D Card CTA */}
            <section className="min-h-[70vh] flex flex-col items-center justify-center relative overflow-hidden bg-card/20 border-t border-border">
                <div className="z-10 text-center px-4 w-full max-w-4xl">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                        Ready to take control?
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-12">
                        Join students who are managing their academic life with clarity and intention.
                    </p>
                    <div className="relative z-20 flex justify-center">
                        <CardContainer className="inter-var">
                            <CardBody className="bg-card/80 backdrop-blur-md relative group/card border-border w-auto sm:w-[32rem] h-auto rounded-3xl p-8 border hover:border-primary/50 transition-colors duration-500">
                                <CardItem
                                    translateZ="50"
                                    className="text-2xl font-bold mb-2"
                                >
                                    Your Dashboard Awaits
                                </CardItem>
                                <CardItem
                                    as="p"
                                    translateZ="60"
                                    className="text-muted-foreground text-sm max-w-sm"
                                >
                                    Create an account in seconds. No credit card required.
                                </CardItem>
                                <div className="flex justify-between items-center mt-10 gap-4">
                                    <CardItem
                                        translateZ={20}
                                        as={Link}
                                        href="https://github.com/tripathiji1312/study_board"
                                        target="__blank"
                                        className="px-5 py-2.5 rounded-full text-sm font-medium border border-border hover:bg-accent/50 transition-colors"
                                    >
                                        Source Code
                                    </CardItem>
                                    <CardItem
                                        translateZ={40}
                                        as="button"
                                        onClick={() => signIn()}
                                        className="px-8 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/30"
                                    >
                                        Sign up free
                                    </CardItem>
                                </div>
                            </CardBody>
                        </CardContainer>
                    </div>
                </div>
                <BackgroundBeams className="z-0 opacity-30" />
            </section>

            <footer className="py-12 border-t border-border bg-card/50">
                <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-8 text-muted-foreground">
                    <Logo />
                    <div className="flex gap-8 text-sm font-medium">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                        <Link href="https://github.com/tripathiji1312/study_board" className="hover:text-foreground transition-colors">GitHub</Link>
                    </div>
                    <div className="text-xs">
                        © {new Date().getFullYear()} StudyBoard
                    </div>
                </div>
            </footer>
        </div>
    )
}

// Filled Feature Headers with Visual Content
const AIBriefingHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-4 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <IconSparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
                <div className="text-xs text-muted-foreground">Good Morning!</div>
                <div className="text-sm font-semibold">3 tasks • 1 exam • Focus: 2h</div>
            </div>
        </div>
    </div>
);

const FocusModeHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/20 p-4 items-center justify-center">
        <div className="relative w-20 h-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center">
            <div className="text-2xl font-bold text-emerald-500">25:00</div>
            <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-l-transparent border-b-transparent" style={{ transform: 'rotate(45deg)' }} />
        </div>
    </div>
);

const ScheduleHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent border border-blue-500/20 p-4 items-center justify-center">
        <div className="grid grid-cols-7 gap-1 w-full max-w-[200px]">
            {Array.from({ length: 14 }).map((_, i) => (
                <div
                    key={i}
                    className={`aspect-square rounded ${i % 4 === 0 ? 'bg-blue-500' : 'bg-blue-500/20'}`}
                />
            ))}
        </div>
    </div>
);

const GradesHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent border border-purple-500/20 p-4 items-end justify-center gap-2">
        {[65, 80, 45, 90, 70, 85, 95].map((h, i) => (
            <div
                key={i}
                className="w-6 rounded-t bg-purple-500/60 transition-all hover:bg-purple-500"
                style={{ height: `${h}%` }}
            />
        ))}
    </div>
);

const GamificationHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/20 p-4 items-center justify-center">
        <div className="flex items-center gap-3">
            <IconTrophy className="w-10 h-10 text-amber-500" />
            <div>
                <div className="text-2xl font-bold text-amber-500">1,250 XP</div>
                <div className="text-xs text-muted-foreground">Level 5 Scholar</div>
            </div>
        </div>
    </div>
);

const MoodHeader = () => (
    <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-gradient-to-br from-pink-500/20 via-pink-500/10 to-transparent border border-pink-500/20 p-4 items-center justify-center gap-4">
        {['😊', '😐', '😫', '🔥', '😴'].map((emoji, i) => (
            <div key={i} className={`text-2xl ${i === 0 ? 'scale-125 opacity-100' : 'opacity-40'}`}>{emoji}</div>
        ))}
    </div>
);

const features = [
    {
        title: "AI-Powered Daily Briefing",
        description: "Each morning, get a personalized summary of your upcoming deadlines, assignments, and recommended focus blocks. Never miss what matters.",
        header: <AIBriefingHeader />,
        icon: <IconRocket className="h-5 w-5 text-primary" />,
    },
    {
        title: "Focus Mode & Analytics",
        description: "Start timed focus sessions with our Pomodoro timer. Track your deep work streaks and see your productivity trends over time.",
        header: <FocusModeHeader />,
        icon: <IconBrain className="h-5 w-5 text-primary" />,
    },
    {
        title: "Smart Schedule",
        description: "Automatically block study time based on your exam and assignment due dates. Syncs with your calendar.",
        header: <ScheduleHeader />,
        icon: <IconClock className="h-5 w-5 text-primary" />,
    },
    {
        title: "Grades, GPA & Forecasting",
        description: "Log your grades by subject. Get real-time GPA calculations and projections. Know exactly where you stand and what you need to improve.",
        header: <GradesHeader />,
        icon: <IconChartBar className="h-5 w-5 text-primary" />,
    },
    {
        title: "Gamification & XP",
        description: "Earn points for completing tasks from your lists. Unlock achievements and stay motivated with streaks.",
        header: <GamificationHeader />,
        icon: <IconTrophy className="h-5 w-5 text-primary" />,
    },
    {
        title: "Mood & Energy Logging",
        description: "Track how you feel each day. Let the AI suggest tasks that match your current energy level.",
        header: <MoodHeader />,
        icon: <IconMoodHappy className="h-5 w-5 text-primary" />,
    },
];

const steps = [
    {
        icon: IconCalendarEvent,
        title: "Add Your Tasks",
        description: "Quickly add assignments, exams, and to-dos. Set due dates and get automatic reminders."
    },
    {
        icon: IconBrain,
        title: "Get Your AI Briefing",
        description: "Each day, receive a smart summary of what needs your attention. No more manual sorting."
    },
    {
        icon: IconRocket,
        title: "Focus & Achieve",
        description: "Enter focus mode, knock out your tasks, and watch your productivity analytics grow."
    }
];
