"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X, ArrowRight, LayoutDashboard, PersonStanding, Sparkles, Shield, Zap, FileCode, GitBranch, AlertTriangle, Rss, MessageSquare, Heart, Building2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAccessibility } from "@/contexts/accessibilityContext";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
    // Product
    { name: "Features", link: "/#features", section: "Product" },
    { name: "Use Cases", link: "/#use-cases", section: "Product" },
    { name: "Integrations", link: "/#connect", section: "Product" },
    // Resources
    { name: "Blog", link: "/blog", section: "Resources" },
    { name: "Changelog", link: "/changelog", section: "Resources" },
    { name: "Supporters", link: "/supporters", section: "Resources" },
    // Company
    { name: "About", link: "/about", section: "Company" },
    { name: "Security", link: "/security", section: "Company" },
    { name: "Contact", link: "/#connect", section: "Company" },
];

export const FloatingNavbar = () => {
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated" && !!session;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isAboveLamp, setIsAboveLamp] = useState(false);
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const isMobile = useIsMobile();

    const { scrollY, scrollYProgress } = useScroll();

    // Subtle progress indicator
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

    // Check if navbar is above lamp section
    useEffect(() => {
        const checkLampPosition = () => {
            const lampSection = document.getElementById('about');
            if (lampSection) {
                const rect = lampSection.getBoundingClientRect();
                // Navbar is above lamp when lamp section top is near or above viewport top
                setIsAboveLamp(rect.top <= 100 && rect.bottom > 0);
            }
        };

        // Check on scroll - try both window and scroll container
        const handleScroll = () => checkLampPosition();
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Also listen to scroll on the ScrollArea viewport
        const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        }

        // Initial check
        checkLampPosition();

        // Also check after a short delay for initial render
        const timeoutId = setTimeout(checkLampPosition, 100);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll);
            }
            clearTimeout(timeoutId);
        };
    }, []);

    useMotionValueEvent(scrollY, "change", (latest) => {
        // Navbar always visible - only track scroll state for styling
        setIsScrolled(latest > 50);
    });

    return (
        <>
            {/* Progress bar - brand accent */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--brand-accent)] to-transparent z-[110] origin-left"
                style={{ scaleX }}
            />

            <motion.div
                className="fixed top-2 sm:top-3 md:top-6 inset-x-0 z-[100] flex justify-center px-2 sm:px-3 md:px-4 pointer-events-none"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                }}
            >
                <motion.nav
                    className={`pointer-events-auto flex items-center justify-between gap-2 sm:gap-3 md:gap-4 border px-3 sm:px-4 md:px-4 lg:px-6 py-2.5 sm:py-3 md:py-3 lg:py-3.5 rounded-2xl sm:rounded-full w-full max-w-5xl backdrop-blur-xl ${
                        isScrolled 
                            ? 'bg-[#1fb6cf]/10 dark:bg-[#1fb6cf]/5 border-[#1fb6cf]/30 shadow-xl shadow-[#1fb6cf]/10' 
                            : 'bg-[#1fb6cf]/5 dark:bg-[#1fb6cf]/5 border-[#1fb6cf]/20 shadow-md shadow-[#1fb6cf]/5'
                    } transition-colors transition-shadow duration-300`}
                    layout
                >

                {/* LEFT: Logo with brand name on mobile */}
                <motion.a
                    href="/"
                    className="flex items-center gap-2 sm:gap-2.5 font-medium group"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    aria-label="VulnIQ Home"
                >
                    <div className="relative">
                        <Image src="/web-app-manifest-512x512.png" alt="VulnIQ Logo" className="h-8 w-8 sm:h-7 sm:w-7 rounded-xl sm:rounded-lg" width={32} height={32} priority fetchPriority="high" />
                        <div className="absolute -inset-1 bg-[var(--brand-accent)]/20 rounded-xl blur-sm -z-10 opacity-0 group-hover:opacity-100 transition-opacity md:hidden"></div>
                    </div>
                    <span className="text-sm font-semibold text-foreground md:hidden">VulnIQ</span>
                </motion.a>

                {/* CENTER: Navigation Menu */}
                <div className="hidden md:flex items-center">
                    <NavigationMenu viewport={!isMobile}>
                        <NavigationMenuList>
                            {/* Product Dropdown */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50 text-muted-foreground hover:text-foreground text-sm">
                                    Product
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid gap-2 p-3 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                        <li className="row-span-3">
                                            <NavigationMenuLink asChild>
                                                <a
                                                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-[var(--brand-accent)]/20 to-[var(--brand-primary)]/20 p-4 no-underline outline-none focus:shadow-md transition-all hover:from-[var(--brand-accent)]/30 hover:to-[var(--brand-primary)]/30"
                                                    href="/#features"
                                                >
                                                    <Sparkles className="h-6 w-6 text-[var(--brand-accent)]" />
                                                    <div className="mb-2 mt-4 text-lg font-medium">
                                                        VulnIQ
                                                    </div>
                                                    <p className="text-sm leading-tight text-muted-foreground">
                                                        AI-powered security code review with autonomous remediation.
                                                    </p>
                                                </a>
                                            </NavigationMenuLink>
                                        </li>
                                        <ListItem href="/#features" title="Features" icon={Zap}>
                                            Advanced vulnerability detection and AI-driven fixes.
                                        </ListItem>
                                        <ListItem href="/#use-cases" title="Use Cases" icon={Shield}>
                                            See how teams use VulnIQ for security.
                                        </ListItem>
                                        <ListItem href="/#connect" title="Integrations" icon={GitBranch}>
                                            Connect with GitHub, GitLab, and more.
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* Resources Dropdown */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50 text-muted-foreground hover:text-foreground text-sm">
                                    Resources
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid gap-3 p-4 md:w-[450px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                        <li className="row-span-4">
                                            <NavigationMenuLink asChild>
                                                <Link
                                                    className="flex h-full w-full select-none flex-col justify-end rounded-md p-6 no-underline outline-none focus:shadow-md transition-all duration-200 overflow-hidden relative group"
                                                    href="/blog"
                                                    style={{
                                                        background: `linear-gradient(135deg, 
                                                            rgba(var(--brand-accent-rgb), 0.15) 0%, 
                                                            rgba(var(--brand-primary-rgb), 0.3) 50%,
                                                            rgba(var(--brand-accent-rgb), 0.15) 100%)`
                                                    }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
                                                    <Rss className="h-8 w-8 mb-3 text-[var(--brand-accent)] relative z-10 group-hover:scale-110 transition-transform" />
                                                    <div className="mb-1 text-lg font-medium relative z-10 text-foreground">
                                                        Blog
                                                    </div>
                                                    <p className="text-sm leading-tight text-muted-foreground relative z-10">
                                                        Security insights and best practices.
                                                    </p>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <ListItem href="/blog/understanding-sql-injection-prevention" title="SQL Injection Guide" icon={AlertTriangle}>
                                            Detection and prevention strategies.
                                        </ListItem>
                                        <ListItem href="/blog/modern-application-security-testing-strategies" title="Security Testing" icon={Shield}>
                                            SAST and DAST best practices.
                                        </ListItem>
                                        <ListItem href="/changelog" title="Changelog" icon={FileCode}>
                                            Latest updates and releases.
                                        </ListItem>
                                        <ListItem href="/supporters" title="Supporters" icon={Heart}>
                                            People supporting this project.
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* Company Dropdown */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50 text-muted-foreground hover:text-foreground text-sm">
                                    Company
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[280px] gap-2 p-3">
                                        <ListItem href="/about" title="About Us" icon={Building2}>
                                            Learn about our mission and team.
                                        </ListItem>
                                        <ListItem href="/security" title="Security Policy" icon={Shield}>
                                            Vulnerability disclosure policy.
                                        </ListItem>
                                        <ListItem href="/#connect" title="Contact" icon={MessageSquare}>
                                            Get in touch with our team.
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* RIGHT: Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                    {/* Mobile: Compact action group */}
                    <div className="flex md:hidden items-center gap-1 bg-muted/30 rounded-xl p-1 border border-border/30">
                        <AccessibilityButton compact />
                        <div className="w-px h-5 bg-border/50"></div>
                        <ThemeToggle compact />
                    </div>

                    {/* Desktop: Full actions */}
                    <div className="hidden md:flex items-center gap-2">
                        <AccessibilityButton />
                        <ThemeToggle />
                    </div>

                    <Button asChild variant="outline" size="sm" className="hidden md:flex rounded-full text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 border-[var(--brand-accent)]/50 text-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/10 hover:border-[var(--brand-accent)]">
                        <a href="/demo" aria-label="View Demo">
                            Demo
                        </a>
                    </Button>
                    {isAuthenticated ? (
                        <Button asChild size="sm" className="rounded-xl md:rounded-full text-xs sm:text-sm px-3 sm:px-4 md:px-5 h-8 sm:h-9 touch-target bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-white shadow-md shadow-[var(--brand-accent)]/20">
                            <a href="/dashboard" className="flex items-center gap-1.5 sm:gap-2" aria-label="Go to Dashboard">
                                <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </a>
                        </Button>
                    ) : (
                        <Button asChild size="sm" className="rounded-xl md:rounded-full text-xs sm:text-sm px-3 sm:px-4 md:px-5 h-8 sm:h-9 touch-target text-white dark:text-[var(--brand-primary)] shadow-md shadow-[var(--brand-accent)]/20">
                            <a href="/login" className="flex items-center gap-1 sm:gap-1.5" aria-label="Get started - Sign in or create an account">
                                <span className="hidden sm:inline">Get started</span>
                                <span className="sm:hidden">Start</span>
                                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
                            </a>
                        </Button>
                    )}
                    {/* Mobile menu button */}
                    <motion.div whileTap={{ scale: 0.9 }} className="md:hidden">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl p-2 h-8 w-8 touch-target bg-muted/30 hover:bg-muted/50 border border-border/30"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileMenuOpen}
                        >
                            <AnimatePresence mode="wait">
                                {mobileMenuOpen ? (
                                    <motion.div
                                        key="close"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <X className="h-5 w-5" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="menu"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Menu className="h-5 w-5" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Button>
                    </motion.div>
                </div>

            </motion.nav>
        </motion.div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="fixed top-16 xs:top-18 sm:top-20 inset-x-0 z-[99] flex justify-center px-3 sm:px-4 md:hidden"
                >
                    <div className="bg-card/98 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Scrollable content */}
                        <div className="max-h-[65vh] overflow-y-auto p-4">
                            {/* Product Section - Feature Cards */}
                            <div className="mb-4">
                                <div className="text-[11px] font-bold text-[var(--brand-accent)] uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" />
                                    Product
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <motion.a
                                        href="/#features"
                                        onClick={() => setMobileMenuOpen(false)}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-[var(--brand-accent)]/10 to-[var(--brand-primary)]/5 border border-[var(--brand-accent)]/20 hover:border-[var(--brand-accent)]/40 transition-all"
                                    >
                                        <Zap className="w-5 h-5 text-[var(--brand-accent)] mb-1.5" />
                                        <span className="text-xs font-medium text-foreground">Features</span>
                                    </motion.a>
                                    <motion.a
                                        href="/#use-cases"
                                        onClick={() => setMobileMenuOpen(false)}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-[var(--brand-accent)]/10 to-[var(--brand-primary)]/5 border border-[var(--brand-accent)]/20 hover:border-[var(--brand-accent)]/40 transition-all"
                                    >
                                        <Shield className="w-5 h-5 text-[var(--brand-accent)] mb-1.5" />
                                        <span className="text-xs font-medium text-foreground">Use Cases</span>
                                    </motion.a>
                                    <motion.a
                                        href="/#connect"
                                        onClick={() => setMobileMenuOpen(false)}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-[var(--brand-accent)]/10 to-[var(--brand-primary)]/5 border border-[var(--brand-accent)]/20 hover:border-[var(--brand-accent)]/40 transition-all"
                                    >
                                        <GitBranch className="w-5 h-5 text-[var(--brand-accent)] mb-1.5" />
                                        <span className="text-xs font-medium text-foreground">Integrations</span>
                                    </motion.a>
                                </div>
                            </div>

                            {/* Resources Section - List with icons */}
                            <div className="mb-4">
                                <div className="text-[11px] font-bold text-[var(--brand-accent)] uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                                    <Rss className="w-3 h-3" />
                                    Resources
                                </div>
                                <div className="space-y-1">
                                    <motion.a
                                        href="/blog"
                                        onClick={() => setMobileMenuOpen(false)}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-[var(--brand-accent)]/10 flex items-center justify-center group-hover:bg-[var(--brand-accent)]/20 transition-colors">
                                            <Rss className="w-4 h-4 text-[var(--brand-accent)]" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-foreground">Blog</span>
                                            <p className="text-[10px] text-muted-foreground">Security insights</p>
                                        </div>
                                    </motion.a>
                                    <motion.a
                                        href="/changelog"
                                        onClick={() => setMobileMenuOpen(false)}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-[var(--brand-accent)]/10 flex items-center justify-center group-hover:bg-[var(--brand-accent)]/20 transition-colors">
                                            <FileCode className="w-4 h-4 text-[var(--brand-accent)]" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-foreground">Changelog</span>
                                            <p className="text-[10px] text-muted-foreground">Latest updates</p>
                                        </div>
                                    </motion.a>
                                    <motion.a
                                        href="/supporters"
                                        onClick={() => setMobileMenuOpen(false)}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-[var(--brand-accent)]/10 flex items-center justify-center group-hover:bg-[var(--brand-accent)]/20 transition-colors">
                                            <Heart className="w-4 h-4 text-[var(--brand-accent)]" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-foreground">Supporters</span>
                                            <p className="text-[10px] text-muted-foreground">Our community</p>
                                        </div>
                                    </motion.a>
                                </div>
                            </div>

                            {/* Company Section - Horizontal pills */}
                            <div className="pt-3 border-t border-border/30">
                                <div className="text-[11px] font-bold text-[var(--brand-accent)] uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                                    <Building2 className="w-3 h-3" />
                                    Company
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <motion.a
                                        href="/about"
                                        onClick={() => setMobileMenuOpen(false)}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-muted/50 hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Building2 className="w-3.5 h-3.5" />
                                        About
                                    </motion.a>
                                    <motion.a
                                        href="/security"
                                        onClick={() => setMobileMenuOpen(false)}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-muted/50 hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                        Security
                                    </motion.a>
                                    <motion.a
                                        href="/#connect"
                                        onClick={() => setMobileMenuOpen(false)}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-muted/50 hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Contact
                                    </motion.a>
                                </div>
                            </div>
                        </div>

                        {/* Fixed bottom actions */}
                        <div className="border-t border-border/40 p-3 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 flex gap-2">
                            <motion.a
                                href="/demo"
                                onClick={() => setMobileMenuOpen(false)}
                                whileTap={{ scale: 0.95 }}
                                className="flex-1 px-4 py-3 text-sm font-medium text-center text-[var(--brand-accent)] border border-[var(--brand-accent)]/40 rounded-xl hover:bg-[var(--brand-accent)]/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Try Demo
                            </motion.a>
                            <motion.a
                                href={isAuthenticated ? "/dashboard" : "/login"}
                                onClick={() => setMobileMenuOpen(false)}
                                whileTap={{ scale: 0.95 }}
                                className="flex-1 px-4 py-3 text-sm font-medium text-center text-white bg-gradient-to-r from-[var(--brand-accent)] to-[var(--brand-primary)] rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-[var(--brand-accent)]/20"
                            >
                                {isAuthenticated ? (
                                    <>
                                        <LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </>
                                ) : (
                                    <>
                                        Get Started
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </motion.a>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
            {/* Feedback Dialog */}
            {feedbackOpen && <FeedbackDialogInline isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />}
        </>
    );
};

// Feedback Button for Navbar
function FeedbackButton({ onClick }) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden sm:flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[var(--brand-accent)]/10 hover:bg-[var(--brand-accent)]/20 border border-[var(--brand-accent)]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2"
            aria-label="Send Feedback"
            title="Send Feedback"
        >
            <MessageSquare className="w-4 h-4 sm:w-4 sm:h-4 text-[var(--brand-accent)]" strokeWidth={2} />
        </motion.button>
    );
}

// Inline Feedback Dialog Component - matches dashboard design
function FeedbackDialogInline({ isOpen, onClose }) {
    const [feedback, setFeedback] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const textareaRef = React.useRef(null);

    const handleSubmit = async () => {
        if (!feedback.trim()) {
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/feedback/public', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedback: feedback.trim(),
                    page: typeof window !== 'undefined' ? window.location.pathname : 'landing'
                }),
            });
            if (response.ok) {
                setFeedback('');
                if (textareaRef.current) {
                    textareaRef.current.textContent = '';
                }
                onClose?.();
            }
        } catch (error) {
            // Silent fail
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInput = (e) => {
        setFeedback(e.currentTarget.textContent || '');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[400px] max-w-[90vw]">
                <DialogHeader>
                    <DialogTitle>Share your feedback</DialogTitle>
                    <DialogDescription>
                        We&apos;d love to hear your thoughts on how we can improve.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="feedback">Your feedback</Label>
                    <ScrollArea className="h-[120px] w-full rounded-md border border-input bg-transparent overflow-hidden">
                        <div
                            ref={textareaRef}
                            contentEditable
                            role="textbox"
                            aria-multiline="true"
                            id="feedback"
                            data-placeholder="Tell us what you think..."
                            onInput={handleInput}
                            className="min-h-[120px] w-full px-3 py-2 text-sm outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground break-all"
                            suppressContentEditableWarning
                        />
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !feedback.trim()}>
                        {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Accessibility Button for Navbar
function AccessibilityButton({ compact }) {
    const { openPanel } = useAccessibility();

    return (
        <motion.button
            onClick={openPanel}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                "flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2",
                compact
                    ? "w-7 h-7 bg-transparent hover:bg-[var(--brand-accent)]/10"
                    : "w-8 h-8 sm:w-9 sm:h-9 bg-[var(--brand-accent)]/10 hover:bg-[var(--brand-accent)]/20 border border-[var(--brand-accent)]/30"
            )}
            aria-label="Open Accessibility Menu"
            title="Accessibility Options"
        >
            <PersonStanding className={cn(
                "text-[var(--brand-accent)]",
                compact ? "w-4 h-4" : "w-4 h-4 sm:w-5 sm:h-5"
            )} strokeWidth={2} />
        </motion.button>
    );
}

// ListItem component for NavigationMenu
function ListItem({ title, children, href, icon: Icon, ...props }) {
    return (
        <li {...props}>
            <NavigationMenuLink asChild>
                <a
                    href={href}
                    className={cn(
                        "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors",
                        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    )}
                >
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-[var(--brand-accent)]" />}
                        <div className="text-sm font-medium leading-none">{title}</div>
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1.5">
                        {children}
                    </p>
                </a>
            </NavigationMenuLink>
        </li>
    );
}

