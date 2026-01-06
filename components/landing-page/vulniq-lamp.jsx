"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export function LampDemo() {
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated" && !!session;

    return (
        <LampContainer>
            <motion.h1
                initial={{ opacity: 0.5, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.3,
                    duration: 0.8,
                    ease: "easeInOut",
                }}
                className="mt-8 sm:mt-12 bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-accent)] dark:from-[var(--brand-light)] dark:to-[var(--brand-accent)] py-8 bg-clip-text text-center text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] font-bold tracking-tight text-transparent px-4"
            >
                VulnIQ
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-6 sm:mt-8 text-slate-300 dark:text-slate-300 text-slate-600 text-center text-xl sm:text-2xl md:text-3xl lg:text-4xl max-w-lg sm:max-w-xl md:max-w-3xl lg:max-w-4xl px-4"
            >
                Making code security autonomous by default
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="mt-6 sm:mt-8 md:mt-12 lg:mt-16 flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-6 lg:gap-8 w-full max-w-xs sm:max-w-none px-4 sm:w-auto sm:px-0"
            >
                <Button asChild size="lg" className="rounded-lg sm:rounded-xl font-semibold w-full sm:w-auto text-sm sm:text-base md:text-lg lg:text-2xl px-5 sm:px-6 md:px-8 lg:px-10 py-2.5 sm:py-3 md:py-5 lg:py-7 h-auto">
                    <a href={isAuthenticated ? "/dashboard" : "/login"} className="flex items-center justify-center gap-2 sm:gap-2.5 md:gap-3 text-white dark:text-[var(--brand-primary)]">
                        {isAuthenticated ? "Dashboard" : "Get started"}
                        {isAuthenticated ? <LayoutDashboard className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-7 lg:h-7" /> : <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-7 lg:h-7" />}
                    </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-lg sm:rounded-xl w-full sm:w-auto text-sm sm:text-base md:text-lg lg:text-2xl px-5 sm:px-6 md:px-8 lg:px-10 py-2.5 sm:py-3 md:py-5 lg:py-7 h-auto border-slate-600 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 border-slate-300 text-slate-700 hover:bg-slate-100">
                    <a href="#features">
                        Learn more
                    </a>
                </Button>
            </motion.div>
        </LampContainer>
    );
}

export const LampContainer = ({ children, className }) => {
    return (
        <div
            className={cn(
                "relative flex min-h-[55vh] sm:min-h-[65vh] md:min-h-[80vh] lg:min-h-screen flex-col items-center justify-center overflow-hidden bg-transparent w-full max-w-[100vw] z-0",
                className
            )}>
            <div className="relative flex w-full max-w-[100vw] flex-1 scale-y-125 items-center justify-center isolate z-0">
                {/* Glow effects - positioned below lamp line */}
                <div className="absolute inset-auto z-30 h-40 sm:h-64 md:h-80 lg:h-96 w-[20rem] sm:w-[32rem] md:w-[48rem] lg:w-[56rem] -translate-y-[3rem] sm:-translate-y-[5rem] md:-translate-y-[6rem] lg:-translate-y-[7rem] rounded-full bg-[var(--brand-accent)] opacity-40 blur-3xl"></div>
                <motion.div
                    initial={{ width: "8rem" }}
                    whileInView={{ width: "16rem" }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: "easeInOut",
                    }}
                    className="absolute inset-auto z-30 h-36 sm:h-56 md:h-72 lg:h-80 w-48 sm:w-72 md:w-96 lg:w-[28rem] -translate-y-[2.5rem] sm:-translate-y-[4rem] md:-translate-y-[5rem] lg:-translate-y-[6rem] rounded-full bg-[var(--brand-accent)]/70 blur-2xl"></motion.div>
            </div>
            <div className="relative z-50 flex -translate-y-36 sm:-translate-y-52 md:-translate-y-60 lg:-translate-y-64 flex-col items-center px-6 sm:px-8 py-4 sm:py-8 md:py-12 w-full max-w-[100vw]">
                {children}
            </div>
        </div>
    );
};