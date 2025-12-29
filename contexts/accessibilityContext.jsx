"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

// Default settings
const defaultSettings = {
  fontSize: 100,
  lineHeight: 100,
  letterSpacing: 0,
  wordSpacing: 0,
  fontWeight: false,
  dyslexiaFont: false,
  highlightLinks: false,
  highlightHeadings: false,
  readingGuide: false,
  bigCursor: false,
  stopAnimations: false,
  contrastMode: "none",
  saturation: 100,
  focusIndicator: false,
  textAlign: "default",
  hideFloatingButton: false,
};

const STORAGE_KEY = "vulniq-accessibility-settings";
const POSITION_KEY = "vulniq-accessibility-position";

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [position, setPosition] = useState({ x: 20, y: null, bottom: 20 });
  const [forceHideFloating, setForceHideFloating] = useState(false);

  // Ensure component only renders on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    if (!mounted) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error("Error loading accessibility settings:", e);
      }
    }

    const savedPos = localStorage.getItem(POSITION_KEY);
    if (savedPos) {
      try {
        setPosition(JSON.parse(savedPos));
      } catch (e) {
        console.error("Error loading widget position:", e);
      }
    }
  }, [mounted]);

  // Apply settings
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const body = document.body;

    // Font size
    root.style.setProperty("--a11y-font-scale", settings.fontSize / 100);

    // Line height
    root.style.setProperty("--a11y-line-height", (settings.lineHeight / 100) * 1.6);

    // Letter spacing
    root.style.setProperty("--a11y-letter-spacing", `${settings.letterSpacing}px`);

    // Word spacing
    root.style.setProperty("--a11y-word-spacing", `${settings.wordSpacing}px`);

    // Toggle a11y-scaled class when any font setting differs from default
    const hasScaling = settings.fontSize !== 100 || 
                       settings.lineHeight !== 100 || 
                       settings.letterSpacing !== 0 || 
                       settings.wordSpacing !== 0;
    body.classList.toggle("a11y-scaled", hasScaling);

    // Classes
    body.classList.toggle("a11y-font-weight", settings.fontWeight);
    body.classList.toggle("a11y-dyslexia-font", settings.dyslexiaFont);
    body.classList.toggle("a11y-highlight-links", settings.highlightLinks);
    body.classList.toggle("a11y-highlight-headings", settings.highlightHeadings);
    body.classList.toggle("a11y-reading-guide", settings.readingGuide);
    body.classList.toggle("a11y-big-cursor", settings.bigCursor);
    body.classList.toggle("a11y-stop-animations", settings.stopAnimations);
    body.classList.toggle("a11y-focus-indicator", settings.focusIndicator);

    // Remove all contrast classes first
    body.classList.remove(
      "a11y-contrast-dark",
      "a11y-contrast-light",
      "a11y-contrast-high",
      "a11y-contrast-monochrome"
    );
    if (settings.contrastMode !== "none") {
      body.classList.add(`a11y-contrast-${settings.contrastMode}`);
    }

    // Saturation
    root.style.setProperty("--a11y-saturation", `${settings.saturation}%`);

    // Text alignment
    body.classList.remove("a11y-text-left", "a11y-text-center", "a11y-text-right");
    if (settings.textAlign !== "default") {
      body.classList.add(`a11y-text-${settings.textAlign}`);
    }

    // Save settings
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, mounted]);

  // Reading guide mouse follower
  useEffect(() => {
    if (!mounted || !settings.readingGuide) return;

    const guide = document.createElement("div");
    guide.id = "a11y-reading-guide";
    guide.className = "a11y-guide-element";
    document.body.appendChild(guide);

    const moveGuide = (e) => {
      guide.style.top = `${e.clientY - 20}px`;
    };

    document.addEventListener("mousemove", moveGuide);

    return () => {
      guide.remove();
      document.removeEventListener("mousemove", moveGuide);
    };
  }, [settings.readingGuide, mounted]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    // Keep hideFloatingButton when resetting
    const keepHidden = settings.hideFloatingButton;
    setSettings({ ...defaultSettings, hideFloatingButton: keepHidden });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultSettings, hideFloatingButton: keepHidden }));
  }, [settings.hideFloatingButton]);

  const openPanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleFloatingButton = useCallback((hide) => {
    updateSetting("hideFloatingButton", hide);
  }, [updateSetting]);

  const savePosition = useCallback((newPos) => {
    setPosition(newPos);
    localStorage.setItem(POSITION_KEY, JSON.stringify(newPos));
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        mounted,
        isOpen,
        setIsOpen,
        settings,
        updateSetting,
        resetSettings,
        openPanel,
        closePanel,
        position,
        setPosition,
        savePosition,
        toggleFloatingButton,
        defaultSettings,
        forceHideFloating,
        setForceHideFloating,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}
