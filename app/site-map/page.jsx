'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, ExternalLink, Map, PersonStanding } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Footer } from "@/components/landing-page/footer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRef } from "react";
import { useAccessibility } from "@/contexts/accessibilityContext";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";

const BASE_URL = 'https://vulniq.org';

const sitemapData = [
    { url: '', name: 'Home', priority: 1.00, changefreq: 'weekly', lastModified: '2024-12-29' },
    { url: '/login', name: 'Login', priority: 0.80, changefreq: 'monthly', lastModified: '2024-12-29' },
    { url: '/changelog', name: 'Changelog', priority: 0.80, changefreq: 'weekly', lastModified: '2024-12-29' },
    { url: '/privacy', name: 'Privacy Policy', priority: 0.80, changefreq: 'yearly', lastModified: '2024-12-29' },
    { url: '/terms', name: 'Terms & Conditions', priority: 0.80, changefreq: 'yearly', lastModified: '2024-12-29' },
    { url: '/about', name: 'About', priority: 0.64, changefreq: 'monthly', lastModified: '2024-12-29' },
];

function getPriorityColor(priority) {
    if (priority >= 0.8) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (priority >= 0.5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
}

function getChangefreqLabel(freq) {
    const labels = {
        'always': 'Always',
        'hourly': 'Hourly',
        'daily': 'Daily',
        'weekly': 'Weekly',
        'monthly': 'Monthly',
        'yearly': 'Yearly',
        'never': 'Never',
    };
    return labels[freq] || freq;
}

export default function SitemapPage() {
    const scrollRef = useRef(null);
    const { openPanel } = useAccessibility();
    
    // Restore scroll position when returning to this page
    useScrollRestoration(scrollRef);
    
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const lastUpdated = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden font-sans selection:bg-[var(--brand-accent)]/20">
            {/* Background effects */}
            <div className="fixed inset-0 mesh-gradient pointer-events-none opacity-50" />
            <div className="fixed inset-0 dots-pattern opacity-30 pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 font-semibold text-xl group">
                            <Image src="/web-app-manifest-512x512.png" alt="Logo" className="w-8 h-8 rounded-lg" width={32} height={32} />
                            <span className="font-bold text-foreground tracking-tight">VulnIQ</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Button variant="ghost" size="sm" asChild className="hover:bg-[var(--brand-accent)]/10 hover:text-[var(--brand-accent)]">
                            <Link href="/">
                                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Back to Home</span>
                            </Link>
                        </Button>
                        <button
                            onClick={openPanel}
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--brand-accent)]/10 hover:bg-[var(--brand-accent)]/20 border border-[var(--brand-accent)]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2"
                            aria-label="Open Accessibility Menu"
                            title="Accessibility Options"
                        >
                            <PersonStanding className="w-5 h-5 text-[var(--brand-accent)]" strokeWidth={2} />
                        </button>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <ScrollArea className="flex-1" viewportRef={scrollRef}>
                <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-4xl mx-auto"
                    >
                        {/* Title Section */}
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--brand-accent)]/10 mb-6 ring-1 ring-[var(--brand-accent)]/20">
                                <Map className="w-8 h-8 text-[var(--brand-accent)]" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                                XML Sitemap
                            </h1>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                This sitemap helps search engines like Google crawl and index pages on this website.
                                Learn more about <a href="https://www.sitemaps.org/" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-accent)] hover:underline">XML Sitemaps</a>.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mb-8">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-foreground">{sitemapData.length}</div>
                                <div className="text-sm text-muted-foreground">Total URLs</div>
                            </div>
                            <div className="hidden sm:block w-px h-8 bg-border" />
                            <div className="text-center">
                                <div className="text-sm sm:text-lg font-bold text-foreground">{lastUpdated}</div>
                                <div className="text-sm text-muted-foreground">Last Updated</div>
                            </div>
                        </div>

                        {/* XML Download Link */}
                        <div className="flex justify-center mb-8">
                            <Button variant="outline" size="sm" asChild>
                                <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Raw XML
                                </a>
                            </Button>
                        </div>

                        {/* Sitemap Table */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="w-full border border-border rounded-xl overflow-hidden bg-card"
                        >
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead className="pl-4 sm:pl-6 whitespace-nowrap">URL</TableHead>
                                        <TableHead className="text-center whitespace-nowrap">Priority</TableHead>
                                        <TableHead className="text-center whitespace-nowrap">Frequency</TableHead>
                                        <TableHead className="text-center whitespace-nowrap">Modified</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sitemapData.map((page) => (
                                        <TableRow key={page.url || 'home'} className="odd:bg-muted/50">
                                            <TableCell className="pl-4 sm:pl-6 font-medium whitespace-nowrap">
                                                <a 
                                                    href={`${BASE_URL}${page.url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[var(--brand-accent)] hover:underline text-sm"
                                                >
                                                    {BASE_URL}{page.url || '/'}
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-center whitespace-nowrap">
                                                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${getPriorityColor(page.priority)}`}>
                                                    {page.priority.toFixed(2)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center text-muted-foreground whitespace-nowrap">
                                                {getChangefreqLabel(page.changefreq)}
                                            </TableCell>
                                            <TableCell className="text-center text-muted-foreground whitespace-nowrap">
                                                {page.lastModified}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </motion.div>

                        {/* Legend */}
                        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap justify-center items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-500"></span>
                                <span className="text-muted-foreground">High (≥0.8)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-yellow-500"></span>
                                <span className="text-muted-foreground">Medium (≥0.5)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-gray-400"></span>
                                <span className="text-muted-foreground">Low (&lt;0.5)</span>
                            </div>
                        </div>
                    </motion.div>
                </main>

                <Footer onScrollToTop={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} />
            </ScrollArea>
        </div>
    );
}
