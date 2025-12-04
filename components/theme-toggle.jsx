'use client'

import { useCallback } from "react"
import { useSettings } from "@/contexts/settingsContext"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle({ className = "" }) {
  const { settings, updateSettings } = useSettings()

  const handleThemeToggle = useCallback(() => {
    const newMode = settings.mode === 'dark' ? 'light' : 'dark'
    updateSettings({ ...settings, mode: newMode })
  }, [settings, updateSettings])

  if (!settings) return null

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleThemeToggle}
      className={className}
      aria-label={`Switch to ${settings.mode === 'dark' ? 'light' : 'dark'} mode`}
    >
      {settings.mode === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  )
}

