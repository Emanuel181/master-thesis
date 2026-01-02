"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X, ArrowRight, ChevronRight, LayoutDashboard, PersonStanding, Sparkles, Shield, Zap, FileCode, BookOpen, Newspaper, GitBranch, Mail, AlertTriangle, Code, Rss, MessageSquare, Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAccessibility } from "@/contexts/accessibilityContext";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
    { name: "Features", link: "/#features" },
    { name: "Use cases", link: "/#use-cases" },
    { name: "About", link: "/about" },
    { name: "Blogs", link: "/blog" },
    { name: "Connect", link: "/#connect" },
    { name: "Changelog", link: "/changelog" },
];

export const FloatingNavbar = () => {
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated" && !!session;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [visible, setVisible] = useState(true);
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
        const previous = scrollY.getPrevious();

        if (latest < previous || latest < 100) {
            setVisible(true);
        } else if (latest > 100 && latest > previous) {
            setVisible(false);
        }

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
                animate={{
                    y: visible ? 0 : -100
                }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                }}
            >
                <motion.nav
                    className={`pointer-events-auto flex items-center justify-between gap-1.5 sm:gap-2 md:gap-4 border px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 lg:py-3.5 rounded-full w-full max-w-5xl backdrop-blur-xl ${
                        isScrolled 
                            ? 'bg-[#1fb6cf]/10 dark:bg-[#1fb6cf]/5 border-[#1fb6cf]/30 shadow-xl shadow-[#1fb6cf]/10' 
                            : 'bg-[#1fb6cf]/5 dark:bg-[#1fb6cf]/5 border-[#1fb6cf]/20 shadow-md shadow-[#1fb6cf]/5'
                    } transition-colors transition-shadow duration-300`}
                    layout
                >

                {/* LEFT: Logo */}
                <motion.a
                    href="/"
                    className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 font-medium group"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    aria-label="VulnIQ Home"
                >
                    <Image src="/web-app-manifest-512x512.png" alt="VulnIQ Logo" className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg" width={28} height={28} priority fetchPriority="high" />

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
                                    <ul className="grid w-[300px] gap-2 p-3 md:grid-cols-1">
                                        <ListItem href="/changelog" title="Changelog" icon={FileCode}>
                                            See what's new in VulnIQ.
                                        </ListItem>
                                        <ListItem href="/about" title="About Us" icon={BookOpen}>
                                            Learn about our mission and team.
                                        </ListItem>
                                        <ListItem href="/supporters" title="Supporters" icon={Heart}>
                                            People who support this project.
                                        </ListItem>
                                        <ListItem href="/security" title="Security Policy" icon={Shield}>
                                            Vulnerability disclosure policy.
                                        </ListItem>
                                        <ListItem href="/#connect" title="Support" icon={MessageSquare}>
                                            Get help or contact our team.
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* Direct Links */}
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground text-sm")}>
                                    <Link href="/about">About</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted/50 data-[state=open]:text-foreground text-sm">
                                    Blog
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[450px] lg:grid-cols-[.75fr_1fr]">
                                        <li className="row-span-3">
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
                                                        VulnIQ Blog
                                                    </div>
                                                    <p className="text-sm leading-tight text-muted-foreground relative z-10">
                                                        Security insights, best practices, and the latest updates.
                                                    </p>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                        <ListItem href="/blog/understanding-sql-injection-prevention" title="SQL Injection Prevention" icon={AlertTriangle}>
                                            Detection and prevention guide.
                                        </ListItem>
                                        <ListItem href="/blog/modern-application-security-testing-strategies" title="Security Testing Strategies" icon={Shield}>
                                            SAST and DAST best practices.
                                        </ListItem>
                                        <ListItem href="/blog/cross-site-scripting-defense-guide" title="XSS Defense Guide" icon={Code}>
                                            Protecting from XSS attacks.
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground text-sm")}>
                                    <a href="/#connect">Contact</a>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* RIGHT: Actions */}
                <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                    <AccessibilityButton />
                    <ThemeToggle />
                    <Button asChild variant="outline" size="sm" className="hidden md:flex rounded-full text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 border-[var(--brand-accent)]/50 text-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/10 hover:border-[var(--brand-accent)]">
                        <a href="/demo" aria-label="View Demo">
                            Demo
                        </a>
                    </Button>
                    {isAuthenticated ? (
                        <Button asChild size="sm" className="rounded-full text-[10px] xs:text-xs sm:text-sm px-2 xs:px-3 sm:px-4 md:px-5 h-7 xs:h-8 sm:h-9 touch-target bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-white">
                            <a href="/dashboard" className="flex items-center gap-1 xs:gap-1.5 sm:gap-2" aria-label="Go to Dashboard">
                                <LayoutDashboard className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                                <span className="hidden xs:inline">Dashboard</span>
                            </a>
                        </Button>
                    ) : (
                        <Button asChild size="sm" className="rounded-full text-[10px] xs:text-xs sm:text-sm px-2 xs:px-3 sm:px-4 md:px-5 h-7 xs:h-8 sm:h-9 touch-target text-white dark:text-[var(--brand-primary)]">
                            <a href="/login" className="flex items-center gap-0.5 xs:gap-1 sm:gap-1.5" aria-label="Get started - Sign in or create an account">
                                <span className="hidden xs:inline">Get started</span>
                                <span className="xs:hidden" aria-hidden="true">Go</span>
                                <span className="sr-only xs:hidden">Get started</span>
                                <ArrowRight className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
                            </a>
                        </Button>
                    )}
                    {/* Mobile menu button */}
                    <motion.div whileTap={{ scale: 0.9 }}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="md:hidden rounded-full p-1.5 xs:p-2 h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 touch-target"
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
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="fixed top-12 xs:top-14 sm:top-16 md:top-20 inset-x-0 z-[99] flex justify-center px-2 sm:px-3 md:px-4 md:hidden"
                >
                    <div className="bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-2 sm:p-3 overflow-hidden">
                        <div className="flex flex-col gap-0.5 sm:gap-1">
                            {navItems.map((item, idx) => (
                                <motion.a
                                    key={item.name}
                                    href={item.link}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg sm:rounded-xl transition-all flex items-center justify-between touch-target"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {item.name}
                                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground/50" />
                                </motion.a>
                            ))}
                            {/* Demo button in mobile menu */}
                            <motion.a
                                href="/demo"
                                onClick={() => setMobileMenuOpen(false)}
                                className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/10 rounded-lg sm:rounded-xl transition-all flex items-center justify-between touch-target border border-[var(--brand-accent)]/30"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: navItems.length * 0.05 }}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Demo
                                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--brand-accent)]/50" />
                            </motion.a>
                        </div>
                        <motion.div
                            className="border-t border-border/30 mt-1.5 sm:mt-2 pt-2 sm:pt-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Button asChild className="w-full rounded-lg sm:rounded-xl touch-target min-h-[44px]" size="sm">
                                <a
                                    href={isAuthenticated ? "/dashboard" : "/login"}
                                    aria-label={isAuthenticated ? "Go to Dashboard" : "Get started"}
                                    className="flex items-center justify-center gap-2"
                                >
                                    {isAuthenticated && <LayoutDashboard className="w-4 h-4" aria-hidden="true" />}
                                    {isAuthenticated ? "Dashboard" : "Get started"}
                                    {!isAuthenticated && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
                                </a>
                            </Button>
                        </motion.div>
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

// Inline Feedback Dialog Component
function FeedbackDialogInline({ isOpen, onClose }) {
    const [feedback, setFeedback] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [status, setStatus] = React.useState('idle');
    const [message, setMessage] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedback.trim()) {
            setStatus('error');
            setMessage('Please enter your feedback');
            return;
        }
        setStatus('loading');
        setMessage('');
        try {
            const response = await fetch('/api/feedback/public', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedback: feedback.trim(),
                    email: email.trim() || undefined,
                    page: typeof window !== 'undefined' ? window.location.pathname : 'landing'
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setStatus('success');
                setMessage('Thank you for your feedback!');
                setFeedback('');
                setEmail('');
                setTimeout(() => { onClose?.(); setStatus('idle'); setMessage(''); }, 2000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to submit feedback');
            }
        } catch (error) {
            setStatus('error');
            setMessage('An error occurred. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Send Feedback</h3>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <input
                        type="email"
                        placeholder="Email (optional)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={status === 'loading' || status === 'success'}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/40"
                    />
                    <textarea
                        placeholder="Tell us what you think..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full min-h-[120px] px-3 py-2 text-sm rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/40"
                        disabled={status === 'loading' || status === 'success'}
                    />
                    {message && (
                        <p className={`text-sm flex items-center gap-1.5 ${status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {message}
                        </p>
                    )}
                    <Button type="submit" className="w-full" disabled={status === 'loading' || status === 'success'}>
                        {status === 'loading' ? 'Sending...' : status === 'success' ? 'Sent!' : 'Send Feedback'}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}

// Accessibility Button for Navbar
function AccessibilityButton() {
    const { openPanel } = useAccessibility();

    return (
        <motion.button
            onClick={openPanel}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[var(--brand-accent)]/10 hover:bg-[var(--brand-accent)]/20 border border-[var(--brand-accent)]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2"
            aria-label="Open Accessibility Menu"
            title="Accessibility Options"
        >
            <PersonStanding className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--brand-accent)]" strokeWidth={2} />
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
