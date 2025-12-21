import { Logo } from "@/components/ui/logo"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto max-w-3xl px-4 py-16">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
                    <IconArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="mb-12">
                    <Logo className="mb-6" />
                    <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
                    <p className="text-muted-foreground">Last updated: December 21, 2024</p>
                </div>

                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            StudyBoard ("we", "our", "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">2. Data We Collect</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">We collect the following types of information:</p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li><strong>Account Information:</strong> Name, email address, and profile picture (if using OAuth).</li>
                            <li><strong>Academic Data:</strong> Assignments, exams, grades, todos, and study sessions you create.</li>
                            <li><strong>Usage Data:</strong> Focus session durations, mood logs, and productivity analytics.</li>
                            <li><strong>API Keys:</strong> Third-party API keys (Groq, Resend) you provide for AI features.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">Your data is used to:</p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Provide and personalize the StudyBoard experience.</li>
                            <li>Generate AI-powered daily briefings and suggestions.</li>
                            <li>Send email notifications (if you provide a Resend API key).</li>
                            <li>Calculate analytics and productivity metrics.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">4. Data Storage & Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Your data is stored securely in our database. API keys are encrypted before storage. We do not sell, share, or rent your personal data to third parties. Access to your data is strictly limited to authenticated sessions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            StudyBoard integrates with third-party services (Groq for AI, Resend for emails, Spotify for music). When you provide API keys, requests are made directly to these services. Please review their respective privacy policies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">You have the right to:</p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Access and export your data.</li>
                            <li>Request deletion of your account and all associated data.</li>
                            <li>Update or correct your personal information.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">7. Contact</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            For any privacy-related questions, please open an issue on our{" "}
                            <Link href="https://github.com/tripathiji1312/study_board" className="text-primary hover:underline">GitHub repository</Link>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
