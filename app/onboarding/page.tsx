"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { IconExternalLink, IconRocket, IconSparkles, IconMail, IconBrain, IconArrowRight, IconChevronLeft, IconAlertCircle, IconCheck, IconInfoCircle } from "@tabler/icons-react"
import { toast } from "sonner"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"
import { motion, AnimatePresence } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { IconPalette } from "@tabler/icons-react"

const themes = [
    { name: "Amethyst (Pro)", value: "theme-purple", color: "bg-[#12081d] border-[#3d1a6d]" },
    { name: "Sakura (Light)", value: "theme-pink", color: "bg-[#fff5f7] border-[#ffb6c1]" },
    { name: "Rose Noir (Dark)", value: "theme-pink-dark", color: "bg-[#1a0a14] border-[#3a1a2a]" },
    { name: "Midnight", value: "theme-midnight", color: "bg-[#0a0a23] border-[#1a1a3a]" },
    { name: "Forest", value: "theme-forest", color: "bg-[#0b1a0b] border-[#1a3a1a]" },
    { name: "Sunset", value: "theme-sunset", color: "bg-[#1a0b0b] border-[#3a1a1a]" },
    { name: "Retro Pop", value: "theme-retro-pop", color: "bg-[#fffacd] border-[#ff69b4]" },
]

