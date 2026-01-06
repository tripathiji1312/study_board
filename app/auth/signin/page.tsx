"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconBrandGithub, IconLoader, IconSparkles } from "@tabler/icons-react"
import { toast } from "sonner"
import { Logo } from "@/components/ui/logo"
import { motion } from "framer-motion"

export default function SignInPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
            })

            if (res?.error) {
                toast.error("Invalid email or password")
            } else {
                toast.success("Welcome back!")
                router.push("/")
                router.refresh()
            }
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    const handleOAuthLogin = (provider: "google" | "github") => {
        setIsLoading(true)
        signIn(provider, { callbackUrl: "/" })
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.08) 1px, transparent 0)`,
                    backgroundSize: '32px 32px'
                }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-[420px]"
            >
                <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl shadow-black/10 p-8 md:p-10 space-y-8">
                    <div className="text-center space-y-4">
                        <div className="flex justify-center mb-6">
                            <Logo className="scale-125" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back</h1>
                        <p className="text-muted-foreground text-sm">
                            Sign in to continue managing your academic life.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Button variant="outline" onClick={() => handleOAuthLogin("github")} disabled={isLoading} className="w-full h-11 rounded-xl hover:bg-accent/50">
                            <IconBrandGithub className="mr-2 h-4 w-4" />
                            Continue with GitHub
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-3 text-muted-foreground">
                                    or continue with email
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleCredentialsLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11 rounded-xl bg-background/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                    <Link href="/auth/reset-password" className="text-xs text-primary hover:underline">
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-11 rounded-xl bg-background/50"
                                />
                            </div>
                            <Button type="submit" className="w-full h-11 rounded-xl font-semibold" disabled={isLoading}>
                                {isLoading && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
                                Sign In
                            </Button>
                        </form>

                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/auth/signup" className="text-primary font-medium hover:underline">
                            Create one
                        </Link>
                    </p>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    By continuing, you agree to our{" "}
                    <Link href="/terms" className="underline hover:text-foreground">Terms</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
                </p>
            </motion.div>
        </div>
    )
}
