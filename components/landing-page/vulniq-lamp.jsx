"use client";
import React from "react";
import { motion } from "motion/react";
import { LampContainer } from "./lamp";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LampDemo() {
    return (
        <LampContainer>
            <motion.h1
                initial={{ opacity: 0.5, y: 50 }} // reduced initial y distance
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }} // Trigger once
                transition={{
                    delay: 0.3,
                    duration: 0.8,
                    ease: "easeInOut",
                }}
                className="mt-8 bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-accent)] py-4 bg-clip-text text-center text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-transparent"
            >
                VulnIQ
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-4 text-[var(--brand-light)]/60 text-center text-base md:text-lg max-w-md"
            >
                Making code security autonomous by default
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="mt-8 flex flex-col sm:flex-row gap-4"
            >
                <Button asChild size="lg" className="rounded-lg bg-[var(--brand-accent)] text-[var(--brand-dark)] hover:bg-[var(--brand-accent)]/90 font-semibold">
                    <a href="/login" className="flex items-center gap-2">
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-lg border-[var(--brand-light)]/20 text-[var(--brand-light)] bg-transparent hover:bg-[var(--brand-light)]/10">
                    <a href="#features">
                        Learn More
                    </a>
                </Button>
            </motion.div>
        </LampContainer>
    );
}