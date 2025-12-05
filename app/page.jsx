'use client';

import React from 'react';
import { SecurityCodeDemo } from '@/components/landing-page/hero/security-code-demo';
import {ModelSelector} from "@/components/landing-page/features/model-selector";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-zinc-50 font-sans selection:bg-blue-500/30 flex flex-col overflow-x-hidden relative">

            {/* --- BACKGROUND LAYER --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Deep Blue/Black Base Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-[#020617]" />

                {/* The "Brighter" Radial Glow at Top Center */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/20 via-slate-900/40 to-transparent blur-3xl" />

                {/* Subtle accent glow for depth */}
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
                        {/* You can add Hero Buttons here */}
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

            <ModelSelector/>

        </div>
    );
}