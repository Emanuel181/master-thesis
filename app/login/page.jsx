'use client'

import { motion } from 'motion/react';
import { LoginForm } from "@/components/login/login-form" // Ensure this path is correct for your project
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
    return (
        <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
            {/* Left Side: Login Form */}
            <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-10">
                <div className="flex justify-between items-center">
                    <a href="/" className="flex items-center gap-2 font-medium text-xl sm:text-2xl">
                        <img src="https://amz-s3-pdfs-gp.s3.us-east-1.amazonaws.com/logo/logo.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 invert dark:invert-0" />
                        VulnIQ
                    </a>
                    <ThemeToggle />
                </div>
                <div className="flex flex-1 items-center justify-center py-8 sm:py-0">
                    <div className="w-full max-w-xs sm:max-w-sm px-2 sm:px-0">
                        <LoginForm />
                    </div>
                </div>
            </div>

            {/* Right Side: Agentic RAG Animation */}
            {/* We override bg-muted with a dark theme for the code visualization */}
            <motion.div
                className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden border-l border-border bg-[length:400%_400%]"
                style={{ backgroundColor: '#99ffa5', backgroundImage: 'linear-gradient(45deg, hsla(263,79%,77%,1), hsla(75,98%,73%,1), hsla(152,94%,68%,1), hsla(215,70%,75%,1), hsla(165,89%,79%,1), hsla(94,83%,71%,1), hsla(128,76%,79%,1))' }}
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 15, ease: 'easeInOut', repeat: Infinity }}
            >
            </motion.div>
        </div>
    )
}
