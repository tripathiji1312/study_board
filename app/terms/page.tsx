import { Logo } from "@/components/ui/logo"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto max-w-3xl px-4 py-16">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
                    <IconArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="mb-12">
                    <Logo className="mb-6" />
                    <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
                    <p className="text-muted-foreground">Last updated: December 21, 2024</p>
                </div>

                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing or using StudyBoard, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            StudyBoard is a productivity and academic management application that helps students track assignments, exams, focus sessions, and more. The service includes AI-powered features that require third-party API keys.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            You are responsible for:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Maintaining the confidentiality of your account credentials.</li>
                            <li>All activities that occur under your account.</li>
                            <li>Notifying us immediately of any unauthorized use.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">You agree not to:</p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Use the service for any illegal purpose.</li>
                            <li>Attempt to gain unauthorized access to the system.</li>
                            <li>Interfere with or disrupt the service.</li>
                            <li>Upload malicious content or code.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">5. Third-Party API Keys</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Certain features require you to provide your own API keys (e.g., Groq, Resend). You are responsible for any charges incurred by these third-party services. We store these keys securely but do not take responsibility for their misuse outside our application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            StudyBoard is open-source software. The source code is available under the terms specified in the repository. Your data remains your property.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            StudyBoard is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to suspend or terminate your account at any time for violations of these terms. You may delete your account at any time through the settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">10. Contact</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            For questions about these terms, please open an issue on our{" "}
                            <Link href="https://github.com/tripathiji1312/study_board" className="text-primary hover:underline">GitHub repository</Link>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
