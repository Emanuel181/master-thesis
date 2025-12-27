'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, CheckCircle2, Loader2, Shield, Clock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from 'next/image'
import { signIn } from "next-auth/react"
import { toast } from "sonner"

// Helper to get email provider details
const getEmailProviders = () => {
    return [
        {
            name: 'Gmail',
            url: 'https://mail.google.com/mail/u/0/#search/from%3Anoreply%40vulniq.org+in%3Aanywhere',
            icon: (props) => (
                <svg viewBox="7.086 -169.483 1277.149 1277.149" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" xmlns="http://www.w3.org/2000/svg" fill="#000000" {...props}>
                    <g strokeWidth="0"></g>
                    <g strokeLinecap="round" strokeLinejoin="round"></g>
                    <g>
                        <path fill="none" d="M1138.734 931.095h.283M1139.017 931.095h-.283"></path>
                        <path d="M1179.439 7.087c57.543 0 104.627 47.083 104.627 104.626v30.331l-145.36 103.833-494.873 340.894L148.96 242.419v688.676h-37.247c-57.543 0-104.627-47.082-104.627-104.625V111.742C7.086 54.198 54.17 7.115 111.713 7.115l532.12 394.525L1179.41 7.115l.029-.028z" fill="#e75a4d"></path>
                        <linearGradient id="a" gradientUnits="userSpaceOnUse" x1="1959.712" y1="737.107" x2="26066.213" y2="737.107" gradientTransform="matrix(.0283 0 0 -.0283 248.36 225.244)">
                            <stop offset="0" stopColor="#f8f6ef"></stop>
                            <stop offset="1" stopColor="#e7e4d6"></stop>
                        </linearGradient>
                        <path fill="url(#a)" d="M111.713 7.087l532.12 394.525L1179.439 7.087z"></path>
                        <path fill="#e7e4d7" d="M148.96 242.419v688.676h989.774V245.877L643.833 586.771z"></path>
                        <path fill="#b8b7ae" d="M148.96 931.095l494.873-344.324-2.24-1.586L148.96 923.527z"></path>
                        <path fill="#b7b6ad" d="M1138.734 245.877l.283 685.218-495.184-344.324z"></path>
                        <path d="M1284.066 142.044l.17 684.51c-2.494 76.082-35.461 103.238-145.219 104.514l-.283-685.219 145.36-103.833-.028.028z" fill="#b2392f"></path>
                        <path fill="#f7f5ed" d="M111.713 7.087l532.12 394.525L1179.439 7.087z"></path>
                    </g>
                </svg>
            ),
        },
        {
            name: 'Outlook',
            url: 'https://outlook.live.com/mail/0/inbox',
            icon: (props) => (
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
                    <rect x="10" y="2" width="20" height="28" rx="2" fill="#1066B5"></rect>
                    <rect x="10" y="2" width="20" height="28" rx="2" fill="url(#paint0_linear_87_7742)"></rect>
                    <rect x="10" y="5" width="10" height="10" fill="#32A9E7"></rect>
                    <rect x="10" y="15" width="10" height="10" fill="#167EB4"></rect>
                    <rect x="20" y="15" width="10" height="10" fill="#32A9E7"></rect>
                    <rect x="20" y="5" width="10" height="10" fill="#58D9FD"></rect>
                    <mask id="mask0_87_7742" style={{maskType: "alpha"}} maskUnits="userSpaceOnUse" x="8" y="14" width="24" height="16">
                        <path d="M8 14H30C31.1046 14 32 14.8954 32 16V28C32 29.1046 31.1046 30 30 30H10C8.89543 30 8 29.1046 8 28V14Z" fill="url(#paint1_linear_87_7742)"></path>
                    </mask>
                    <g mask="url(#mask0_87_7742)">
                        <path d="M32 14V18H30V14H32Z" fill="#135298"></path>
                        <path d="M32 30V16L7 30H32Z" fill="url(#paint2_linear_87_7742)"></path>
                        <path d="M8 30V16L33 30H8Z" fill="url(#paint3_linear_87_7742)"></path>
                    </g>
                    <path d="M8 12C8 10.3431 9.34315 9 11 9H17C18.6569 9 20 10.3431 20 12V24C20 25.6569 18.6569 27 17 27H8V12Z" fill="#000000" fillOpacity="0.3"></path>
                    <rect y="7" width="18" height="18" rx="2" fill="url(#paint4_linear_87_7742)"></rect>
                    <path d="M14 16.0693V15.903C14 13.0222 11.9272 11 9.01582 11C6.08861 11 4 13.036 4 15.9307V16.097C4 18.9778 6.07278 21 9 21C11.9114 21 14 18.964 14 16.0693ZM11.6424 16.097C11.6424 18.0083 10.5665 19.1579 9.01582 19.1579C7.46519 19.1579 6.37342 17.9806 6.37342 16.0693V15.903C6.37342 13.9917 7.44937 12.8421 9 12.8421C10.5348 12.8421 11.6424 14.0194 11.6424 15.9307V16.097Z" fill="white"></path>
                    <defs>
                        <linearGradient id="paint0_linear_87_7742" x1="10" y1="16" x2="30" y2="16" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#064484"></stop>
                            <stop offset="1" stopColor="#0F65B5"></stop>
                        </linearGradient>
                        <linearGradient id="paint1_linear_87_7742" x1="8" y1="26.7692" x2="32" y2="26.7692" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#1B366F"></stop>
                            <stop offset="1" stopColor="#2657B0"></stop>
                        </linearGradient>
                        <linearGradient id="paint2_linear_87_7742" x1="32" y1="23" x2="8" y2="23" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#44DCFD"></stop>
                            <stop offset="0.453125" stopColor="#259ED0"></stop>
                        </linearGradient>
                        <linearGradient id="paint3_linear_87_7742" x1="8" y1="23" x2="32" y2="23" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#259ED0"></stop>
                            <stop offset="1" stopColor="#44DCFD"></stop>
                        </linearGradient>
                        <linearGradient id="paint4_linear_87_7742" x1="0" y1="16" x2="18" y2="16" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#064484"></stop>
                            <stop offset="1" stopColor="#0F65B5"></stop>
                        </linearGradient>
                    </defs>
                </svg>
            ),
        },
        {
            name: 'Yahoo Mail',
            url: 'https://mail.yahoo.com',
            icon: (props) => (
                <svg xmlns="http://www.w3.org/2000/svg" aria-label="Yahoo!" role="img" viewBox="0 0 512 512" fill="#000000" {...props}>
                    <g strokeWidth="0"></g>
                    <g strokeLinecap="round" strokeLinejoin="round"></g>
                    <g>
                        <rect width="512" height="512" rx="15%" fill="#5f01d1"></rect>
                        <g fill="#ffffff">
                            <path d="M203 404h-62l25-59-69-165h63l37 95 37-95h62m58 76h-69l62-148h69"></path>
                            <circle cx="303" cy="308" r="38"></circle>
                        </g>
                    </g>
                </svg>
            ),
        },
        {
            name: 'iCloud Mail',
            url: 'https://www.icloud.com/mail',
            icon: (props) => (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 80 52"
                    {...props}
                >
                    <defs>
                        <linearGradient id="linearGradient1072" x1="-108.90347" y1="2124.834" x2="-1137.1982" y2="2110.6506" gradientUnits="userSpaceOnUse" gradientTransform="matrix(0.07740541,0,0,0.07740541,88.373952,-128.02586)">
                            <stop style={{ stopColor: "#3e82f4", stopOpacity: 1 }} offset="0" />
                            <stop style={{ stopColor: "#93dcf7", stopOpacity: 1 }} offset="1" />
                        </linearGradient>
                    </defs>
                    <path
                        style={{ fill: "url(#linearGradient1072)", fillOpacity: 1 }}
                        d="M 45.864371,0.751258 A 21.518704,21.518704 0 0 0 27.127725,11.764594 11.804325,11.804325 0 0 0 21.976186,10.573131 11.804325,11.804325 0 0 0 10.35494,20.48888 16.255137,16.255137 0 0 0 0.37795502,35.481798 16.255137,16.255137 0 0 0 16.640956,51.721206 16.255137,16.255137 0 0 0 18.679799,51.57426 h 45.187983 a 15.130063,15.202083 0 0 0 0.712824,0.03447 15.130063,15.202083 0 0 0 0.679264,-0.03447 h 1.082164 V 51.49383 A 15.130063,15.202083 0 0 0 79.703385,36.406573 V 36.3774 A 15.130063,15.202083 0 0 0 67.386251,21.477308 21.518704,21.518704 0 0 0 45.864371,0.751258 Z"
                    />
                </svg>
            ),
        },
    ];
}

