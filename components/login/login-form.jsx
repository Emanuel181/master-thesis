'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { signIn } from "next-auth/react"
import { motion } from "framer-motion"
import { Loader2, LockKeyhole } from "lucide-react"
import { GitlabIcon } from "@/components/icons/gitlab"
import { useSearchParams } from "next/navigation"

export function LoginForm({ className, ...props }) {
    const [isLoading, setIsLoading] = React.useState(null)
    const [errorMessage, setErrorMessage] = React.useState(null)
    const searchParams = useSearchParams()

    // Get callback URL from query params, default to /dashboard
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

    const handleSignIn = async (provider) => {
        setIsLoading(provider)
        setErrorMessage(null)
        try {
            console.log('Signing in with provider:', provider, 'callbackUrl:', callbackUrl)
            await signIn(provider, { callbackUrl })
        } catch (error) {
            console.log('Sign in error:', error)
            setErrorMessage("Sign-in failed. Please try again or use another provider.")
            setIsLoading(null)
        }
    }


    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 },
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
        <motion.form
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn("flex flex-col gap-4 sm:gap-6 w-full max-w-sm mx-auto", className)}
            {...props}
        >
            <FieldGroup>
                {/* Header */}
                <motion.div variants={itemVariants} className="flex flex-col items-center gap-2 text-center mb-4 sm:mb-6">
                    <div className="flex items-center justify-center gap-2">
                        <LockKeyhole className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome</h1>
                    </div>
                    <p className="text-muted-foreground text-base sm:text-lg text-balance max-w-[90%] sm:max-w-[80%]">
                        Choose a provider below to access your workspace.
                    </p>
                </motion.div>

                {/* Divider */}
                <motion.div variants={itemVariants} className="relative mb-3 sm:mb-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t-2 border-muted" />
                    </div>
                    <div className="relative flex justify-center text-sm sm:text-base uppercase">
                        <span className="bg-background px-2 text-muted-foreground font-semibold">
                            Social login
                        </span>
                    </div>
                </motion.div>

                {errorMessage && (
                    <motion.div variants={itemVariants} className="text-xs sm:text-sm text-red-500 text-center -mt-2">
                        {errorMessage}
                    </motion.div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-2 sm:gap-3">
                    <Field>
                        {/* GitHub */}
                        <motion.div variants={itemVariants} whileTap={{ scale: 0.98 }}>
                            <Button
                                variant="outline"
                                type="button"
                                disabled={isLoading !== null}
                                onClick={() => handleSignIn("github")}
                                className="w-full h-12 sm:h-14 flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 hover:border-foreground/20 hover:bg-muted/30 font-medium text-sm sm:text-base"
                            >
                                {isLoading === "github" ? (
                                    <Loader2 className="h-7 w-7 animate-spin" />
                                ) : (
                                    <svg role="img" viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                                )}
                                Login with GitHub
                            </Button>
                        </motion.div>

                        {/* Google */}
                        <motion.div variants={itemVariants} className="mt-2 sm:mt-3" whileTap={{ scale: 0.98 }}>
                            <Button
                                variant="outline"
                                type="button"
                                disabled={isLoading !== null}
                                onClick={() => handleSignIn("google")}
                                className="w-full h-12 sm:h-14 flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 hover:border-foreground/20 hover:bg-muted/30 font-medium text-sm sm:text-base"
                            >
                                {isLoading === "google" ? (
                                    <Loader2 className="h-5 w-5 sm:h-7 sm:w-7 animate-spin" />
                                ) : (
                                    <svg viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" className="h-5 w-5 sm:h-7 sm:w-7"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"></path><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"></path><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"></path><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"></path></svg>
                                )}
                                Login with Google
                            </Button>
                        </motion.div>

                        {/* Microsoft */}
                        <motion.div variants={itemVariants} className="mt-2 sm:mt-3" whileTap={{ scale: 0.98 }}>
                            <Button
                                variant="outline"
                                type="button"
                                disabled={isLoading !== null}
                                onClick={() => handleSignIn("microsoft-entra-id")}
                                className="w-full h-12 sm:h-14 flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 hover:border-foreground/20 hover:bg-muted/30 font-medium text-sm sm:text-base"
                            >
                                {isLoading === "microsoft-entra-id" ? (
                                    <Loader2 className="h-5 w-5 sm:h-7 sm:w-7 animate-spin" />
                                ) : (
                                    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none" className="h-5 w-5 sm:h-7 sm:w-7"><path fill="#F35325" d="M1 1h6.5v6.5H1V1z"></path><path fill="#81BC06" d="M8.5 1H15v6.5H8.5V1z"></path><path fill="#05A6F0" d="M1 8.5h6.5V15H1V8.5z"></path><path fill="#FFBA08" d="M8.5 8.5H15V15H8.5V8.5z"></path></svg>
                                )}
                                Login with Microsoft
                            </Button>
                        </motion.div>

                        {/* GitLab */}
                        <motion.div variants={itemVariants} className="mt-2 sm:mt-3" whileTap={{ scale: 0.98 }}>
                            <Button
                                variant="outline"
                                type="button"
                                disabled={isLoading !== null}
                                onClick={() => handleSignIn("gitlab")}
                                className="w-full h-12 sm:h-14 flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 hover:border-foreground/20 hover:bg-muted/30 font-medium text-sm sm:text-base"
                            >
                                {isLoading === "gitlab" ? (
                                    <Loader2 className="h-5 w-5 sm:h-7 sm:w-7 animate-spin" />
                                ) : (
                                    <GitlabIcon className="h-5 w-5 sm:h-7 sm:w-7" />
                                )}
                                Login with GitLab
                            </Button>
                        </motion.div>
                    </Field>
                </div>
            </FieldGroup>

        </motion.form>
    )
}
