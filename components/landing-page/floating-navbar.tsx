"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowUpRight } from "lucide-react";

const navItems = [
    { name: "Home", link: "#" },
    { name: "Enterprise", link: "#" },
    { name: "Pricing", link: "#" },
    { name: "Customers", link: "#" },
    { name: "About us", link: "#", hasDropdown: true },
    { name: "Docs", link: "#", isExternal: true },
];

export const FloatingNavbar = () => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div className="fixed top-6 inset-x-0 z-[100] flex justify-center px-4 pointer-events-none">
            <nav
                className="pointer-events-auto flex items-center justify-between gap-4
                   bg-zinc-900/80 backdrop-blur-md border border-white/10
                   pl-4 pr-2 py-2 rounded-full shadow-2xl w-full max-w-5xl"
            >

                {/* LEFT: Logo */}
                <div className="flex items-center gap-2 mr-4">
                    <img src="https://amz-s3-pdfs-gp.s3.us-east-1.amazonaws.com/logo/logo.png" alt="VulnIQ Logo" className="h-6 w-6 rounded-lg" />
                    <span className="font-bold text-zinc-100 tracking-tight hidden sm:block">
            VulnIQ
          </span>
                </div>

                {/* CENTER: Navigation Links (Hidden on mobile) */}
                <div className="hidden md:flex items-center gap-1">
                    {navItems.map((item, idx) => (
                        <a
                            key={item.name}
                            href={item.link}
                            className="relative px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors group flex items-center gap-1"
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <span className="relative z-10">{item.name}</span>

                            {/* Icons for Dropdown or External */}
                            {item.hasDropdown && <ChevronDown size={12} className="opacity-50 group-hover:opacity-100 transition-opacity relative z-10" />}
                            {item.isExternal && <ArrowUpRight size={12} className="opacity-50 group-hover:opacity-100 transition-opacity relative z-10" />}

                            {/* Hover Background Pill */}
                            {hoveredIndex === idx && (
                                <motion.span
                                    layoutId="nav-hover"
                                    className="absolute inset-0 bg-white/10 rounded-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </a>
                    ))}
                </div>

                {/* RIGHT: Actions */}
                <div className="flex items-center gap-2 pl-4">
                    <button className="text-sm font-medium text-zinc-300 hover:text-white px-3 py-2 transition-colors hidden sm:block">
                        Login
                    </button>
                    <button className="bg-white text-zinc-950 px-4 py-2 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5">
                        Get started
                    </button>
                </div>

            </nav>
        </div>
    );
};