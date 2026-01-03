"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { FileText, Send, Loader2, CheckCircle2, AlertCircle, Linkedin, ChevronUp, Map, Twitter, Github, Instagram, ExternalLink, MessageSquare, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    const [serviceStatus, setServiceStatus] = useState("checking"); // checking, operational, partial, down
    const [feedbackOpen, setFeedbackOpen] = useState(false);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await fetch("/api/health", { 
                    method: "GET",
                    cache: "no-store" 
                });
                if (response.ok) {
                    const text = await response.text();
                    setServiceStatus(text === "ok" ? "operational" : "partial");
                } else {
                    setServiceStatus("partial");
                }
            } catch {
                setServiceStatus("down");
            }
        };

        checkHealth();
        const interval = setInterval(checkHealth, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

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
        <footer ref={ref} className="relative py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 md:px-8 bg-[var(--brand-dark)] dark:bg-[var(--brand-dark)] w-full pb-safe">
            <motion.div
                className="max-w-7xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
            >
                {/* Main footer card */}
                <div className="relative rounded-2xl sm:rounded-3xl border border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/10 bg-[var(--brand-light)]/95 dark:bg-[var(--brand-primary)]/40 backdrop-blur-sm overflow-hidden">
                    {/* Decorative top accent */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 sm:w-1/2 md:w-1/3 h-px bg-gradient-to-r from-transparent via-[var(--brand-accent)]/50 to-transparent" />

                    <div className="px-6 sm:px-8 md:px-10 lg:px-12 xl:px-16 py-8 sm:py-10 md:py-12 lg:py-16">
                        <div className="grid grid-cols-1 gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">

                    {/* Column 1: Brand & Description */}
                    <motion.div
                        className="space-y-4 sm:col-span-2 lg:col-span-1"
                        variants={itemVariants}
                    >
                        <div className="flex items-center gap-2.5">
                            <Image src="/web-app-manifest-512x512.png" alt="VulnIQ Logo" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" width={32} height={32} loading="eager" />
                            <span className="font-semibold text-[var(--brand-primary)] dark:text-[var(--brand-light)] text-base sm:text-lg tracking-tight">VulnIQ</span>
                        </div>
                        <p className="text-sm leading-relaxed text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70">
                            Autonomous security remediation powered by retrieval-augmented generation.
                        </p>
                        {/* Product Hunt Card */}
                        <motion.a
                            href="https://www.producthunt.com/products/vulniq"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#fff5f4] dark:bg-[#2a1f1e] border border-[#ffded9] dark:border-[#4a2f2c] hover:border-[#FF6154]/50 transition-all group"
                            whileHover={{ scale: 1.02 }}
                        >
                            <svg className="w-8 h-8 text-[#FF6154]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13.604 8.4h-3.405V12h3.405c.995 0 1.801-.806 1.801-1.8 0-.995-.806-1.8-1.801-1.8zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.801V6h5.803c2.319 0 4.2 1.881 4.2 4.2 0 2.319-1.881 4.2-4.2 4.2z"/>
                            </svg>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider text-[#FF6154]/70 font-medium">Follow us on</span>
                                <span className="text-sm font-semibold text-[#FF6154]">Product Hunt</span>
                            </div>
                        </motion.a>
                    </motion.div>

                    {/* Column 2: Resources */}
                    <motion.div variants={itemVariants} className="space-y-4">
                        <h4 className="font-semibold text-[var(--brand-primary)] dark:text-[var(--brand-light)] text-sm">Resources</h4>
                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={() => setFeedbackOpen(true)}
                                className="inline-flex items-center gap-2 text-sm text-[var(--brand-accent)] hover:underline text-left"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Have a feedback?
                            </button>
                            <Link
                                href="/changelog"
                                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                Changelog
                            </Link>
                            <Link
                                href="/site-map"
                                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Map className="w-4 h-4" />
                                Sitemap
                            </Link>
                            <Link
                                href="/supporters"
                                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Heart className="w-4 h-4" />
                                Supporters
                            </Link>
                            <motion.a
                                href="https://www.overleaf.com/read/vdqywdqywyhr#693113"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-[var(--brand-accent)] hover:underline"
                                whileHover={{ x: 2 }}
                            >
                                <FileText className="w-4 h-4" />
                                View thesis paper
                                <ExternalLink className="w-3 h-3" />
                            </motion.a>
                            <motion.a
                                href="https://status.vulniq.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                whileHover={{ x: 2 }}
                            >
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                        serviceStatus === "operational" ? "bg-green-400" : 
                                        serviceStatus === "partial" ? "bg-yellow-400" : 
                                        serviceStatus === "down" ? "bg-red-400" : "bg-gray-400"
                                    }`} />
                                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                        serviceStatus === "operational" ? "bg-green-500" : 
                                        serviceStatus === "partial" ? "bg-yellow-500" : 
                                        serviceStatus === "down" ? "bg-red-500" : "bg-gray-500"
                                    }`} />
                                </span>
                                {serviceStatus === "operational" ? "Services are operational" :
                                 serviceStatus === "partial" ? "Diagnosing issue, fixing" :
                                 serviceStatus === "down" ? "Systems down" :
                                 "Systems idle"}
                            </motion.a>
                        </div>
                    </motion.div>

                    {/* Column 3: About */}
                    <motion.div variants={itemVariants} className="space-y-4">
                        <h4 className="font-semibold text-[var(--brand-primary)] dark:text-[var(--brand-light)] text-sm">Master thesis</h4>
                        <div className="space-y-1.5 text-sm text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70">
                            <p className="font-medium text-[var(--brand-primary)] dark:text-[var(--brand-light)]">Emanuel Rusu</p>
                            <a 
                                href="https://www.uvt.ro/en/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:text-[var(--brand-primary)] dark:hover:text-white transition-colors"
                            >
                                West University of Timișoara
                                <ExternalLink className="w-3 h-3" />
                            </a>
                            <p>Faculty of Computer Science</p>
                            <p>MSc Cybersecurity</p>
                        </div>
                        <motion.a
                            href="https://www.linkedin.com/in/rusu-emanuel/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#0077b5] transition-colors"
                            whileHover={{ x: 2 }}
                        >
                            <Linkedin className="w-4 h-4" />
                            Connect on LinkedIn
                            <ExternalLink className="w-3 h-3" />
                        </motion.a>
                    </motion.div>

                    {/* Column 4: Newsletter */}
                    <motion.div variants={itemVariants} className="space-y-4 sm:col-span-2 lg:col-span-1">
                        <h4 className="font-semibold text-[var(--brand-primary)] dark:text-[var(--brand-light)] text-sm">Stay updated</h4>
                        <p className="text-sm text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70">
                            Get notified about new features and research updates.
                        </p>
                        <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                className="w-full px-4 py-3 text-sm rounded-lg bg-[var(--brand-white)] dark:bg-[var(--brand-primary)] border border-[var(--brand-primary)]/20 dark:border-[var(--brand-accent)]/20 text-[var(--brand-primary)] dark:text-[var(--brand-light)] placeholder:text-[var(--brand-primary)]/40 dark:placeholder:text-[var(--brand-light)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/40 focus:border-[var(--brand-accent)]/60 transition-all min-h-[44px]"
                                disabled={status === "loading" || status === "success"}
                            />
                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={status === "loading" || status === "success"}
                                    className="w-full min-h-[44px] whitespace-nowrap text-white dark:bg-white dark:text-[var(--brand-primary)] dark:hover:bg-white/90"
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

                {/* Bottom Bar - inside card */}
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
                            className="text-xs bg-[var(--brand-white)] dark:bg-[var(--brand-primary)] border-[var(--brand-primary)]/20 dark:border-[var(--brand-accent)]/20"
                        >
                            <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
                            Back to top
                        </Button>
                    </div>

                    {/* Social Media Icons */}
                    <div className="flex justify-center gap-4">
                        <a
                            href="https://vulniq.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-[var(--brand-primary)]/5 dark:bg-[var(--brand-light)]/5 hover:bg-[var(--brand-accent)]/10 dark:hover:bg-[var(--brand-accent)]/20 text-[var(--brand-primary)]/60 dark:text-[var(--brand-light)]/60 hover:text-[var(--brand-accent)] transition-all"
                            aria-label="Twitter"
                        >
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a
                            href="https://vulniq.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-[var(--brand-primary)]/5 dark:bg-[var(--brand-light)]/5 hover:bg-[var(--brand-accent)]/10 dark:hover:bg-[var(--brand-accent)]/20 text-[var(--brand-primary)]/60 dark:text-[var(--brand-light)]/60 hover:text-[var(--brand-accent)] transition-all"
                            aria-label="GitHub"
                        >
                            <Github className="w-5 h-5" />
                        </a>
                        <a
                            href="https://vulniq.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-[var(--brand-primary)]/5 dark:bg-[var(--brand-light)]/5 hover:bg-[var(--brand-accent)]/10 dark:hover:bg-[var(--brand-accent)]/20 text-[var(--brand-primary)]/60 dark:text-[var(--brand-light)]/60 hover:text-[var(--brand-accent)] transition-all"
                            aria-label="LinkedIn"
                        >
                            <Linkedin className="w-5 h-5" />
                        </a>
                        <a
                            href="https://vulniq.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-[var(--brand-primary)]/5 dark:bg-[var(--brand-light)]/5 hover:bg-[var(--brand-accent)]/10 dark:hover:bg-[var(--brand-accent)]/20 text-[var(--brand-primary)]/60 dark:text-[var(--brand-light)]/60 hover:text-[var(--brand-accent)] transition-all"
                            aria-label="Instagram"
                        >
                            <Instagram className="w-5 h-5" />
                        </a>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <p className="text-xs text-[var(--brand-primary)]/60 dark:text-[var(--brand-light)]/50">
                            © 2026 VulnIQ. All rights reserved.
                        </p>
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <Link
                                href="/privacy"
                                className="text-xs text-[var(--brand-primary)]/60 dark:text-[var(--brand-light)]/50 hover:text-[var(--brand-primary)] dark:hover:text-white transition-colors py-1"
                            >
                                Privacy Policy
                            </Link>
                            <span className="text-[var(--brand-primary)]/30 dark:text-[var(--brand-light)]/30 text-xs">•</span>
                            <Link
                                href="/terms"
                                className="text-xs text-[var(--brand-primary)]/60 dark:text-[var(--brand-light)]/50 hover:text-[var(--brand-primary)] dark:hover:text-white transition-colors py-1"
                            >
                                Terms & Conditions
                            </Link>
                            <span className="text-[var(--brand-primary)]/30 dark:text-[var(--brand-light)]/30 text-xs">•</span>
                            <Link
                                href="/security"
                                className="text-xs text-[var(--brand-primary)]/60 dark:text-[var(--brand-light)]/50 hover:text-[var(--brand-primary)] dark:hover:text-white transition-colors py-1"
                            >
                                Vulnerability Disclosure Policy
                            </Link>
                        </div>
                    </div>
                    <p className="text-xs text-[var(--brand-primary)]/60 dark:text-[var(--brand-light)]/50">
                        Open beta • Research project •{" "}
                        <a 
                            href="https://info.uvt.ro/en/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-[var(--brand-primary)] dark:hover:text-white transition-colors underline underline-offset-2 inline-flex items-center gap-1"
                        >
                            Faculty of Computer Science
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </p>
                    </div>
                </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Feedback Dialog */}
            {feedbackOpen && (
                <FooterFeedbackDialog isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
            )}
        </footer>
    );
}

// Footer Feedback Dialog Component - matches dashboard design
function FooterFeedbackDialog({ isOpen, onClose }) {
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef(null);

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
                    <Label htmlFor="footer-feedback">Your feedback</Label>
                    <ScrollArea className="h-[120px] w-full rounded-md border border-input bg-transparent overflow-hidden">
                        <div
                            ref={textareaRef}
                            contentEditable
                            role="textbox"
                            aria-multiline="true"
                            id="footer-feedback"
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
