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
                initial={{ opacity: 0.5, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.3,
                    duration: 0.8,
                    ease: "easeInOut",
                }}
                className="mt-8 bg-gradient-to-br from-[#e6f4f7] to-[#1fb6cf] py-4 bg-clip-text text-center text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-transparent"
            >
                VulnIQ
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-4 text-[#e6f4f7]/60 text-center text-base md:text-lg max-w-md"
            >
                Intelligent security for the modern codebase
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="mt-8 flex flex-col sm:flex-row gap-4"
            >
                <Button asChild size="lg" className="rounded-lg bg-[#1fb6cf] text-[#0a1c27] hover:bg-[#1fb6cf]/90 font-semibold">
                    <a href="/login" className="flex items-center gap-2">
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-lg border-[#e6f4f7]/20 text-[#e6f4f7] bg-transparent hover:bg-[#e6f4f7]/10">
                    <a href="#features">
                        Learn More
                    </a>
                </Button>
            </motion.div>
        </LampContainer>
    );
}