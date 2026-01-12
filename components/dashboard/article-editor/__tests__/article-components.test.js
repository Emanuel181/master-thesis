/**
 * Unit tests for ArticleEditor sub-components
 * Feature: frontend-refactoring
 * Validates: Requirements 6.1
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { readFileSync, existsSync } from 'node:fs'

describe('ArticleEditor Sub-Components', () => {
    describe('Article List Components', () => {
        it('should export ArticleList from index', () => {
            const indexPath = 'components/dashboard/article-editor/_components/article-list/index.jsx'
            assert.ok(existsSync(indexPath), 'index.jsx should exist')
            
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(
                content.includes('ArticleList'),
                'Should export ArticleList'
            )
        })

        it('should export ArticleCard from index', () => {
            const indexPath = 'components/dashboard/article-editor/_components/article-list/index.jsx'
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(
                content.includes('ArticleCard'),
                'Should export ArticleCard'
            )
        })

        it('should export ArticleFilters from index', () => {
            const indexPath = 'components/dashboard/article-editor/_components/article-list/index.jsx'
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(
                content.includes('ArticleFilters'),
                'Should export ArticleFilters'
            )
        })

        it('should export ArticlePagination from index', () => {
            const indexPath = 'components/dashboard/article-editor/_components/article-list/index.jsx'
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(
                content.includes('ArticlePagination'),
                'Should export ArticlePagination'
            )
        })

        it('ArticleCard should accept article and statusConfig props', () => {
            const filePath = 'components/dashboard/article-editor/_components/article-list/article-card.jsx'
            assert.ok(existsSync(filePath), 'article-card.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            assert.ok(content.includes('article'), 'Should accept article prop')
            assert.ok(content.includes('statusConfig'), 'Should accept statusConfig prop')
            assert.ok(content.includes('onSelect'), 'Should accept onSelect prop')
        })

        it('ArticleFilters should handle search and status filter', () => {
            const filePath = 'components/dashboard/article-editor/_components/article-list/article-filters.jsx'
            assert.ok(existsSync(filePath), 'article-filters.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            assert.ok(content.includes('searchTerm'), 'Should handle searchTerm')
            assert.ok(content.includes('activeTab'), 'Should handle activeTab for status filter')
        })

        it('ArticlePagination should accept pagination props', () => {
            const filePath = 'components/dashboard/article-editor/_components/article-list/article-pagination.jsx'
            assert.ok(existsSync(filePath), 'article-pagination.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            assert.ok(content.includes('currentPage'), 'Should accept currentPage')
            assert.ok(content.includes('totalPages'), 'Should accept totalPages')
            assert.ok(content.includes('onPageChange'), 'Should accept onPageChange')
        })
    })

    describe('Article Form Components', () => {
        it('should export ArticleForm from index', () => {
            const indexPath = 'components/dashboard/article-editor/_components/article-form/index.jsx'
            assert.ok(existsSync(indexPath), 'index.jsx should exist')
            
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(
                content.includes('ArticleForm'),
                'Should export ArticleForm'
            )
        })

        it('should export CoverSection from index', () => {
            const indexPath = 'components/dashboard/article-editor/_components/article-form/index.jsx'
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(
                content.includes('CoverSection'),
                'Should export CoverSection'
            )
        })

        it('should export IconSection from index', () => {
            const indexPath = 'components/dashboard/article-editor/_components/article-form/index.jsx'
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(
                content.includes('IconSection'),
                'Should export IconSection'
            )
        })

        it('CoverSection should handle gradient and image cover types', () => {
            const filePath = 'components/dashboard/article-editor/_components/article-form/cover-section.jsx'
            assert.ok(existsSync(filePath), 'cover-section.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            assert.ok(content.includes('gradient'), 'Should handle gradient cover type')
            assert.ok(content.includes('coverType'), 'Should handle coverType prop')
        })

        it('IconSection should handle icon selection with pagination', () => {
            const filePath = 'components/dashboard/article-editor/_components/article-form/icon-section.jsx'
            assert.ok(existsSync(filePath), 'icon-section.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            assert.ok(content.includes('iconSearch'), 'Should handle icon search')
            assert.ok(content.includes('iconPage'), 'Should handle icon pagination')
            assert.ok(content.includes('paginatedIcons'), 'Should display paginated icons')
        })

        it('IconDisplay should render SVG icons', () => {
            const filePath = 'components/dashboard/article-editor/_components/article-form/icon-display.jsx'
            assert.ok(existsSync(filePath), 'icon-display.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            assert.ok(content.includes('name'), 'Should accept name prop')
            assert.ok(content.includes('className'), 'Should accept className prop')
        })
    })

    describe('Article Dialogs Components', () => {
        it('should export DeleteArticleDialog from index', () => {
            const indexPath = 'components/dashboard/article-editor/_components/article-dialogs/index.jsx'
            assert.ok(existsSync(indexPath), 'index.jsx should exist')
            
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(
                content.includes('DeleteArticleDialog'),
                'Should export DeleteArticleDialog'
            )
        })

        it('DeleteArticleDialog should handle confirmation', () => {
            const filePath = 'components/dashboard/article-editor/_components/article-dialogs/delete-article-dialog.jsx'
            assert.ok(existsSync(filePath), 'delete-article-dialog.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            assert.ok(content.includes('onConfirm'), 'Should accept onConfirm prop')
            assert.ok(content.includes('AlertDialog'), 'Should use AlertDialog component')
        })
    })

    describe('ArticleEditor Integration', () => {
        it('article-editor.jsx should import custom hooks', () => {
            const filePath = 'components/dashboard/article-editor/article-editor.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            assert.ok(
                content.includes('useArticles'),
                'Should import useArticles hook'
            )
            assert.ok(
                content.includes('useArticleForm'),
                'Should import useArticleForm hook'
            )
        })

        it('article-editor.jsx should be significantly smaller than original', () => {
            const filePath = 'components/dashboard/article-editor/article-editor.jsx'
            const content = readFileSync(filePath, 'utf-8')
            const lineCount = content.split('\n').length
            
            // Original was 1261 lines, refactored should be ~150-200 lines
            assert.ok(
                lineCount < 300,
                `article-editor.jsx should be under 300 lines (got ${lineCount})`
            )
        })
    })
})
