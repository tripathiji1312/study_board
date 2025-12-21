"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { IconBrandGoogle, IconBrandGithub, IconLoader } from "@tabler/icons-react"
import { toast } from "sonner"
import { Shell } from "@/components/ui/shell"

export default function SignUpPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [name, setName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || "Registration failed")
                return
            }

            toast.success("Account created! Signing you in...")

            // Auto login after registration
            const loginRes = await signIn("credentials", {
                redirect: false,
                email,
                password,
            })

            if (loginRes?.error) {
                toast.error("Login failed. Please sign in manually.")
                router.push("/auth/signin")
            } else {
                router.push("/onboarding") // Send to onboarding after first login
            }

        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    const handleOAuthLogin = (provider: "google" | "github") => {
        setIsLoading(true)
        signIn(provider, { callbackUrl: "/onboarding" })
    }

    return (
        <Shell>
            <div className="flex h-[80vh] items-center justify-center">
                <Card className="w-full max-w-[400px]">
                    <CardHeader className="text-center">
                        <CardTitle>Create an Account</CardTitle>
                        <CardDescription>Enter your details to get started</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
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
                        <Button className="w-full" onClick={handleRegister} disabled={isLoading}>
                            {isLoading && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or sign up with
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
                    </CardContent>
                    <CardFooter className="flex justify-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/auth/signin" className="ml-1 text-primary hover:underline">
                            Sign in
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </Shell>
    )
}
