"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation" // Correct import for App Router
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { IconBrandGoogle, IconBrandGithub, IconLoader } from "@tabler/icons-react"
import { toast } from "sonner"
import { Shell } from "@/components/ui/shell"

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
        <Shell>
            <div className="flex h-[80vh] items-center justify-center">
                <Card className="w-full max-w-[400px]">
                    <CardHeader className="text-center">
                        <CardTitle>Welcome Back</CardTitle>
                        <CardDescription>Sign in to your account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button className="w-full" onClick={handleCredentialsLogin} disabled={isLoading}>
                            {isLoading && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" onClick={() => handleOAuthLogin("github")} disabled={isLoading}>
                                <IconBrandGithub className="mr-2 h-4 w-4" />
                                GitHub
                            </Button>
                            <Button variant="outline" onClick={() => handleOAuthLogin("google")} disabled={isLoading}>
                                <IconBrandGoogle className="mr-2 h-4 w-4" />
                                Google
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            className="w-full mt-2 text-muted-foreground hover:text-primary"
                            onClick={async () => {
                                setIsLoading(true)
                                try {
                                    // 1. Seed Demo Data
                                    await fetch('/api/demo/seed', { method: 'POST' })

                                    // 2. Auto Login
                                    const res = await signIn("credentials", {
                                        redirect: false,
                                        email: "demo@example.com",
                                        password: "password",
                                    })

                                    if (res?.ok) {
                                        toast.success("Welcome Demo Student!")
                                        router.push("/")
                                        router.refresh()
                                    }
                                } catch (e) {
                                    toast.error("Demo login failed")
                                } finally {
                                    setIsLoading(false)
                                }
                            }}
                            disabled={isLoading}
                        >
                            Try Demo Account
                        </Button>
                    </CardContent>
                    <CardFooter className="flex justify-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link href="/auth/signup" className="ml-1 text-primary hover:underline">
                            Sign up
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </Shell>
    )
}
