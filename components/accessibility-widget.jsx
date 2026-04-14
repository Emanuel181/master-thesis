"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAccessibility } from "@/contexts/accessibilityContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslations } from 'next-intl';
import {
  Accessibility,
  RotateCcw,
  X,
  PersonStanding,
  Contrast,
  Play,
  Pause,
  BookOpen,
  EyeOff,
  Eye,
  Link2,
  Type,
  Space,
  AlignLeft,
  MousePointer2,
  Layers,
  AlignVerticalJustifyStart,
  Droplets,
  Languages,
  ImageOff,
  MessageSquare,
  ChevronRight,
  List,
  Landmark,
  ExternalLink,
} from "lucide-react";

// ── Feature tile definitions ───────────────────────────────────────────────

const FEATURES = [
  {
    id: "contrastMode",
    label: "Smart Contrast",
    icon: Contrast,
    type: "toggle-value",
    onValue: "high",
    offValue: "none",
    getValue: (s) => s.contrastMode === "high",
    apply: (s, on) => ({ ...s, contrastMode: on ? "high" : "none" }),
  },
  {
    id: "stopAnimations",
    label: "Stop Animations",
    icon: Pause,
    type: "toggle",
    getValue: (s) => s.stopAnimations,
    apply: (s, on) => ({ ...s, stopAnimations: on }),
  },
  {
    id: "dyslexiaFont",
    label: "Dyslexia Friendly",
    icon: BookOpen,
    type: "toggle",
    getValue: (s) => s.dyslexiaFont,
    apply: (s, on) => ({ ...s, dyslexiaFont: on }),
  },
  {
    id: "invertColors",
    label: "Invert Colors",
    icon: Eye,
    type: "toggle",
    getValue: (s) => s.invertColors,
    apply: (s, on) => ({ ...s, invertColors: on }),
  },
  {
    id: "highlightLinks",
    label: "Highlight Links",
    icon: Link2,
    type: "toggle",
    getValue: (s) => s.highlightLinks,
    apply: (s, on) => ({ ...s, highlightLinks: on }),
  },
  {
    id: "fontSize",
    label: "Bigger Text",
    icon: Type,
    type: "toggle",
    getValue: (s) => s.fontSize > 100,
    apply: (s, on) => ({ ...s, fontSize: on ? 130 : 100 }),
  },
  {
    id: "letterSpacing",
    label: "Light Spacing",
    icon: Space,
    type: "toggle",
    getValue: (s) => s.letterSpacing > 0 || s.wordSpacing > 0,
    apply: (s, on) => ({ ...s, letterSpacing: on ? 3 : 0, wordSpacing: on ? 6 : 0 }),
  },
  {
    id: "hideImages",
    label: "Hide Images",
    icon: ImageOff,
    type: "toggle",
    getValue: (s) => s.hideImages,
    apply: (s, on) => ({ ...s, hideImages: on }),
  },
  {
    id: "bigCursor",
    label: "Big Cursor",
    icon: MousePointer2,
    type: "toggle",
    getValue: (s) => s.bigCursor,
    apply: (s, on) => ({ ...s, bigCursor: on }),
  },
  {
    id: "tooltips",
    label: "Tooltips",
    icon: MessageSquare,
    type: "toggle",
    getValue: (s) => s.tooltips,
    apply: (s, on) => ({ ...s, tooltips: on }),
  },
  {
    id: "pageStructure",
    label: "Page Structure",
    icon: Layers,
    type: "action",
  },
  {
    id: "lineHeight",
    label: "Line Height",
    icon: AlignVerticalJustifyStart,
    type: "toggle",
    getValue: (s) => s.lineHeight > 100,
    apply: (s, on) => ({ ...s, lineHeight: on ? 150 : 100 }),
  },
  {
    id: "textAlign",
    label: "Align Left",
    icon: AlignLeft,
    type: "toggle",
    getValue: (s) => s.textAlign === "left",
    apply: (s, on) => ({ ...s, textAlign: on ? "left" : "default" }),
  },
  {
    id: "saturation",
    label: "Low Saturation",
    icon: Droplets,
    type: "toggle",
    getValue: (s) => s.saturation < 100,
    apply: (s, on) => ({ ...s, saturation: on ? 30 : 100 }),
  },
  {
    id: "readingGuide",
    label: "Reading Guide",
    icon: BookOpen,
    type: "toggle",
    getValue: (s) => s.readingGuide,
    apply: (s, on) => ({ ...s, readingGuide: on }),
  },
  {
    id: "focusIndicator",
    label: "Focus Indicator",
    icon: Eye,
    type: "toggle",
    getValue: (s) => s.focusIndicator,
    apply: (s, on) => ({ ...s, focusIndicator: on }),
  },
];

