'use client'

import React, { useCallback } from "react"
import { useSettings, themePresets, scales, radiusOptions } from '@/contexts/settingsContext'
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ThemeCustomization = () => {
  const { settings, updateSettings, resetSettings, mounted } = useSettings()

  const handleThemeChange = useCallback((preset) => {
    updateSettings({ ...settings, themePreset: preset })
  }, [settings, updateSettings])

  const handleScaleChange = useCallback((scale) => {
    updateSettings({ ...settings, scale })
  }, [settings, updateSettings])

  const handleRadiusChange = useCallback((radius) => {
    updateSettings({ ...settings, radius })
  }, [settings, updateSettings])

  const handleModeChange = useCallback((mode) => {
    updateSettings({ ...settings, mode })
  }, [settings, updateSettings])

  const handleLayoutChange = useCallback((layout) => {
    updateSettings({ ...settings, contentLayout: layout })
  }, [settings, updateSettings])

  const handleSidebarChange = useCallback((sidebar) => {
    updateSettings({ ...settings, sidebarMode: sidebar })
  }, [settings, updateSettings])

  if (!mounted) {
    return null
  }

  const currentPreset = themePresets[settings.themePreset] || themePresets.default

  return (
    <div className="space-y-3">
      {/* Theme Preset Dropdown */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Theme preset:</Label>
        <Select value={settings.themePreset} onValueChange={handleThemeChange}>
          <SelectTrigger className="w-full h-8 text-xs">
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: settings.mode === 'dark' ? currentPreset.dark.primary : currentPreset.light.primary
                }}
              />
              <SelectValue placeholder="Select theme" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(themePresets).map(([key, preset]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: settings.mode === 'dark' ? preset.dark.primary : preset.light.primary
                    }}
                  />
                  <span>{preset.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scale */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Scale:</Label>
        <div className="grid grid-cols-5 gap-1.5">
          {Object.keys(scales).map((key) => (
            <button
              key={key}
              onClick={() => handleScaleChange(key)}
              className={`rounded-md border px-2 py-1.5 text-xs font-medium uppercase transition-all hover:bg-accent ${
                settings.scale === key ? 'border-primary bg-accent' : 'border-border'
              }`}
            >
              {key === 'md' ? (
                <div className="flex items-center justify-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 2L8 14M2 8L14 8" />
                  </svg>
                </div>
              ) : (
                key
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Radius */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Radius:</Label>
        <div className="grid grid-cols-5 gap-1.5">
          {Object.keys(radiusOptions).map((key) => (
            <button
              key={key}
              onClick={() => handleRadiusChange(key)}
              className={`rounded-md border px-2 py-1.5 text-xs font-medium uppercase transition-all hover:bg-accent ${
                settings.radius === key ? 'border-primary bg-accent' : 'border-border'
              }`}
              style={settings.radius === key ? { borderRadius: radiusOptions[key] } : {}}
            >
              {key === 'none' ? (
                <div className="flex items-center justify-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 2L8 14M2 8L14 8" />
                  </svg>
                </div>
              ) : (
                key
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Color Mode */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Color mode:</Label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleModeChange('light')}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:bg-accent ${
              settings.mode === 'light' ? 'border-primary bg-accent' : 'border-border'
            }`}
          >
            Light
          </button>
          <button
            onClick={() => handleModeChange('dark')}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:bg-accent ${
              settings.mode === 'dark' ? 'border-primary bg-accent' : 'border-border'
            }`}
          >
            Dark
          </button>
        </div>
      </div>

      {/* Content Layout */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Content layout:</Label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleLayoutChange('full')}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:bg-accent ${
              settings.contentLayout === 'full' ? 'border-primary bg-accent' : 'border-border'
            }`}
          >
            Full
          </button>
          <button
            onClick={() => handleLayoutChange('centered')}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:bg-accent ${
              settings.contentLayout === 'centered' ? 'border-primary bg-accent' : 'border-border'
            }`}
          >
            Centered
          </button>
        </div>
      </div>

      {/* Sidebar Mode */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Sidebar mode:</Label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleSidebarChange('default')}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:bg-accent ${
              settings.sidebarMode === 'default' ? 'border-primary bg-accent' : 'border-border'
            }`}
          >
            Default
          </button>
          <button
            onClick={() => handleSidebarChange('icon')}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:bg-accent ${
              settings.sidebarMode === 'icon' ? 'border-primary bg-accent' : 'border-border'
            }`}
          >
            Icon
          </button>
        </div>
      </div>

      {/* Reset Button */}
      <Button
        onClick={resetSettings}
        variant="destructive"
        size="sm"
        className="w-full"
      >
        Reset to Default
      </Button>
    </div>
  )
}

export default ThemeCustomization

