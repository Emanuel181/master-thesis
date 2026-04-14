"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const CONSENT_STORAGE_KEY = 'vulniq_cookie_consent';
const CONSENT_VERSION = '1.0';

// Cookie providers for advanced view
const COOKIE_PROVIDERS = {
    essential: [
        { company: 'VulnIQ', domain: 'vulniq.org' },
        { company: 'NextAuth.js', domain: 'vulniq.org' },
        { company: 'Cloudflare', domain: 'cloudflare.com' },
    ],
    analytics: [
        { company: 'Google Tag Manager', domain: 'googletagmanager.com' },
        { company: 'Google Analytics', domain: 'google-analytics.com' },
        { company: 'Cloudflare Insights', domain: 'cloudflareinsights.com' },
    ],
    marketing: [
        { company: 'Google Ads', domain: 'googleads.g.doubleclick.net' },
    ],
};

// Slider levels: each level includes all categories up to that point
const SLIDER_LEVELS = [
    { key: 'essential', categories: ['essential'] },
    { key: 'analytics', categories: ['essential', 'analytics'] },
    { key: 'marketing', categories: ['essential', 'analytics', 'marketing'] },
];

function consentFromLevel(level) {
    const cats = SLIDER_LEVELS[level].categories;
    return {
        essential: true,
        analytics: cats.includes('analytics'),
        marketing: cats.includes('marketing'),
    };
}

function levelFromConsent(consent) {
    if (consent.marketing) return 2;
    if (consent.analytics) return 1;
    return 0;
}

