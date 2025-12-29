"use client";

import React from "react";
import { motion } from "framer-motion";
import { FloatingNavbar } from "@/components/landing-page/floating-navbar";
import { Footer } from "@/components/landing-page/footer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
    CheckCircle2, 
    GitCommit, 
    Sparkles, 
    Zap, 
    Shield, 
    FileText, 
    Layout, 
    Database, 
    Code2, 
    GitBranch, 
    UserCircle, 
    MessageSquare, 
    Settings, 
    Workflow, 
    LogIn, 
    Keyboard,
    Rocket,
    Activity,
    Smartphone,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const changelogData = [
    {
        version: "v1.2.0",
        date: "December 2025",
        title: "Observability, mobile & Product Hunt",
        description: "Enhanced system monitoring, mobile responsiveness, and public launch on Product Hunt.",
        type: "minor",
        changes: [
            {
                category: "Observability",
                icon: <Activity className="w-4 h-4 text-green-500" />,
                items: [
                    "Added real-time service health monitoring with status indicators.",
                    "Integrated Gatus for uptime monitoring at status.vulniq.org.",
                    "Live status badges in footer and login page showing operational state."
                ]
            },
            {
                category: "Product Hunt",
                icon: <Rocket className="w-4 h-4 text-orange-500" />,
                items: [
                    "Launched VulnIQ on Product Hunt for public visibility.",
                    "Added Product Hunt card in footer with direct link to product page.",
                    "Enhanced SEO with structured data for better search engine indexing."
                ]
            },
            {
                category: "Mobile optimizations",
                icon: <Smartphone className="w-4 h-4 text-blue-500" />,
                items: [
                    "Improved responsive design across all pages for mobile devices.",
                    "Optimized tables with horizontal scrolling for smaller screens.",
                    "Enhanced touch targets and navigation for mobile users."
                ]
            }
        ]
    },
    {
        version: "v1.1.0",
        date: "December 2025",
        title: "Productivity & navigation",
        description: "Focus on developer experience with keyboard shortcuts and a polished landing page.",
        type: "minor",
        changes: [
            {
                category: "Shortcuts",
                icon: <Keyboard className="w-4 h-4 text-pink-500" />,
                items: [
                    "Implemented browser-based keyboard shortcuts for faster navigation across the app.",
                    "Quick actions for navigating between Dashboard, Editor, and Settings."
                ]
            },
            {
                category: "Landing page",
                icon: <Layout className="w-4 h-4 text-purple-500" />,
                items: [
                    "Launched the new public-facing landing page showcasing features and use cases.",
                    "Integrated smooth scrolling, feature grids, and interactive demos."
                ]
            }
        ]
    },
    {
        version: "v1.0.0",
        date: "November 2025",
        title: "Auth & workflow configuration",
        description: "A major release introducing secure authentication and the visual workflow builder.",
        type: "major",
        changes: [
            {
                category: "Authentication",
                icon: <LogIn className="w-4 h-4 text-green-500" />,
                items: [
                    "Implemented Sign In page with OTP (One-Time Password) support.",
                    "Secure session management and user onboarding flow."
                ]
            },
            {
                category: "Workflow engine",
                icon: <Workflow className="w-4 h-4 text-blue-500" />,
                items: [
                    "Added Visual Workflow Configurator: A drag-and-drop interface to design remediation pipelines.",
                    "Configure which agents (Reviewer, Fixer, Tester) to use for specific tasks.",
                    "Link specific Knowledge Bases and System Prompts to each agent in the chain."
                ]
            }
        ]
    },
    {
        version: "v0.9.0",
        date: "October 2025",
        title: "Customization & feedback",
        description: "Empowering users to personalize their experience and provide feedback.",
        type: "minor",
        changes: [
            {
                category: "Customization",
                icon: <Settings className="w-4 h-4 text-slate-500" />,
                items: [
                    "Page customization: Users can now toggle themes and layout preferences.",
                    "Code editor customization: Adjust font size, themes, and keybindings.",
                    "Notification system: Real-time alerts for scan completions and system updates."
                ]
            },
            {
                category: "Feedback",
                icon: <MessageSquare className="w-4 h-4 text-amber-500" />,
                items: [
                    "Implemented a global feedback mechanism for reporting bugs and suggesting features.",
                    "User profile page added for managing account details."
                ]
            }
        ]
    },
    {
        version: "v0.8.0",
        date: "October 2025",
        title: "Knowledge base & profile",
        description: "Building the foundation for RAG (Retrieval-Augmented Generation).",
        type: "major",
        changes: [
            {
                category: "Knowledge base",
                icon: <Database className="w-4 h-4 text-indigo-500" />,
                items: [
                    "Define \"Use Cases\" to group related security documents.",
                    "Add descriptions and metadata to Use Cases for better context.",
                    "Import and index documents (PDFs, Markdown) relevant to each Use Case."
                ]
            },
            {
                category: "User profile",
                icon: <UserCircle className="w-4 h-4 text-cyan-500" />,
                items: [
                    "Launched the User Profile page.",
                    "Manage personal settings and view account activity."
                ]
            }
        ]
    },
    {
        version: "v0.5.0",
        date: "October 2025",
        title: "Dashboard & git integration",
        description: "The central hub for managing projects and repositories.",
        type: "major",
        changes: [
            {
                category: "Dashboard",
                icon: <Layout className="w-4 h-4 text-orange-500" />,
                items: [
                    "Created the Home Page dashboard.",
                    "Overview of current imported projects and their status."
                ]
            },
            {
                category: "Integrations",
                icon: <GitBranch className="w-4 h-4 text-red-500" />,
                items: [
                    "GitHub & GitLab Import: Directly connect and import repositories.",
                    "System prompts: Organize and edit system prompts for each agent type."
                ]
            }
        ]
    },
    {
        version: "v0.1.0",
        date: "October 2025",
        title: "The code editor",
        description: "The first milestone: Preparing code for agentic review.",
        type: "initial",
        changes: [
            {
                category: "Editor",
                icon: <Code2 className="w-4 h-4 text-[var(--brand-accent)]" />,
                items: [
                    "Launched the core Code Editor interface.",
                    "Features: Code formatting, language selection, and Use Case selection.",
                    "Code locking: Signal that code is ready for the agentic review pipeline."
                ]
            }
        ]
    }
];

