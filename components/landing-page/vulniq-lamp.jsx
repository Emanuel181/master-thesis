"use client";
import React from "react";
import { motion } from "framer-motion";
import { LampContainer } from "./lamp";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LampDemo() {
    return (
        <LampContainer>
            <motion.h1
                initial={{ opacity: 0.5, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                    delay: 0.3,
                    duration: 0.8,
                    ease: "easeInOut",
                }}
                className="mt-4 sm:mt-8 bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-accent)] py-2 sm:py-4 bg-clip-text text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-transparent"
            >
                VulnIQ
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-2 sm:mt-4 text-[var(--brand-light)]/60 text-center text-xs sm:text-sm md:text-base lg:text-lg max-w-[280px] sm:max-w-sm md:max-w-md px-4"
            >
                Making code security autonomous by default
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="mt-4 sm:mt-6 md:mt-8 flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 w-full max-w-xs sm:max-w-none px-4 sm:w-auto sm:px-0"
            >
                <Button asChild size="default" className="rounded-lg bg-[var(--brand-accent)] text-[var(--brand-dark)] hover:bg-[var(--brand-accent)]/90 font-semibold w-full sm:w-auto text-sm sm:text-base">
                    <a href="/login" className="flex items-center justify-center gap-2">
                        Get Started
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </a>
                </Button>
                <Button asChild variant="outline" size="default" className="rounded-lg border-[var(--brand-light)]/20 text-[var(--brand-light)] bg-transparent hover:bg-[var(--brand-light)]/10 w-full sm:w-auto text-sm sm:text-base">
                    <a href="#features">
                        Learn More
                    </a>
                </Button>
            </motion.div>
        </LampContainer>
    );
}