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
                className="mt-8 bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-accent)] dark:from-[var(--brand-light)] dark:to-[var(--brand-accent)] py-4 bg-clip-text text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-transparent"
            >
                VulnIQ
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-2 sm:mt-4 text-slate-300 dark:text-slate-300 text-slate-600 text-center text-xs sm:text-sm md:text-base lg:text-lg max-w-[280px] sm:max-w-sm md:max-w-md px-4"
            >
                Making code security autonomous by default
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="mt-4 sm:mt-6 md:mt-8 flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 w-full max-w-xs sm:max-w-none px-4 sm:w-auto sm:px-0"
            >
                <Button asChild size="default" className="rounded-lg font-semibold w-full sm:w-auto text-sm sm:text-base">
                    <a href={isAuthenticated ? "/dashboard" : "/login"} className="flex items-center justify-center gap-2 text-white dark:text-[var(--brand-primary)]">
                        {isAuthenticated ? "Dashboard" : "Get Started"}
                        {isAuthenticated ? <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </a>
                </Button>
                <Button asChild variant="outline" size="default" className="rounded-lg w-full sm:w-auto text-sm sm:text-base border-slate-600 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 border-slate-300 text-slate-700 hover:bg-slate-100">
                    <a href="#features">
                        Learn More
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
                "relative flex min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] flex-col items-center justify-center overflow-hidden bg-transparent w-full max-w-[100vw] z-0",
                className
            )}>
            <div className="relative flex w-full max-w-[100vw] flex-1 items-center justify-center isolate z-0 overflow-hidden">
                {/* Left conic gradient */}
                <motion.div
                    initial={{ opacity: 0.5, width: "5rem" }}
                    whileInView={{ opacity: 1, width: "8rem" }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: "easeInOut",
                    }}
                    style={{
                        backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
                    }}
                    className="absolute inset-auto h-20 sm:h-40 md:h-56 w-[8rem] sm:w-[20rem] md:w-[30rem] -translate-y-1/2 -translate-x-1/2 bg-gradient-conic from-[var(--brand-accent)] via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]">
                </motion.div>
                {/* Right conic gradient */}
                <motion.div
                    initial={{ opacity: 0.5, width: "5rem" }}
                    whileInView={{ opacity: 1, width: "8rem" }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: "easeInOut",
                    }}
                    style={{
                        backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
                    }}
                    className="absolute inset-auto h-20 sm:h-40 md:h-56 w-[8rem] sm:w-[20rem] md:w-[30rem] -translate-y-1/2 translate-x-1/2 bg-gradient-conic from-transparent via-transparent to-[var(--brand-accent)] text-white [--conic-position:from_290deg_at_center_top]">
                </motion.div>
                {/* Blur background */}
                <div className="absolute top-1/2 z-50 h-16 sm:h-36 md:h-48 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
                {/* Glow effects */}
                <div className="absolute inset-auto z-50 h-10 sm:h-28 md:h-36 w-[6rem] sm:w-[18rem] md:w-[28rem] -translate-y-1/2 rounded-full bg-[var(--brand-accent)] opacity-50 blur-3xl"></div>
                <motion.div
                    initial={{ width: "2rem" }}
                    whileInView={{ width: "4rem" }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: "easeInOut",
                    }}
                    className="absolute inset-auto z-30 h-10 sm:h-28 md:h-36 w-16 sm:w-48 md:w-64 -translate-y-[2.5rem] sm:-translate-y-[5rem] md:-translate-y-[6rem] rounded-full bg-[var(--brand-accent)]/80 blur-2xl"></motion.div>
                {/* Blue line */}
                <motion.div
                    initial={{ width: "8rem" }}
                    whileInView={{ width: "16rem" }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: "easeInOut",
                    }}
                    className="absolute inset-auto z-50 h-0.5 w-[16rem] sm:w-[28rem] md:w-[40rem] -translate-y-[3rem] sm:-translate-y-[6rem] md:-translate-y-[7rem] bg-[var(--brand-accent)]"></motion.div>
            </div>
            <div className="relative z-50 flex -translate-y-20 sm:-translate-y-52 md:-translate-y-72 flex-col items-center px-4 sm:px-5 w-full max-w-[100vw]">
                {children}
            </div>
        </div>
    );
};