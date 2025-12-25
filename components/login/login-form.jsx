'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { signIn } from "next-auth/react"
import { motion } from "framer-motion"
import { Loader2, LockKeyhole, Clock, AlertTriangle, Mail } from "lucide-react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

const LAST_PROVIDER_KEY = "vulniq-last-login-provider"

// Map of error codes to user-friendly messages
const ERROR_MESSAGES = {
    OAuthAccountNotLinked: {
        title: "Account Already Exists",
        description: "An account with this email already exists but is linked to a different sign-in provider.",
        details: "To sign in, please use the same provider you originally used to create your account.",
        icon: Mail,
    },
    OAuthSignin: {
        title: "Sign-in Error",
        description: "There was a problem starting the sign-in process.",
        details: "Please try again. If the problem persists, try a different sign-in method.",
        icon: AlertTriangle,
    },
    OAuthCallback: {
        title: "Authentication Failed",
        description: "There was a problem completing the authentication.",
        details: "This could be due to a temporary issue. Please try signing in again.",
        icon: AlertTriangle,
    },
    Default: {
        title: "Sign-in Error",
        description: "An unexpected error occurred during sign-in.",
        details: "Please try again or use a different sign-in method.",
        icon: AlertTriangle,
    },
}

function LoginFormInner({ className, ...props }) {
    const [isLoading, setIsLoading] = React.useState(null)
    const [errorMessage, setErrorMessage] = React.useState(null)
    const [lastUsedProvider, setLastUsedProvider] = React.useState(null)
    const [mounted, setMounted] = React.useState(false)
    const [errorDialogOpen, setErrorDialogOpen] = React.useState(false)
    const [currentError, setCurrentError] = React.useState(null)
    const [email, setEmail] = React.useState("")
    const searchParams = useSearchParams()

    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
    const errorParam = searchParams.get("error")

    React.useEffect(() => {
        if (errorParam) {
            const errorInfo = ERROR_MESSAGES[errorParam] || ERROR_MESSAGES.Default
            setCurrentError({ ...errorInfo, code: errorParam })
            setErrorDialogOpen(true)
        }
    }, [errorParam])

    React.useEffect(() => {
        setMounted(true)
        try {
            const saved = localStorage.getItem(LAST_PROVIDER_KEY)
            if (saved) setLastUsedProvider(saved)
        } catch (e) {
            // localStorage not available
        }
    }, [])

    const handleSignIn = async (provider) => {
        setIsLoading(provider)
        setErrorMessage(null)
        try {
            localStorage.setItem(LAST_PROVIDER_KEY, provider)
        } catch (e) {}

        try {
            await signIn(provider, { callbackUrl })
        } catch (error) {
            setErrorMessage("Sign-in failed. Please try again.")
            setIsLoading(null)
        }
    }

    const handleEmailSignIn = async (e) => {
        e.preventDefault()
        setIsLoading("nodemailer")
        setErrorMessage(null)

        try {
            const res = await signIn("nodemailer", { email, callbackUrl, redirect: false })
            if (res?.error) {
                setErrorMessage("Sign-in failed. Please try again.")
                setIsLoading(null)
            } else {
                window.location.href = `/login/verify-code?email=${encodeURIComponent(email)}`
            }
        } catch (error) {
            setErrorMessage("Sign-in failed. Please try again.")
            setIsLoading(null)
        }
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    }

    const itemVariants = {
        hidden: { y: 10, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 350, damping: 25 }
        },
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn("w-full max-w-5xl mx-auto", className)}
            {...props}
        >
            <Card className="border-border/50 shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <motion.div variants={itemVariants} className="flex justify-center mb-2">
                        <div className="rounded-full bg-muted p-3">
                            <LockKeyhole className="h-6 w-6 text-foreground" />
                        </div>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                            Welcome back
                        </CardTitle>
                        <CardDescription>
                            Choose your preferred method to sign in to VulnIQ
                        </CardDescription>
                    </motion.div>
                </CardHeader>

                <CardContent className="grid gap-4">
                    {/* Social Login Buttons */}
                    <div className="grid gap-2">
                        <motion.div variants={itemVariants} className="grid gap-2">
                            <Button
                                variant="outline"
                                type="button"
                                disabled={isLoading !== null}
                                onClick={() => handleSignIn("github")}
                                className={cn(
                                    "w-full relative",
                                    mounted && lastUsedProvider === "github" && "border-primary ring-1 ring-primary"
                                )}
                            >
                                {isLoading === "github" ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                                )}
                                Github
                                {mounted && lastUsedProvider === "github" && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Last used
                                    </div>
                                )}
                            </Button>
                        </motion.div>

                        <motion.div variants={itemVariants} className="grid gap-2">
                            <Button
                                variant="outline"
                                type="button"
                                disabled={isLoading !== null}
                                onClick={() => handleSignIn("google")}
                                className={cn(
                                    "w-full relative",
                                    mounted && lastUsedProvider === "google" && "border-primary ring-1 ring-primary"
                                )}
                            >
                                {isLoading === "google" ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                )}
                                Google
                                {mounted && lastUsedProvider === "google" && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Last used
                                    </div>
                                )}
                            </Button>
                        </motion.div>

                        <motion.div variants={itemVariants} className="grid gap-2">
                            <Button
                                variant="outline"
                                type="button"
                                disabled={isLoading !== null}
                                onClick={() => handleSignIn("microsoft-entra-id")}
                                className={cn(
                                    "w-full relative",
                                    mounted && lastUsedProvider === "microsoft-entra-id" && "border-primary ring-1 ring-primary"
                                )}
                            >
                                {isLoading === "microsoft-entra-id" ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <svg viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
                                )}
                                Microsoft
                                {mounted && lastUsedProvider === "microsoft-entra-id" && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Last used
                                    </div>
                                )}
                            </Button>
                        </motion.div>

                        <motion.div variants={itemVariants} className="grid gap-2">
                            <Button
                                variant="outline"
                                type="button"
                                disabled={isLoading !== null}
                                onClick={() => handleSignIn("gitlab")}
                                className={cn(
                                    "w-full relative",
                                    mounted && lastUsedProvider === "gitlab" && "border-primary ring-1 ring-primary"
                                )}
                            >
                                {isLoading === "gitlab" ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 0 0-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 0 0-.867 0L1.387 9.452.045 13.587a.924.924 0 0 0 .331 1.023L12 23.054l11.624-8.443a.92.92 0 0 0 .331-1.024"/></svg>
                                )}
                                GitLab
                                {mounted && lastUsedProvider === "gitlab" && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Last used
                                    </div>
                                )}
                            </Button>
                        </motion.div>
                    </div>

                    <motion.div variants={itemVariants} className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with email
                            </span>
                        </div>
                    </motion.div>

                    {/* Email Login */}
                    <motion.div variants={itemVariants}>
                        <form onSubmit={handleEmailSignIn} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-10"
                                />
                            </div>
                            <Button type="submit" disabled={isLoading !== null || !email}>
                                {isLoading === "nodemailer" ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    "Sign in with Email"
                                )}
                            </Button>
                        </form>
                    </motion.div>

                    {errorMessage && (
                        <motion.div
                            variants={itemVariants}
                            className="text-sm font-medium text-destructive text-center"
                        >
                            {errorMessage}
                        </motion.div>
                    )}
                </CardContent>

                <CardFooter>
                    <motion.p variants={itemVariants} className="text-xs text-center text-muted-foreground w-full">
                        <span className="text-muted-foreground">By continuing, you agree to VulnIQ's</span>{" "}
                        <Link href="/terms" className="text-white underline underline-offset-4 hover:text-primary">
                            Terms of Service
                        </Link>{" "}
                        <span className="text-muted-foreground">and</span>{" "}
                        <Link href="/privacy" className="text-white underline underline-offset-4 hover:text-primary">
                            Privacy Policy
                        </Link>
                        <span className="text-muted-foreground">.</span>
                    </motion.p>
                </CardFooter>
            </Card>

            {/* Error Dialog */}
            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            {currentError?.icon && (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                                    <currentError.icon className="h-5 w-5 text-destructive" />
                                </div>
                            )}
                            <DialogTitle>{currentError?.title || "Error"}</DialogTitle>
                        </div>
                        <DialogDescription className="pt-2">
                            {currentError?.description}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 text-sm text-muted-foreground">
                        <p>{currentError?.details}</p>
                        {currentError?.code === "OAuthAccountNotLinked" && (
                            <div className="mt-4 rounded-md bg-muted p-3 text-xs">
                                <strong>Tip:</strong> Try signing in with the provider you originally used to create your account.
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setErrorDialogOpen(false)}>
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                setErrorDialogOpen(false)
                                window.history.replaceState({}, '', '/login')
                            }}
                        >
                            Try Again
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}

export function LoginForm({ className, ...props }) {
    return (
        <React.Suspense fallback={null}>
            <LoginFormInner className={className} {...props} />
        </React.Suspense>
    )
}