// ── Basic Settings View ──────────────────────────────────────────────
function BasicSettingsView({ consent, onConsentChange, onSubmit, onAdvanced, onCancel, t }) {
    const level = levelFromConsent(consent);

    const handleSliderClick = (newLevel) => {
        onConsentChange(consentFromLevel(newLevel));
    };

    // Build allowed/disallowed functionality lists
    const allowed = [t('functionality.secureAuth')];
    const disallowed = [];

    // Essential always allowed
    allowed.push(t('functionality.sessionState'));

    if (consent.analytics) {
        allowed.push(t('functionality.rememberAuth'));
        allowed.push(t('functionality.retainCart'));
        allowed.push(t('functionality.siteConsistency'));
    } else {
        disallowed.push(t('functionality.rememberAuth'));
        disallowed.push(t('functionality.retainCart'));
        disallowed.push(t('functionality.siteConsistency'));
    }

    if (consent.marketing) {
        allowed.push(t('functionality.socialSharing'));
        allowed.push(t('functionality.postComments'));
        allowed.push(t('functionality.targetedAds'));
    } else {
        disallowed.push(t('functionality.socialSharing'));
        disallowed.push(t('functionality.postComments'));
        disallowed.push(t('functionality.targetedAds'));
    }

    return (
        <>
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {t('basicDescription')}
                </p>

                <div className="border border-border rounded-xl p-4 sm:p-5">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left: Vertical slider with category labels */}
                        <div className="flex-shrink-0">
                            <div className="flex items-start gap-3">
                                {/* Slider track */}
                                <div className="flex flex-col items-center pt-1">
                                    {SLIDER_LEVELS.map((sl, i) => (
                                        <div key={sl.key} className="flex flex-col items-center">
                                            <button
                                                type="button"
                                                onClick={() => handleSliderClick(i)}
                                                className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
                                                    i <= level
                                                        ? 'border-primary bg-primary'
                                                        : 'border-muted-foreground/40 bg-card hover:border-muted-foreground/60'
                                                }`}
                                                aria-label={t(`${sl.key}.label`)}
                                            >
                                                {i <= level && (
                                                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                                                )}
                                            </button>
                                            {i < SLIDER_LEVELS.length - 1 && (
                                                <div className={`w-0.5 h-10 transition-colors ${
                                                    i < level ? 'bg-primary' : 'bg-border'
                                                }`} />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Category labels */}
                                <div className="flex flex-col">
                                    {SLIDER_LEVELS.map((sl, i) => (
                                        <button
                                            key={sl.key}
                                            type="button"
                                            onClick={() => handleSliderClick(i)}
                                            className="text-left"
                                            style={{ height: i < SLIDER_LEVELS.length - 1 ? '60px' : 'auto' }}
                                        >
                                            <span className={`text-sm font-medium block ${
                                                i <= level ? 'text-foreground' : 'text-muted-foreground'
                                            }`}>
                                                {t(`${sl.key}.label`)}
                                            </span>
                                            <span className="text-xs text-muted-foreground line-clamp-2">
                                                {t(`${sl.key}.shortDesc`)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Allowed / Disallowed lists */}
                        <div className="flex-1 min-w-0 space-y-4">
                            {allowed.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-1.5">
                                        {t('allowedFunctionality')}
                                    </h4>
                                    <ul className="space-y-0.5">
                                        {allowed.map((item, i) => (
                                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                                <span className="text-muted-foreground/60 mt-px">–</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {disallowed.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-1.5">
                                        {t('disallowedFunctionality')}
                                    </h4>
                                    <ul className="space-y-0.5">
                                        {disallowed.map((item, i) => (
                                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                                <span className="text-muted-foreground/60 mt-px">–</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 px-5 sm:px-6 py-4 border-t border-border">
                <Button variant="ghost" size="sm" onClick={onCancel} className="w-full sm:w-auto">
                    {t('cancel')}
                </Button>
                <Button variant="outline" size="sm" onClick={onAdvanced} className="w-full sm:w-auto">
                    {t('advancedSettings')}
                </Button>
                <Button size="sm" onClick={onSubmit} className="w-full sm:w-auto">
                    {t('submitPreferences')}
                </Button>
            </div>
        </>
    );
}

// ── Advanced Settings View ───────────────────────────────────────────
function AdvancedCategorySection({ categoryKey, label, description, providers, enabled, onToggle, alwaysOn }) {
    const [expanded, setExpanded] = useState(false);
    const t = useTranslations('cookie');

    return (
        <div className="border border-border rounded-xl overflow-hidden">
            {/* Category header */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
                    </div>
                    {alwaysOn ? (
                        <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 bg-muted rounded shrink-0 mt-0.5">
                            {t('alwaysActive')}
                        </span>
                    ) : (
                        <Switch
                            checked={enabled}
                            onCheckedChange={onToggle}
                            className="shrink-0 mt-0.5"
                        />
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-accent hover:underline mt-2 flex items-center gap-1"
                >
                    {expanded ? t('hideCookies') : t('showCookies')}
                    {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
            </div>

            {/* Expandable provider table */}
            {expanded && (
                <div className="border-t border-border">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-left font-medium text-muted-foreground px-4 py-2">{t('providerCompany')}</th>
                                <th className="text-left font-medium text-muted-foreground px-4 py-2">{t('providerDomain')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {providers.map((p, i) => (
                                <tr key={i} className="border-b border-border last:border-0">
                                    <td className="px-4 py-2 text-foreground">{p.company}</td>
                                    <td className="px-4 py-2 text-muted-foreground">{p.domain}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function AdvancedSettingsView({ consent, onConsentChange, onSubmit, onBasic, onCancel, t }) {
    return (
        <>
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {t('basicDescription')}
                </p>

                <div className="space-y-3">
                    <AdvancedCategorySection
                        categoryKey="essential"
                        label={t('essential.label')}
                        description={t('essential.description')}
                        providers={COOKIE_PROVIDERS.essential}
                        enabled={true}
                        alwaysOn
                    />
                    <AdvancedCategorySection
                        categoryKey="analytics"
                        label={t('analytics.label')}
                        description={t('analytics.description')}
                        providers={COOKIE_PROVIDERS.analytics}
                        enabled={consent.analytics}
                        onToggle={(v) => onConsentChange({ ...consent, analytics: v })}
                    />
                    <AdvancedCategorySection
                        categoryKey="marketing"
                        label={t('marketing.label')}
                        description={t('marketing.description')}
                        providers={COOKIE_PROVIDERS.marketing}
                        enabled={consent.marketing}
                        onToggle={(v) => onConsentChange({ ...consent, marketing: v })}
                    />
                </div>
            </div>

            {/* Footer buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 px-5 sm:px-6 py-4 border-t border-border">
                <Button variant="ghost" size="sm" onClick={onCancel} className="w-full sm:w-auto">
                    {t('cancel')}
                </Button>
                <Button variant="outline" size="sm" onClick={onBasic} className="w-full sm:w-auto">
                    {t('basicSettings')}
                </Button>
                <Button size="sm" onClick={onSubmit} className="w-full sm:w-auto">
                    {t('submitPreferences')}
                </Button>
            </div>
        </>
    );
}

// ── Main Component ───────────────────────────────────────────────────
export function CookieConsentBanner() {
    const t = useTranslations('cookie');
    const [isVisible, setIsVisible] = useState(false);
    const [view, setView] = useState('basic'); // 'basic' | 'advanced'
    const [consent, setConsent] = useState({
        essential: true,
        analytics: false,
        marketing: false,
    });

    const saveConsent = useCallback((consentData) => {
        try {
            localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
                version: CONSENT_VERSION,
                consent: consentData,
                timestamp: new Date().toISOString(),
            }));
            window.dispatchEvent(new CustomEvent('cookie-consent-updated', {
                detail: consentData,
            }));
        } catch (error) {
            console.warn('Failed to save cookie consent:', error);
        }
    }, []);

    const handleSubmit = useCallback(() => {
        saveConsent(consent);
        setIsVisible(false);
        setView('basic');
    }, [consent, saveConsent]);

    const handleCancel = useCallback(() => {
        setIsVisible(false);
        setView('basic');
    }, []);

    // Check localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.version === CONSENT_VERSION) {
                    setConsent(parsed.consent);
                    return;
                }
            }
            setIsVisible(true);
        } catch {
            setIsVisible(true);
        }
    }, []);

    // Listen for footer "Manage Cookies" event
    useEffect(() => {
        const handleOpenEvent = () => {
            try {
                const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.version === CONSENT_VERSION) {
                        setConsent(parsed.consent);
                    }
                }
            } catch {}
            setView('basic');
            setIsVisible(true);
        };
        window.addEventListener('open-cookie-preferences', handleOpenEvent);
        return () => window.removeEventListener('open-cookie-preferences', handleOpenEvent);
    }, []);

    // Body scroll lock (preserves scroll position)
    useEffect(() => {
        if (isVisible) {
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            return () => {
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.left = '';
                document.body.style.right = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [isVisible]);

    // Escape key
    useEffect(() => {
        if (!isVisible) return;
        const handleEscape = (e) => {
            if (e.key === 'Escape') handleCancel();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isVisible, handleCancel]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleCancel}
                aria-hidden="true"
            />

            {/* Modal container */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div
                    role="dialog"
                    aria-labelledby="cookie-title"
                    className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3">
                        <h2 id="cookie-title" className="text-lg font-semibold text-foreground">
                            {t('title')}
                        </h2>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-muted"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* View content */}
                    {view === 'basic' ? (
                        <BasicSettingsView
                            consent={consent}
                            onConsentChange={setConsent}
                            onSubmit={handleSubmit}
                            onAdvanced={() => setView('advanced')}
                            onCancel={handleCancel}
                            t={t}
                        />
                    ) : (
                        <AdvancedSettingsView
                            consent={consent}
                            onConsentChange={setConsent}
                            onSubmit={handleSubmit}
                            onBasic={() => setView('basic')}
                            onCancel={handleCancel}
                            t={t}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Hook to check cookie consent status
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
        } catch {}
        setConsent(prev => ({ ...prev, loaded: true }));
    }, []);

    useEffect(() => {
        const handleUpdate = (e) => {
            if (e.detail) {
                setConsent({ ...e.detail, loaded: true });
            }
        };
        window.addEventListener('cookie-consent-updated', handleUpdate);
        return () => window.removeEventListener('cookie-consent-updated', handleUpdate);
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
    } catch {}
}

export default CookieConsentBanner;
