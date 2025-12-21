'use client';

import React from 'react';

// 1. Hero Components
import { SecurityCodeDemo } from '@/components/landing-page/hero/security-code-demo';

// 2. Feature Components
import { PhilosophyText } from '@/components/landing-page/features/philosophy-text';
import { TimelineDemo } from '@/components/landing-page/features/timeline';
import { FeaturesGrid } from '@/components/landing-page/features/features-grid';
import { ModelSelector } from '@/components/landing-page/features/model-selector';
// NEW IMPORT
import { LampDemo } from '@/components/landing-page/vulniq-lamp';
import { FloatingNavbar } from "@/components/landing-page/floating-navbar";
import { Footer } from "@/components/landing-page/footer";

export default function LandingPage() {
    return (
        <div className="min-h-screen text-foreground font-sans selection:bg-primary/30 flex flex-col overflow-x-hidden relative">

            {/* Navbar */}
            <FloatingNavbar />

            {/* --- GLOBAL BACKGROUND LAYER (Fixed) --- */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-background">
                <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-slate-950 dark:to-[#020617]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-blue-600/20 dark:via-slate-900/40 dark:to-transparent blur-3xl" />
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] dark:bg-indigo-500/10 blur-[100px] rounded-full" />
            </div>

            {/* --- HERO SECTION --- */}
            <section id="hero" className="relative z-10 w-full min-h-screen flex flex-col justify-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pt-20 pb-8 sm:pb-0">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
                        <div className="order-1 lg:col-span-2 space-y-6 sm:space-y-8 text-center lg:text-left">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-foreground leading-[1.1] sm:leading-[1.05]">
                                Fix code <br className="hidden sm:block"/>
                                <span className="sm:hidden"> </span>vulnerabilities <br className="hidden sm:block"/>
                                <span className="text-muted-foreground">
                                    without the hallucinations.
                                </span>
                            </h1>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                                Watch autonomous agents collaborate to detect, patch, test, and report on security issues in real-time using verified RAG data.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4 justify-center lg:justify-start">
                                <a href="/login" className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors inline-block text-center">
                                    Start Project
                                </a>
                                <button className="border border-border text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors">
                                    Read Thesis
                                </button>
                            </div>
                        </div>
                        <div className="order-2 lg:col-span-3 w-full flex justify-center lg:justify-end pl-0 lg:pl-12">
                            <div className="w-full max-w-full sm:max-w-none transform transition-all duration-1000 ease-out hover:scale-[1.01]">
                                <SecurityCodeDemo />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECTION 2: PHILOSOPHY BRIDGE --- */}
            <section className="relative z-10 w-full">
                <PhilosophyText />
            </section>

            {/* --- SECTION 4: FEATURES & ORCHESTRATION --- */}
            <section id="features" className="relative z-10 py-16 sm:py-24 lg:py-32 border-t border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">

                    <div className="mb-16 sm:mb-24 lg:mb-32">
                        <FeaturesGrid />
                    </div>

                    {/* --- SECTION 3: THE PIPELINE (Timeline) --- */}
                    <section id="timeline" className="relative z-10 w-full py-12 sm:py-16 lg:py-24">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">
                                The Remediation Pipeline
                            </h2>
                            <p className="text-muted-foreground max-w-2xl text-base sm:text-lg mb-8 sm:mb-12">
                                We don&#39;t just autocomplete code. We run a rigorous, multi-step defense process for every vulnerability detected.
                            </p>
                            <div className="w-full">
                                <TimelineDemo />
                            </div>
                        </div>
                    </section>

                    {/* MODEL SELECTOR: Side-by-Side Layout */}
                    <div id="models" className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
                        <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
                            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                                Orchestrate your <br className="hidden sm:block"/> Intelligence
                            </h3>
                            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                                Different agents require different brains. Use <span className="text-foreground font-semibold">Claude 3.5 Sonnet</span> for complex reasoning, <span className="text-foreground font-semibold">GPT-4o</span> for code generation, or local <span className="text-foreground font-semibold">Llama 3</span> for air-gapped security environments.
                            </p>
                            <ul className="space-y-3 sm:space-y-4 text-muted-foreground pt-2 sm:pt-4 text-left max-w-lg mx-auto lg:mx-0">
                                <li className="flex items-center gap-3 text-sm sm:text-base">
                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                    Support for Ollama & LMStudio
                                </li>
                                <li className="flex items-center gap-3 text-sm sm:text-base">
                                    <div className="w-2 h-2 bg-secondary rounded-full flex-shrink-0" />
                                    Cloud failover redundancy
                                </li>
                                <li className="flex items-center gap-3 text-sm sm:text-base">
                                    <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />
                                    Per-agent model assignment
                                </li>
                            </ul>
                        </div>
                        <div className="w-full flex justify-center lg:justify-end">
                            <ModelSelector />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECTION 5: VULNIQ BRANDING (Lamp) --- */}
            <section id="about" className="relative z-10 w-full bg-transparent">
                <LampDemo />
            </section>

            {/* --- FOOTER --- */}
            <div className="relative z-10">
                <Footer />
            </div>

        </div>
    );
}