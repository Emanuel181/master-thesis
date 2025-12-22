"use client"

import { useCallback, useMemo } from 'react';
import { useSettings, editorThemes, editorFonts, editorFontSizes, syntaxColorPresets } from "@/contexts/settingsContext";

/**
 * Custom hook for Monaco editor configuration
 * @returns {Object} Editor configuration and theme builder
 */
export function useEditorConfig() {
    const { settings } = useSettings();

    // Get editor configuration based on settings
    const getEditorConfig = useCallback(() => {
        const appMode = settings?.mode || 'light';
        let themeKey = settings?.editorTheme || 'default-dark';
        let theme = editorThemes[themeKey];

        if (theme) {
            const isAppDark = appMode === 'dark';
            const isThemeDark = theme.base === 'vs-dark';
            if (isAppDark !== isThemeDark) {
                themeKey = isAppDark ? 'default-dark' : 'default-light';
                theme = editorThemes[themeKey];
            }
        } else {
            themeKey = appMode === 'dark' ? 'default-dark' : 'default-light';
            theme = editorThemes[themeKey];
        }

        const fontKey = settings?.editorFont || 'fira-code';
        const fontSizeKey = settings?.editorFontSize || 'md';
        const font = editorFonts[fontKey] || editorFonts['fira-code'];
        const fontSize = editorFontSizes[fontSizeKey]?.size || 16;

        return {
            theme,
            font,
            fontSize,
            ligatures: settings?.editorLigatures ?? true,
            minimap: settings?.editorMinimap ?? true,
            themeKey
        };
    }, [settings]);

    const editorConfig = useMemo(() => getEditorConfig(), [getEditorConfig]);

    // Build Monaco theme from editor theme configuration
    const buildMonacoTheme = useCallback((editorTheme) => {
        const appMode = settings?.mode || 'light';
        const syntaxColors = settings?.customSyntaxColors?.[appMode] || syntaxColorPresets.default[appMode];
        return {
            base: editorTheme.base,
            inherit: true,
            rules: [
                { token: 'comment', foreground: syntaxColors.comment, fontStyle: 'italic' },
                { token: 'keyword', foreground: syntaxColors.keyword, fontStyle: 'bold' },
                { token: 'string', foreground: syntaxColors.string },
                { token: 'number', foreground: syntaxColors.number },
                { token: 'type', foreground: syntaxColors.type },
                { token: 'function', foreground: syntaxColors.function },
                { token: 'variable', foreground: syntaxColors.variable },
                { token: 'operator', foreground: syntaxColors.operator },
            ],
            colors: {
                'editor.background': editorTheme.colors.background,
                'editor.foreground': editorTheme.colors.foreground,
                'editor.lineHighlightBackground': editorTheme.colors.lineHighlight,
                'editorLineNumber.foreground': editorTheme.colors.lineNumber,
                'minimap.background': editorTheme.colors.background,
            },
        };
    }, [settings?.mode, settings?.customSyntaxColors]);

    return {
        editorConfig,
        buildMonacoTheme,
    };
}

