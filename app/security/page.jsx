'use client'

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Shield, FileText, Globe, Users, Mail, CheckCircle, AlertTriangle, PersonStanding } from "lucide-react";
import { Footer } from "@/components/landing-page/footer";
import { FloatingNavbar } from "@/components/landing-page/floating-navbar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef, useEffect } from "react";
import { useAccessibility } from "@/contexts/accessibilityContext";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";

export default function SecurityPage() {
    const { openPanel, setForceHideFloating } = useAccessibility()

    // Hide the floating accessibility widget on this page
    useEffect(() => {
        setForceHideFloating(true);
        return () => setForceHideFloating(false);
    }, [setForceHideFloating]);

    const sections = [
        { id: 'introduction', title: 'Introduction', icon: FileText },
        { id: 'scope', title: 'Systems in scope', icon: Globe },
        { id: 'out-of-scope', title: 'Out of scope', icon: AlertTriangle },
        { id: 'commitments', title: 'Our commitments', icon: CheckCircle },
        { id: 'expectations', title: 'Our expectations', icon: Users },
        { id: 'channels', title: 'Official channels', icon: Mail },
        { id: 'safe-harbor', title: 'Safe harbor', icon: Shield },
    ];

    const scrollRef = useRef(null);

    // Restore scroll position when returning to this page
    useScrollRestoration(scrollRef);

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden font-sans selection:bg-[var(--brand-accent)]/20">
            {/* Background effects */}
            <div className="fixed inset-0 mesh-gradient pointer-events-none opacity-50" />
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
                                <span className="sm:hidden">Back</span>
                                <span className="hidden sm:inline">Back to home</span>
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

            {/* Main Content with ScrollArea */}
            <ScrollArea className="flex-1" viewportRef={scrollRef}>
                <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-4xl mx-auto"
                    >
                        {/* Title Section */}
                        <div id="security-top" className="text-center mb-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-accent)]/10 mb-6">
                                <Shield className="w-8 h-8 text-[var(--brand-accent)]" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                                Vulnerability Disclosure Policy
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Updated at 2026-01-02
                            </p>
                        </div>

                        {/* Table of Contents */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="mb-12 p-6 rounded-lg border border-border bg-muted/30"
                        >
                            <h2 className="text-lg font-semibold mb-4">Table of contents</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {sections.map((section, index) => (
                                    <a
                                        key={section.id}
                                        href={`#${section.id}`}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 py-1"
                                    >
                                        <span className="text-[var(--brand-accent)]">{index + 1}.</span>
                                        {section.title}
                                    </a>
                                ))}
                            </div>
                        </motion.div>

                        {/* Content Sections */}
                        <div className="prose prose-neutral dark:prose-invert max-w-none">
                            {/* Introduction */}
                            <Section id="introduction" title="Introduction" icon={FileText}>
                                <p>
                                    VulnIQ welcomes feedback from security researchers and the general public to help improve our security. If you believe you have discovered a vulnerability, privacy issue, exposed data, or other security issues in any of our assets, we want to hear from you. This policy outlines steps for reporting vulnerabilities to us, what we expect, what you can expect from us.
                                </p>
                            </Section>

                            {/* Systems in Scope */}
                            <Section id="scope" title="Systems in scope" icon={Globe}>
                                <p>
                                    This policy applies to any digital assets owned, operated, or maintained by VulnIQ.
                                </p>
                            </Section>

                            {/* Out of Scope */}
                            <Section id="out-of-scope" title="Out of scope" icon={AlertTriangle}>
                                <ul className="space-y-2">
                                    <li>Assets or other equipment not owned by parties participating in this policy.</li>
                                </ul>
                                <p>
                                    Vulnerabilities discovered or suspected in out-of-scope systems should be reported to the appropriate vendor or applicable authority.
                                </p>
                            </Section>

                            {/* Our Commitments */}
                            <Section id="commitments" title="Our commitments" icon={CheckCircle}>
                                <p>
                                    When working with us, according to this policy, you can expect us to:
                                </p>
                                <ul className="space-y-2">
                                    <li>Respond to your report promptly, and work with you to understand and validate your report;</li>
                                    <li>Strive to keep you informed about the progress of a vulnerability as it is processed;</li>
                                    <li>Work to remediate discovered vulnerabilities in a timely manner, within our operational constraints; and</li>
                                    <li>Extend Safe Harbor for your vulnerability research that is related to this policy.</li>
                                </ul>
                            </Section>

                            {/* Our Expectations */}
                            <Section id="expectations" title="Our expectations" icon={Users}>
                                <p>
                                    In participating in our vulnerability disclosure program in good faith, we ask that you:
                                </p>
                                <ul className="space-y-3">
                                    <li>Play by the rules, including following this policy and any other relevant agreements. If there is any inconsistency between this policy and any other applicable terms, the terms of this policy will prevail;</li>
                                    <li>Report any vulnerability you&apos;ve discovered promptly;</li>
                                    <li>Avoid violating the privacy of others, disrupting our systems, destroying data, and/or harming user experience;</li>
                                    <li>Use only the Official Channels to discuss vulnerability information with us;</li>
                                    <li>Provide us a reasonable amount of time (at least 180 days from the initial report) to resolve the issue before you disclose it publicly;</li>
                                    <li>Perform testing only on in-scope systems, and respect systems and activities which are out-of-scope;</li>
                                    <li>If a vulnerability provides unintended access to data: Limit the amount of data you access to the minimum required for effectively demonstrating a Proof of Concept; and cease testing and submit a report immediately if you encounter any user data during testing, such as Personally Identifiable Information (PII), Personal Healthcare Information (PHI), credit card data, or proprietary information;</li>
                                    <li>You should only interact with test accounts you own or with explicit permission from the account holder; and</li>
                                    <li>Do not engage in extortion.</li>
                                </ul>
                            </Section>

                            {/* Official Channels */}
                            <Section id="channels" title="Official channels" icon={Mail}>
                                <p>
                                    Please report security issues via email, providing all relevant information. The more details you provide, the easier it will be for us to triage and fix the issue.
                                </p>
                                <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30">
                                    <p className="flex flex-wrap items-center gap-2">
                                        <Mail className="h-4 w-4 text-[var(--brand-accent)] flex-shrink-0" />
                                        <strong>Security Email:</strong>
                                        <a href="mailto:emanuel.rusu03@e-uvt.ro" className="text-[var(--brand-accent)] hover:underline break-all">
                                            emanuel.rusu03@e-uvt.ro
                                        </a>
                                    </p>
                                </div>
                            </Section>

                            {/* Safe Harbor */}
                            <Section id="safe-harbor" title="Safe harbor" icon={Shield}>
                                <p>
                                    When conducting vulnerability research, according to this policy, we consider this research conducted under this policy to be:
                                </p>
                                <ul className="space-y-3">
                                    <li>Authorized concerning any applicable anti-hacking laws, and we will not initiate or support legal action against you for accidental, good-faith violations of this policy;</li>
                                    <li>Authorized concerning any relevant anti-circumvention laws, and we will not bring a claim against you for circumvention of technology controls;</li>
                                    <li>Exempt from restrictions in our Terms of Service (TOS) and/or Acceptable Usage Policy (AUP) that would interfere with conducting security research, and we waive those restrictions on a limited basis; and</li>
                                    <li>Lawful, helpful to the overall security of the Internet, and conducted in good faith.</li>
                                </ul>
                                <p>
                                    You are expected, as always, to comply with all applicable laws. If legal action is initiated by a third party against you and you have complied with this policy, we will take steps to make it known that your actions were conducted in compliance with this policy.
                                </p>
                                <p>
                                    If at any time you have concerns or are uncertain whether your security research is consistent with this policy, please submit a report through one of our Official Channels before going any further.
                                </p>
                                <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30">
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Note:</strong> The Safe Harbor applies only to legal claims under the control of the organization participating in this policy, and that the policy does not bind independent third parties.
                                    </p>
                                </div>
                            </Section>
                        </div>

                    </motion.div>
                </main>

                <Footer onScrollToTop={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} />
            </ScrollArea>
        </div>
    );
}

function Section({ id, title, icon: Icon, children }) {
    return (
        <motion.section
            id={id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-10 scroll-mt-24"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-accent)]/10">
                    <Icon className="h-4 w-4 text-[var(--brand-accent)]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h2>
            </div>
            <div className="text-muted-foreground leading-relaxed space-y-4 pl-11">
                {children}
            </div>
        </motion.section>
    );
}

