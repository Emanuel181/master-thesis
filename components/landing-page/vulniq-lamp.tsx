"use client";
import React from "react";
import { motion } from "framer-motion";
import { LampContainer } from "@/components/ui/lamp";

export function VulnIQLamp() {
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
                // Updated sizes: text-6xl for mobile, md:text-9xl for desktop
                className="mt-8 bg-gradient-to-br from-slate-100 to-slate-400 py-4 bg-clip-text text-center text-6xl font-bold tracking-tight text-transparent md:text-9xl"
            >
                VulnIQ
            </motion.h1>
        </LampContainer>
    );
}