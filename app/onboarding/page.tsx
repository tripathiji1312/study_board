"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Shell } from "@/components/ui/shell"
import { IconCheck, IconExternalLink } from "@tabler/icons-react"
import { toast } from "sonner"
import Link from "next/link"

export default function OnboardingPage() {
    const { data: session, status } = useSession({ required: true })
    const router = useRouter()
    const [step, setStep] = React.useState(1)
    const [isLoading, setIsLoading] = React.useState(false)

    // Form State
    const [formData, setFormData] = React.useState({
        displayName: "",
        department: "CSE",
        currentSemId: 1,
        groqApiKey: "",
        resendApiKey: "",
    })

    // Pre-fill name from session
    React.useEffect(() => {
        if (session?.user?.name) {
            setFormData(prev => ({ ...prev, displayName: session.user.name || "" }))
        }
    }, [session])

    const handleNext = () => setStep(prev => prev + 1)
    const handleBack = () => setStep(prev => prev - 1)

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error("Failed to save settings")

            toast.success("Profile setup complete!")
            router.push('/')
        } catch (error) {
            toast.error("Something went wrong. Please try again.")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    if (status === "loading") return <div className="flex h-screen items-center justify-center">Loading...</div>

    return (
        <Shell>
            <div className="flex min-h-[80vh] items-center justify-center">
                <Card className="w-full max-w-[600px] border-2 shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-sm font-medium text-muted-foreground">
                                Step {step} of 2
                            </div>
                            <div className="flex gap-1">
                                <div className={`h-2 w-12 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                                <div className={`h-2 w-12 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">
                            {step === 1 ? "Welcome to Study Board" : "Connect Your Tools"}
                        </CardTitle>
                        <CardDescription>
                            {step === 1
                                ? "Let's personalize your experience."
                                : "Add your API keys to enable AI features and Notifications."
                            }
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.displayName}
                                        onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                        placeholder="Student Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dept">Department</Label>
                                    <Input
                                        id="dept"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="e.g. CSE, ECE"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                {/* Resend Key */}
                                <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold">Resend API Key</Label>
                                        <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs">
                                            <Link href="https://resend.com/api-keys" target="_blank" className="flex items-center gap-1">
                                                Get Key <IconExternalLink className="w-3 h-3" />
                                            </Link>
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Required for daily digest emails. Create a free account on Resend.
                                    </p>
                                    <Input
                                        type="password"
                                        placeholder="re_1234..."
                                        value={formData.resendApiKey}
                                        onChange={e => setFormData({ ...formData, resendApiKey: e.target.value })}
                                    />
                                </div>

                                {/* Groq Key */}
                                <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold">Groq API Key</Label>
                                        <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs">
                                            <Link href="https://console.groq.com/keys" target="_blank" className="flex items-center gap-1">
                                                Get Key <IconExternalLink className="w-3 h-3" />
                                            </Link>
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Required for AI summaries and advice. It's free and fast.
                                    </p>
                                    <Input
                                        type="password"
                                        placeholder="gsk_..."
                                        value={formData.groqApiKey}
                                        onChange={e => setFormData({ ...formData, groqApiKey: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-between">
                        {step === 1 ? (
                            <Button variant="ghost" disabled>Back</Button>
                        ) : (
                            <Button variant="outline" onClick={handleBack}>Back</Button>
                        )}

                        {step === 1 ? (
                            <Button onClick={handleNext}>Next</Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={isLoading}>
                                {isLoading ? "Saving..." : "Finish Setup"}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </Shell>
    )
}