export default function ChangelogPage() {
    return (
        <ScrollArea className="h-screen">
            <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[var(--brand-accent)]/20 flex flex-col relative overflow-hidden">
                 {/* Background effects */}
                <div className="fixed inset-0 mesh-gradient pointer-events-none" />
                <div className="fixed inset-0 dots-pattern opacity-30 pointer-events-none" />

                <FloatingNavbar />

                <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-32 relative z-10">
                    
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <div className="flex justify-start mb-6">
                            <Button variant="ghost" size="sm" asChild className="hover:bg-[var(--brand-accent)]/10 hover:text-[var(--brand-accent)]">
                                <Link href="/">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Home
                                </Link>
                            </Button>
                        </div>
                        <Badge variant="outline" className="mb-4 border-[var(--brand-accent)]/30 text-[var(--brand-accent)] bg-[var(--brand-accent)]/5 px-3 py-1">
                            Development Journey
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                            Changelog
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                            A timeline of VulnIQ's evolution, from the initial code editor to a fully agentic security platform.
                        </p>
                    </motion.div>

                    {/* Timeline */}
                    <div className="relative border-l border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/10 ml-4 md:ml-0 space-y-12">
                        {changelogData.map((release, index) => (
                            <motion.div
                                key={release.version}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="relative pl-8 md:pl-12"
                            >
                                {/* Timeline Dot */}
                                <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-[var(--brand-accent)] ring-4 ring-background" />

                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-4">
                                    <h2 className="text-2xl font-bold text-foreground">
                                        {release.version}
                                    </h2>
                                    <span className="text-sm text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                                        {release.date}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-[var(--brand-primary)] dark:text-[var(--brand-light)] mb-2">
                                    {release.title}
                                </h3>
                                <p className="text-muted-foreground mb-6 leading-relaxed">
                                    {release.description}
                                </p>

                                <div className="grid gap-4">
                                    {release.changes.map((changeGroup, idx) => (
                                        <div key={idx} className="bg-card/50 border border-border/50 rounded-xl p-5 hover:border-[var(--brand-accent)]/20 transition-colors">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-1.5 rounded-md bg-muted/50">
                                                    {changeGroup.icon}
                                                </div>
                                                <h4 className="font-medium text-sm text-foreground">
                                                    {changeGroup.category}
                                                </h4>
                                            </div>
                                            <ul className="space-y-2">
                                                {changeGroup.items.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                                        <CheckCircle2 className="w-4 h-4 text-[var(--brand-accent)] shrink-0 mt-0.5" />
                                                        <span className="leading-relaxed">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                </main>

                <Footer />
            </div>
        </ScrollArea>
    );
}