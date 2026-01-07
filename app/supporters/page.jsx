'use client'

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from "@/components/theme-toggle";
import {
    ArrowLeft,
    Heart,
    Users,
    Loader2,
    PersonStanding,
    ChevronLeft,
    ChevronRight,
    Send,
    CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Footer } from "@/components/landing-page/footer";
import { FloatingNavbar } from "@/components/landing-page/floating-navbar";
import { useAccessibility } from "@/contexts/accessibilityContext";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { SupporterCard } from "@/components/ui/supporter-card";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

// Message Form Component
function MessageForm() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email');
            return;
        }

        if (!message.trim()) {
            setError('Please enter a message');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/feedback/public', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    feedback: message,
                    email: email || undefined,
                    page: 'supporters'
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                setEmail('');
                setMessage('');
            } else {
                setError(data.error || 'Failed to send message. Please try again.');
            }
        } catch (err) {
            setError('Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-4"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">Thank you! Your message has been sent.</p>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSuccess(false)}
                    className="text-[var(--brand-accent)] hover:text-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/10"
                >
                    Send another message
                </Button>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-muted-foreground">
                    Email <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50 border-border/50 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]/20"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="message" className="text-sm text-muted-foreground">
                    Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                    id="message"
                    placeholder="Tell us how you'd like to contribute..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="bg-background/50 border-border/50 focus:border-[var(--brand-accent)] focus:ring-[var(--brand-accent)]/20 resize-none"
                />
            </div>
            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-white"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                    </>
                ) : (
                    <>
                        <Send className="mr-2 h-4 w-4" />
                        Leave a message
                    </>
                )}
            </Button>
        </form>
    );
}

