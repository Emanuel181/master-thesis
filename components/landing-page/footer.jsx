"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { FileText, Send, Loader2, CheckCircle2, AlertCircle, Linkedin, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, transform: "translateY(16px)" },
    visible: {
        opacity: 1,
        transform: "translateY(0px)",
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
};


export function Footer({ onScrollToTop }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle"); // idle, loading, success, error
    const [message, setMessage] = useState("");

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email || !email.includes("@")) {
            setStatus("error");
            setMessage("Please enter a valid email address");
            return;
        }

        setStatus("loading");
        try {
            const response = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setMessage(data.message);
                setEmail("");
            } else {
                setStatus("error");
                setMessage(data.error || "Failed to subscribe");
            }
        } catch (error) {
            setStatus("error");
            setMessage("An error occurred. Please try again.");
        }
    };

    return (
        <footer id="connect" ref={ref} className="relative border-t border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/10 bg-gradient-to-b from-[var(--brand-white)] dark:from-[var(--brand-dark)] to-[var(--brand-light)]/20 dark:to-[var(--brand-primary)]/20 overflow-hidden w-full">
            {/* Decorative top accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 sm:w-1/2 md:w-1/3 h-px bg-gradient-to-r from-transparent via-[var(--brand-accent)]/50 to-transparent" />

            <motion.div
                className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 md:py-10 lg:py-12 xl:py-16 w-full"
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
            >
                <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-12 xl:gap-16">

                    {/* Column 1: Brand & Description */}
                    <motion.div
                        className="space-y-4 md:col-span-2 lg:col-span-1"
                        variants={itemVariants}
                    >
                        <div className="flex items-center gap-2.5">
                            <Image src="/web-app-manifest-512x512.png" alt="VulnIQ Logo" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" width={32} height={32} loading="eager" />
                            <span className="font-semibold text-[var(--brand-primary)] dark:text-[var(--brand-light)] text-base sm:text-lg tracking-tight">VulnIQ</span>
                        </div>
                        <p className="text-sm sm:text-base leading-relaxed text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70 max-w-md">
                            Autonomous security remediation powered by retrieval-augmented generation. A master thesis project exploring AI-driven vulnerability detection and patching.
                        </p>
                    </motion.div>

                    {/* Column 2: Thesis Info & Socials */}
                    <motion.div variants={itemVariants} className="space-y-4">
                        <h4 className="font-semibold text-[var(--brand-primary)] dark:text-[var(--brand-light)] text-sm sm:text-base">Master thesis</h4>
                        <div className="space-y-2 text-sm text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70">
                            <p className="font-semibold text-[var(--brand-primary)] dark:text-[var(--brand-light)]">Emanuel Rusu</p>
                            <p>West University of Timișoara</p>
                            <p>Faculty of computer science</p>
                            <p>Master&apos;s degree in cybersecurity</p>
                        </div>
                        <div className="flex flex-col gap-3 pt-2">
                            <Link
                                href="/changelog"
                                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1 -ml-1 pl-1 rounded touch-target"
                            >
                                <FileText className="w-4 h-4" />
                                Changelog
                            </Link>
                            <motion.a
                                href="https://www.overleaf.com/read/vdqywdqywyhr#693113"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-accent)] hover:underline py-1 -ml-1 pl-1 rounded touch-target"
                                whileHover={{ x: 2 }}
                            >
                                <FileText className="w-4 h-4" />
                                View thesis paper
                            </motion.a>
                            <motion.a
                                href="https://www.linkedin.com/in/rusu-emanuel/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#0077b5] transition-colors py-1 -ml-1 pl-1 rounded touch-target"
                                whileHover={{ x: 2 }}
                                aria-label="Connect on LinkedIn (opens in new tab)"
                            >
                                <Linkedin className="w-4 h-4" />
                                Connect on LinkedIn
                            </motion.a>
                        </div>
                    </motion.div>

                    {/* Column 3: Newsletter */}
                    <motion.div variants={itemVariants} className="space-y-4 md:col-span-2 lg:col-span-1">
                        <h4 className="font-semibold text-[var(--brand-primary)] dark:text-[var(--brand-light)] text-sm sm:text-base">Stay updated</h4>
                        <p className="text-sm text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70">
                            Get notified about new features and research updates.
                        </p>
                        <form onSubmit={handleSubscribe} className="flex flex-col gap-3 max-w-md">
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="flex-1 min-w-0 px-4 py-3 text-sm rounded-lg bg-[var(--brand-white)] dark:bg-[var(--brand-primary)] border border-[var(--brand-primary)]/20 dark:border-[var(--brand-accent)]/20 text-[var(--brand-primary)] dark:text-[var(--brand-light)] placeholder:text-[var(--brand-primary)]/40 dark:placeholder:text-[var(--brand-light)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/40 focus:border-[var(--brand-accent)]/60 transition-all min-h-[44px]"
                                    disabled={status === "loading" || status === "success"}
                                />
                                <Button
                                    type="submit"
                                    disabled={status === "loading" || status === "success"}
                                    className="w-full sm:w-auto min-h-[44px] whitespace-nowrap text-white dark:bg-white dark:text-[var(--brand-primary)] dark:hover:bg-white/90"
                                    aria-label={status === "loading" ? "Subscribing..." : status === "success" ? "Subscribed successfully" : "Subscribe to newsletter"}
                                >
                                    <span>Subscribe</span>
                                    {status === "loading" ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : status === "success" ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                            {message && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`text-xs flex items-center gap-1 ${
                                        status === "success" 
                                            ? "text-green-600 dark:text-green-400" 
                                            : "text-red-600 dark:text-red-400"
                                    }`}
                                >
                                    {status === "success" ? (
                                        <CheckCircle2 className="w-3 h-3" />
                                    ) : (
                                        <AlertCircle className="w-3 h-3" />
                                    )}
                                    {message}
                                </motion.p>
                            )}
                        </form>
                    </motion.div>

                </div>

                {/* Bottom Bar */}
                <motion.div
                    className="border-t border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/10 mt-8 sm:mt-10 md:mt-12 lg:mt-16 pt-6 sm:pt-8 flex flex-col gap-4"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    {/* Back to top button */}
                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onScrollToTop ? onScrollToTop() : window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="text-xs"
                        >
                            <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
                            Back to top
                        </Button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <p className="text-xs text-[var(--brand-primary)]/50 dark:text-[var(--brand-light)]/50">
                            © 2025 Emanuel Rusu - Master thesis project
                        </p>
                        <div className="flex items-center justify-center sm:justify-start gap-3">
                            <Link
                                href="/privacy"
                                className="text-xs text-[var(--brand-primary)]/50 dark:text-[var(--brand-light)]/50 hover:text-[var(--brand-primary)] dark:hover:text-white transition-colors py-1 px-2 -mx-2 rounded touch-target"
                            >
                                Privacy Policy
                            </Link>
                            <span className="text-[var(--brand-primary)]/30 dark:text-[var(--brand-light)]/30">•</span>
                            <Link
                                href="/terms"
                                className="text-xs text-[var(--brand-primary)]/50 dark:text-[var(--brand-light)]/50 hover:text-[var(--brand-primary)] dark:hover:text-white transition-colors py-1 px-2 -mx-2 rounded touch-target"
                            >
                                Terms & Conditions
                            </Link>
                        </div>
                    </div>
                    <p className="text-xs text-[var(--brand-primary)]/50 dark:text-[var(--brand-light)]/50">
                        Open beta • Research project
                    </p>
                    </div>
                </motion.div>
            </motion.div>
        </footer>
    );
}