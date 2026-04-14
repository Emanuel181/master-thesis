"use client"

import { Link } from '@/i18n/navigation'
import { motion, AnimatePresence } from "framer-motion"
import {
    Sparkles, Zap, Shield, GitBranch, Rss, FileCode, Heart, Rocket, BookOpen,
    Building2, MessageSquare, LayoutDashboard, ArrowRight, ExternalLink
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { AccessibilityButton } from "./accessibility-button"
import { useTranslations } from 'next-intl'

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
    const t = useTranslations('nav')
    return (
        <div className="mb-4">
            <div className="text-[11px] font-bold text-accent uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                {t('product')}
            </div>
            <div className="grid grid-cols-3 gap-2">
                <MotionLink
                    href="/#features"
                    onClick={onClose}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/20 hover:border-accent/40 transition-all"
                >
                    <Zap className="w-5 h-5 text-accent mb-1.5" />
                    <span className="text-xs font-medium text-foreground">{t('productItems.features.label')}</span>
                </MotionLink>
                <MotionLink
                    href="/#use-cases"
                    onClick={onClose}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/20 hover:border-accent/40 transition-all"
                >
                    <Shield className="w-5 h-5 text-accent mb-1.5" />
                    <span className="text-xs font-medium text-foreground">{t('productItems.useCases.label')}</span>
                </MotionLink>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/20">
                    <GitBranch className="w-5 h-5 text-accent mb-1.5" />
                    <span className="text-xs font-medium text-foreground">{t('productItems.integrations.label')}</span>
                </div>
            </div>
        </div>
    )
}

function ResourcesSection({ onClose }) {
    const t = useTranslations('nav')
    const internalItems = [
        { href: "/blog", icon: Rss, title: t('resourceItems.blog.label'), subtitle: t('resourceItems.blog.description') },
        { href: "/changelog", icon: FileCode, title: t('resourceItems.changelog.label'), subtitle: t('resourceItems.changelog.description') },
        { href: "/supporters", icon: Heart, title: t('resourceItems.supporters.label'), subtitle: t('resourceItems.supporters.description') },
    ]
    
    const externalItems = [
        { href: "https://www.producthunt.com/posts/vulniq", icon: Rocket, title: t('resourceItems.productHunt.label') },
        { href: "https://github.com/vulniq/vulniq", icon: BookOpen, title: "Documentation" },
    ]

    return (
        <div className="mb-4">
            <div className="text-[11px] font-bold text-accent uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                <Rss className="w-3 h-3" />
                {t('resources')}
            </div>
            <div className="space-y-1">
                {internalItems.map((item) => (
                    <MotionLink
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-all duration-150 group select-none"
                    >
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-muted/20 transition-colors">
                            <item.icon className="w-4 h-4 text-accent" />
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
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-all duration-150 group select-none"
                    >
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-muted/20 transition-colors">
                            <item.icon className="w-4 h-4 text-accent" />
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
    const t = useTranslations('nav')
    const items = [
        { href: "/about", icon: Building2, label: t('companyItems.about.label') },
        { href: "/security", icon: Shield, label: t('companyItems.security.label') },
        { href: "/#connect", icon: MessageSquare, label: t('companyItems.contact.label') },
    ]

    return (
        <div className="pt-3 border-t border-border/30">
            <div className="text-[11px] font-bold text-accent uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                <Building2 className="w-3 h-3" />
                {t('company')}
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
    const t = useTranslations('nav')
    return (
        <div className="border-t border-border/40 p-3 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 space-y-2">
            <div className="flex items-center justify-center gap-1 bg-muted/30 rounded-xl p-1 border border-border/30">
                <AccessibilityButton compact />
                <div className="w-px h-5 bg-border/50" />
                <ThemeToggle compact />
            </div>
            <div className="flex gap-2">
            <MotionLink
                href="/demo"
                onClick={onClose}
                whileTap={{ scale: 0.95 }}
                className="flex-1 px-4 py-3 text-sm font-medium text-center text-accent border border-accent/40 rounded-xl hover:bg-muted/10 transition-colors flex items-center justify-center gap-2"
            >
                <Sparkles className="w-4 h-4" />
                {t('resourceItems.tryDemo.label')}
            </MotionLink>
            <MotionLink
                href={isAuthenticated ? "/dashboard" : "/login"}
                onClick={onClose}
                whileTap={{ scale: 0.95 }}
                className="flex-1 px-4 py-3 text-sm font-medium text-center text-primary-foreground bg-gradient-to-r from-primary/80 to-primary rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
                {isAuthenticated ? (
                    <>
                        <LayoutDashboard className="w-4 h-4" />
                        {t('dashboard')}
                    </>
                ) : (
                    <>
                        {t('getStarted')}
                        <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </MotionLink>
            </div>
        </div>
    )
}
