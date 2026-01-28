"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { IconLock, IconLoader, IconCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/ui/logo"
import { toast } from "sonner"
import { motion } from "framer-motion"

function NewPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [isLoading, setIsLoading] = React.useState(false)
    const [password, setPassword] = React.useState("")
    const [confirmPassword, setConfirmPassword] = React.useState("")
    const [isSuccess, setIsSuccess] = React.useState(false)

    // Verify token presence
    React.useEffect(() => {
        if (!token) {
            toast.error("Invalid or missing reset token")
            router.push("/auth/signin")
        }
    }, [token, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch("/api/auth/new-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            })

            const data = await res.json()

            if (res.ok) {
                setIsSuccess(true)
                toast.success("Password updated successfully!")
            } else {
                toast.error(data.error || "Something went wrong")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface p-4 text-on-surface">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-[420px] bg-surface-container-high/80 backdrop-blur-xl border border-outline-variant/30 rounded-[2.5rem] shadow-expressive p-8 text-center space-y-6"
                >
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <IconCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-on-surface">Password Reset</h1>
                        <p className="text-on-surface-variant">
                            Your password has been successfully reset. You can now log in with your new password.
                        </p>
                    </div>
                    <Button asChild className="w-full h-12 rounded-full shadow-md">
                        <Link href="/auth/signin">Sign In</Link>
                    </Button>
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
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <Logo className="scale-110" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Set new password</h1>
                        <p className="text-on-surface-variant text-sm">
                            Please enter your new password below.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-on-surface">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 rounded-xl bg-surface-container-highest/50 border-transparent focus:border-primary focus:bg-surface-container-highest transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-on-surface">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="h-12 rounded-xl bg-surface-container-highest/50 border-transparent focus:border-primary focus:bg-surface-container-highest transition-all"
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 rounded-full font-semibold shadow-md" disabled={isLoading}>
                            {isLoading && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
                            Reset Password
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}

export default function NewPasswordPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-surface p-4">
                <IconLoader className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <NewPasswordContent />
        </React.Suspense>
    )
}
