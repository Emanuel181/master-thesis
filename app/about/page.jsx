'use client'

import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Shield, Target, Zap, Lock, ChevronUp, Users, Globe, Award, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef } from "react";
import { Footer } from "@/components/landing-page/footer";
import { LogoLoop } from '@/components/ui/logo-loop';
import { SiReact, SiNextdotjs, SiTailwindcss, SiDocker, SiGithub, SiWebstorm, SiShadcnui } from 'react-icons/si';
import { FaAws } from "react-icons/fa";
import { FaNodeJs } from "react-icons/fa6";
import { IoLogoJavascript } from "react-icons/io";
import { IoLogoCss3 } from "react-icons/io5";

const techLogos = [
  { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
  { node: <SiDocker />, title: "Docker", href: "https://www.docker.com" },
  { node: <SiReact />, title: "React", href: "https://react.dev" },
  { node: <SiGithub />, title: "GitHub", href: "https://github.com" },
  { node: <SiTailwindcss />, title: "Tailwind CSS", href: "https://tailwindcss.com" },
  { node: <FaAws />, title: "AWS", href: "https://aws.amazon.com" },
  { node: <SiWebstorm />, title: "WebStorm", href: "https://www.jetbrains.com/webstorm/" },
  { node: <FaNodeJs />, title: "Node.js", href: "https://nodejs.org" },
  { node: <IoLogoJavascript />, title: "JavaScript", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
  { node: <IoLogoCss3 />, title: "CSS3", href: "https://developer.mozilla.org/en-US/docs/Web/CSS" },
  { node: <SiShadcnui />, title: "Shadcn UI", href: "https://ui.shadcn.com" },
];

export default function AboutPage() {
    const scrollRef = useRef(null);

    const scrollToTop = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden font-sans selection:bg-[var(--brand-accent)]/20">
            {/* Background effects */}
            <div className="fixed inset-0 mesh-gradient pointer-events-none opacity-50" />
            <div className="fixed inset-0 dots-pattern opacity-30 pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 font-semibold text-xl group">
                            <Image src="/web-app-manifest-512x512.png" alt="Logo" className="w-8 h-8 rounded-lg" width={32} height={32} />
                            <span className="font-bold text-foreground tracking-tight">VulnIQ</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild className="hover:bg-[var(--brand-accent)]/10 hover:text-[var(--brand-accent)]">
                            <Link href="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Home
                            </Link>
                        </Button>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content with ScrollArea */}
            <ScrollArea className="flex-1" viewportRef={scrollRef}>
                <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
                    
                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-4xl mx-auto text-center mb-20"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--brand-accent)]/10 mb-8 transition-transform duration-300 ring-1 ring-[var(--brand-accent)]/20 shadow-lg shadow-[var(--brand-accent)]/10">
                            <Shield className="w-10 h-10 text-[var(--brand-accent)]" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                            Agentic RAG for <span className="gradient-text">automated program repair</span>
                        </h1>
                        <p className="text-muted-foreground text-xl leading-relaxed max-w-2xl mx-auto">
                            A Master's thesis project investigating the efficacy of LLM-based agents augmented with specialized security knowledge for vulnerability remediation.
                        </p>
                    </motion.div>

                    {/* Problem & Solution Section */}
                    <div className="max-w-5xl mx-auto mb-24 space-y-24">
                        
                        {/* The Problem */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
                        >
                            <div className="order-2 md:order-1 relative">
                                <div className="absolute inset-0 bg-destructive/5 blur-3xl rounded-full opacity-40" />
                                <div className="relative bg-card border border-border/50 rounded-2xl p-8 shadow-lg">
                                    <div className="flex items-center gap-3 mb-4 text-destructive">
                                        <div className="p-2 rounded-lg bg-destructive/10">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-semibold">Problem statement</h3>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Large Language Models (LLMs) are increasingly applied to Automated Program Repair (APR), but often struggle due to insufficient domain knowledge and a tendency to produce "hallucinations" or unreliable fixes.
                                    </p>
                                </div>
                            </div>
                            <div className="order-1 md:order-2 space-y-4">
                                <h2 className="text-3xl font-bold tracking-tight">Limitations of current approaches</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Without grounded context, even advanced models rely on probabilistic generation rather than verified security practices. This limitation hinders the practical application of LLMs in critical security infrastructure where precision is paramount.
                                </p>
                            </div>
                        </motion.div>

                        {/* The Solution */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
                        >
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold tracking-tight">Proposed methodology</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    This research proposes an agentic system leveraging Retrieval-Augmented Generation (RAG) to enhance the reliability and precision of source code vulnerability remediation.
                                </p>
                                <p className="text-muted-foreground leading-relaxed">
                                    The framework positions LLMs as central controllers orchestrating reasoning and tool interaction. By utilizing RAG, we augment the LLM's context with retrieved external security knowledge, such as best-practice guidelines, relevant code snippets, and historical fixes.
                                </p>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-[var(--brand-accent)]/20 blur-3xl rounded-full opacity-30" />
                                <div className="relative bg-card border border-border/50 rounded-2xl p-8 shadow-2xl glow-accent">
                                    <div className="flex items-center gap-3 mb-4 text-[var(--brand-accent)]">
                                        <div className="p-2 rounded-lg bg-[var(--brand-accent)]/10">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-semibold">System architecture</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)]" />
                                            <span className="text-sm text-muted-foreground">Specialized retrieval methods for code security</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)]" />
                                            <span className="text-sm text-muted-foreground">Distilled security knowledge injection</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)]" />
                                            <span className="text-sm text-muted-foreground">Orchestrated tool interaction & verification</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>

                        {/* The Outcome */}
                         <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-muted/30 rounded-3xl p-8 md:p-12 text-center border border-border/50"
                        >
                            <Award className="w-12 h-12 text-[var(--brand-accent)] mx-auto mb-6" />
                            <h2 className="text-2xl md:text-3xl font-bold mb-4">Research contributions</h2>
                            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
                                Results from the scientific community demonstrate that this knowledge-driven, structured approach significantly boosts performance in software security tasks. Tailoring the RAG context with distilled security knowledge yields substantial improvements in secure code generation metrics over state-of-the-art baselines.
                            </p>
                            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
                                The proposed agentic RAG system provides a robust, context-aware, and knowledge-grounded framework for automated vulnerability repair, a crucial step toward creating reliable, high-quality APR solutions essential for modern software security.
                            </p>
                        </motion.div>

                    </div>

                    {/* Core Values */}
                    <div className="mb-24">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Research objectives</h2>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <ValueCard 
                                icon={Target} 
                                title="Contextual precision"
                                description="Implementing a RAG pipeline that ensures every remediation suggestion is contextually accurate to the specific codebase architecture." 
                            />
                            <ValueCard 
                                icon={Zap} 
                                title="Automated reasoning"
                                description="Developing agentic workflows that can autonomously analyze, reason about, and repair vulnerabilities with minimal human intervention." 
                            />
                        </div>
                    </div>

                    {/* Team / Culture (Optional placeholder) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto text-center bg-card border border-border/50 rounded-3xl p-12 relative overflow-hidden mb-20"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--brand-accent)] to-transparent opacity-50" />
                        <div className="relative z-10">
                            <Award className="w-12 h-12 text-[var(--brand-accent)] mx-auto mb-6" />
                            <h2 className="text-3xl font-bold mb-6">About the research</h2>
                            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                                This project is part of a Master's thesis focused on advancing the field of Automated Program Repair through the integration of modern LLMs and knowledge retrieval systems.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button asChild size="lg" className="rounded-full bg-[var(--brand-accent)] text-[var(--brand-primary)] hover:bg-[var(--brand-accent)]/90 font-semibold shadow-lg shadow-[var(--brand-accent)]/20">
                                    <Link href="/login">
                                        View Prototype
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        {/* Decorative glow */}
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[var(--brand-accent)]/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[var(--brand-accent)]/10 rounded-full blur-3xl pointer-events-none" />
                    </motion.div>

                    {/* Tech Stack Loop */}
                    <div className="max-w-4xl mx-auto mb-20">
                         <h3 className="text-center text-sm font-semibold text-muted-foreground mb-8 tracking-wider">Built with modern technologies</h3>
                         <div className="h-[60px] relative overflow-hidden">
                            <LogoLoop 
                                logos={techLogos} 
                                speed={50} 
                                direction="left" 
                                logoHeight={40} 
                                gap={60} 
                                hoverSpeed={0} 
                                scaleOnHover 
                                fadeOut={false} 
                                ariaLabel="Technology stack" 
                            />
                        </div>
                    </div>

                </main>

                <Footer />
            </ScrollArea>
        </div>
    );
}

function ValueCard({ icon: Icon, title, description }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-[var(--brand-accent)]/30 transition-all duration-300 group"
        >
            <div className="w-12 h-12 rounded-lg bg-[var(--brand-accent)]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Icon className="w-6 h-6 text-[var(--brand-accent)]" />
            </div>
            <h3 className="text-xl font-semibold mb-3 group-hover:text-[var(--brand-accent)] transition-colors">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
}