export default function OnboardingPage() {
    const { data: session, status } = useSession({ required: true })
    const router = useRouter()
    const [step, setStep] = React.useState(1)
    const [isLoading, setIsLoading] = React.useState(false)

    const [formData, setFormData] = React.useState({
        displayName: "",
        department: "CSE",
        currentSemId: 1,
        groqApiKey: "",
        resendApiKey: "",
        theme: "light",
    })
    const { theme: currentTheme, setTheme } = useTheme()

    React.useEffect(() => {
        if (session?.user?.name) {
            setFormData(prev => ({ ...prev, displayName: session.user.name || "" }))
        }
    }, [session])

    // Auto-redirect if already onboarded
    React.useEffect(() => {
        const checkStatus = async () => {
            if (status === "authenticated") {
                try {
                    const res = await fetch('/api/settings')
                    if (res.ok) {
                        const settings = await res.json()
                        if (settings?.hasSeenWalkthrough) {
                            router.push('/')
                        }
                    }
                } catch (e) {
                    console.error("Failed to check onboarding status", e)
                }
            }
        }
        checkStatus()
    }, [status, router])

    const handleNext = () => {
        // Validate step 3 - Groq API key is required (previously step 2)
        if (step === 3 && !formData.groqApiKey.trim()) {
            toast.error("Groq API key is required for AI features. Get a free key from the link above.")
            return
        }
        setStep(prev => prev + 1)
    }
    const handleBack = () => setStep(prev => prev - 1)

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    hasSeenWalkthrough: true
                })
            })

            if (!res.ok) throw new Error("Failed to save settings")

            toast.success("You’re all set! Welcome to StudyBoard.")
            router.push('/')
        } catch (error) {
            toast.error("Something went wrong. Please try again.")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    if (status === "loading") return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
    )

    const totalSteps = 4
    const progressPercent = (step / totalSteps) * 100

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-[600px]"
            >
                <Card className="border-border/50 shadow-2xl">
                    <CardHeader className="space-y-4 pb-4">
                        <div className="flex items-center justify-between">
                            <Logo />
                            <Badge variant="secondary" className="text-xs">
                                Step {step} of {totalSteps}
                            </Badge>
                        </div>
                        <Progress value={progressPercent} className="h-1" />
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6 pb-4 min-h-[350px]">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold tracking-tight">Welcome to StudyBoard</h2>
                                        <p className="text-muted-foreground">Let&apos;s set up your profile to personalize your experience.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Display Name</Label>
                                            <Input
                                                id="name"
                                                value={formData.displayName}
                                                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                                placeholder="Your name"
                                            />
                                            <p className="text-xs text-muted-foreground">This is how you&apos;ll appear in the app.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dept">Department / Major</Label>
                                            <Input
                                                id="dept"
                                                value={formData.department}
                                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                placeholder="e.g. Computer Science"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <IconPalette className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold tracking-tight">Vibe Check</h2>
                                                <p className="text-sm text-muted-foreground">Pick a theme that matches your personality</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {themes.map((t) => (
                                            <button
                                                key={t.value}
                                                onClick={() => {
                                                    setFormData({ ...formData, theme: t.value })
                                                    setTheme(t.value)
                                                }}
                                                className={cn(
                                                    "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                                                    formData.theme === t.value
                                                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                        : "border-border hover:border-border/80 hover:bg-muted/50"
                                                )}
                                            >
                                                <div className={cn("h-10 w-10 rounded-full border shadow-sm", t.color)} />
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-semibold">{t.name}</span>
                                                    {formData.theme === t.value && (
                                                        <motion.span
                                                            layoutId="selected"
                                                            className="text-[10px] text-primary font-bold uppercase tracking-wider mt-1"
                                                        >
                                                            Active
                                                        </motion.span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <IconBrain className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold tracking-tight">AI Features</h2>
                                                <p className="text-sm text-muted-foreground">Power up with Groq</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Alert variant="destructive">
                                        <IconInfoCircle className="h-4 w-4" />
                                        <AlertTitle>Required</AlertTitle>
                                        <AlertDescription>
                                            The Groq API key is required for AI-powered daily briefings, task suggestions, and cron jobs. It is completely free to get.
                                        </AlertDescription>
                                    </Alert>

                                    <Card className="bg-muted/30">
                                        <CardContent className="pt-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="font-semibold">Groq API Key</Label>
                                                <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs">
                                                    <Link href="https://console.groq.com/keys" target="_blank" className="flex items-center gap-1">
                                                        Get Free Key <IconExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </Button>
                                            </div>
                                            <Input
                                                type="password"
                                                placeholder="gsk_..."
                                                value={formData.groqApiKey}
                                                onChange={e => setFormData({ ...formData, groqApiKey: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Your key is encrypted and only used for your requests.{" "}
                                                <Link href="/setup/api" className="text-primary hover:underline">Learn more →</Link>
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {!formData.groqApiKey && (
                                        <p className="text-xs text-muted-foreground text-center">
                                            You can skip this and add it later in Settings.
                                        </p>
                                    )}
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <IconMail className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold tracking-tight">Email Notifications</h2>
                                                <p className="text-sm text-muted-foreground">Get daily briefings delivered</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Alert variant="default">
                                        <IconInfoCircle className="h-4 w-4" />
                                        <AlertTitle>Completely Optional</AlertTitle>
                                        <AlertDescription>
                                            Resend allows us to email you daily briefings. Just the API key is needed—no secrets or domain verification for testing.
                                        </AlertDescription>
                                    </Alert>

                                    <Card className="bg-muted/30">
                                        <CardContent className="pt-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="font-semibold">Resend API Key</Label>
                                                <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs">
                                                    <Link href="https://resend.com/api-keys" target="_blank" className="flex items-center gap-1">
                                                        Get Free Key <IconExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </Button>
                                            </div>
                                            <Input
                                                type="password"
                                                placeholder="re_..."
                                                value={formData.resendApiKey}
                                                onChange={e => setFormData({ ...formData, resendApiKey: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Free tier: 3,000 emails/month. Perfect for daily digests.
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-primary/5 border-primary/20">
                                        <CardContent className="pt-4">
                                            <div className="flex items-start gap-3">
                                                <IconCheck className="w-5 h-5 text-primary mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-sm">Ready to launch!</p>
                                                    <p className="text-xs text-muted-foreground">Click &quot;Launch Dashboard&quot; to start using StudyBoard.</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>

                    <Separator />

                    <CardFooter className="flex justify-between pt-4">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={step === 1}
                        >
                            <IconChevronLeft className="w-4 h-4 mr-1" />
                            Back
                        </Button>

                        {step < totalSteps ? (
                            <Button onClick={handleNext}>
                                Continue <IconArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={isLoading}>
                                {isLoading ? "Saving..." : (
                                    <>
                                        <IconRocket className="w-4 h-4 mr-1" />
                                        Launch Dashboard
                                    </>
                                )}
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    You can always update these settings later in your profile.
                </p>
            </motion.div>
        </div>
    )
}
