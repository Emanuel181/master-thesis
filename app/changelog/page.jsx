"use client";

import React from "react";
import { motion } from "framer-motion";
import { FloatingNavbar } from "@/components/landing-page/floating-navbar";
import { Footer } from "@/components/landing-page/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAccessibility } from "@/contexts/accessibilityContext";
import Image from "next/image";
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
    ArrowLeft,
    PersonStanding
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const changelogData = [
    {
        version: "v1.6.0",
        date: "January 2026",
        title: "Admin dashboard & security hardening",
        description: "Comprehensive admin tools and enhanced security infrastructure.",
        type: "minor",
        changes: [
            {
                category: "Security assessment",
                icon: <Code2 className="w-4 h-4 text-emerald-500" />,
                items: [
                    "Assessed application security using agentic AI systems.",
                    "Automated security scanning and vulnerability detection.",
                    "Agentic pentesting workflows to identify and report potential threats."
                ]
            },
            {
                category: "Admin views",
                icon: <Shield className="w-4 h-4 text-red-500" />,
                items: [
                    "Added admin dashboard for managing users, articles, and supporters.",
                    "Master admin controls for creating and managing admin accounts.",
                    "Article review system for approving user-submitted content."
                ]
            },
            {
                category: "Cloudflare integration",
                icon: <Shield className="w-4 h-4 text-orange-500" />,
                items: [
                    "Integrated Cloudflare for DDoS protection and bot mitigation.",
                    "Configured threat detection and automatic blocking rules.",
                    "Added Turnstile CAPTCHA for enhanced form security."
                ]
            },
            {
                category: "Analytics",
                icon: <Activity className="w-4 h-4 text-blue-500" />,
                items: [
                    "Configured Google Analytics for user behavior insights.",
                    "Added tracking for key user interactions and page views."
                ]
            }
        ]
    },
    {
        version: "v1.5.0",
        date: "January 2026",
        title: "Knowledge base groups & workflow improvements",
        description: "Better organization for use cases and streamlined workflow configuration.",
        type: "minor",
        changes: [
            {
                category: "Knowledge base groups",
                icon: <Database className="w-4 h-4 text-indigo-500" />,
                items: [
                    "New groups panel in knowledge base page.",
                    "Users can now organize use cases into logical groups.",
                    "Drag and drop support for managing group assignments."
                ]
            },
            {
                category: "Workflow configuration",
                icon: <Workflow className="w-4 h-4 text-purple-500" />,
                items: [
                    "Improved workflow configuration UI/UX.",
                    "Streamlined agent selection and pipeline setup.",
                    "Better visual feedback for workflow steps."
                ]
            }
        ]
    },
    {
        version: "v1.4.0",
        date: "January 2026",
        title: "Article publishing & responsive design",
        description: "User-generated content system and cross-device optimizations.",
        type: "minor",
        changes: [
            {
                category: "Write articles",
                icon: <FileText className="w-4 h-4 text-green-500" />,
                items: [
                    "New write article section available for all users.",
                    "Rich text editor for creating security articles and guides.",
                    "Submit articles for admin review before publishing."
                ]
            },
            {
                category: "Responsive design",
                icon: <Smartphone className="w-4 h-4 text-cyan-500" />,
                items: [
                    "Mobile, tablet, and desktop layout optimizations.",
                    "Improved touch interactions and navigation.",
                    "Consistent spacing and typography across all breakpoints."
                ]
            }
        ]
    },
    {
        version: "v1.3.0",
        date: "January 2026",
        title: "Home customization & UI polish",
        description: "Personalize your dashboard and enjoy a more consistent experience.",
        type: "minor",
        changes: [
            {
                category: "Home page customization",
                icon: <Layout className="w-4 h-4 text-amber-500" />,
                items: [
                    "New panel position customization on home page.",
                    "Swap and reorder dashboard panels to your preference.",
                    "Persistent layout settings across sessions."
                ]
            },
            {
                category: "Landing page",
                icon: <Sparkles className="w-4 h-4 text-pink-500" />,
                items: [
                    "Improved landing page with enhanced visuals.",
                    "Better feature showcases and smoother animations."
                ]
            },
            {
                category: "Bug fixes & polish",
                icon: <Zap className="w-4 h-4 text-yellow-500" />,
                items: [
                    "Fixed keyboard shortcut conflicts and edge cases.",
                    "Ensured consistent design language across all pages.",
                    "Improved accessibility and color contrast."
                ]
            }
        ]
    },
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
                    "Integrated smooth scrolling, feature grids, and animations."
                ]
            }
        ]
    },
    {
        version: "v1.0.1",
        date: "December 2025",
        title: "Interactive demo experience",
        description: "A fully functional demo simulating all core features without authentication.",
        type: "patch",
        changes: [
            {
                category: "Demo page",
                icon: <Sparkles className="w-4 h-4 text-amber-500" />,
                items: [
                    "Added interactive demo page simulating the complete working application.",
                    "Code importing: Demo repository browsing and code input simulation.",
                    "Customizations: Theme, layout, and editor preferences in demo mode.",
                    "Use cases: Create, edit, and organize use cases with documents.",
                    "Groups: Group use cases into logical collections.",
                    "Prompts: Create and manage AI agent prompts.",
                    "Repository browsing: Navigate through demo GitHub/GitLab repositories.",
                    "Article creation: Write and preview security articles.",
                    "Code scanning: Simulate vulnerability detection and remediation workflows."
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
    const { openPanel } = useAccessibility();
    
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[var(--brand-accent)]/20 relative">
             {/* Background effects */}
            <div className="fixed inset-0 mesh-gradient pointer-events-none" />
            <div className="fixed inset-0 dots-pattern opacity-30 pointer-events-none" />

            {/* Floating Navbar - disabled for footer pages */}
            {/* <FloatingNavbar /> */}

            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 font-semibold text-xl group">
                            <Image src="/web-app-manifest-512x512.png" alt="Logo" className="w-8 h-8" width={32} height={32} />
                            <span className="font-bold text-foreground">VulnIQ</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild className="hover:bg-[var(--brand-accent)]/10 hover:text-[var(--brand-accent)]">
                            <Link href="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to home
                            </Link>
                        </Button>
                        <button
                            onClick={openPanel}
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--brand-accent)]/10 hover:bg-[var(--brand-accent)]/20 border border-[var(--brand-accent)]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2"
                            aria-label="Open accessibility menu"
                            title="Accessibility options"
                        >
                            <PersonStanding className="w-5 h-5 text-[var(--brand-accent)]" strokeWidth={2} />
                        </button>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Title Section */}
            <div className="border-b border-border/50">
                <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8 relative z-10">
                    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                        Changelog
                    </h1>
                    <p className="text-muted-foreground mt-2">Track all updates and improvements to VulnIQ</p>
                </div>
            </div>

            {/* Timeline */}
            <div className="max-w-5xl mx-auto px-6 lg:px-10 pt-10 relative z-10">
                <div className="relative">
                    {changelogData.map((release, index) => (
                        <div
                            key={release.version}
                            className="relative flex flex-col md:flex-row gap-y-6"
                        >
                            {/* Left side - Date and Version (sticky) */}
                            <div className="md:w-48 flex-shrink-0">
                                <div className="md:sticky md:top-8 pb-10">
                                    <time className="text-sm font-medium text-muted-foreground block mb-3">
                                        {release.date}
                                    </time>
                                    <div className="inline-flex relative z-10 items-center justify-center px-3 h-10 text-foreground border border-border rounded-lg text-sm font-bold bg-background">
                                        {release.version}
                                    </div>
                                </div>
                            </div>

                            {/* Right side - Content */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className="flex-1 md:pl-8 relative pb-10"
                            >
                                {/* Vertical timeline line */}
                                <div className="hidden md:block absolute top-2 left-0 w-px h-full bg-border">
                                    {/* Timeline dot */}
                                    <div className="absolute -translate-x-1/2 size-3 bg-[var(--brand-accent)] rounded-full z-10" />
                                </div>

                                <div className="space-y-6">
                                    <div className="relative z-10 flex flex-col gap-2">
                                        <h2 className="text-2xl font-semibold tracking-tight text-balance">
                                            {release.title}
                                        </h2>

                                        {/* Type badge */}
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`h-6 w-fit px-2 text-xs font-medium rounded-full border flex items-center justify-center ${
                                                release.type === 'major' 
                                                    ? 'bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border-[var(--brand-accent)]/30' 
                                                    : release.type === 'minor'
                                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                                    : 'bg-muted text-muted-foreground border-border'
                                            }`}>
                                                {release.type === 'major' ? 'Major Release' : release.type === 'minor' ? 'Minor Update' : 'Initial Release'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-muted-foreground leading-relaxed text-balance">
                                        {release.description}
                                    </p>

                                    {/* Changes */}
                                    <div className="space-y-4">
                                        {release.changes.map((changeGroup, idx) => (
                                            <div key={idx} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-md bg-muted/50">
                                                        {changeGroup.icon}
                                                    </div>
                                                    <h4 className="font-medium text-sm text-foreground">
                                                        {changeGroup.category}
                                                    </h4>
                                                </div>
                                                <ul className="list-disc space-y-1.5 pl-6 text-sm text-muted-foreground">
                                                    {changeGroup.items.map((item, i) => (
                                                        <li key={i} className="leading-relaxed pl-1">
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>

            <Footer />
        </div>
    );
}