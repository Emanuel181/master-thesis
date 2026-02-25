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
            <motion.h2
                initial={{ opacity: 0.5, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.3,
                    duration: 0.8,
                    ease: "easeInOut",
                }}
                className="mt-4 xs:mt-6 sm:mt-12 bg-gradient-to-br from-[var(--brand-dark)] to-[var(--brand-accent)] dark:from-[var(--brand-light)] dark:to-[var(--brand-accent)] py-4 xs:py-6 sm:py-8 bg-clip-text text-center text-5xl xs:text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] font-bold tracking-tight text-transparent px-4"
            >
                VulnIQ
            </motion.h2>

            <motion.p
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-4 xs:mt-6 sm:mt-8 text-slate-300 dark:text-slate-300 text-slate-600 text-center text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl max-w-xs xs:max-w-sm sm:max-w-xl md:max-w-3xl lg:max-w-4xl px-4"
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
                "relative flex min-h-[50vh] xs:min-h-[55vh] sm:min-h-[65vh] md:min-h-[80vh] lg:min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--brand-dark)] w-full z-0",
                className
            )}>
            <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0">
                {/* Left conic beam */}
                <motion.div
                    initial={{ opacity: 0.5, width: "15rem" }}
                    whileInView={{ opacity: 1, width: "30rem" }}
                    transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
                    style={{
                        backgroundImage: "conic-gradient(var(--conic-position), var(--tw-gradient-stops))",
                    }}
                    className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic from-[var(--brand-accent)] via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
                >
                    <div className="absolute w-[100%] left-0 bg-[var(--brand-dark)] h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
                    <div className="absolute w-40 h-[100%] left-0 bg-[var(--brand-dark)] bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
                </motion.div>
                {/* Right conic beam */}
                <motion.div
                    initial={{ opacity: 0.5, width: "15rem" }}
                    whileInView={{ opacity: 1, width: "30rem" }}
                    transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
                    style={{
                        backgroundImage: "conic-gradient(var(--conic-position), var(--tw-gradient-stops))",
                    }}
                    className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-[var(--brand-accent)] text-white [--conic-position:from_290deg_at_center_top]"
                >
                    <div className="absolute w-40 h-[100%] right-0 bg-[var(--brand-dark)] bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
                    <div className="absolute w-[100%] right-0 bg-[var(--brand-dark)] h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
                </motion.div>
                {/* Background blur fills */}
                <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-[var(--brand-dark)] blur-2xl" />
                <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md" />
                {/* Center glow blob */}
                <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-[var(--brand-accent)] opacity-50 blur-3xl" />
                {/* Animated inner glow */}
                <motion.div
                    initial={{ width: "8rem" }}
                    whileInView={{ width: "16rem" }}
                    transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-[var(--brand-accent)] opacity-70 blur-2xl"
                />
                {/* Lamp line */}
                <motion.div
                    initial={{ width: "15rem" }}
                    whileInView={{ width: "30rem" }}
                    transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-[var(--brand-accent)]"
                />
                {/* Top dark cover */}
                <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-[var(--brand-dark)]" />
            </div>
            <div className="relative z-50 flex -translate-y-32 xs:-translate-y-40 sm:-translate-y-56 md:-translate-y-80 flex-col items-center px-4 xs:px-6 sm:px-8 w-full max-w-[100vw]">
                {children}
            </div>
        </div>
    );
};