export default function SupportersPage() {
    const scrollRef = useRef(null);
    const { openPanel, setForceHideFloating } = useAccessibility();
    const [supporters, setSupporters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Pagination settings: 3 per row × 3 rows = 9 per page
    const ITEMS_PER_PAGE = 9;

    useScrollRestoration(scrollRef);

    // Hide floating accessibility widget on this page
    useEffect(() => {
        setForceHideFloating(true);
        return () => setForceHideFloating(false);
    }, [setForceHideFloating]);

    // Fetch supporters
    useEffect(() => {
        async function fetchSupporters() {
            try {
                setLoading(true);
                const response = await fetch('/api/supporters');
                const data = await response.json();

                if (response.ok) {
                    setSupporters(data.supporters || []);
                } else {
                    setError(data.error || 'Failed to fetch supporters');
                }
            } catch (err) {
                setError('Failed to load supporters');
            } finally {
                setLoading(false);
            }
        }
        fetchSupporters();
    }, []);

    // Separate featured and regular supporters
    const featuredSupporters = supporters.filter(s => s.featured);
    const regularSupporters = supporters.filter(s => !s.featured);

    // Pagination calculations (only for regular supporters)
    const totalPages = Math.ceil(regularSupporters.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedSupporters = regularSupporters.slice(startIndex, endIndex);

    // Reset to page 1 when supporters change
    useEffect(() => {
        setCurrentPage(1);
    }, [supporters.length]);

    return (
        <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-[var(--brand-accent)]/20">
            {/* Background effects - matching landing page */}
            <div className="fixed inset-0 mesh-gradient pointer-events-none" />
            <div className="fixed inset-0 dots-pattern opacity-30 pointer-events-none" />

            {/* Floating Navbar - disabled for footer pages */}            {/* <FloatingNavbar /> */}

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

            {/* Main Content */}
            <ScrollArea className="flex-1" viewportRef={scrollRef}>
                <main className="relative z-10 container mx-auto py-8 sm:py-12 lg:py-20 px-4 sm:px-6 lg:px-8">
                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="mx-auto max-w-3xl text-center mb-8 sm:mb-16"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="mx-auto mb-4 sm:mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-accent)]/20 to-[var(--brand-primary)]/20"
                        >
                            <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-[var(--brand-accent)]" />
                        </motion.div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-3 sm:mb-4">
                            People who{' '}
                            <span className="bg-gradient-to-r from-[var(--brand-accent)] via-[var(--brand-primary)] to-pink-500 bg-clip-text text-transparent">
                                supported
                            </span>
                        </h1>

                        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                            A heartfelt thank you to everyone who has supported this project.
                        </p>
                    </motion.div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-20 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-accent)]" />
                            <p className="text-sm text-muted-foreground">Loading supporters...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <Card className="max-w-md mx-auto">
                            <CardContent className="pt-6 text-center px-4 sm:px-6">
                                <p className="text-destructive mb-4 text-sm sm:text-base">{error}</p>
                                <Button onClick={() => window.location.reload()} size="sm">
                                    Try Again
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Empty State */}
                    {!loading && !error && supporters.length === 0 && (
                        <Card className="max-w-md mx-auto">
                            <CardContent className="pt-6 text-center px-4 sm:px-6">
                                <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/50 mb-4" />
                                <h3 className="text-base sm:text-lg font-semibold mb-2">No supporters yet</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Be the first to support this project!
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Supporters Grid */}
                    {!loading && !error && supporters.length > 0 && (
                        <div className="space-y-10 sm:space-y-16">
                            {/* Featured supporters Section */}
                            {featuredSupporters.length > 0 && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 mb-4"
                                        >
                                            <span className="text-amber-500 text-lg">★</span>
                                            <span className="text-sm font-medium text-amber-500">Featured supporters</span>
                                        </motion.div>
                                    </div>
                                    <motion.div
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-[1200px] mx-auto"
                                    >
                                        {featuredSupporters.map(supporter => (
                                            <div key={supporter.id} className="w-full flex justify-center">
                                                <div className="w-full max-w-[380px] relative">
                                                    {/* Featured badge */}
                                                    <div className="absolute -top-2 -right-2 z-10">
                                                        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/30">
                                                            <span className="text-sm">★</span>
                                                        </span>
                                                    </div>
                                                    <div className="ring-2 ring-amber-500/30 rounded-2xl">
                                                        <SupporterCard supporter={supporter} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                </div>
                            )}

                            {/* Regular Supporters Section */}
                            {regularSupporters.length > 0 && (
                                <div className="space-y-6">
                                    {featuredSupporters.length > 0 && (
                                        <div className="text-center">
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted border border-border mb-4"
                                            >
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium text-muted-foreground">All Supporters</span>
                                            </motion.div>
                                        </div>
                                    )}
                                    <motion.div
                                        key={currentPage}
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-[1200px] mx-auto"
                                    >
                                        {paginatedSupporters.map(supporter => (
                                            <div key={supporter.id} className="w-full flex justify-center">
                                                <div className="w-full max-w-[380px]">
                                                    <SupporterCard supporter={supporter} />
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-1 sm:gap-2 pt-6 sm:pt-8">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-[var(--brand-accent)]/10 hover:text-[var(--brand-accent)] hover:border-[var(--brand-accent)]/50 disabled:opacity-50"
                                    >
                                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="sr-only">Previous page</span>
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                            // On mobile, show limited page numbers
                                            const showPage = totalPages <= 5 ||
                                                page === 1 ||
                                                page === totalPages ||
                                                Math.abs(page - currentPage) <= 1;

                                            if (!showPage) {
                                                // Show ellipsis for skipped pages
                                                if (page === 2 || page === totalPages - 1) {
                                                    return <span key={page} className="px-1 text-muted-foreground">...</span>;
                                                }
                                                return null;
                                            }

                                            return (
                                                <Button
                                                    key={page}
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="icon"
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm ${
                                                        currentPage === page 
                                                            ? 'bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-white' 
                                                            : 'hover:bg-[var(--brand-accent)]/10 hover:text-[var(--brand-accent)] hover:border-[var(--brand-accent)]/50'
                                                    }`}
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-[var(--brand-accent)]/10 hover:text-[var(--brand-accent)] hover:border-[var(--brand-accent)]/50 disabled:opacity-50"
                                    >
                                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="sr-only">Next page</span>
                                    </Button>
                                </div>
                            )}

                            {/* Page info */}
                            {totalPages > 1 && regularSupporters.length > 0 && (
                                <p className="text-center text-xs sm:text-sm text-muted-foreground">
                                    Showing {startIndex + 1}-{Math.min(endIndex, regularSupporters.length)} of {regularSupporters.length} supporters
                                </p>
                            )}
                        </div>
                    )}

                    {/* CTA Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-12 sm:mt-20 px-2"
                    >
                        <Card className="max-w-2xl mx-auto border-[var(--brand-accent)]/20 bg-gradient-to-br from-[var(--brand-accent)]/5 to-transparent">
                            <CardContent className="p-4 sm:pt-6 sm:p-6 text-center">
                                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight mb-2">
                                    Want to support VulnIQ?
                                </h3>
                                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                                    If you find VulnIQ useful, consider becoming a supporter. You can support the project by writing blogs,
                                    contribute with feedback, testing, or help spread the word.
                                    Have another ideas? Leave a message to explore how you can contribute to the project.
                                </p>
                                <MessageForm />
                            </CardContent>
                        </Card>
                    </motion.div>
                </main>

                {/* Footer */}
                <Footer onScrollToTop={() => {
                    const viewport = scrollRef.current;
                    if (viewport) {
                        // Try smooth scroll first, fallback to immediate
                        try {
                            viewport.scrollTo({ top: 0, behavior: 'smooth' });
                        } catch {
                            viewport.scrollTop = 0;
                        }
                    }
                }} />
            </ScrollArea>
        </div>
    );
}
