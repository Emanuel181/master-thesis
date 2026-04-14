"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Link } from '@/i18n/navigation';
import { motion, useInView } from "framer-motion";
import { FileText, Send, Loader2, CheckCircle2, AlertCircle, Linkedin, ChevronUp, Map, Twitter, Github, Instagram, ExternalLink, MessageSquare, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HexGridBackground } from "./hex-grid-background";
import { LanguageSelector } from "@/components/language-selector";
import { useTranslations } from 'next-intl';

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
    const t = useTranslations('footer');
    const tNav = useTranslations('nav');
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle"); // idle, loading, success, error
    const [message, setMessage] = useState("");
    const [serviceStatus, setServiceStatus] = useState("checking"); // checking, operational, partial, down
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [hoveredResource, setHoveredResource] = useState(null);
    const [hoveredThesis, setHoveredThesis] = useState(null);

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
            setMessage(t('newsletter.invalidEmail'));
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
        <footer ref={ref} className="relative pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16 lg:pb-20 px-4 sm:px-6 md:px-8 bg-background w-full pb-safe overflow-hidden">
            {/* Hex Grid Background - hidden on mobile for performance */}
            <HexGridBackground className="z-0 opacity-60 hidden md:block" />
            
            <motion.div
                className="max-w-7xl mx-auto relative z-10"
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
            >
                {/* Main footer card */}
                <div className="relative rounded-2xl sm:rounded-3xl border border-border hover:border-accent/50 bg-card/95 backdrop-blur-sm overflow-hidden transition-[border-color] duration-500 ease-in-out shadow-sm">
                    {/* Decorative top accent */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 sm:w-1/2 md:w-1/3 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

                    <div className="px-6 sm:px-8 md:px-10 lg:px-12 xl:px-16 py-8 sm:py-10 md:py-12 lg:py-16">
                        <div className="grid grid-cols-1 gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">

                    {/* Column 1: Brand & Description */}
                    <motion.div
                        className="space-y-4 sm:col-span-2 lg:col-span-1"
                        variants={itemVariants}
                    >
                        <div className="flex items-center gap-2.5">
                            <Image src="/web-app-manifest-512x512.png" alt="VulnIQ Logo" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" width={32} height={32} loading="eager" />
                            <span className="font-semibold text-foreground text-base sm:text-lg tracking-tight">{t('brand')}</span>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {t('tagline')}
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
                                <span className="text-[10px] uppercase tracking-wider text-[#FF6154]/70 font-medium">{t('followUs')}</span>
                                <span className="text-sm font-semibold text-[#FF6154]">{t('productHunt')}</span>
                            </div>
                        </motion.a>
                    </motion.div>

                    {/* Column 2: Resources */}
                    <motion.div variants={itemVariants} className="space-y-4">
                        <h4 className="font-semibold text-foreground text-sm">{t('resources')}</h4>
                        <div className="flex flex-col gap-2.5" onMouseLeave={() => setHoveredResource(null)}>
                            <button
                                onClick={() => setFeedbackOpen(true)}
                                onMouseEnter={() => setHoveredResource('feedback')}
                                className={`inline-flex items-center gap-2 text-sm text-accent hover:underline text-left transition-opacity duration-200 ${hoveredResource && hoveredResource !== 'feedback' ? 'opacity-30' : 'opacity-100'}`}
                            >
                                <MessageSquare className="w-4 h-4" />
                                {t('haveFeedback')}
                            </button>
                            <Link
                                href="/changelog"
                                onMouseEnter={() => setHoveredResource('changelog')}
                                className={`inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 ${hoveredResource && hoveredResource !== 'changelog' ? 'opacity-30' : 'opacity-100'}`}
                            >
                                <FileText className="w-4 h-4" />
                                {t('changelog')}
                            </Link>
                            <Link
                                href="/site-map"
                                onMouseEnter={() => setHoveredResource('sitemap')}
                                className={`inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 ${hoveredResource && hoveredResource !== 'sitemap' ? 'opacity-30' : 'opacity-100'}`}
                            >
                                <Map className="w-4 h-4" />
                                {t('sitemap')}
                            </Link>
                            <Link
                                href="/supporters"
                                onMouseEnter={() => setHoveredResource('supporters')}
                                className={`inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 ${hoveredResource && hoveredResource !== 'supporters' ? 'opacity-30' : 'opacity-100'}`}
                            >
                                <Heart className="w-4 h-4" />
                                {t('supporters')}
                            </Link>
                            <motion.a
                                href="https://www.overleaf.com/read/vdqywdqywyhr#693113"
                                target="_blank"
                                rel="noopener noreferrer"
                                onMouseEnter={() => setHoveredResource('thesis')}
                                className={`inline-flex items-center gap-2 text-sm text-accent hover:underline transition-opacity duration-200 ${hoveredResource && hoveredResource !== 'thesis' ? 'opacity-30' : 'opacity-100'}`}
                                whileHover={{ x: 2 }}
                            >
                                <FileText className="w-4 h-4" />
                                {t('viewThesisPaper')}
                                <ExternalLink className="w-3 h-3" />
                            </motion.a>
                            <motion.a
                                href="https://status.vulniq.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                onMouseEnter={() => setHoveredResource('status')}
                                className={`inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 ${hoveredResource && hoveredResource !== 'status' ? 'opacity-30' : 'opacity-100'}`}
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
                                {serviceStatus === "operational" ? t('serviceStatus.operational') :
                                 serviceStatus === "partial" ? t('serviceStatus.diagnosing') :
                                 serviceStatus === "down" ? t('serviceStatus.down') :
                                 t('serviceStatus.idle')}
                            </motion.a>
                        </div>
                    </motion.div>

                    {/* Column 3: About */}
                    <motion.div variants={itemVariants} className="space-y-4" onMouseLeave={() => setHoveredThesis(null)}>
                        <h4 className="font-semibold text-foreground text-sm">{t('thesis.label')}</h4>
                        <div className="space-y-1.5 text-sm text-muted-foreground">
                            <p
                                onMouseEnter={() => setHoveredThesis('name')}
                            >{t('thesis.author')}</p>
                            <a
                                href="https://www.uvt.ro/en/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onMouseEnter={() => setHoveredThesis('university')}
                                className={`inline-flex items-center gap-1 hover:text-foreground transition-all duration-200 ${hoveredThesis && hoveredThesis !== 'university' ? 'opacity-30' : 'opacity-100'}`}
                            >
                                {t('thesis.university')}
                                <ExternalLink className="w-3 h-3" />
                            </a>
                            <p
                                onMouseEnter={() => setHoveredThesis('faculty')}
                                className={`transition-opacity duration-200 ${hoveredThesis && hoveredThesis !== 'faculty' ? 'opacity-30' : 'opacity-100'}`}
                            >{t('thesis.faculty')}</p>
                            <a
                                href="https://info.uvt.ro/master/cybersecurity/"
                                target="_blank"
                                rel="noopener noreferrer"
                                onMouseEnter={() => setHoveredThesis('msc')}
                                className={`inline-flex items-center gap-1 hover:text-foreground transition-all duration-200 ${hoveredThesis && hoveredThesis !== 'msc' ? 'opacity-30' : 'opacity-100'}`}
                            >
                                {t('thesis.degree')}
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                        <motion.a
                            href="https://www.linkedin.com/in/rusu-emanuel/"
                            target="_blank"
                            rel="noopener noreferrer"
                            onMouseEnter={() => setHoveredThesis('linkedin')}
                            className={`inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#0077b5] transition-all duration-200 ${hoveredThesis && hoveredThesis !== 'linkedin' ? 'opacity-30' : 'opacity-100'}`}
                            whileHover={{ x: 2 }}
                        >
                            <Linkedin className="w-4 h-4" />
                            {t('thesis.connectLinkedIn')}
                            <ExternalLink className="w-3 h-3" />
                        </motion.a>
                    </motion.div>

                    {/* Column 4: Newsletter */}
                    <motion.div variants={itemVariants} className="space-y-4 sm:col-span-2 lg:col-span-1">
                        <h4 className="font-semibold text-foreground text-sm">{t('newsletter.heading')}</h4>
                        <p className="text-sm text-muted-foreground">
                            {t('newsletter.description')}
                        </p>
                        <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('newsletter.emailPlaceholder')}
                                className="w-full px-4 py-3 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60 transition-all min-h-[44px]"
                                disabled={status === "loading" || status === "success"}
                            />
                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={status === "loading" || status === "success"}
                                    className="w-full min-h-[44px] whitespace-nowrap"
                                    aria-label={status === "loading" ? t('newsletter.subscribingButton') : status === "success" ? t('newsletter.successMessage') : t('newsletter.subscribeButton')}
                                >
                                    <span>{t('newsletter.subscribeButton')}</span>
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
                    className="border-t border-border mt-8 sm:mt-10 md:mt-12 lg:mt-16 pt-6 sm:pt-8 flex flex-col gap-4"
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
                            {t('backToTop')}
                        </Button>
                    </div>

                    {/* Social Media Icons */}
                    <div className="flex justify-center gap-4">
                        <a
                            href="https://vulniq.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-muted hover:bg-muted/20 text-muted-foreground hover:text-accent transition-all"
                            aria-label="Twitter"
                        >
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a
                            href="https://vulniq.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-muted hover:bg-muted/20 text-muted-foreground hover:text-accent transition-all"
                            aria-label="GitHub"
                        >
                            <Github className="w-5 h-5" />
                        </a>
                        <a
                            href="https://vulniq.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-muted hover:bg-muted/20 text-muted-foreground hover:text-accent transition-all"
                            aria-label="LinkedIn"
                        >
                            <Linkedin className="w-5 h-5" />
                        </a>
                        <a
                            href="https://vulniq.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-muted hover:bg-muted/20 text-muted-foreground hover:text-accent transition-all"
                            aria-label="Instagram"
                        >
                            <Instagram className="w-5 h-5" />
                        </a>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
                        <span className="text-xs text-muted-foreground">{t('copyright')}</span>
                        <span className="text-muted-foreground/50 text-xs">•</span>
                        <span className="text-xs text-muted-foreground">{t('madeIn')}</span>
                        <span className="text-muted-foreground/50 text-xs">•</span>
                        <LanguageSelector />
                        <span className="text-muted-foreground/50 text-xs">•</span>
                        <Link
                            href="/privacy"
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('privacyPolicy')}
                        </Link>
                        <span className="text-muted-foreground/50 text-xs">•</span>
                        <Link
                            href="/terms"
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('termsConditions')}
                        </Link>
                        <span className="text-muted-foreground/50 text-xs">•</span>
                        <Link
                            href="/security"
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('vulnerabilityDisclosure')}
                        </Link>
                        <span className="text-muted-foreground/50 text-xs">•</span>
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new Event('open-cookie-preferences'))}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('manageCookies')}
                        </button>
                        <span className="text-muted-foreground/50 text-xs">•</span>
                        <span className="text-xs text-muted-foreground">
                            {t('openBetaBadge')}{" "}
                            <a
                                href="https://info.uvt.ro/en/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-foreground transition-colors underline underline-offset-2 inline-flex items-center gap-1"
                            >
                                {t('thesis.faculty')}
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </span>
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