// ── Page Structure scanner ─────────────────────────────────────────────────

function usePageStructure(active) {
  const [headings, setHeadings] = useState([]);
  const [landmarks, setLandmarks] = useState([]);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    if (!active) return;

    // Headings
    const headingEls = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).filter(
      (el) => !el.closest("[data-a11y-widget]")
    );
    setHeadings(
      headingEls.map((el, i) => ({
        id: i,
        level: el.tagName,
        text: el.textContent.trim().slice(0, 80),
        el,
      }))
    );

    // Landmarks
    const landmarkSelectors = "main,nav,header,footer,aside,section[aria-label],section[aria-labelledby],[role='main'],[role='navigation'],[role='banner'],[role='contentinfo'],[role='complementary'],[role='search']";
    const landmarkEls = Array.from(document.querySelectorAll(landmarkSelectors)).filter(
      (el) => !el.closest("[data-a11y-widget]")
    );
    setLandmarks(
      landmarkEls.map((el, i) => ({
        id: i,
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute("role") || el.tagName.toLowerCase(),
        label: el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.tagName.toLowerCase(),
        el,
      }))
    );

    // Links
    const linkEls = Array.from(document.querySelectorAll("a[href]")).filter(
      (el) => !el.closest("[data-a11y-widget]") && el.textContent.trim()
    );
    setLinks(
      linkEls.slice(0, 60).map((el, i) => ({
        id: i,
        text: el.textContent.trim().slice(0, 60),
        href: el.getAttribute("href"),
        el,
      }))
    );
  }, [active]);

  return { headings, landmarks, links };
}

function scrollTo(el) {
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.focus?.({ preventScroll: true });
  el.style.outline = "3px solid hsl(var(--primary))";
  setTimeout(() => { el.style.outline = ""; }, 2000);
}

