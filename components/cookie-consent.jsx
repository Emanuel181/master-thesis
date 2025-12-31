"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Cookie, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const CONSENT_STORAGE_KEY = 'vulniq_cookie_consent';
const CONSENT_VERSION = '1.0'; // Increment when consent requirements change

/**
 * GDPR Cookie Consent Banner
 * ==========================
 * 
 * Implements EU GDPR and ePrivacy Directive requirements:
 * - Explicit opt-in for non-essential cookies
 * - Clear explanation of cookie purposes
 * - Easy withdrawal of consent
 * - Consent is stored with version for re-consent on policy changes
 */
export function CookieConsentBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [consent, setConsent] = useState({
        essential: true, // Always required, cannot be disabled
        analytics: false,
        marketing: false,
    });

    useEffect(() => {
        // Check if consent has been given
        try {
            const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Check if consent version matches
                if (parsed.version === CONSENT_VERSION) {
                    setConsent(parsed.consent);
                    return; // Consent already given for current version
                }
            }
            // Show banner if no consent or outdated version
            setIsVisible(true);
        } catch {
            setIsVisible(true);
        }
    }, []);

    const saveConsent = (consentData) => {
        try {
            localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
                version: CONSENT_VERSION,
                consent: consentData,
                timestamp: new Date().toISOString(),
            }));
        } catch (error) {
            console.warn('Failed to save cookie consent:', error);
        }
    };

    const handleAcceptAll = () => {
        const fullConsent = {
            essential: true,
            analytics: true,
            marketing: true,
        };
        setConsent(fullConsent);
        saveConsent(fullConsent);
        setIsVisible(false);
    };

    const handleAcceptEssential = () => {
        const essentialOnly = {
            essential: true,
            analytics: false,
            marketing: false,
        };
        setConsent(essentialOnly);
        saveConsent(essentialOnly);
        setIsVisible(false);
    };

    const handleSavePreferences = () => {
        saveConsent(consent);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div 
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
            role="dialog"
            aria-labelledby="cookie-consent-title"
            aria-describedby="cookie-consent-description"
        >
            <Card className="mx-auto max-w-4xl border-border bg-card/95 dark:bg-card/90 backdrop-blur-lg shadow-2xl dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-start gap-4">
                        <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-accent)]/10 dark:bg-[var(--brand-accent)]/20">
                            <Cookie className="h-6 w-6 text-[var(--brand-accent)]" />
                        </div>
                        
                        <div className="flex-1 space-y-4">
                            <div>
                                <h2 
                                    id="cookie-consent-title" 
                                    className="text-lg font-semibold flex items-center gap-2 text-foreground"
                                >
                                    <Cookie className="h-5 w-5 md:hidden text-[var(--brand-accent)]" />
                                    Cookie Preferences
                                </h2>
                                <p 
                                    id="cookie-consent-description"
                                    className="text-sm text-muted-foreground mt-1"
                                >
                                    We use cookies to enhance your experience. Essential cookies are required for the site to function. 
                                    You can choose which optional cookies to allow.
                                </p>
                            </div>

                            {showDetails && (
                                <div className="space-y-3 border-t border-border pt-4">
                                    {/* Essential Cookies */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-[var(--brand-accent)]" />
                                                <span className="font-medium text-sm text-foreground">Essential Cookies</span>
                                                <span className="text-xs bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] px-2 py-0.5 rounded font-medium">Required</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Required for authentication, security, and basic site functionality.
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={true}
                                            disabled
                                            className="h-4 w-4 accent-[var(--brand-accent)]"
                                            aria-label="Essential cookies (required)"
                                        />
                                    </div>

                                    {/* Analytics Cookies */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm text-foreground">Analytics Cookies</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Help us understand how visitors interact with our site to improve it.
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={consent.analytics}
                                            onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                                            className="h-4 w-4 cursor-pointer accent-[var(--brand-accent)]"
                                            aria-label="Analytics cookies"
                                        />
                                    </div>

                                    {/* Marketing Cookies */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm text-foreground">Marketing Cookies</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Used to deliver relevant advertisements and track campaign effectiveness.
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={consent.marketing}
                                            onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                                            className="h-4 w-4 cursor-pointer accent-[var(--brand-accent)]"
                                            aria-label="Marketing cookies"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                {showDetails ? (
                                    <>
                                        <Button
                                            onClick={handleSavePreferences}
                                            className="flex-1 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-[var(--brand-primary)] font-medium"
                                        >
                                            Save Preferences
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowDetails(false)}
                                            className="flex-1 border-border hover:bg-accent"
                                        >
                                            Back
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleAcceptAll}
                                            className="flex-1 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90 text-[var(--brand-primary)] font-medium"
                                        >
                                            Accept All
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleAcceptEssential}
                                            className="flex-1 border-border hover:bg-accent"
                                        >
                                            Essential Only
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowDetails(true)}
                                            className="flex-1 text-muted-foreground hover:text-foreground hover:bg-accent"
                                        >
                                            Customize
                                        </Button>
                                    </>
                                )}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                By continuing to use this site, you agree to our{' '}
                                <a href="/privacy" className="underline hover:text-[var(--brand-accent)] transition-colors">
                                    Privacy Policy
                                </a>
                                {' '}and{' '}
                                <a href="/terms" className="underline hover:text-[var(--brand-accent)] transition-colors">
                                    Terms of Service
                                </a>.
                            </p>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleAcceptEssential}
                            className="hidden md:flex text-muted-foreground hover:text-foreground hover:bg-accent"
                            aria-label="Close cookie banner"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Hook to check cookie consent status
 * Use this to conditionally load analytics/marketing scripts
 */
export function useCookieConsent() {
    const [consent, setConsent] = useState({
        essential: true,
        analytics: false,
        marketing: false,
        loaded: false,
    });

    useEffect(() => {
        try {
            const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.version === CONSENT_VERSION) {
                    setConsent({ ...parsed.consent, loaded: true });
                    return;
                }
            }
        } catch {
            // Ignore errors
        }
        setConsent(prev => ({ ...prev, loaded: true }));
    }, []);

    return consent;
}

/**
 * Reset cookie consent (for settings page)
 */
export function resetCookieConsent() {
    try {
        localStorage.removeItem(CONSENT_STORAGE_KEY);
        window.location.reload();
    } catch {
        // Ignore errors
    }
}

export default CookieConsentBanner;
