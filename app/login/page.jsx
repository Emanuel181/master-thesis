'use client'
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { LoginForm } from "@/components/login/login-form"
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PersonStanding } from "lucide-react";
import { useAccessibility } from "@/contexts/accessibilityContext";

export default function LoginPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [serviceStatus, setServiceStatus] = useState("checking") // checking, operational, partial, down
    const { openPanel, setForceHideFloating } = useAccessibility()

    // Hide floating button on login page
    useEffect(() => {
        setForceHideFloating(true)
        return () => setForceHideFloating(false)
    }, [setForceHideFloating])

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard')
        }
    }, [status, router])

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await fetch("/api/health", { 
                    method: "GET",
                    cache: "no-store" 
                });
                if (response.ok) {
                    const text = await response.text();
                    setServiceStatus(text === "ok" ? "operational" : "partial");
                } else {
                    setServiceStatus("partial");
                }
            } catch {
                setServiceStatus("down");
            }
        };

        checkHealth();
        const interval = setInterval(checkHealth, 60000);
        return () => clearInterval(interval);
    }, []);

    if (status === 'loading') {
        return null // Or a loading spinner
    }

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* Left Side: Login Form */}
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 font-medium">
                        <Image
                            src="/web-app-manifest-512x512.png"
                            alt="Logo"
                            className="h-6 w-6"
                            width={24}
                            height={24}
                        />
                        <span className="text-lg font-semibold">VulnIQ</span>
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Button variant="ghost" size="sm" asChild className="hover:bg-[var(--brand-accent)]/10 hover:text-[var(--brand-accent)]">
                            <Link href="/">
                                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Back to Home</span>
                            </Link>
                        </Button>
                        <a
                            href="https://status.vulniq.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                    serviceStatus === "operational" ? "bg-green-400" : 
                                    serviceStatus === "partial" ? "bg-yellow-400" : 
                                    serviceStatus === "down" ? "bg-red-400" : "bg-gray-400"
                                }`} />
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                    serviceStatus === "operational" ? "bg-green-500" : 
                                    serviceStatus === "partial" ? "bg-yellow-500" : 
                                    serviceStatus === "down" ? "bg-red-500" : "bg-gray-500"
                                }`} />
                            </span>
                            <span className="hidden sm:inline">
                                {serviceStatus === "operational" ? "Services are operational" : 
                                 serviceStatus === "partial" ? "Services partially operational" : 
                                 serviceStatus === "down" ? "Services not operational" : "Checking..."}
                            </span>
                        </a>
                        <AccessibilityButton />
                        <ThemeToggle />
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <motion.div
                        className="w-full max-w-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <LoginForm />
                    </motion.div>
                </div>

                {/* Terms and Privacy Policy */}
                <div className="text-center text-xs text-muted-foreground pb-6">
                    <span className="text-muted-foreground">By continuing, you agree to VulnIQ's</span>{" "}
                    <Link href="/terms" className="text-foreground underline underline-offset-4 hover:text-primary">
                        Terms of Service
                    </Link>{" "}
                    <span className="text-muted-foreground">and</span>{" "}
                    <Link href="/privacy" className="text-foreground underline underline-offset-4 hover:text-primary">
                        Privacy Policy
                    </Link>
                    <span className="text-muted-foreground">.</span>
                </div>
            </div>

            {/* Right Side: Animated Moving Gradient Background */}
            <motion.div
                className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden border-l bg-[length:400%_400%]"
                style={{
                    backgroundColor: '#0f1117',
                    backgroundImage: 'linear-gradient(45deg, hsla(220,60%,10%,1), hsla(180,70%,25%,1), hsla(200,80%,30%,1), hsla(170,60%,35%,1), hsla(190,70%,20%,1))'
                }}
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 10, ease: 'easeInOut', repeat: Infinity }}
            >
                {/* Noise overlay */}
                <div
                    className="absolute inset-0 opacity-[0.15]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                />

                {/* Main Content */}
                <div className="relative z-10 max-w-2xl px-8 text-center">
                    <motion.h1
                        className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        Making code security autonomous by default
                    </motion.h1>
                </div>

                {/* Vignette effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
            </motion.div>
        </div>
    )
}

// Accessibility Button Component
function AccessibilityButton() {
    const { openPanel } = useAccessibility()

    return (
        <button
            onClick={openPanel}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--brand-accent)]/10 hover:bg-[var(--brand-accent)]/20 border border-[var(--brand-accent)]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2"
            aria-label="Open Accessibility Menu"
            title="Accessibility Options"
        >
            <PersonStanding className="w-5 h-5 text-[var(--brand-accent)]" strokeWidth={2} />
        </button>
    )
}