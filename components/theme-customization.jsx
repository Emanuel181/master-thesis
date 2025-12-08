'use client'

import React, { useCallback } from "react"
import { useSettings, themePresets, scales, radiusOptions, editorThemes, editorFonts, editorFontSizes, syntaxColorPresets, syntaxTokenTypes } from '@/contexts/settingsContext'
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const ThemeCustomization = ({ showEditorTabs = true }) => {
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

  // Editor settings handlers
  const handleEditorThemeChange = useCallback((theme) => {
    updateSettings({ ...settings, editorTheme: theme })
  }, [settings, updateSettings])

  const handleEditorFontChange = useCallback((font) => {
    const fontConfig = editorFonts[font]
    updateSettings({
      ...settings,
      editorFont: font,
      editorLigatures: fontConfig?.ligatures ?? true
    })
  }, [settings, updateSettings])

  const handleEditorFontSizeChange = useCallback((size) => {
    updateSettings({ ...settings, editorFontSize: size })
  }, [settings, updateSettings])

  const handleEditorLigaturesChange = useCallback((enabled) => {
    updateSettings({ ...settings, editorLigatures: enabled })
  }, [settings, updateSettings])

  const handleEditorMinimapChange = useCallback((enabled) => {
    updateSettings({ ...settings, editorMinimap: enabled })
  }, [settings, updateSettings])

  // Syntax color handlers
  const handleSyntaxPresetChange = useCallback((preset) => {
    const presetColors = syntaxColorPresets[preset]
    if (presetColors) {
      updateSettings({
        ...settings,
        syntaxColorPreset: preset,
        customSyntaxColors: {
          dark: { ...presetColors.dark },
          light: { ...presetColors.light },
        }
      })
    }
  }, [settings, updateSettings])

  const handleSyntaxColorChange = useCallback((mode, tokenType, color) => {
    // Remove # if present and validate hex
    const cleanColor = color.replace('#', '').toUpperCase()
    if (/^[0-9A-F]{6}$/.test(cleanColor)) {
      updateSettings({
        ...settings,
        syntaxColorPreset: 'custom',
        customSyntaxColors: {
          ...settings.customSyntaxColors,
          [mode]: {
            ...settings.customSyntaxColors?.[mode],
            [tokenType]: cleanColor,
          }
        }
      })
    }
  }, [settings, updateSettings])

  // Get current syntax colors based on mode
  const getCurrentSyntaxColors = (mode) => {
    return settings.customSyntaxColors?.[mode] || syntaxColorPresets.default[mode]
  }

  if (!mounted) {
    return null
  }


  // Get editor theme - automatically match to app mode if mismatched
  const getEffectiveEditorTheme = () => {
    const selectedTheme = editorThemes[settings.editorTheme]
    if (selectedTheme) {
      const isAppDark = settings.mode === 'dark'
      const isThemeDark = selectedTheme.base === 'vs-dark'
      if (isAppDark !== isThemeDark) {
        // Return matching default theme
        return isAppDark ? editorThemes['default-dark'] : editorThemes['default-light']
      }
      return selectedTheme
    }
    return settings.mode === 'dark' ? editorThemes['default-dark'] : editorThemes['default-light']
  }

  const currentEditorTheme = getEffectiveEditorTheme()
  const currentEditorFont = editorFonts[settings.editorFont] || editorFonts['fira-code']

  return (
    <Tabs defaultValue="app" className="w-full">
      <TabsList className={`grid w-full mb-3 ${showEditorTabs ? 'grid-cols-3' : 'grid-cols-1'}`}>
        <TabsTrigger value="app" className="text-xs">App</TabsTrigger>
        {showEditorTabs && <TabsTrigger value="editor" className="text-xs">Editor</TabsTrigger>}
        {showEditorTabs && <TabsTrigger value="syntax" className="text-xs">Syntax</TabsTrigger>}
      </TabsList>

      <TabsContent value="app" className="space-y-3 mt-0">
        {/* Theme Preset Dropdown */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Theme preset:</Label>
          <Select value={settings.themePreset} onValueChange={handleThemeChange}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Select theme" />
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
      </TabsContent>

      {showEditorTabs && (
        <TabsContent value="editor" className="space-y-3 mt-0">
          {/* Editor Theme */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Editor theme:</Label>
            <Select value={settings.editorTheme} onValueChange={handleEditorThemeChange}>
              <SelectTrigger className="w-full h-8 text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: currentEditorTheme.colors.background }}
                  />
                  <SelectValue placeholder="Select theme" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {/* Show themes matching current app mode first */}
                <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                  {settings.mode === 'dark' ? 'Dark Themes' : 'Light Themes'}
                </div>
                {Object.entries(editorThemes)
                  .filter(([, theme]) => settings.mode === 'dark' ? theme.base === 'vs-dark' : theme.base === 'vs')
                  .map(([key, theme]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-sm border border-border"
                          style={{ backgroundColor: theme.colors.background }}
                        />
                        <span>{theme.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                <Separator className="my-1" />
                <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                  {settings.mode === 'dark' ? 'Light Themes' : 'Dark Themes'}
                </div>
                {Object.entries(editorThemes)
                  .filter(([, theme]) => settings.mode === 'dark' ? theme.base === 'vs' : theme.base === 'vs-dark')
                  .map(([key, theme]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-sm border border-border"
                          style={{ backgroundColor: theme.colors.background }}
                        />
                        <span>{theme.name}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Editor theme automatically matches app color mode
            </p>
          </div>

          {/* Editor Font */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Font family:</Label>
            <Select value={settings.editorFont} onValueChange={handleEditorFontChange}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(editorFonts).map(([key, font]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: font.family }}>{font.name}</span>
                      {font.ligatures && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">Ligatures</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Font size:</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {Object.entries(editorFontSizes).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleEditorFontSizeChange(key)}
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium uppercase transition-all hover:bg-accent ${
                    settings.editorFontSize === key ? 'border-primary bg-accent' : 'border-border'
                  }`}
                  title={`${config.size}px`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* Ligatures Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Font ligatures:</Label>
            <Switch
              checked={settings.editorLigatures}
              onCheckedChange={handleEditorLigaturesChange}
              disabled={!currentEditorFont.ligatures}
            />
          </div>

          {/* Minimap Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Show minimap:</Label>
            <Switch
              checked={settings.editorMinimap}
              onCheckedChange={handleEditorMinimapChange}
            />
          </div>

          {/* Theme Preview */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Preview:</Label>
            <div
              className="rounded-md border p-2 text-xs overflow-hidden"
              style={{
                backgroundColor: currentEditorTheme.colors.background,
                fontFamily: currentEditorFont.family,
                fontSize: editorFontSizes[settings.editorFontSize]?.size || 14,
              }}
            >
              <div style={{ color: `#${currentEditorTheme.rules.find(r => r.token === 'keyword')?.foreground || 'fff'}` }}>
                <span style={{ fontWeight: 'bold' }}>const</span>
              </div>
              <div style={{ color: `#${currentEditorTheme.rules.find(r => r.token === 'function')?.foreground || 'fff'}` }}>
                greet
                <span style={{ color: currentEditorTheme.colors.foreground }}>(</span>
                <span style={{ color: `#${currentEditorTheme.rules.find(r => r.token === 'string')?.foreground || 'fff'}` }}>&quot;Hello&quot;</span>
                <span style={{ color: currentEditorTheme.colors.foreground }}>)</span>
              </div>
            </div>
          </div>
        </TabsContent>
      )}

      {showEditorTabs && (
        <TabsContent value="syntax" className="space-y-3 mt-0">
          {/* Syntax Color Preset */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Color preset:</Label>
            <Select value={settings.syntaxColorPreset || 'default'} onValueChange={handleSyntaxPresetChange}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(syntaxColorPresets).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {['keyword', 'string', 'function'].map((token) => (
                          <div
                            key={token}
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: `#${preset[settings.mode]?.[token] || 'fff'}` }}
                          />
                        ))}
                      </div>
                      <span>{preset.name}</span>
                    </div>
                  </SelectItem>
                ))}
                {settings.syntaxColorPreset === 'custom' && (
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {['keyword', 'string', 'function'].map((token) => (
                          <div
                            key={token}
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: `#${getCurrentSyntaxColors(settings.mode)?.[token] || 'fff'}` }}
                          />
                        ))}
                      </div>
                      <span>Custom</span>
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Mode Toggle for Syntax Colors */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Editing colors for:</Label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => updateSettings({ ...settings, mode: 'dark' })}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:bg-accent ${
                  settings.mode === 'dark' ? 'border-primary bg-accent' : 'border-border'
                }`}
              >
                Dark Mode
              </button>
              <button
                onClick={() => updateSettings({ ...settings, mode: 'light' })}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:bg-accent ${
                  settings.mode === 'light' ? 'border-primary bg-accent' : 'border-border'
                }`}
              >
                Light Mode
              </button>
            </div>
          </div>

          {/* Individual Token Colors */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Token colors ({settings.mode} mode):</Label>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
              {syntaxTokenTypes.map(({ key, label }) => {
                const currentColor = getCurrentSyntaxColors(settings.mode)?.[key] || 'FFFFFF'
                return (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="h-6 w-6 rounded border border-border shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50"
                            style={{ backgroundColor: `#${currentColor}` }}
                            title={`Click to change ${label} color`}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="start">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">{label} Color</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={`#${currentColor}`}
                                onChange={(e) => handleSyntaxColorChange(settings.mode, key, e.target.value)}
                                className="h-8 w-12 p-0 border-0 cursor-pointer"
                              />
                              <Input
                                type="text"
                                value={`#${currentColor}`}
                                onChange={(e) => handleSyntaxColorChange(settings.mode, key, e.target.value)}
                                className="h-8 w-20 text-xs font-mono"
                                placeholder="#FFFFFF"
                              />
                            </div>
                            {/* Quick color options */}
                            <div className="flex gap-1 flex-wrap">
                              {Object.entries(syntaxColorPresets).slice(0, 4).map(([presetKey, preset]) => (
                                <button
                                  key={presetKey}
                                  className="h-5 w-5 rounded border border-border hover:ring-1 hover:ring-primary/50"
                                  style={{ backgroundColor: `#${preset[settings.mode]?.[key] || 'fff'}` }}
                                  onClick={() => handleSyntaxColorChange(settings.mode, key, preset[settings.mode]?.[key])}
                                  title={`${preset.name} ${label}`}
                                />
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <span className="text-xs truncate">{label}</span>
                    </div>
                    <code
                      className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        backgroundColor: currentEditorTheme.colors.background,
                        color: `#${currentColor}`,
                        fontFamily: currentEditorFont.family,
                      }}
                    >
                      {key}
                    </code>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Syntax Preview */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Preview:</Label>
            <div
              className="rounded-md border p-2 text-xs overflow-hidden font-mono"
              style={{
                backgroundColor: currentEditorTheme.colors.background,
                fontSize: 11,
              }}
            >
              <div>
                <span style={{ color: `#${getCurrentSyntaxColors(settings.mode)?.comment}`, fontStyle: 'italic' }}>{'// Example code'}</span>
              </div>
              <div>
                <span style={{ color: `#${getCurrentSyntaxColors(settings.mode)?.keyword}`, fontWeight: 'bold' }}>const</span>
                <span style={{ color: currentEditorTheme.colors.foreground }}> </span>
                <span style={{ color: `#${getCurrentSyntaxColors(settings.mode)?.variable}` }}>greeting</span>
                <span style={{ color: `#${getCurrentSyntaxColors(settings.mode)?.operator}` }}> = </span>
                <span style={{ color: `#${getCurrentSyntaxColors(settings.mode)?.string}` }}>&quot;Hello&quot;</span>
              </div>
              <div>
                <span style={{ color: `#${getCurrentSyntaxColors(settings.mode)?.keyword}`, fontWeight: 'bold' }}>function</span>
                <span style={{ color: currentEditorTheme.colors.foreground }}> </span>
                <span style={{ color: `#${getCurrentSyntaxColors(settings.mode)?.function}` }}>add</span>
                <span style={{ color: currentEditorTheme.colors.foreground }}>(a, b) {'{'}</span>
              </div>
              <div>
                <span style={{ color: currentEditorTheme.colors.foreground }}>  </span>
                <span style={{ color: `#${getCurrentSyntaxColors(settings.mode)?.keyword}`, fontWeight: 'bold' }}>return</span>
                <span style={{ color: currentEditorTheme.colors.foreground }}> a </span>
                <span style={{ color: `#${getCurrentSyntaxColors(settings.mode)?.operator}` }}>+</span>
                <span style={{ color: currentEditorTheme.colors.foreground }}> b</span>
              </div>
              <div>
                <span style={{ color: currentEditorTheme.colors.foreground }}>{'}'}</span>
              </div>
              <div>
                <span style={{ color: `#${getCurrentSyntaxColors(settings.mode)?.type}` }}>Number</span>
                <span style={{ color: currentEditorTheme.colors.foreground }}>(</span>
                <span style={{ color: `#${getCurrentSyntaxColors(settings.mode)?.number}` }}>42</span>
                <span style={{ color: currentEditorTheme.colors.foreground }}>)</span>
              </div>
            </div>
          </div>
        </TabsContent>
      )}

      <Separator className="my-3" />

      {/* Reset Button - styled with current theme */}
      <Button
        onClick={resetSettings}
        variant="outline"
        size="sm"
        className="w-full border-primary/50 hover:bg-primary/10 hover:text-primary"
      >
        Reset to Default
      </Button>
    </Tabs>
  )
}

export default ThemeCustomization