function PageStructurePanel({ onClose }) {
  const t = useTranslations('accessibility');
  const { headings, landmarks, links } = usePageStructure(true);

  return (
    <div
      data-a11y-widget
      className="fixed top-0 left-[22rem] h-full w-[22rem] bg-background border-r border-border shadow-2xl flex flex-col z-[2147483647]"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold">{t('features.pageStructure')}</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="headings" className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 pt-3 pb-1 shrink-0">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="headings" className="text-xs">
              <List className="w-3 h-3 mr-1" />{t('structure.headings')}
            </TabsTrigger>
            <TabsTrigger value="landmarks" className="text-xs">
              <Landmark className="w-3 h-3 mr-1" />{t('structure.landmarks')}
            </TabsTrigger>
            <TabsTrigger value="links" className="text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />{t('structure.links')}
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <TabsContent value="headings" className="mt-0 px-4 pb-4 space-y-1">
            {headings.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">{t('structure.noHeadings')}</p>
            ) : (
              headings.map((h) => {
                const lvl = parseInt(h.level[1]);
                return (
                  <button
                    key={h.id}
                    onClick={() => scrollTo(h.el)}
                    className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                    style={{ paddingLeft: `${(lvl - 1) * 12 + 8}px` }}
                  >
                    <span className="shrink-0 inline-flex items-center justify-center h-5 w-8 rounded text-[10px] font-bold bg-primary/10 text-primary">
                      {h.level}
                    </span>
                    <span className="text-xs truncate">{h.text || t('structure.noText')}</span>
                  </button>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="landmarks" className="mt-0 px-4 pb-4 space-y-1">
            {landmarks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">{t('structure.noLandmarks')}</p>
            ) : (
              landmarks.map((lm) => (
                <button
                  key={lm.id}
                  onClick={() => scrollTo(lm.el)}
                  className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <span className="shrink-0 inline-flex items-center justify-center h-5 px-1.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">
                    {lm.role}
                  </span>
                  <span className="text-xs truncate text-muted-foreground">{lm.label}</span>
                </button>
              ))
            )}
          </TabsContent>

          <TabsContent value="links" className="mt-0 px-4 pb-4 space-y-1">
            {links.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">{t('structure.noLinks')}</p>
            ) : (
              links.map((lk) => (
                <button
                  key={lk.id}
                  onClick={() => scrollTo(lk.el)}
                  className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground" />
                  <span className="text-xs truncate">{lk.text}</span>
                </button>
              ))
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

// ── Feature tile ───────────────────────────────────────────────────────────

// Map feature IDs to translation keys
const FEATURE_LABEL_KEYS = {
  contrastMode: 'features.smartContrast',
  stopAnimations: 'features.stopAnimations',
  dyslexiaFont: 'features.dyslexiaFriendly',
  invertColors: 'features.invertColors',
  highlightLinks: 'features.highlightLinks',
  fontSize: 'features.biggerText',
  letterSpacing: 'features.lightSpacing',
  hideImages: 'features.hideImages',
  bigCursor: 'features.bigCursor',
  tooltips: 'features.tooltips',
  pageStructure: 'features.pageStructure',
  lineHeight: 'features.lineHeight',
  textAlign: 'features.alignLeft',
  saturation: 'features.lowSaturation',
  readingGuide: 'features.readingGuide',
  focusIndicator: 'features.focusIndicator',
};

function FeatureTile({ feature, settings, onToggle, onAction }) {
  const t = useTranslations('accessibility');
  const Icon = feature.icon;
  const active = feature.type !== "action" && feature.getValue?.(settings);
  const translatedLabel = FEATURE_LABEL_KEYS[feature.id] ? t(FEATURE_LABEL_KEYS[feature.id]) : feature.label;

  return (
    <button
      onClick={() => {
        if (feature.type === "action") onAction(feature.id);
        else onToggle(feature);
      }}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-150 text-center",
        "hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary/8 text-primary"
          : "border-border/60 bg-muted/20 text-foreground"
      )}
    >
      {/* Active checkmark */}
      {active && (
        <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-primary">
          <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
      {feature.type === "action" && (
        <span className="absolute top-1.5 right-1.5">
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </span>
      )}
      <Icon className="w-6 h-6" strokeWidth={1.5} />
      <span className="text-[11px] font-medium leading-tight">{translatedLabel}</span>
    </button>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────

export function AccessibilityWidget() {
  const t = useTranslations('accessibility');
  const {
    mounted,
    isOpen,
    setIsOpen,
    settings,
    setSettings: _setSettings,
    updateSetting,
    resetSettings,
    position,
    setPosition,
    savePosition,
    forceHideFloating,
  } = useAccessibility();

  const isMobile = useIsMobile();
  const [isDragging, setIsDragging] = useState(false);
  const [pageStructureOpen, setPageStructureOpen] = useState(false);
  const buttonRef = useRef(null);
  const hasMoved = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) initialPos.current = { x: rect.left, y: rect.top };

    const handleMouseMove = (e) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (!hasMoved.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) hasMoved.current = true;
      if (hasMoved.current) {
        setPosition({
          x: Math.max(0, Math.min(initialPos.current.x + dx, window.innerWidth - 60)),
          y: Math.max(0, Math.min(initialPos.current.y + dy, window.innerHeight - 60)),
          bottom: null,
        });
      }
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      setIsDragging(false);
      if (hasMoved.current) {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) savePosition({ x: rect.left, y: rect.top, bottom: null });
      }
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [setPosition, savePosition]);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    hasMoved.current = false;
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) initialPos.current = { x: rect.left, y: rect.top };
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;
    if (!hasMoved.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) hasMoved.current = true;
    if (hasMoved.current) {
      e.preventDefault();
      setPosition({
        x: Math.max(0, Math.min(initialPos.current.x + dx, window.innerWidth - 60)),
        y: Math.max(0, Math.min(initialPos.current.y + dy, window.innerHeight - 60)),
        bottom: null,
      });
    }
  }, [isDragging, setPosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (hasMoved.current) {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) savePosition({ x: rect.left, y: rect.top, bottom: null });
    }
  }, [savePosition]);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    button.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => button.removeEventListener("touchmove", handleTouchMove);
  }, [handleTouchMove]);

  const handleClick = useCallback((e) => {
    if (hasMoved.current) {
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => { hasMoved.current = false; }, 0);
      return;
    }
    setIsOpen(true);
  }, [setIsOpen]);

  const handleToggle = useCallback((feature) => {
    const current = feature.getValue(settings);
    const next = feature.apply(settings, !current);
    // Apply each changed key
    Object.entries(next).forEach(([k, v]) => {
      if (settings[k] !== v) updateSetting(k, v);
    });
  }, [settings, updateSetting]);

  const handleAction = useCallback((id) => {
    if (id === "pageStructure") setPageStructureOpen((p) => !p);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPageStructureOpen(false);
  }, [setIsOpen]);

  const buttonStyle =
    position.y !== null
      ? { left: position.x, top: position.y }
      : { left: position.x, bottom: position.bottom };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Floating Button */}
      {!settings.hideFloatingButton && !forceHideFloating && !isMobile && (
        <button
          ref={buttonRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
          className={cn(
            "fixed w-12 h-12 rounded-xl overflow-hidden",
            "shadow-lg border border-border/50 bg-background",
            !isDragging && "hover:shadow-xl hover:bg-muted transition-all duration-200",
            "cursor-grab active:cursor-grabbing",
            "flex items-center justify-center",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "touch-none"
          )}
          style={{ ...buttonStyle, zIndex: 2147483647 }}
          aria-label={t('dragToMove')}
        >
          <PersonStanding className="w-5 h-5 text-foreground" strokeWidth={2} />
        </button>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          style={{ zIndex: 2147483646 }}
          onClick={handleClose}
        />
      )}

      {/* Main Sidebar */}
      <div
        data-a11y-widget
        className={cn(
          "fixed top-0 left-0 h-full w-[22rem] bg-background border-r border-border shadow-2xl flex flex-col",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ zIndex: 2147483647 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
              <Accessibility className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">{t('widgetTitle')}</h2>
              <p className="text-[11px] text-muted-foreground">{t('customizeExperience')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetSettings}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('resetAll')}</TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Feature grid */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 grid grid-cols-3 gap-2">
            {FEATURES.map((f) => (
              <FeatureTile
                key={f.id}
                feature={f}
                settings={settings}
                onToggle={handleToggle}
                onAction={handleAction}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="shrink-0 px-4 py-2.5 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-8 gap-2"
            onClick={resetSettings}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('resetAllButton')}
          </Button>
        </div>
      </div>

      {/* Page Structure sub-panel */}
      {isOpen && pageStructureOpen && (
        <PageStructurePanel onClose={() => setPageStructureOpen(false)} />
      )}
    </>,
    document.body
  );
}

// Navbar Accessibility Button
export function AccessibilityNavButton({ className }) {
  const t = useTranslations('accessibility');
  const { openPanel } = useAccessibility();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={openPanel}
          className={className}
          aria-label={t('openMenu')}
        >
          <PersonStanding className="h-5 w-5" strokeWidth={2} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('accessibilityOptions')}</TooltipContent>
    </Tooltip>
  );
}
