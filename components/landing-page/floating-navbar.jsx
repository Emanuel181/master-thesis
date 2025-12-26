"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X, ArrowRight, ChevronRight } from "lucide-react";

const navItems = [
    { name: "Features", link: "/#features" },
    { name: "Use cases", link: "/#use-cases" },
    { name: "About", link: "/about" },
    { name: "Connect", link: "/#connect" },
];

export const FloatingNavbar = () => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [visible, setVisible] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);

    const { scrollY, scrollYProgress } = useScroll();

    // Subtle progress indicator
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

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
                className="fixed top-6 inset-x-0 z-[100] flex justify-center px-4 pointer-events-none"
                initial={{ y: -100, opacity: 0 }}
                animate={{
                    y: visible ? 0 : -100,
                    opacity: visible ? 1 : 0
                }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                }}
            >
                <motion.nav
                    className={`pointer-events-auto flex items-center justify-between gap-4 border px-6 py-3.5 rounded-full w-full max-w-5xl transition-all duration-500 ease-in-out ${
                        isScrolled 
                            ? 'bg-background/95 backdrop-blur-xl border-[var(--brand-primary)]/20 dark:border-[var(--brand-accent)]/20 shadow-xl shadow-black/10' 
                            : 'bg-background/80 dark:bg-[var(--brand-dark)]/90 backdrop-blur-md border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/30 shadow-md'
                    }`}
                    layout
                >

                {/* LEFT: Logo */}
                <motion.a
                    href="/"
                    className="flex items-center gap-2.5 font-medium group"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <Image src="/web-app-manifest-512x512.png" alt="VulnIQ Logo" className="h-7 w-7 rounded-lg" width={28} height={28} />
                    <span className="font-semibold text-foreground tracking-tight hidden sm:block text-sm">
                        VulnIQ
                    </span>
                </motion.a>

                {/* CENTER: Navigation Links */}
                <div className="hidden md:flex items-center gap-1">
                    {navItems.map((item, idx) => (
                        <motion.div
                            key={item.name}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + idx * 0.05 }}
                        >
                            <a
                                href={item.link}
                                className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                onMouseEnter={() => setHoveredIndex(idx)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                <span className="relative z-10">{item.name}</span>

                                <AnimatePresence>
                                    {hoveredIndex === idx && (
                                        <motion.span
                                            layoutId="nav-hover"
                                            className="absolute inset-0 bg-muted/50 rounded-full"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                        />
                                    )}
                                </AnimatePresence>
                            </a>
                        </motion.div>
                    ))}
                </div>

                {/* RIGHT: Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <ThemeToggle />
                    <Button asChild size="sm" className="rounded-full text-xs sm:text-sm px-3 sm:px-5 h-8 sm:h-9">
                        <a href="/login" className="flex items-center gap-1 sm:gap-1.5">
                            <span className="hidden xs:inline">Get started</span>
                            <span className="xs:hidden">Start</span>
                            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </a>
                    </Button>
                    {/* Mobile menu button */}
                    <motion.div whileTap={{ scale: 0.9 }}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="md:hidden rounded-full p-2 h-8 w-8 sm:h-9 sm:w-9"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
                    className="fixed top-20 inset-x-0 z-[99] flex justify-center px-4 md:hidden"
                >
                    <div className="bg-card/95 backdrop-blur-xl border border-border/30 rounded-2xl shadow-2xl w-full max-w-sm p-3 overflow-hidden">
                        <div className="flex flex-col gap-1">
                            {navItems.map((item, idx) => (
                                <motion.a
                                    key={item.name}
                                    href={item.link}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all flex items-center justify-between"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {item.name}
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                                </motion.a>
                            ))}
                        </div>
                        <motion.div
                            className="border-t border-border/30 mt-2 pt-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Button asChild className="w-full rounded-xl" size="sm">
                                <a href="/login">Get started free</a>
                            </Button>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        </>
    );
};
