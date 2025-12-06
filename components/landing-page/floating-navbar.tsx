"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
    { name: "Home", link: "#hero" },
    { name: "Features", link: "#features" },
    { name: "How It Works", link: "#timeline" },
    { name: "Models", link: "#models" },
    { name: "About", link: "#about" },
];

export const FloatingNavbar = () => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div className="fixed top-6 inset-x-0 z-[100] flex justify-center px-4 pointer-events-none">
            <nav
                className="pointer-events-auto flex items-center justify-between gap-4 bg-card/80 backdrop-blur-md border border-border/10 hover:border-primary/20 pl-4 pr-2 py-2 rounded-full shadow-2xl w-full max-w-5xl transition-colors"
            >

                {/* LEFT: Logo */}
                <a href="/" className="flex items-center gap-2 font-medium">
                    <Image src="https://amz-s3-pdfs-gp.s3.us-east-1.amazonaws.com/logo/logo.png" alt="VulnIQ Logo" className="h-6 w-6 rounded-lg invert dark:invert-0" width={24} height={24} />
                    <span className="font-bold text-card-foreground tracking-tight hidden sm:block">
            VulnIQ
          </span>
                </a>

                {/* CENTER: Navigation Links (Hidden on mobile) */}
                <div className="hidden md:flex items-center gap-1">
                    {navItems.map((item, idx) => (
                        <Button
                            key={item.name}
                            asChild
                            variant="ghost"
                            size="sm"
                            className="relative px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group flex items-center gap-1"
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <a href={item.link}>
                                <span className="relative z-10">{item.name}</span>


                                {/* Hover Background Pill */}
                                {hoveredIndex === idx && (
                                    <motion.span
                                        layoutId="nav-hover"
                                        className="absolute inset-0 bg-accent/10 rounded-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </a>
                        </Button>
                    ))}
                </div>

                {/* RIGHT: Actions */}
                <div className="flex items-center gap-2 pl-4">
                    <ThemeToggle />
                    <Button asChild variant="default" size="sm" className="rounded-full">
                        <a href="/login">Get started</a>
                    </Button>
                </div>

            </nav>
        </div>
    );
};