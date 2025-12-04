'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export const themePresets = {
  'sunset-glow': {
    name: 'Sunset Glow',
    light: {
      primary: 'oklch(0.58 0.24 25)',
      background: 'oklch(0.98 0.01 85)',
    },
    dark: {
      primary: 'oklch(0.68 0.20 25)',
      background: 'oklch(0.15 0.01 285)',
    },
  },
  'ocean-breeze': {
    name: 'Ocean Breeze',
    light: {
      primary: 'oklch(0.58 0.18 220)',
      background: 'oklch(0.98 0.01 220)',
    },
    dark: {
      primary: 'oklch(0.68 0.16 220)',
      background: 'oklch(0.15 0.01 220)',
    },
  },
  'forest-mist': {
    name: 'Forest Mist',
    light: {
      primary: 'oklch(0.55 0.20 155)',
      background: 'oklch(0.98 0.01 155)',
    },
    dark: {
      primary: 'oklch(0.65 0.18 155)',
      background: 'oklch(0.15 0.01 155)',
    },
  },
  'lavender-dream': {
    name: 'Lavender Dream',
    light: {
      primary: 'oklch(0.60 0.18 290)',
      background: 'oklch(0.98 0.01 290)',
    },
    dark: {
      primary: 'oklch(0.70 0.16 290)',
      background: 'oklch(0.15 0.01 290)',
    },
  },
  'default': {
    name: 'Default',
    light: {
      primary: 'oklch(0.242 0.015 286)',
      background: 'oklch(1 0 0)',
    },
    dark: {
      primary: 'oklch(0.831 0.012 286)',
      background: 'oklch(0.145 0.007 286)',
    },
  },
}

export const scales = {
  xs: 0.875,
  sm: 0.95,
  md: 1,
  lg: 1.05,
  xl: 1.1,
}

export const radiusOptions = {
  none: '0rem',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
}

const defaultSettings = {
  mode: 'light',
  themePreset: 'default',
  scale: 'md',
  radius: 'md',
  contentLayout: 'full',
  sidebarMode: 'default',
}

const SettingsContext = createContext(undefined)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedSettings = localStorage.getItem('app-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error('Failed to parse settings:', e)
      }
    }
    setMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('app-settings', JSON.stringify(settings))
      applySettings(settings)
    }
  }, [settings, mounted])

  const updateSettings = (newSettings) => {
    setSettings(newSettings)
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, mounted }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

function applySettings(settings) {
  const root = document.documentElement
  const preset = themePresets[settings.themePreset] || themePresets.default
  const colors = settings.mode === 'dark' ? preset.dark : preset.light

  // Apply theme colors
  if (colors.primary) {
    root.style.setProperty('--primary', colors.primary)
  }
  if (colors.background) {
    root.style.setProperty('--background', colors.background)
  }

  // Apply scale
  const scaleValue = scales[settings.scale] || 1
  root.style.setProperty('--scale', scaleValue)
  root.style.fontSize = `${scaleValue * 16}px`

  // Apply radius
  const radiusValue = radiusOptions[settings.radius] || '0.5rem'
  root.style.setProperty('--radius', radiusValue)

  // Apply dark class
  if (settings.mode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export default SettingsContext

