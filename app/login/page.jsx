'use client'

import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { LoginForm } from "@/components/login/login-form"
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {

    return (
        <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
            {/* Left Side: Login Form */}
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
                        className="w-full max-w-xs sm:max-w-sm px-2 sm:px-0"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <LoginForm />
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Animated Moving Gradient Background */}
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


                {/* Vignette effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
            </motion.div>
        </div>
    )
}
