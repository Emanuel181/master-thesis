"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function PhilosophyText() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <div ref={ref} className="relative py-32 sm:py-40 px-6 sm:px-8 lg:px-12 overflow-hidden">
            {/* Subtle divider lines */}
            <div className="absolute left-6 sm:left-8 lg:left-12 right-6 sm:right-8 lg:right-12 top-0 h-px bg-border/50" />
            <div className="absolute left-6 sm:left-8 lg:left-12 right-6 sm:right-8 lg:right-12 bottom-0 h-px bg-border/50" />

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <motion.p
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-foreground leading-[1.3] tracking-[-0.02em]"
                    initial={{ opacity: 0, y: 24 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                    Security vulnerabilities demand{' '}
                    <span className="text-foreground underline decoration-foreground/20 underline-offset-8 decoration-2">
                        precision
                    </span>.{' '}
                    <span className="text-muted-foreground">
                        Not hallucinations. Intelligent, verified remediation is the new standard.
                    </span>
                </motion.p>
            </div>
        </div>
    );
}
