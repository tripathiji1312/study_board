import { Logo } from "@/components/ui/logo"
import Link from "next/link"
import { IconArrowLeft, IconExternalLink, IconBrain, IconMail, IconKey, IconShieldCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export default function ApiSetupPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto max-w-4xl px-4 py-16">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
                    <IconArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="mb-12">
                    <Logo className="mb-6" />
                    <h1 className="text-4xl font-bold tracking-tight mb-4">API Setup Guide</h1>
                    <p className="text-muted-foreground text-lg">
                        StudyBoard uses external APIs to power AI features and email notifications. This guide explains how to get and use these keys.
                    </p>
                </div>

                <div className="space-y-12">
                    {/* Groq Section */}
                    <section className="p-6 rounded-2xl bg-card border border-border">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                                <IconBrain className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold mb-1">Groq API</h2>
                                <p className="text-muted-foreground">Powers AI daily briefings, task suggestions, and mood-based recommendations.</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <h3 className="font-semibold">Why Groq?</h3>
                            <p className="text-muted-foreground">
                                Groq provides ultra-fast AI inference with their LPU (Language Processing Unit) technology. It's <strong>completely free</strong> for personal use with generous rate limits—perfect for StudyBoard's AI features.
                            </p>
                        </div>

                        <div className="space-y-4 mb-6">
                            <h3 className="font-semibold">How to Get Your Key</h3>
                            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                                <li>Go to <Link href="https://console.groq.com" target="_blank" className="text-primary hover:underline">console.groq.com</Link></li>
                                <li>Create a free account or sign in with Google/GitHub.</li>
                                <li>Navigate to <strong>API Keys</strong> in the sidebar.</li>
                                <li>Click <strong>Create API Key</strong> and give it a name (e.g., "StudyBoard").</li>
                                <li>Copy the key (starts with <code className="bg-muted px-1 rounded">gsk_</code>).</li>
                                <li>Paste it in your StudyBoard settings or during onboarding.</li>
                            </ol>
                        </div>

                        <Button asChild>
                            <Link href="https://console.groq.com/keys" target="_blank">
                                Get Groq API Key <IconExternalLink className="ml-2 w-4 h-4" />
                            </Link>
                        </Button>
                    </section>

                    {/* Resend Section */}
                    <section className="p-6 rounded-2xl bg-card border border-border">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                <IconMail className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold mb-1">Resend API</h2>
                                <p className="text-muted-foreground">Powers email notifications like daily morning briefings.</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <h3 className="font-semibold">Why Resend?</h3>
                            <p className="text-muted-foreground">
                                Resend is a modern email API built for developers. Their <strong>free tier includes 3,000 emails/month</strong>—more than enough for daily StudyBoard notifications.
                            </p>
                        </div>

                        <div className="space-y-4 mb-6">
                            <h3 className="font-semibold">How to Get Your Key</h3>
                            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                                <li>Go to <Link href="https://resend.com" target="_blank" className="text-primary hover:underline">resend.com</Link></li>
                                <li>Create a free account.</li>
                                <li>Navigate to <strong>API Keys</strong> in your dashboard.</li>
                                <li>Click <strong>Create API Key</strong>.</li>
                                <li>Copy the key (starts with <code className="bg-muted px-1 rounded">re_</code>).</li>
                                <li>Paste it in your StudyBoard settings.</li>
                            </ol>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                                <strong>Note:</strong> For Resend to work, you need to verify a domain. For testing, you can use their sandbox which sends to your own email only.
                            </p>
                        </div>

                        <Button asChild variant="outline">
                            <Link href="https://resend.com/api-keys" target="_blank">
                                Get Resend API Key <IconExternalLink className="ml-2 w-4 h-4" />
                            </Link>
                        </Button>
                    </section>

                    {/* Security Note */}
                    <section className="p-6 rounded-2xl bg-muted/30 border border-border">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                                <IconShieldCheck className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold mb-2">Your Keys Are Safe</h2>
                                <p className="text-muted-foreground">
                                    API keys are stored encrypted in the database and are only used for your requests. They are never exposed to other users or logged. You can delete them at any time in Settings.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
