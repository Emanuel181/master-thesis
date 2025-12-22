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
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('app-settings', JSON.stringify(settings));
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

