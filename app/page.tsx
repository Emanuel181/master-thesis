'use client';

import React from 'react';

// 1. Hero Components
import { SecurityCodeDemo } from '@/components/landing-page/hero/security-code-demo';

// 2. Feature Components
import { PhilosophyText } from '@/components/landing-page/features/philosophy-text';
import { ProcessScroll } from '@/components/landing-page/features/process-scroll';
import { GoogleGeminiEffectDemo } from '@/components/landing-page/features/gemini-effect';
import { FeaturesGrid } from '@/components/landing-page/features/features-grid';
import { ModelSelector } from '@/components/landing-page/features/model-selector';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-zinc-50 font-sans selection:bg-blue-500/30 flex flex-col overflow-x-hidden relative">

            {/* --- BACKGROUND LAYER --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-[#020617]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/20 via-slate-900/40 to-transparent blur-3xl" />
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full" />
            </div>

            {/* --- HERO SECTION --- */}
            <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 items-center">

                    {/* Left: Text Content */}
                    <div className="order-1 lg:col-span-2 space-y-8">
                        <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.05]">
                            Fix code <br/>
                            vulnerabilities <br/>
                            <span className="text-zinc-500">
                without the hallucinations.
              </span>
                        </h1>
                        <p className="text-lg text-zinc-400 leading-relaxed">
                            Watch autonomous agents collaborate to detect, patch, test, and report on security issues in real-time using verified RAG data.
                        </p>
                        <div className="flex gap-4 pt-4">
                            <button className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors">
                                Start Project
                            </button>
                            <button className="border border-zinc-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-zinc-800 transition-colors">
                                Read Thesis
                            </button>
                        </div>
                    </div>

                    {/* Right: The Animation Component */}
                    <div className="order-2 lg:col-span-3 w-full flex justify-center lg:justify-end pl-0 lg:pl-12">
                        <div className="w-full transform transition-all duration-1000 ease-out hover:scale-[1.01]">
                            <SecurityCodeDemo />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECTION 2: PHILOSOPHY BRIDGE --- */}
            <section className="relative z-10 w-full">
                <PhilosophyText />
            </section>

            {/* --- SECTION 3: HOW IT WORKS (Sticky Scroll) --- */}
            <section className="relative z-10 bg-slate-950 py-20">
                <div className="max-w-7xl mx-auto px-6 mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        The Remediation Pipeline
                    </h2>
                    <p className="text-zinc-400 max-w-2xl text-lg">
                        We don&#39;t just autocomplete code. We run a rigorous, multi-step defense process for every vulnerability detected.
                    </p>
                </div>
                <ProcessScroll />
            </section>

            {/* --- SECTION 4: THE DEPTH (Gemini Effect) --- */}
            {/* This component is very tall (400vh) to create a scrolling tunnel effect */}
            <section className="relative w-full z-10 border-t border-zinc-900">
                <GoogleGeminiEffectDemo />
            </section>

            {/* --- SECTION 5: FEATURES & ORCHESTRATION --- */}
            <section className="relative z-10 py-24 bg-slate-950 border-t border-zinc-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-20 text-center">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Enterprise-Grade Security Architecture
                        </h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                            Built for security teams that demand privacy, accuracy, and auditability.
                        </p>
                    </div>

                    {/* The Bento Grid (Glowing Effect) */}
                    <div className="mb-32">
                        <FeaturesGrid />
                    </div>

                    {/* The Model Selector (Flexibility) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h3 className="text-4xl font-bold text-white">Orchestrate your Intelligence</h3>
                            <p className="text-zinc-400 text-lg leading-relaxed">
                                Different agents require different brains. Use <span className="text-white font-semibold">Claude 3.5 Sonnet</span> for reasoning, <span className="text-white font-semibold">GPT-4o</span> for code generation, or local <span className="text-white font-semibold">Llama 3</span> for air-gapped security.
                            </p>
                            <ul className="space-y-2 text-zinc-500">
                                <li className="flex items-center gap-2">✓ Support for Ollama & LMStudio</li>
                                <li className="flex items-center gap-2">✓ Cloud failover redundancy</li>
                                <li className="flex items-center gap-2">✓ Per-agent model assignment</li>
                            </ul>
                        </div>
                        <div className="w-full flex justify-center">
                            <ModelSelector />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-12 border-t border-zinc-900 bg-black text-center text-zinc-500 relative z-10">
                <p>© 2025 SecureRAG System. All rights reserved.</p>
            </footer>

        </div>
    );
}