function VerifyCodeContent() {
    const searchParams = useSearchParams()
    const email = searchParams.get('email')
    const [otp, setOtp] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    // Best practices: Rate limiting and security states
    const [attempts, setAttempts] = useState(0)
    const [isLocked, setIsLocked] = useState(false)
    const [lockoutEndTime, setLockoutEndTime] = useState(null)
    const [lockoutRemaining, setLockoutRemaining] = useState(0)
    // Initialize resendCooldown from localStorage to persist across page refreshes
    const [resendCooldown, setResendCooldown] = useState(() => {
        if (typeof window === 'undefined') return 0 // SSR fallback
        try {
            const savedCooldown = localStorage.getItem(`otp_resend_cooldown_${email}`)
            if (savedCooldown) {
                const cooldownEndTime = parseInt(savedCooldown)
                const remaining = Math.ceil((cooldownEndTime - Date.now()) / 1000)
                return remaining > 0 ? remaining : 0
            }
        } catch {
            // localStorage not available
        }
        return 0
    })
    // Initialize with default value to prevent hydration mismatch
    const [codeExpiry, setCodeExpiry] = useState(600)
    const [hydrated, setHydrated] = useState(false)
    const maxAttempts = 5 // Maximum verification attempts before lockout
    const lockoutDuration = 300 // 5 minutes lockout in seconds
    const resendCooldownDuration = 60 // 60 seconds between resends

    const inputRef = useRef(null)
    const hasInitializedTimer = useRef(false)
    const isVerifyingRef = useRef(false)

    // Hydration: Load timer from localStorage after mount to prevent SSR mismatch
    useEffect(() => {
        if (hasInitializedTimer.current) return
        hasInitializedTimer.current = true

        // Use requestAnimationFrame to defer state update after paint
        requestAnimationFrame(() => {
            try {
                const savedTimestamp = localStorage.getItem(`otp_timestamp_${email}`)
                if (savedTimestamp) {
                    const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000)
                    const remaining = 600 - elapsed
                    setCodeExpiry(remaining > 0 ? remaining : 0)
                } else {
                    // Initialize new timer
                    localStorage.setItem(`otp_timestamp_${email}`, Date.now().toString())
                }
            } catch {
                // localStorage not available, use default
            }
            setHydrated(true)
        })
    }, [email])

    const providers = getEmailProviders()


    // Best practices: Countdown timers for resend cooldown, lockout, and code expiry
    useEffect(() => {
        const timer = setInterval(() => {
            // Resend cooldown timer
            if (resendCooldown > 0) {
                setResendCooldown(prev => prev - 1)
            }

            // Lockout timer
            if (isLocked && lockoutEndTime) {
                const remaining = Math.ceil((lockoutEndTime - Date.now()) / 1000)
                if (remaining <= 0) {
                    setIsLocked(false)
                    setLockoutEndTime(null)
                    setLockoutRemaining(0)
                    setAttempts(0)
                    setError("")
                } else {
                    setLockoutRemaining(remaining)
                }
            }

            // Code expiry timer
            if (codeExpiry > 0) {
                setCodeExpiry(prev => prev - 1)
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [resendCooldown, isLocked, lockoutEndTime, codeExpiry])

    // Focus input on mount for better UX
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }, [])


    // Format time for display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }


    // Helper to get email provider details
    const handleVerify = async (code) => {
        // Prevent multiple simultaneous verification attempts
        if (isVerifyingRef.current) return
        
        // Validate code format (only numbers, exactly 6 digits)
        if (!/^\d{6}$/.test(code)) {
            setError("Please enter a valid 6-digit code")
            return
        }

        // Check if locked out
        if (isLocked) {
            setError(`Too many attempts. Please wait ${formatTime(lockoutRemaining)}.`)
            return
        }

        // Check if code has expired
        if (codeExpiry <= 0) {
            setError("Code has expired. Please request a new one.")
            return
        }

        isVerifyingRef.current = true
        setIsLoading(true)
        setError("")

        try {
            // 1. Verify code with our custom API first
            const res = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            })

            const data = await res.json()

            if (!res.ok) {
                // Increment attempt counter
                const newAttempts = attempts + 1
                setAttempts(newAttempts)

                // Check if max attempts reached after this attempt fails
                if (newAttempts >= maxAttempts) {
                    setIsLocked(true)
                    setLockoutEndTime(Date.now() + lockoutDuration * 1000)
                    setLockoutRemaining(lockoutDuration)
                    setError(`Too many failed attempts. Please wait ${lockoutDuration / 60} minutes before trying again.`)
                } else {
                     setError(data.error || "Invalid code. Please try again.")
                }
                
                isVerifyingRef.current = false
                setIsLoading(false)
                // Clear OTP field on error
                setOtp("")
                return
            }

            // 2. If valid, proceed with the actual sign-in redirection
            // We construct the NextAuth callback URL that "consumes" the token
            const callbackUrl = window.location.origin + "/dashboard"
            const verifyUrl = `/api/auth/callback/nodemailer?token=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`
            
            // Clear timer before redirecting
            localStorage.removeItem(`otp_timer_${email}`)
            localStorage.removeItem(`otp_timestamp_${email}`)
            
            // Redirect to verification endpoint
            window.location.href = verifyUrl
            
        } catch (err) {
            console.error("Verification error:", err)
            setError("Something went wrong. Please try again.")
            isVerifyingRef.current = false
            setIsLoading(false)
        }
    }

    // Handle resend with cooldown (rate limiting best practice)
    const handleResend = async () => {
        if (resendCooldown > 0) return

        try {
            await signIn("nodemailer", { email, redirect: false })

            // Update storage first - creates a fresh session with new timestamp
            const now = Date.now()
            try {
                localStorage.setItem(`otp_timestamp_${email}`, now.toString())
                // Save resend cooldown end time to persist across page refreshes
                localStorage.setItem(`otp_resend_cooldown_${email}`, (now + resendCooldownDuration * 1000).toString())
            } catch {
                // localStorage not available
            }

            // Reset timers after updating storage
            setResendCooldown(resendCooldownDuration)
            setCodeExpiry(600) // Reset expiry timer to 10 minutes

            setOtp("") // Clear current input
            setAttempts(0) // Reset attempts on new code
            setError("")
            toast.success("New verification code sent!")
        } catch {
            toast.error("Failed to send new code. Please try again.")
        }
    }

    // Track if we should auto-submit (use ref to avoid re-renders)
    const shouldAutoSubmitRef = useRef(false)

    // Set flag when OTP reaches 6 digits
    useEffect(() => {
        if (otp.length === 6 && !isLocked && codeExpiry > 0) {
            shouldAutoSubmitRef.current = true
        }
    }, [otp, isLocked, codeExpiry])

    // Auto-submit using the flag (separate effect to avoid setState in sync)
    useEffect(() => {
        if (shouldAutoSubmitRef.current && otp.length === 6) {
            shouldAutoSubmitRef.current = false
            // Use setTimeout to defer the state update
            const timer = setTimeout(() => {
                handleVerify(otp)
            }, 0)
            return () => clearTimeout(timer)
        }
    })

    return (
        <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
            {/* Left Side: Content */}
            <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-10 bg-background">
                <div className="flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 font-semibold text-xl sm:text-2xl group">
                        <Image src="/web-app-manifest-512x512.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10" width={40} height={40} />
                        <span className="font-bold text-foreground">VulnIQ</span>
                    </Link>
                    <ThemeToggle />
                </div>
                
                <div className="flex flex-1 items-center justify-center py-8 sm:py-0">
                    <motion.div
                        className="w-full max-w-md"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="border-border/50 shadow-xl">
                            <CardHeader className="text-center space-y-4 pb-2">
                                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                    <Mail className="w-6 h-6 text-primary" />
                                </div>
                                <CardTitle className="text-2xl font-bold tracking-tight">Enter verification code</CardTitle>
                                <CardDescription className="text-base text-balance">
                                    We sent a 6-digit code to <br />
                                    <span className="font-medium text-foreground">{email || "your email address"}</span>
                                </CardDescription>
                            </CardHeader>
                            
                            <CardContent className="flex flex-col items-center gap-6 pt-4">
                                {/* Security status indicators */}
                                <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>Code expires in: {hydrated ? formatTime(codeExpiry) : "10:00"}</span>
                                    </div>
                                    {attempts > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            <span>{maxAttempts - attempts} attempts left</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <InputOTP
                                        ref={inputRef}
                                        maxLength={6}
                                        value={otp}
                                        onChange={(value) => {
                                            // Only allow numeric input
                                            const numericValue = value.replace(/[^0-9]/g, '')
                                            setOtp(numericValue)
                                        }}
                                        disabled={isLoading || isLocked}
                                    >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} className="h-14 w-14 text-xl font-bold" />
                                            <InputOTPSlot index={1} className="h-14 w-14 text-xl font-bold" />
                                            <InputOTPSlot index={2} className="h-14 w-14 text-xl font-bold" />
                                            <InputOTPSlot index={3} className="h-14 w-14 text-xl font-bold" />
                                            <InputOTPSlot index={4} className="h-14 w-14 text-xl font-bold" />
                                            <InputOTPSlot index={5} className="h-14 w-14 text-xl font-bold" />
                                        </InputOTPGroup>
                                    </InputOTP>
                                    {error && <p className="text-sm text-destructive text-center mt-2">{error}</p>}
                                    {isLocked && lockoutRemaining > 0 && (
                                        <p className="text-sm text-amber-500 text-center mt-2">
                                            Locked for {formatTime(lockoutRemaining)}
                                        </p>
                                    )}
                                    {codeExpiry <= 0 && (
                                        <p className="text-sm text-amber-500 text-center mt-2">
                                            Code expired. Please request a new one.
                                        </p>
                                    )}
                                </div>

                                <Button 
                                    className="w-full h-9 sm:h-11 text-base"
                                    size="lg"
                                    disabled={otp.length !== 6 || isLoading || isLocked || codeExpiry <= 0}
                                    onClick={() => handleVerify(otp)}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            Verify Code
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>

                                <div className="text-center text-sm text-muted-foreground mt-2">
                                    <p>Didn&apos;t receive the code?</p>
                                    <Button
                                        variant="link" 
                                        className="h-auto p-0 text-primary"
                                        disabled={resendCooldown > 0}
                                        onClick={handleResend}
                                    >
                                        {resendCooldown > 0
                                            ? `Resend in ${resendCooldown}s`
                                            : "Click to resend"
                                        }
                                    </Button>
                                </div>

                                {/* Email Providers */}
                                <div className="w-full pt-4 border-t">
                                    <p className="text-xs text-center text-muted-foreground mb-3 uppercase tracking-wider font-semibold">Open Email App</p>
                                    <div className="flex justify-center gap-3">
                                        {providers.map((provider) => (
                                            <Button
                                                key={provider.name}
                                                variant="outline"
                                                size="icon"
                                                className="h-10 w-10 rounded-full hover:bg-muted/50 transition-colors"
                                                asChild
                                                title={`Open ${provider.name}`}
                                            >
                                                <Link href={provider.url} target="_blank" rel="noopener noreferrer">
                                                    <provider.icon className="w-5 h-5" />
                                                    <span className="sr-only">{provider.name}</span>
                                                </Link>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            
                            <CardFooter className="flex flex-col gap-2 border-t pt-6">
                                <Button
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => {
                                        // Clear OTP session data when going back to login
                                        try {
                                            localStorage.removeItem(`otp_timestamp_${email}`)
                                            localStorage.removeItem(`otp_resend_cooldown_${email}`)
                                        } catch {
                                            // localStorage not available
                                        }
                                        window.location.href = '/login'
                                    }}
                                >
                                    Back to login
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Background (Same as Login) */}
            <motion.div
                className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden border-l border-border bg-[length:400%_400%]"
                style={{
                    backgroundColor: '#0f1117',
                    backgroundImage: 'linear-gradient(45deg, hsla(220,60%,10%,1), hsla(180,70%,25%,1), hsla(200,80%,30%,1), hsla(170,60%,35%,1), hsla(190,70%,20%,1))'
                }}
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 15, ease: 'easeInOut', repeat: Infinity }}
            >
                {/* Noise overlay */}
                <div
                    className="absolute inset-0 opacity-[0.15]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
                
                <div className="z-10 flex flex-col items-center gap-4 text-center px-8">
                     <div className="p-4 rounded-full bg-background/10 backdrop-blur-md border border-white/10">
                        <CheckCircle2 className="w-12 h-12 text-primary" />
                     </div>
                     <h2 className="text-3xl font-bold text-white tracking-tight">Secure Authentication</h2>
                     <p className="text-white/70 max-w-md text-lg">
                        Enter the verification code sent to your email to securely access your account.
                     </p>
                </div>
            </motion.div>
        </div>
    )
}

export default function VerifyCodePage() {
    return (
        <Suspense>
            <VerifyCodeContent />
        </Suspense>
    )
}
