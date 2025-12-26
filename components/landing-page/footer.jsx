"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { FileText, Send, Loader2, CheckCircle2, AlertCircle, Linkedin } from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
};


export function Footer() {
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
        <footer id="connect" ref={ref} className="relative border-t border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/10 bg-gradient-to-b from-[var(--brand-white)] dark:from-[var(--brand-dark)] to-[var(--brand-light)]/20 dark:to-[var(--brand-primary)]/20">
            {/* Decorative top accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-[var(--brand-accent)]/50 to-transparent" />

            <motion.div
                className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16"
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12">

                    {/* Brand Column */}
                    <motion.div
                        className="space-y-4"
                        variants={itemVariants}
                    >
                        <div className="flex items-center gap-2.5">
                            <Image src="/web-app-manifest-512x512.png" alt="VulnIQ Logo" className="w-7 h-7 rounded-lg" width={28} height={28} />
                            <span className="font-semibold text-[var(--brand-primary)] dark:text-[var(--brand-light)] text-base tracking-tight">VulnIQ</span>
                        </div>
                        <p className="text-sm leading-relaxed max-w-sm text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70">
                            Autonomous security remediation powered by retrieval-augmented generation. A master thesis project exploring AI-driven vulnerability detection and patching.
                        </p>

                        {/* Email Subscription Form */}
                        <div className="pt-3 space-y-3">
                            <h4 className="font-medium text-[var(--brand-primary)] dark:text-[var(--brand-light)] text-sm">Stay Updated</h4>
                            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="flex-1 px-3 py-2 text-sm rounded-lg bg-[var(--brand-white)] dark:bg-[var(--brand-primary)] border border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/20 text-[var(--brand-primary)] dark:text-[var(--brand-light)] placeholder:text-[var(--brand-primary)]/40 dark:placeholder:text-[var(--brand-light)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/30 focus:border-[var(--brand-accent)]/50 transition-all"
                                        disabled={status === "loading" || status === "success"}
                                    />
                                    <motion.button
                                        type="submit"
                                        disabled={status === "loading" || status === "success"}
                                        className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                        whileHover={{ scale: status === "loading" || status === "success" ? 1 : 1.02 }}
                                        whileTap={{ scale: status === "loading" || status === "success" ? 1 : 0.98 }}
                                    >
                                        {status === "loading" ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : status === "success" ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </motion.button>
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
                        </div>
                    </motion.div>

                    {/* Thesis Info */}
                    <motion.div variants={itemVariants} className="space-y-4">
                        <h4 className="font-medium text-[var(--brand-primary)] dark:text-[var(--brand-light)] text-sm">Master Thesis</h4>
                        <div className="space-y-2 text-sm text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70">
                            <p className="font-medium text-[var(--brand-primary)] dark:text-[var(--brand-light)]">Emanuel Rusu</p>
                            <p>West University of Timișoara</p>
                            <p>Faculty of Computer Science</p>
                            <p>Master&apos;s Degree in Cybersecurity</p>
                        </div>
                        <motion.a
                            href="https://www.overleaf.com/read/vdqywdqywyhr#693113"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 mt-2 text-sm font-medium rounded-lg bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] border border-[var(--brand-accent)]/20 hover:bg-[var(--brand-accent)]/20 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <FileText className="w-4 h-4" />
                            View Thesis Paper
                        </motion.a>
                        
                        <div className="pt-4">
                             <motion.a
                                href="https://www.linkedin.com/in/rusu-emanuel/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-muted-foreground hover:text-[#0077b5] transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Linkedin className="w-5 h-5" />
                                <span className="text-sm">Connect on LinkedIn</span>
                            </motion.a>
                        </div>
                    </motion.div>

                </div>

                {/* Bottom Bar */}
                <motion.div
                    className="border-t border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <p className="text-xs text-[var(--brand-primary)]/50 dark:text-[var(--brand-light)]/50">
                        © 2025 Emanuel Rusu — Master Thesis Project
                    </p>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/privacy"
                            className="text-xs text-[var(--brand-primary)]/50 dark:text-[var(--brand-light)]/50 hover:text-[var(--brand-accent)] transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <span className="text-[var(--brand-primary)]/30 dark:text-[var(--brand-light)]/30">•</span>
                        <Link
                            href="/terms"
                            className="text-xs text-[var(--brand-primary)]/50 dark:text-[var(--brand-light)]/50 hover:text-[var(--brand-accent)] transition-colors"
                        >
                            Terms & Conditions
                        </Link>
                    </div>
                    <p className="text-xs text-[var(--brand-primary)]/50 dark:text-[var(--brand-light)]/50">
                        Open Beta • Research Project
                    </p>
                </motion.div>
            </motion.div>
        </footer>
    );
}