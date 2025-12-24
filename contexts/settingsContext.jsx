'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

// Import configuration from extracted modules
import {
  themePresets,
  editorThemes,
  editorFonts,
  editorFontSizes,
  syntaxColorPresets,
  syntaxTokenTypes,
  scales,
  radiusOptions,
} from './config';

// Re-export configuration for backwards compatibility
export {
  themePresets,
  editorThemes,
  editorFonts,
  editorFontSizes,
  syntaxColorPresets,
  syntaxTokenTypes,
  scales,
  radiusOptions,
};

// Default syntax colors
const defaultSyntaxColors = {
  dark: { ...syntaxColorPresets.default.dark },
  light: { ...syntaxColorPresets.default.light },
};

const defaultSettings = {
  mode: 'light',
  themePreset: 'default',
  scale: 'md',
  radius: 'md',
  contentLayout: 'full',
  sidebarMode: 'default',
  // Editor settings
  editorTheme: 'default-dark',
  editorFont: 'fira-code',
  editorFontSize: 'md',
  editorLigatures: true,
  editorMinimap: true,
  // Syntax highlighting colors
  syntaxColorPreset: 'default',
  customSyntaxColors: defaultSyntaxColors,
};

const SettingsContext = createContext(undefined);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let parsedSettings = null;
    try {
      const savedSettings = localStorage.getItem('app-settings');
      if (savedSettings) {
        try {
          parsedSettings = JSON.parse(savedSettings);
        } catch (e) {
          console.error('Failed to parse settings:', e);
        }
      }
    } catch (e) {
      // localStorage not available (SSR, private browsing, etc.)
      console.warn('localStorage not available:', e);
    }

    if (parsedSettings) {
      // Avoid synchronous setState in effect body (lint rule).
      queueMicrotask(() => {
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      });
    }

    // Avoid synchronous setState in effect body (lint rule).
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem('app-settings', JSON.stringify(settings));
      } catch (e) {
        // localStorage write failed (quota exceeded, private browsing, etc.)
        console.warn('Failed to save settings to localStorage:', e);
      }
      applySettings(settings);
    }
  }, [settings, mounted]);

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, mounted }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

function applySettings(settings) {
  const root = document.documentElement;
  const preset = themePresets[settings.themePreset] || themePresets.default;
  const colors = settings.mode === 'dark' ? preset.dark : preset.light;

  // Apply theme colors
  if (colors.primary) {
    root.style.setProperty('--primary', colors.primary);
  }
  if (colors.background) {
    root.style.setProperty('--background', colors.background);
  }

  // Apply scale
  const scaleValue = scales[settings.scale] || 1;
  root.style.setProperty('--scale', scaleValue);
  root.style.fontSize = `${scaleValue * 16}px`;

  // Apply radius
  const radiusValue = radiusOptions[settings.radius] || '0.5rem';
  root.style.setProperty('--radius', radiusValue);

  // Apply dark class
  if (settings.mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export default SettingsContext;
