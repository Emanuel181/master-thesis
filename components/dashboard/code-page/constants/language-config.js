// Language configuration for the code editor

// Languages shown in the dropdown selector (main programming languages that are fully supported)
export const displayLanguages = [
    { name: "JavaScript", prism: "javascript" },
    { name: "Python", prism: "python" },
    { name: "Java", prism: "java" },
    { name: "C#", prism: "csharp" },
    { name: "C", prism: "c" },
    { name: "C++", prism: "cpp" },
    { name: "PHP", prism: "php" },
    { name: "Go", prism: "go" },
];

// All languages that can be displayed and formatted (includes JSON, etc.)
export const supportedLanguages = [
    ...displayLanguages,
    { name: "JSON", prism: "json" },
];

// Languages that can be formatted by the backend (must match format-code API)
export const formattableLanguages = [
    'javascript', 'python', 'java', 'csharp', 'c', 'cpp', 'php', 'go', 'json'
];

// Languages that can be reviewed by the AI agent (excludes config files like JSON, MJS modules)
export const reviewableLanguages = [
    'javascript', 'python', 'java', 'csharp', 'c', 'cpp', 'php', 'go'
];

// File extensions that are view-only (can format/copy but not review)
export const viewOnlyExtensions = ['json', 'mjs', 'cjs'];

// Base placeholder text for the editor
export const BASE_PLACEHOLDER = "Enter your code here...";

/**
 * Get the comment prefix for a given language
 * @param {string} lang - The language identifier
 * @returns {string} The comment prefix
 */
export const commentPrefixFor = (lang) => {
    switch (lang) {
        case 'python': return '# ';
        case 'php': return '// ';
        default: return '// ';
    }
};

// Comprehensive extension to language mapping for detection
export const extensionToLanguageMap = {
    // JavaScript variants (all map to javascript)
    'js': 'javascript',
    'jsx': 'javascript',
    'mjs': 'javascript',
    'cjs': 'javascript',
    'es6': 'javascript',
    'ts': 'javascript',
    'tsx': 'javascript',
    'mts': 'javascript',
    'cts': 'javascript',

    // Python
    'py': 'python',
    'pyw': 'python',
    'pyi': 'python',

    // Java
    'java': 'java',

    // C#
    'cs': 'csharp',
    'csx': 'csharp',

    // C
    'c': 'c',
    'h': 'c',

    // C++
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'hpp': 'cpp',
    'hxx': 'cpp',
    'hh': 'cpp',

    // PHP
    'php': 'php',
    'phtml': 'php',
    'php3': 'php',
    'php4': 'php',
    'php5': 'php',
    'php7': 'php',
    'phps': 'php',

    // Go
    'go': 'go',

    // JSON
    'json': 'json',
    'jsonc': 'json',
    'json5': 'json',

    // Other (unsupported but detectable)
    'rs': 'rust',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'kts': 'kotlin',
    'scala': 'scala',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'mdx': 'markdown',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'ps1': 'powershell',
    
    // Plain text / Config files (unsupported for review)
    'txt': 'plaintext',
    'text': 'plaintext',
    'log': 'plaintext',
    'ini': 'plaintext',
    'cfg': 'plaintext',
    'conf': 'plaintext',
    'env': 'plaintext',
    'gitignore': 'plaintext',
    'dockerignore': 'plaintext',
    'editorconfig': 'plaintext',
    'properties': 'plaintext',
    'toml': 'plaintext',
    'lock': 'plaintext',
};

/**
 * Detect language from filename and content
 * @param {string} filename - The filename
 * @param {string} content - The file content
 * @returns {string} The detected language or 'unsupported'
 */
export const detectLanguageFromContent = (filename, content) => {
    if (!filename) return 'unsupported';

    const ext = filename.split('.').pop()?.toLowerCase();
    
    // Handle files without extension (like Dockerfile, Makefile, etc.)
    if (!ext || ext === filename.toLowerCase()) {
        // Check for known extensionless files
        const baseName = filename.toLowerCase();
        if (['dockerfile', 'makefile', 'jenkinsfile', 'vagrantfile'].includes(baseName)) {
            return 'plaintext';
        }
        if (baseName === 'requirements') return 'plaintext';
        return 'unsupported';
    }

    if (extensionToLanguageMap[ext]) {
        return extensionToLanguageMap[ext];
    }

    // Fallback: Check content for language hints
    if (content) {
        if (/^#!\/.+\bpython/.test(content)) return 'python';
        if (/^#!\/.+\bnode/.test(content)) return 'javascript';
        if (content.includes('public static void main')) return 'java';
        if (content.includes('import React') || content.includes('from "react"') || content.includes("from 'react'")) return 'javascript';
        if (content.includes('def ') && content.includes(':')) return 'python';
        if (content.includes('package main') && content.includes('func ')) return 'go';
        if (content.includes('<?php')) return 'php';
        if (content.includes('using System;') || content.includes('namespace ')) return 'csharp';
    }

    return 'unsupported';
};

