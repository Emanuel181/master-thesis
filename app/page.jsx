'use client';

import React from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Components
import { SecurityCodeDemo } from '@/components/landing-page/hero/security-code-demo';
import { TimelineDemo } from '@/components/landing-page/features/timeline';
import { FeaturesGrid } from '@/components/landing-page/features/features-grid';
import { ModelSelector } from '@/components/landing-page/features/model-selector';
import { LampDemo } from '@/components/landing-page/vulniq-lamp';
import { FloatingNavbar } from "@/components/landing-page/floating-navbar";
import { Footer } from "@/components/landing-page/footer";

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.15,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
        },
    },
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function LandingPage() {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll();
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

    const heroOpacity = useTransform(smoothProgress, [0, 0.12], [1, 0]);
    const heroY = useTransform(smoothProgress, [0, 0.12], [0, -40]);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#1fb6cf]/20 flex flex-col overflow-x-hidden relative">

            {/* Background effects */}
            <div className="fixed inset-0 mesh-gradient pointer-events-none" />
            <div className="fixed inset-0 dots-pattern opacity-30 pointer-events-none" />

            <FloatingNavbar />

            {/* ===================== HERO ===================== */}
            <motion.section
                ref={heroRef}
                id="hero"
                className="relative z-10 w-full min-h-screen flex flex-col justify-center hero-gradient"
                style={{ opacity: heroOpacity, y: heroY }}
            >
                {/* Decorative elements */}
                <div className="absolute top-1/4 left-10 w-72 h-72 bg-[#1fb6cf]/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#1fb6cf]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full pt-32 pb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

                        {/* Left: Copy */}
                        <motion.div
                            className="space-y-8 text-center lg:text-left"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div variants={itemVariants} className="flex justify-center lg:justify-start gap-3">
                                <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#1fb6cf] bg-[#1fb6cf]/10 border border-[#1fb6cf]/20 rounded-full backdrop-blur-sm">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1fb6cf] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1fb6cf]"></span>
                                    </span>
                                    Open Beta
                                </span>
                            </motion.div>

                            <motion.h1
                                variants={itemVariants}
                                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
                            >
                                <span className="text-foreground">Security remediation</span>
                                <br />
                                <span className="gradient-text">without hallucinations.</span>
                            </motion.h1>

                            <motion.p
                                variants={itemVariants}
                                className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0"
                            >
                                Autonomous AI agents that detect, patch, and verify vulnerabilities. Every fix is <span className="text-[#1fb6cf] font-medium">grounded in your documentation</span> using RAG.
                            </motion.p>

                            <motion.div
                                variants={itemVariants}
                                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                            >
                                <Button asChild size="lg" className="rounded-lg">
                                    <a href="/login" className="flex items-center gap-2">
                                        Get Started
                                        <ArrowRight className="w-4 h-4" />
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="rounded-lg">
                                    <a href="#how-it-works">
                                        See How It Works
                                    </a>
                                </Button>
                            </motion.div>
                        </motion.div>

                        {/* Right: Demo */}
                        <motion.div
                            className="w-full"
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="relative">
                                {/* Glow behind card */}
                                <div className="absolute -inset-4 bg-[#1fb6cf]/20 rounded-3xl blur-2xl opacity-50" />
                                <div className="relative rounded-2xl border border-[#1fb6cf]/20 bg-card glow-accent overflow-hidden">
                                    <SecurityCodeDemo />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* ===================== FEATURES ===================== */}
            <section id="features" className="relative z-10 py-24 sm:py-32">
                {/* Section gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1fb6cf]/[0.02] to-transparent pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
                    <motion.div
                        className="text-center mb-20"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <motion.span
                            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-[#1fb6cf] uppercase tracking-[0.2em] bg-[#1fb6cf]/10 rounded-full border border-[#1fb6cf]/20 mb-6"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                        >
                            Platform
                        </motion.span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                            Enterprise-grade security
                            <br />
                            <span className="gradient-text">automation</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                            Purpose-built AI agents that understand security context, not just code.
                        </p>
                        <div className="accent-line-center w-24 mx-auto mt-8" />
                    </motion.div>

                    <FeaturesGrid />
                </div>
            </section>

            {/* ===================== HOW IT WORKS ===================== */}
            <section id="how-it-works" className="relative z-10 py-24 sm:py-32">
                <div className="absolute inset-0 bg-gradient-to-b from-[#1fb6cf]/[0.02] via-transparent to-[#1fb6cf]/[0.02] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
                    <motion.div
                        className="mb-20"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <motion.span
                            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-[#1fb6cf] uppercase tracking-[0.2em] bg-[#1fb6cf]/10 rounded-full border border-[#1fb6cf]/20 mb-6"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                        >
                            How It Works
                        </motion.span>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                            The remediation
                            <br />
                            <span className="gradient-text">pipeline</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
                            A rigorous, multi-agent process that ensures every fix is accurate and verified.
                        </p>
                        <div className="accent-line w-24 mt-8" />
                    </motion.div>
                    <TimelineDemo />
                </div>
            </section>

            {/* ===================== MODEL SELECTOR ===================== */}
            <section id="models" className="relative z-10 py-24 sm:py-32">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1fb6cf]/[0.03] to-transparent pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        <motion.div
                            className="space-y-8"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                        >
                            <motion.span
                                className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-[#1fb6cf] uppercase tracking-[0.2em] bg-[#1fb6cf]/10 rounded-full border border-[#1fb6cf]/20"
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                            >
                                Infrastructure
                            </motion.span>
                            <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                                <span className="text-foreground">Your models,</span>
                                <br />
                                <span className="gradient-text">your rules</span>
                            </h3>
                            <p className="text-muted-foreground leading-relaxed text-lg max-w-lg">
                                Deploy with Claude, GPT-4, or run fully local with Llama and Mistral. Perfect for air-gapped environments and strict compliance requirements.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Ollama & LMStudio support",
                                    "Cloud failover redundancy",
                                    "Per-agent model assignment",
                                    "Custom fine-tuned models",
                                ].map((item, i) => (
                                    <motion.li
                                        key={i}
                                        className="flex items-center gap-3 text-muted-foreground"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 + 0.2 }}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-[#1fb6cf]/10 border border-[#1fb6cf]/20 flex items-center justify-center">
                                            <CheckCircle className="w-3.5 h-3.5 text-[#1fb6cf]" />
                                        </div>
                                        <span>{item}</span>
                                    </motion.li>
                                ))}
                            </ul>
                            <div className="accent-line w-24 mt-4" />
                        </motion.div>
                        <motion.div
                            className="w-full"
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.7 }}
                        >
                            <div className="relative">
                                <div className="absolute -inset-4 bg-[#1fb6cf]/10 rounded-3xl blur-2xl opacity-50" />
                                <div className="relative rounded-2xl border border-[#1fb6cf]/20 bg-card overflow-hidden glow-accent">
                                    <ModelSelector />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===================== LAMP / BRANDING ===================== */}
            <section id="about" className="relative z-10 w-full">
                <LampDemo />
            </section>

            {/* ===================== FOOTER ===================== */}
            <Footer />
        </div>
    );
}
