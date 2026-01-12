/**
 * Integration tests for navigation patterns
 * Feature: frontend-refactoring
 * Validates: Requirements 5.1, 5.2
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Recursively get all .jsx files in a directory
 */
function getJsxFiles(dir, files = []) {
    const items = readdirSync(dir)
    for (const item of items) {
        const fullPath = join(dir, item)
        const stat = statSync(fullPath)
        if (stat.isDirectory() && !item.startsWith('node_modules') && !item.startsWith('.')) {
            getJsxFiles(fullPath, files)
        } else if (item.endsWith('.jsx')) {
            files.push(fullPath)
        }
    }
    return files
}

/**
 * Check if a file contains internal links using <a href="/..."> instead of Link
 */
function findRawInternalLinks(content, filePath) {
    const issues = []
    
    // Pattern to find <a href="/..." (internal links)
    // Excludes external links (http://, https://, mailto:, etc.)
    const rawLinkPattern = /<a\s+[^>]*href=["']\/[^"']*["'][^>]*>/gi
    const matches = content.match(rawLinkPattern) || []
    
    for (const match of matches) {
        // Skip if it's inside a comment
        if (content.includes(`{/* ${match}`) || content.includes(`// ${match}`)) {
            continue
        }
        issues.push({
            file: filePath,
            match: match,
            message: 'Internal link should use Next.js Link component instead of <a href>'
        })
    }
    
    return issues
}

/**
 * Check if a file imports Link when it has internal navigation
 */
function checkLinkImport(content, filePath) {
    const hasInternalHref = /href=["']\/[^"']*["']/i.test(content)
    const hasLinkImport = /import\s+.*Link.*from\s+["']next\/link["']/i.test(content)
    
    if (hasInternalHref && !hasLinkImport) {
        // Check if it's using Button asChild with Link (which is fine)
        const usesButtonAsChild = /Button\s+asChild/.test(content) && hasLinkImport
        if (!usesButtonAsChild) {
            return {
                file: filePath,
                message: 'File has internal hrefs but does not import Link from next/link'
            }
        }
    }
    
    return null
}

describe('Navigation Pattern Tests', () => {
    const refactoredDirs = [
        'components/landing-page/_components/navbar',
        'components/home/_components',
        'components/dashboard/article-editor/_components',
    ]

    it('should not have raw <a href="/..."> for internal links in refactored navbar components', () => {
        const navbarDir = 'components/landing-page/_components/navbar'
        const files = getJsxFiles(navbarDir)
        const allIssues = []

        for (const file of files) {
            const content = readFileSync(file, 'utf-8')
            const issues = findRawInternalLinks(content, file)
            allIssues.push(...issues)
        }

        assert.strictEqual(
            allIssues.length, 
            0, 
            `Found ${allIssues.length} raw internal links:\n${allIssues.map(i => `  ${i.file}: ${i.match}`).join('\n')}`
        )
    })

    it('should import Link from next/link when using internal navigation in navbar', () => {
        const navbarDir = 'components/landing-page/_components/navbar'
        const files = getJsxFiles(navbarDir)
        
        // Files that should have Link import (have internal hrefs)
        const filesWithInternalLinks = ['nav-actions.jsx', 'mobile-menu.jsx', 'nav-menu.jsx']
        
        for (const file of files) {
            const fileName = file.split(/[/\\]/).pop()
            if (filesWithInternalLinks.includes(fileName)) {
                const content = readFileSync(file, 'utf-8')
                const hasLinkImport = /import\s+.*Link.*from\s+["']next\/link["']/i.test(content)
                assert.ok(
                    hasLinkImport,
                    `${fileName} should import Link from next/link for internal navigation`
                )
            }
        }
    })

    it('should use Next.js Link component for internal routes', () => {
        // Check that nav-actions.jsx uses Link
        const navActionsContent = readFileSync('components/landing-page/_components/navbar/nav-actions.jsx', 'utf-8')
        
        // Should have Link import
        assert.ok(
            /import\s+Link\s+from\s+["']next\/link["']/.test(navActionsContent),
            'nav-actions.jsx should import Link from next/link'
        )
        
        // Should use <Link href="/demo"> instead of <a href="/demo">
        assert.ok(
            /<Link\s+href=["']\/demo["']/.test(navActionsContent),
            'nav-actions.jsx should use <Link href="/demo"> for demo link'
        )
        
        // Should use <Link href="/dashboard"> instead of <a href="/dashboard">
        assert.ok(
            /<Link\s+href=["']\/dashboard["']/.test(navActionsContent),
            'nav-actions.jsx should use <Link href="/dashboard"> for dashboard link'
        )
        
        // Should use <Link href="/login"> instead of <a href="/login">
        assert.ok(
            /<Link\s+href=["']\/login["']/.test(navActionsContent),
            'nav-actions.jsx should use <Link href="/login"> for login link'
        )
    })

    it('should use MotionLink for animated internal navigation in mobile-menu', () => {
        const mobileMenuContent = readFileSync('components/landing-page/_components/navbar/mobile-menu.jsx', 'utf-8')
        
        // Should have Link import
        assert.ok(
            /import\s+Link\s+from\s+["']next\/link["']/.test(mobileMenuContent),
            'mobile-menu.jsx should import Link from next/link'
        )
        
        // Should create MotionLink from Link
        assert.ok(
            /MotionLink\s*=\s*motion\.create\(Link\)/.test(mobileMenuContent),
            'mobile-menu.jsx should create MotionLink using motion.create(Link)'
        )
        
        // Should use MotionLink for internal routes
        assert.ok(
            /<MotionLink/.test(mobileMenuContent),
            'mobile-menu.jsx should use MotionLink for animated internal links'
        )
    })
})
