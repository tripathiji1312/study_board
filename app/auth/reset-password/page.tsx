"use client"

import * as React from "react"
import Link from "next/link"
import { IconArrowLeft, IconMail, IconLoader } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/ui/logo"
import { toast } from "sonner"
import { motion } from "framer-motion"

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [email, setEmail] = React.useState("")
    const [isSubmitted, setIsSubmitted] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            if (res.ok) {
                setIsSubmitted(true)
                toast.success("Reset link sent!")
            } else {
                toast.error("Something went wrong. Please try again.")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface p-4 relative overflow-hidden text-on-surface">
                <div className="absolute inset-0 z-0 opacity-40">
                    <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 w-full max-w-[420px]"
                >
                    <div className="bg-surface-container-high/80 backdrop-blur-xl border border-outline-variant/30 rounded-[2.5rem] shadow-expressive p-8 text-center space-y-6">
                        <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                            <IconMail className="w-6 h-6 text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-on-surface">Check your email</h1>
                            <p className="text-on-surface-variant text-sm">
                                We&apos;ve sent a password reset link to <br />
                                <span className="font-medium text-on-surface">{email}</span>
                            </p>
                        </div>
                        <Button asChild className="w-full h-12 rounded-full shadow-md">
                            <Link href="/auth/signin">Back to Sign In</Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-4 relative overflow-hidden text-on-surface">
            <div className="absolute inset-0 z-0 opacity-40">
                <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-[420px]"
            >
                <div className="bg-surface-container-high/80 backdrop-blur-xl border border-outline-variant/30 rounded-[2.5rem] shadow-expressive p-8 md:p-10 space-y-8">
                    <div className="space-y-4">
                        <Link href="/auth/signin" className="inline-flex items-center text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                            <IconArrowLeft className="mr-2 h-4 w-4" />
                            Back to Sign In
                        </Link>
                        <div className="flex justify-center py-4">
                            <Logo className="scale-110" />
                        </div>
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight text-on-surface">Forgot password?</h1>
                            <p className="text-on-surface-variant text-sm">
                                Enter your email address and we&apos;ll send you a link to reset your password.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-on-surface">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 rounded-xl bg-surface-container-highest/50 border-transparent focus:border-primary focus:bg-surface-container-highest transition-all"
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 rounded-full font-semibold shadow-md" disabled={isLoading}>
                            {isLoading && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
                            Send Reset Link
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
