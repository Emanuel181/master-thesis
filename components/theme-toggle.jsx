"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useSettings } from "@/contexts/settingsContext";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { flushSync } from "react-dom";

export function ThemeToggle({ className = "", duration = 400, compact = false }) {
  const { settings, updateSettings } = useSettings();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    // avoid hydration mismatch: mark mounted on next tick
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleThemeToggle = useCallback(async () => {
    if (!settings || !buttonRef.current) return;
    
    const newMode = settings.mode === "dark" ? "light" : "dark";
    
    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      // Fallback for browsers without View Transitions API
      updateSettings({ ...settings, mode: newMode });
      return;
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        updateSettings({ ...settings, mode: newMode });
      });
    }).ready;

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  }, [settings, updateSettings, duration]);

  if (!mounted || !settings) {
    return null;
  }

  const currentMode = settings.mode;

  return (
    <Button
      ref={buttonRef}
      variant={compact ? "ghost" : "outline"}
      size="icon"
      onClick={handleThemeToggle}
      className={cn(
        className,
        "text-[var(--brand-primary)] dark:text-[var(--brand-light)] hover:bg-[var(--brand-accent)]/10 hover:text-[var(--brand-accent)] transition-all duration-300",
        compact
          ? "h-7 w-7 border-0"
          : "hover:border-[var(--brand-accent)]/50"
      )}
      aria-label={`Switch to ${currentMode === "dark" ? "light" : "dark"} mode`}
    >
      {currentMode === "dark" ? (
        <Sun className={compact ? "h-4 w-4" : "h-5 w-5"} />
      ) : (
        <Moon className={compact ? "h-4 w-4" : "h-5 w-5"} />
      )}
    </Button>
  );
}
