'use client';

import React from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// Components
import { SecurityCodeDemo } from '@/components/landing-page/hero/security-code-demo';
import { FeaturesGrid } from '@/components/landing-page/features/features-grid';
import { LampDemo } from '@/components/landing-page/vulniq-lamp';
import { FloatingNavbar } from "@/components/landing-page/floating-navbar";
import { Footer } from "@/components/landing-page/footer";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { FlipWordsDemo } from "@/components/flip-words-demo";
import InfiniteMovingCardsDemo from "@/components/infinite-moving-cards-demo";
import CardDemo from "@/components/ui/cards-demo-3";
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
    const scrollContainerRef = useRef(null);
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ container: scrollContainerRef });
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

    const heroOpacity = useTransform(smoothProgress, [0, 0.12], [1, 0]);
    const heroY = useTransform(smoothProgress, [0, 0.12], [0, -40]);

    return (
        <ScrollArea className="h-screen" viewportRef={scrollContainerRef}>
            <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[var(--brand-accent)]/20 flex flex-col overflow-x-hidden relative">

                {/* Background effects */}
                <div className="fixed inset-0 mesh-gradient pointer-events-none" />
                <div className="fixed inset-0 dots-pattern opacity-30 pointer-events-none" />

                <FloatingNavbar />

                {/* ===================== HERO ===================== */}
                <motion.section
                    ref={heroRef}
                    id="hero"
                    className="relative z-10 w-full min-h-screen flex flex-col justify-center hero-gradient px-4 sm:px-0"
                    style={{ opacity: heroOpacity, y: heroY }}
                >
                    {/* Decorative elements - hidden on small screens for performance */}
                    <div className="absolute top-1/4 left-10 w-72 h-72 bg-[#1fb6cf]/10 rounded-full blur-[100px] pointer-events-none hidden sm:block" />
                    <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#1fb6cf]/5 rounded-full blur-[120px] pointer-events-none hidden sm:block" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full pt-24 sm:pt-32 pb-12 sm:pb-16">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-20 items-center">

                            {/* Left: Copy */}
                            <motion.div
                                className="space-y-6 sm:space-y-8 text-center lg:text-left order-2 lg:order-1"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <motion.div variants={itemVariants} className="flex justify-center lg:justify-start gap-3">
                                    <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-[#1fb6cf] bg-[#1fb6cf]/10 border border-[#1fb6cf]/20 rounded-full backdrop-blur-sm">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1fb6cf] opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1fb6cf]"></span>
                                        </span>
                                        Open Beta
                                    </span>
                                </motion.div>

                                <motion.h1
                                    variants={itemVariants}
                                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1]"
                                >
                                    <span className="text-foreground">Security remediation</span>
                                    <br />
                                    <span className="gradient-text">without hallucinations.</span>
                                </motion.h1>

                                <motion.p
                                    variants={itemVariants}
                                    className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0"
                                >
                                    Autonomous AI agents that detect, patch, and verify vulnerabilities. Every fix is <span className="text-[#1fb6cf] font-medium">grounded in your documentation</span> using RAG.
                                </motion.p>

                                <motion.div
                                    variants={itemVariants}
                                    className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
                                >
                                    <Button asChild size="lg" className="rounded-lg w-full sm:w-auto">
                                        <a href="https://www.overleaf.com/read/vdqywdqywyhr#693113" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                                            View Thesis
                                            <ArrowRight className="w-4 h-4" />
                                        </a>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="rounded-lg w-full sm:w-auto hover:bg-[var(--brand-accent)]/10 hover:text-[var(--brand-accent)] hover:border-[var(--brand-accent)]/50 transition-all duration-300">
                                        <a href="/login">
                                            Explore prototype
                                        </a>
                                    </Button>
                                </motion.div>
                            </motion.div>

                            {/* Right: Demo */}
                            <motion.div
                                className="w-full order-1 lg:order-2"
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            >
                                    <SecurityCodeDemo className="relative glow-accent"/>
                            </motion.div>
                        </div>
                    </div>
                </motion.section>

                {/* ===================== FEATURES & FLIP WORDS ===================== */}
                {/* Combined sections to tighten spacing */}
                <section id="features" className="relative z-10 py-16 sm:py-24 md:py-32 pb-8 sm:pb-12">
                    {/* Section gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1fb6cf]/[0.02] to-transparent pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative">
                        {/* Header */}
                        <motion.div
                            className="text-center mb-12 sm:mb-16 md:mb-20"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                        >
                            <div className="text-center">
                                <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground mb-6 font-medium">
                                    Vulnerability management is critical.
                                </p>
                                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                                    The next frontier is{" "}
                                    <PointerHighlight
                                        containerClassName="px-1"
                                        rectangleClassName="border-[var(--brand-accent)]/60 bg-[var(--brand-accent)]/10"
                                        pointerClassName="text-[var(--brand-accent)]"
                                    >
                                        <span className="gradient-text">agentic remediation</span>
                                    </PointerHighlight>
                                </div>
                            </div>
                            <div className="accent-line-center w-16 sm:w-24 mx-auto mt-6 sm:mt-8" />
                        </motion.div>

                        {/* Grid */}
                        <FeaturesGrid />

                        <div className="mt-12 w-full py-8">
                            <h3 className="text-center text-sm font-semibold text-muted-foreground mb-6 tracking-wider">Powered by modern tech stack</h3>
                             <div style={{ height: '60px', position: 'relative', overflow: 'hidden'}}>
                                <LogoLoop 
                                    logos={techLogos} 
                                    speed={60} 
                                    direction="left" 
                                    logoHeight={32} 
                                    gap={60} 
                                    hoverSpeed={0} 
                                    scaleOnHover 
                                    fadeOut={false} 
                                    ariaLabel="Technology stack" 
                                />
                            </div>
                        </div>

                        {/* Flip Words - Moved inside Features container for tighter spacing */}
                        {/* Adjust 'mt-8' to 'mt-4' or 'mt-12' to tune the distance exactly */}
                        <div className="mt-4 sm:mt-8 w-full">
                            <FlipWordsDemo />
                        </div>

                        {/* Infinite Moving Cards */}
                        <div id="use-cases" className="mt-4 sm:mt-8 w-full">
                            <InfiniteMovingCardsDemo />
                        </div>

                        {/* Providers Demo */}
                        <div className="mt-16 w-full">
                            <CardDemo />
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
        </ScrollArea>
    );
}