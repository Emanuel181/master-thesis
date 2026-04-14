"use client"

import { Link } from '@/i18n/navigation'
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ArrowRight, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { AccessibilityButton } from "./accessibility-button"
import { useTranslations } from 'next-intl'

/**
 * NavActions - Right side action buttons (theme, accessibility, auth, mobile menu)
 */
export function NavActions({
    isAuthenticated,
    mobileMenuOpen,
    onToggleMobileMenu,
}) {
    const t = useTranslations('nav')
    return (
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3">
            {/* Tablet: Compact action group (xs to md) */}
            <div className="hidden xs:flex items-center gap-1 bg-muted/30 rounded-xl p-1 border border-border/30 md:!hidden">
                <AccessibilityButton compact />
                <div className="w-px h-5 bg-border/50" />
                <ThemeToggle compact />
            </div>

            {/* Desktop: Full actions (md+) */}
            <div className="hidden md:!flex items-center gap-2">
                <AccessibilityButton />
                <ThemeToggle />
            </div>

            <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden md:flex rounded-full text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 border-accent/50 text-accent hover:bg-muted/10 hover:border-accent"
            >
                <Link href="/demo" aria-label="View Demo">
                    {t('demo')}
                </Link>
            </Button>

            {isAuthenticated ? (
                <Button
                    asChild
                    size="sm"
                    className="rounded-xl md:rounded-full text-[10px] xs:text-xs sm:text-sm px-2 xs:px-3 sm:px-4 md:px-5 h-7 xs:h-8 sm:h-9 touch-target bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                >
                    <Link href="/dashboard" className="flex items-center gap-1 xs:gap-1.5 sm:gap-2" aria-label="Go to Dashboard">
                        <LayoutDashboard className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                        <span className="hidden sm:inline">{t('dashboard')}</span>
                    </Link>
                </Button>
            ) : (
                <Button
                    asChild
                    size="sm"
                    className="rounded-xl md:rounded-full text-[10px] xs:text-xs sm:text-sm px-2 xs:px-3 sm:px-4 md:px-5 h-7 xs:h-8 sm:h-9 touch-target shadow-md shadow-accent/20"
                >
                    <Link href="/login" className="flex items-center gap-1 sm:gap-1.5" aria-label="Get started - Sign in or create an account">
                        <span className="sm:hidden">{t('go')}</span>
                        <span className="hidden sm:inline">{t('getStarted')}</span>
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
                    </Link>
                </Button>
            )}

            {/* Mobile menu button */}
            <motion.div whileTap={{ scale: 0.9 }} className="md:hidden">
                <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl p-1.5 xs:p-2 h-7 w-7 xs:h-8 xs:w-8 touch-target bg-muted/30 hover:bg-muted/50 border border-border/30"
                    onClick={onToggleMobileMenu}
                    aria-label={mobileMenuOpen ? t('closeMenu') : t('openMenu')}
                    aria-expanded={mobileMenuOpen}
                >
                    <AnimatePresence mode="wait">
                        {mobileMenuOpen ? (
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <X className="h-5 w-5" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="menu"
                                initial={{ rotate: 90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: -90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Menu className="h-5 w-5" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Button>
            </motion.div>
        </div>
    )
}