// Footer Feedback Dialog Component - custom modal to avoid Radix scroll issues
function FooterFeedbackDialog({ isOpen, onClose }) {
    const t = useTranslations('footer.feedbackDialog');
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
                    textareaRef.current.value = '';
                }
                onClose?.();
            }
        } catch (error) {
            // Silent fail
        } finally {
            setIsSubmitting(false);
        }
    };

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose?.();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 animate-in fade-in-0"
                onClick={onClose}
            />
            {/* Modal Content */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] max-w-[90vw] bg-background border rounded-lg p-6 shadow-lg animate-in fade-in-0 zoom-in-95">
                {/* Close button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                </button>
                
                {/* Header */}
                <div className="flex flex-col gap-2 text-center sm:text-left mb-4">
                    <h2 className="text-lg font-semibold leading-none">{t('title')}</h2>
                    <p className="text-muted-foreground text-sm">
                        {t('description')}
                    </p>
                </div>
                
                {/* Content */}
                <div className="space-y-2 mb-4">
                    <Label htmlFor="footer-feedback">{t('feedbackLabel')}</Label>
                    <textarea
                        ref={textareaRef}
                        id="footer-feedback"
                        placeholder={t('feedbackPlaceholder')}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-transparent resize-none outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                
                {/* Footer */}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        {t('cancelButton')}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !feedback.trim()}
                    >
                        {isSubmitting ? t('submittingButton') : t('submitButton')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
