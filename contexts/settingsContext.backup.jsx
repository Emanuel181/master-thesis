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

// Editor themes inspired by VS Code and JetBrains
export const editorThemes = {
  'default-dark': {
    name: 'Default Dark',
    base: 'vs-dark',
    colors: {
      background: '#171717',
      foreground: '#E5E7EB',
      lineHighlight: '#262626',
      lineNumber: '#6B7280',
      lineNumberActive: '#A78BFA',
    },
    rules: [
      { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C084FC', fontStyle: 'bold' },
      { token: 'string', foreground: '6EE7B7' },
      { token: 'number', foreground: 'FCD34D' },
      { token: 'type', foreground: '60A5FA' },
      { token: 'function', foreground: 'A78BFA' },
      { token: 'variable', foreground: 'E5E7EB' },
      { token: 'operator', foreground: 'F472B6' },
      { token: 'delimiter', foreground: 'D1D5DB' },
    ],
  },
  'vs-dark': {
    name: 'Dark+ (VS Code)',
    base: 'vs-dark',
    colors: {
      background: '#1E1E1E',
      foreground: '#D4D4D4',
      lineHighlight: '#2A2A2A',
      lineNumber: '#858585',
      lineNumberActive: '#C6C6C6',
    },
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'operator', foreground: 'D4D4D4' },
      { token: 'delimiter', foreground: 'D4D4D4' },
    ],
  },
  'one-dark': {
    name: 'One Dark Pro',
    base: 'vs-dark',
    colors: {
      background: '#282C34',
      foreground: '#ABB2BF',
      lineHighlight: '#2C313A',
      lineNumber: '#495162',
      lineNumberActive: '#ABB2BF',
    },
    rules: [
      { token: 'comment', foreground: '5C6370', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C678DD', fontStyle: 'bold' },
      { token: 'string', foreground: '98C379' },
      { token: 'number', foreground: 'D19A66' },
      { token: 'type', foreground: 'E5C07B' },
      { token: 'function', foreground: '61AFEF' },
      { token: 'variable', foreground: 'E06C75' },
      { token: 'operator', foreground: '56B6C2' },
      { token: 'delimiter', foreground: 'ABB2BF' },
    ],
  },
  'dracula': {
    name: 'Dracula',
    base: 'vs-dark',
    colors: {
      background: '#282A36',
      foreground: '#F8F8F2',
      lineHighlight: '#44475A',
      lineNumber: '#6272A4',
      lineNumberActive: '#F8F8F2',
    },
    rules: [
      { token: 'comment', foreground: '6272A4', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FF79C6', fontStyle: 'bold' },
      { token: 'string', foreground: 'F1FA8C' },
      { token: 'number', foreground: 'BD93F9' },
      { token: 'type', foreground: '8BE9FD' },
      { token: 'function', foreground: '50FA7B' },
      { token: 'variable', foreground: 'F8F8F2' },
      { token: 'operator', foreground: 'FF79C6' },
      { token: 'delimiter', foreground: 'F8F8F2' },
    ],
  },
  'github-dark': {
    name: 'GitHub Dark',
    base: 'vs-dark',
    colors: {
      background: '#0D1117',
      foreground: '#C9D1D9',
      lineHighlight: '#161B22',
      lineNumber: '#484F58',
      lineNumberActive: '#C9D1D9',
    },
    rules: [
      { token: 'comment', foreground: '8B949E', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FF7B72', fontStyle: 'bold' },
      { token: 'string', foreground: 'A5D6FF' },
      { token: 'number', foreground: '79C0FF' },
      { token: 'type', foreground: 'FFA657' },
      { token: 'function', foreground: 'D2A8FF' },
      { token: 'variable', foreground: 'FFA657' },
      { token: 'operator', foreground: 'FF7B72' },
      { token: 'delimiter', foreground: 'C9D1D9' },
    ],
  },
  'monokai': {
    name: 'Monokai',
    base: 'vs-dark',
    colors: {
      background: '#272822',
      foreground: '#F8F8F2',
      lineHighlight: '#3E3D32',
      lineNumber: '#90908A',
      lineNumberActive: '#F8F8F2',
    },
    rules: [
      { token: 'comment', foreground: '75715E', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'F92672', fontStyle: 'bold' },
      { token: 'string', foreground: 'E6DB74' },
      { token: 'number', foreground: 'AE81FF' },
      { token: 'type', foreground: '66D9EF' },
      { token: 'function', foreground: 'A6E22E' },
      { token: 'variable', foreground: 'F8F8F2' },
      { token: 'operator', foreground: 'F92672' },
      { token: 'delimiter', foreground: 'F8F8F2' },
    ],
  },
  'jetbrains-dark': {
    name: 'JetBrains Darcula',
    base: 'vs-dark',
    colors: {
      background: '#2B2B2B',
      foreground: '#A9B7C6',
      lineHighlight: '#323232',
      lineNumber: '#606366',
      lineNumberActive: '#A4A3A3',
    },
    rules: [
      { token: 'comment', foreground: '808080', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'CC7832', fontStyle: 'bold' },
      { token: 'string', foreground: '6A8759' },
      { token: 'number', foreground: '6897BB' },
      { token: 'type', foreground: 'FFC66D' },
      { token: 'function', foreground: 'FFC66D' },
      { token: 'variable', foreground: 'A9B7C6' },
      { token: 'operator', foreground: 'A9B7C6' },
      { token: 'delimiter', foreground: 'A9B7C6' },
    ],
  },
  'default-light': {
    name: 'Default Light',
    base: 'vs',
    colors: {
      background: '#FFFFFF',
      foreground: '#1F2937',
      lineHighlight: '#F5F5F5',
      lineNumber: '#6B7280',
      lineNumberActive: '#7C3AED',
    },
    rules: [
      { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7C3AED', fontStyle: 'bold' },
      { token: 'string', foreground: '059669' },
      { token: 'number', foreground: 'D97706' },
      { token: 'type', foreground: '2563EB' },
      { token: 'function', foreground: '7C3AED' },
      { token: 'variable', foreground: '1F2937' },
      { token: 'operator', foreground: 'DB2777' },
      { token: 'delimiter', foreground: '4B5563' },
    ],
  },
  'vs-light': {
    name: 'Light+ (VS Code)',
    base: 'vs',
    colors: {
      background: '#FFFFFF',
      foreground: '#000000',
      lineHighlight: '#F5F5F5',
      lineNumber: '#237893',
      lineNumberActive: '#000000',
    },
    rules: [
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },
      { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
      { token: 'string', foreground: 'A31515' },
      { token: 'number', foreground: '098658' },
      { token: 'type', foreground: '267F99' },
      { token: 'function', foreground: '795E26' },
      { token: 'variable', foreground: '001080' },
      { token: 'operator', foreground: '000000' },
      { token: 'delimiter', foreground: '000000' },
    ],
  },
  'github-light': {
    name: 'GitHub Light',
    base: 'vs',
    colors: {
      background: '#FFFFFF',
      foreground: '#24292F',
      lineHighlight: '#F6F8FA',
      lineNumber: '#57606A',
      lineNumberActive: '#24292F',
    },
    rules: [
      { token: 'comment', foreground: '6E7781', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'CF222E', fontStyle: 'bold' },
      { token: 'string', foreground: '0A3069' },
      { token: 'number', foreground: '0550AE' },
      { token: 'type', foreground: '953800' },
      { token: 'function', foreground: '8250DF' },
      { token: 'variable', foreground: '953800' },
      { token: 'operator', foreground: 'CF222E' },
      { token: 'delimiter', foreground: '24292F' },
    ],
  },
  'solarized-light': {
    name: 'Solarized Light',
    base: 'vs',
    colors: {
      background: '#FDF6E3',
      foreground: '#657B83',
      lineHighlight: '#EEE8D5',
      lineNumber: '#93A1A1',
      lineNumberActive: '#657B83',
    },
    rules: [
      { token: 'comment', foreground: '93A1A1', fontStyle: 'italic' },
      { token: 'keyword', foreground: '859900', fontStyle: 'bold' },
      { token: 'string', foreground: '2AA198' },
      { token: 'number', foreground: 'D33682' },
      { token: 'type', foreground: 'B58900' },
      { token: 'function', foreground: '268BD2' },
      { token: 'variable', foreground: '657B83' },
      { token: 'operator', foreground: '859900' },
      { token: 'delimiter', foreground: '657B83' },
    ],
  },
}

// Popular programming fonts
export const editorFonts = {
  'fira-code': {
    name: 'Fira Code',
    family: '"Fira Code", "Fira Mono", monospace',
    ligatures: true,
  },
  'jetbrains-mono': {
    name: 'JetBrains Mono',
    family: '"JetBrains Mono", monospace',
    ligatures: true,
  },
  'source-code-pro': {
    name: 'Source Code Pro',
    family: '"Source Code Pro", monospace',
    ligatures: false,
  },
  'cascadia-code': {
    name: 'Cascadia Code',
    family: '"Cascadia Code", "Cascadia Mono", monospace',
    ligatures: true,
  },
  'sf-mono': {
    name: 'SF Mono',
    family: '"SF Mono", Monaco, monospace',
    ligatures: false,
  },
  'consolas': {
    name: 'Consolas',
    family: 'Consolas, "Courier New", monospace',
    ligatures: false,
  },
  'ibm-plex-mono': {
    name: 'IBM Plex Mono',
    family: '"IBM Plex Mono", monospace',
    ligatures: false,
  },
  'roboto-mono': {
    name: 'Roboto Mono',
    family: '"Roboto Mono", monospace',
    ligatures: false,
  },
}

// Editor font sizes
export const editorFontSizes = {
  xs: { name: 'Extra Small', size: 12 },
  sm: { name: 'Small', size: 14 },
  md: { name: 'Medium', size: 16 },
  lg: { name: 'Large', size: 18 },
  xl: { name: 'Extra Large', size: 20 },
}

// Syntax highlighting color presets
export const syntaxColorPresets = {
  'default': {
    name: 'Default',
    dark: {
      comment: '6B7280',
      keyword: 'C084FC',
      string: '6EE7B7',
      number: 'FCD34D',
      type: '60A5FA',
      function: 'A78BFA',
      variable: 'E5E7EB',
      operator: 'F472B6',
    },
    light: {
      comment: '6B7280',
      keyword: '7C3AED',
      string: '059669',
      number: 'D97706',
      type: '2563EB',
      function: '7C3AED',
      variable: '1F2937',
      operator: 'DB2777',
    },
  },
  'ocean': {
    name: 'Ocean',
    dark: {
      comment: '546E7A',
      keyword: '89DDFF',
      string: 'C3E88D',
      number: 'F78C6C',
      type: 'FFCB6B',
      function: '82AAFF',
      variable: 'EEFFFF',
      operator: '89DDFF',
    },
    light: {
      comment: '546E7A',
      keyword: '6182B8',
      string: '91B859',
      number: 'F76D47',
      type: 'E2931D',
      function: '6182B8',
      variable: '37474F',
      operator: '39ADB5',
    },
  },
  'sunset': {
    name: 'Sunset',
    dark: {
      comment: '8B8B8B',
      keyword: 'FF6B6B',
      string: 'FFE66D',
      number: 'FF8E72',
      type: '4ECDC4',
      function: 'C792EA',
      variable: 'F8F8F2',
      operator: 'FF6B6B',
    },
    light: {
      comment: '8B8B8B',
      keyword: 'D63031',
      string: 'FDCB6E',
      number: 'E17055',
      type: '00B894',
      function: '6C5CE7',
      variable: '2D3436',
      operator: 'D63031',
    },
  },
  'forest': {
    name: 'Forest',
    dark: {
      comment: '608B4E',
      keyword: '4EC9B0',
      string: 'CE9178',
      number: 'B5CEA8',
      type: '4FC1FF',
      function: 'DCDCAA',
      variable: '9CDCFE',
      operator: 'D4D4D4',
    },
    light: {
      comment: '008000',
      keyword: '008080',
      string: 'A31515',
      number: '098658',
      type: '267F99',
      function: '795E26',
      variable: '001080',
      operator: '000000',
    },
  },
  'neon': {
    name: 'Neon',
    dark: {
      comment: '6272A4',
      keyword: 'FF79C6',
      string: 'F1FA8C',
      number: 'BD93F9',
      type: '8BE9FD',
      function: '50FA7B',
      variable: 'F8F8F2',
      operator: 'FF79C6',
    },
    light: {
      comment: '6272A4',
      keyword: 'DB2777',
      string: 'CA8A04',
      number: '7C3AED',
      type: '0891B2',
      function: '16A34A',
      variable: '1F2937',
      operator: 'DB2777',
    },
  },
}

// Token types for syntax highlighting
export const syntaxTokenTypes = [
  { key: 'keyword', label: 'Keywords', example: 'const, function, if' },
  { key: 'string', label: 'Strings', example: '"hello world"' },
  { key: 'number', label: 'Numbers', example: '42, 3.14' },
  { key: 'comment', label: 'Comments', example: '// comment' },
  { key: 'function', label: 'Functions', example: 'myFunction()' },
  { key: 'type', label: 'Types', example: 'String, Number' },
  { key: 'variable', label: 'Variables', example: 'myVar' },
  { key: 'operator', label: 'Operators', example: '+, -, =, =>' },
]

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

// Default syntax colors
const defaultSyntaxColors = {
  dark: { ...syntaxColorPresets.default.dark },
  light: { ...syntaxColorPresets.default.light },
}

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
}

const SettingsContext = createContext(undefined)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let parsedSettings = null
    const savedSettings = localStorage.getItem('app-settings')
    if (savedSettings) {
      try {
        parsedSettings = JSON.parse(savedSettings)
      } catch (e) {
        console.error('Failed to parse settings:', e)
      }
    }

    if (parsedSettings) {
      queueMicrotask(() => {
        setSettings(prev => ({ ...prev, ...parsedSettings }))
      })
    }
    queueMicrotask(() => {
      setMounted(true)
    })
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

void editorThemes;
void editorFonts;
void editorFontSizes;
void syntaxTokenTypes;
void SettingsProvider;
void useSettings;

export default SettingsContext
