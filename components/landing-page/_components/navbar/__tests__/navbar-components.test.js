/**
 * Unit tests for FloatingNavbar sub-components
 * Feature: frontend-refactoring
 * Validates: Requirements 6.1
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { readFileSync, existsSync } from 'node:fs'

describe('FloatingNavbar Sub-Components', () => {
    describe('Component Exports', () => {
        it('should export NavLogo from index', () => {
            const indexPath = 'components/landing-page/_components/navbar/index.jsx'
            assert.ok(existsSync(indexPath), 'index.jsx should exist')
            
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(content.includes('NavLogo'), 'Should export NavLogo')
        })

        it('should export NavMenu from index', () => {
            const indexPath = 'components/landing-page/_components/navbar/index.jsx'
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(content.includes('NavMenu'), 'Should export NavMenu')
        })

        it('should export NavActions from index', () => {
            const indexPath = 'components/landing-page/_components/navbar/index.jsx'
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(content.includes('NavActions'), 'Should export NavActions')
        })

        it('should export MobileMenu from index', () => {
            const indexPath = 'components/landing-page/_components/navbar/index.jsx'
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(content.includes('MobileMenu'), 'Should export MobileMenu')
        })

        it('should export ProgressBar from index', () => {
            const indexPath = 'components/landing-page/_components/navbar/index.jsx'
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(content.includes('ProgressBar'), 'Should export ProgressBar')
        })

        it('should export AccessibilityButton from index', () => {
            const indexPath = 'components/landing-page/_components/navbar/index.jsx'
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(content.includes('AccessibilityButton'), 'Should export AccessibilityButton')
        })

        it('should export FeedbackDialog from index', () => {
            const indexPath = 'components/landing-page/_components/navbar/index.jsx'
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(content.includes('FeedbackDialog'), 'Should export FeedbackDialog')
        })
    })

    describe('NavLogo Component', () => {
        it('should exist and accept isAboveColoredSection prop', () => {
            const filePath = 'components/landing-page/_components/navbar/nav-logo.jsx'
            assert.ok(existsSync(filePath), 'nav-logo.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            assert.ok(content.includes('isAboveColoredSection'), 'Should accept isAboveColoredSection prop')
        })

        it('should include brand name and logo', () => {
            const filePath = 'components/landing-page/_components/navbar/nav-logo.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            assert.ok(content.includes('VulnIQ'), 'Should include brand name')
            assert.ok(content.includes('Image'), 'Should use Next.js Image component')
        })

        it('should have ARIA label for accessibility', () => {
            const filePath = 'components/landing-page/_components/navbar/nav-logo.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            assert.ok(content.includes('aria-label'), 'Should have aria-label for accessibility')
        })
    })

    describe('MobileMenu Component', () => {
        it('should exist and accept required props', () => {
            const filePath = 'components/landing-page/_components/navbar/mobile-menu.jsx'
            assert.ok(existsSync(filePath), 'mobile-menu.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            assert.ok(content.includes('isOpen'), 'Should accept isOpen prop')
            assert.ok(content.includes('onClose'), 'Should accept onClose prop')
            assert.ok(content.includes('isAuthenticated'), 'Should accept isAuthenticated prop')
        })

        it('should use AnimatePresence for animations', () => {
            const filePath = 'components/landing-page/_components/navbar/mobile-menu.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            assert.ok(content.includes('AnimatePresence'), 'Should use AnimatePresence')
        })

        it('should use Next.js Link for internal navigation', () => {
            const filePath = 'components/landing-page/_components/navbar/mobile-menu.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            assert.ok(content.includes("import Link from \"next/link\""), 'Should import Link from next/link')
            assert.ok(content.includes('MotionLink'), 'Should use MotionLink for animated internal links')
        })

        it('should have Product, Resources, and Company sections', () => {
            const filePath = 'components/landing-page/_components/navbar/mobile-menu.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            assert.ok(content.includes('ProductSection'), 'Should have ProductSection')
            assert.ok(content.includes('ResourcesSection'), 'Should have ResourcesSection')
            assert.ok(content.includes('CompanySection'), 'Should have CompanySection')
        })
    })

    describe('NavMenu Component', () => {
        it('should exist and accept isAboveColoredSection prop', () => {
            const filePath = 'components/landing-page/_components/navbar/nav-menu.jsx'
            assert.ok(existsSync(filePath), 'nav-menu.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            assert.ok(content.includes('isAboveColoredSection'), 'Should accept isAboveColoredSection prop')
        })

        it('should use NavigationMenu from Shadcn UI', () => {
            const filePath = 'components/landing-page/_components/navbar/nav-menu.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            assert.ok(content.includes('NavigationMenu'), 'Should use NavigationMenu')
            assert.ok(content.includes('NavigationMenuTrigger'), 'Should use NavigationMenuTrigger')
            assert.ok(content.includes('NavigationMenuContent'), 'Should use NavigationMenuContent')
        })

        it('should use Next.js Link for internal navigation', () => {
            const filePath = 'components/landing-page/_components/navbar/nav-menu.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            assert.ok(content.includes("import Link from \"next/link\""), 'Should import Link from next/link')
        })

        it('should have Product, Resources, and Company dropdowns', () => {
            const filePath = 'components/landing-page/_components/navbar/nav-menu.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            assert.ok(content.includes('Product'), 'Should have Product dropdown')
            assert.ok(content.includes('Resources'), 'Should have Resources dropdown')
            assert.ok(content.includes('Company'), 'Should have Company dropdown')
        })
    })

    describe('NavActions Component', () => {
        it('should exist', () => {
            const filePath = 'components/landing-page/_components/navbar/nav-actions.jsx'
            assert.ok(existsSync(filePath), 'nav-actions.jsx should exist')
        })

        it('should use Next.js Link for internal navigation', () => {
            const filePath = 'components/landing-page/_components/navbar/nav-actions.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            assert.ok(content.includes("import Link from \"next/link\""), 'Should import Link from next/link')
        })
    })

    describe('ProgressBar Component', () => {
        it('should exist and accept progress prop', () => {
            const filePath = 'components/landing-page/_components/navbar/progress-bar.jsx'
            assert.ok(existsSync(filePath), 'progress-bar.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            assert.ok(content.includes('progress'), 'Should accept progress prop')
        })
    })

    describe('AccessibilityButton Component', () => {
        it('should exist', () => {
            const filePath = 'components/landing-page/_components/navbar/accessibility-button.jsx'
            assert.ok(existsSync(filePath), 'accessibility-button.jsx should exist')
        })
    })

    describe('FeedbackDialog Component', () => {
        it('should exist', () => {
            const filePath = 'components/landing-page/_components/navbar/feedback-dialog.jsx'
            assert.ok(existsSync(filePath), 'feedback-dialog.jsx should exist')
        })
    })

    describe('FloatingNavbar Integration', () => {
        it('floating-navbar.jsx should import custom hooks', () => {
            const filePath = 'components/landing-page/floating-navbar.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            assert.ok(
                content.includes('useScrollBehavior'),
                'Should import useScrollBehavior hook'
            )
            assert.ok(
                content.includes('useMobileMenu'),
                'Should import useMobileMenu hook'
            )
        })

        it('floating-navbar.jsx should import sub-components from navbar folder', () => {
            const filePath = 'components/landing-page/floating-navbar.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            assert.ok(
                content.includes('_components/navbar'),
                'Should import from _components/navbar'
            )
        })

        it('floating-navbar.jsx should be significantly smaller than original', () => {
            const filePath = 'components/landing-page/floating-navbar.jsx'
            const content = readFileSync(filePath, 'utf-8')
            const lineCount = content.split('\n').length
            
            // Original was 763 lines, refactored should be ~90-150 lines
            assert.ok(
                lineCount < 200,
                `floating-navbar.jsx should be under 200 lines (got ${lineCount})`
            )
        })
    })
})
