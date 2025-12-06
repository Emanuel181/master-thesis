"use client";

import { useCallback, useEffect, useState } from "react";
import { useSettings } from "@/contexts/settingsContext";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className = "" }) {
  const { settings, updateSettings } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // avoid hydration mismatch: mark mounted on next tick
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleThemeToggle = useCallback(() => {
    if (!settings) return;
    const newMode = settings.mode === "dark" ? "light" : "dark";
    // keep app settings in sync (persist & applySettings)
    updateSettings({ ...settings, mode: newMode });
  }, [settings, updateSettings]);

  if (!mounted || !settings) {
    return null;
  }

  const currentMode = settings.mode;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleThemeToggle}
      className={className}
      aria-label={`Switch to ${currentMode === "dark" ? "light" : "dark"} mode`}
    >
      {currentMode === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
