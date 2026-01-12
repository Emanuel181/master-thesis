"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
    Sparkles, Zap, Shield, GitBranch, Rss, FileCode, Heart, Rocket, BookOpen,
    Building2, MessageSquare, LayoutDashboard, ArrowRight, ExternalLink
} from "lucide-react"

// Motion-enabled Link component for internal navigation
const MotionLink = motion.create(Link)

/**
 * MobileMenu - Mobile navigation dropdown menu
 */
export function MobileMenu({ isOpen, onClose, isAuthenticated }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="fixed top-16 xs:top-18 sm:top-20 inset-x-0 z-[99] flex justify-center px-3 sm:px-4 md:hidden"
                >
                    <div className="bg-card/98 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Scrollable content */}
                        <div className="max-h-[65vh] overflow-y-auto p-4">
                            {/* Product Section */}
                            <ProductSection onClose={onClose} />

                            {/* Resources Section */}
                            <ResourcesSection onClose={onClose} />

                            {/* Company Section */}
                            <CompanySection onClose={onClose} />
                        </div>

                        {/* Fixed bottom actions */}
                        <BottomActions onClose={onClose} isAuthenticated={isAuthenticated} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function ProductSection({ onClose }) {
    return (
        <div className="mb-4">
            <div className="text-[11px] font-bold text-[var(--brand-accent)] uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Product
            </div>
            <div className="grid grid-cols-3 gap-2">
                <MotionLink
                    href="/#features"
                    onClick={onClose}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-[var(--brand-accent)]/10 to-[var(--brand-primary)]/5 border border-[var(--brand-accent)]/20 hover:border-[var(--brand-accent)]/40 transition-all"
                >
                    <Zap className="w-5 h-5 text-[var(--brand-accent)] mb-1.5" />
                    <span className="text-xs font-medium text-foreground">Features</span>
                </MotionLink>
                <MotionLink
                    href="/#use-cases"
                    onClick={onClose}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-[var(--brand-accent)]/10 to-[var(--brand-primary)]/5 border border-[var(--brand-accent)]/20 hover:border-[var(--brand-accent)]/40 transition-all"
                >
                    <Shield className="w-5 h-5 text-[var(--brand-accent)] mb-1.5" />
                    <span className="text-xs font-medium text-foreground">Use cases</span>
                </MotionLink>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-[var(--brand-accent)]/10 to-[var(--brand-primary)]/5 border border-[var(--brand-accent)]/20">
                    <GitBranch className="w-5 h-5 text-[var(--brand-accent)] mb-1.5" />
                    <span className="text-xs font-medium text-foreground">Integrations</span>
                </div>
            </div>
        </div>
    )
}

function ResourcesSection({ onClose }) {
    const internalItems = [
        { href: "/blog", icon: Rss, title: "Blog", subtitle: "Security insights" },
        { href: "/changelog", icon: FileCode, title: "Changelog", subtitle: "Latest updates" },
        { href: "/supporters", icon: Heart, title: "Supporters", subtitle: "Our community" },
    ]
    
    const externalItems = [
        { href: "https://www.producthunt.com/posts/vulniq", icon: Rocket, title: "Product Hunt" },
        { href: "https://github.com/vulniq/vulniq", icon: BookOpen, title: "Documentation" },
    ]

    return (
        <div className="mb-4">
            <div className="text-[11px] font-bold text-[var(--brand-accent)] uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                <Rss className="w-3 h-3" />
                Resources
            </div>
            <div className="space-y-1">
                {internalItems.map((item) => (
                    <MotionLink
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-[var(--brand-accent)]/10 flex items-center justify-center group-hover:bg-[var(--brand-accent)]/20 transition-colors">
                            <item.icon className="w-4 h-4 text-[var(--brand-accent)]" />
                        </div>
                        <div>
                            <span className="text-sm font-medium text-foreground">{item.title}</span>
                            {item.subtitle && (
                                <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
                            )}
                        </div>
                    </MotionLink>
                ))}
                {externalItems.map((item) => (
                    <motion.a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-[var(--brand-accent)]/10 flex items-center justify-center group-hover:bg-[var(--brand-accent)]/20 transition-colors">
                            <item.icon className="w-4 h-4 text-[var(--brand-accent)]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-medium text-foreground">{item.title}</span>
                                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            </div>
                        </div>
                    </motion.a>
                ))}
            </div>
        </div>
    )
}

function CompanySection({ onClose }) {
    const items = [
        { href: "/about", icon: Building2, label: "About" },
        { href: "/security", icon: Shield, label: "Security" },
        { href: "/#connect", icon: MessageSquare, label: "Contact" },
    ]

    return (
        <div className="pt-3 border-t border-border/30">
            <div className="text-[11px] font-bold text-[var(--brand-accent)] uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                <Building2 className="w-3 h-3" />
                Company
            </div>
            <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                    <MotionLink
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-muted/50 hover:bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <item.icon className="w-3.5 h-3.5" />
                        {item.label}
                    </MotionLink>
                ))}
            </div>
        </div>
    )
}

function BottomActions({ onClose, isAuthenticated }) {
    return (
        <div className="border-t border-border/40 p-3 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 flex gap-2">
            <MotionLink
                href="/demo"
                onClick={onClose}
                whileTap={{ scale: 0.95 }}
                className="flex-1 px-4 py-3 text-sm font-medium text-center text-[var(--brand-accent)] border border-[var(--brand-accent)]/40 rounded-xl hover:bg-[var(--brand-accent)]/10 transition-colors flex items-center justify-center gap-2"
            >
                <Sparkles className="w-4 h-4" />
                Try demo
            </MotionLink>
            <MotionLink
                href={isAuthenticated ? "/dashboard" : "/login"}
                onClick={onClose}
                whileTap={{ scale: 0.95 }}
                className="flex-1 px-4 py-3 text-sm font-medium text-center text-white bg-gradient-to-r from-[var(--brand-accent)] to-[var(--brand-primary)] rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-[var(--brand-accent)]/20"
            >
                {isAuthenticated ? (
                    <>
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </>
                ) : (
                    <>
                        Get started
                        <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </MotionLink>
        </div>
    )
}
