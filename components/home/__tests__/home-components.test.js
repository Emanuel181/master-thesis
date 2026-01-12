/**
 * Unit tests for HomePage sub-components
 * Feature: frontend-refactoring
 * Validates: Requirements 6.1
 * 
 * Note: These are static analysis tests that verify component structure,
 * exports, and prop interfaces without requiring a React testing environment.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { readFileSync, existsSync } from 'node:fs'

describe('HomePage Sub-Components', () => {
    describe('Repo Panel Components', () => {
        it('should export GitHubRepoPanel from index', () => {
            const indexPath = 'components/home/_components/repo-panel/index.jsx'
            assert.ok(existsSync(indexPath), 'index.jsx should exist')
            
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(
                content.includes('GitHubRepoPanel'),
                'Should export GitHubRepoPanel'
            )
        })

        it('should export GitLabRepoPanel from index', () => {
            const indexPath = 'components/home/_components/repo-panel/index.jsx'
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(
                content.includes('GitLabRepoPanel'),
                'Should export GitLabRepoPanel'
            )
        })

        it('should export RepoCard from index', () => {
            const indexPath = 'components/home/_components/repo-panel/index.jsx'
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(
                content.includes('RepoCard'),
                'Should export RepoCard'
            )
        })

        it('GitHubRepoPanel should accept required props', () => {
            const filePath = 'components/home/_components/repo-panel/github-repo-panel.jsx'
            assert.ok(existsSync(filePath), 'github-repo-panel.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            
            // Check for required props in function signature
            const requiredProps = [
                'repos',
                'isLoading',
                'isConnected',
                'searchTerm',
                'setSearchTerm',
                'currentPage',
                'setCurrentPage',
                'paginatedRepos',
                'totalPages',
            ]
            
            for (const prop of requiredProps) {
                assert.ok(
                    content.includes(prop),
                    `GitHubRepoPanel should accept ${prop} prop`
                )
            }
        })

        it('GitLabRepoPanel should accept required props', () => {
            const filePath = 'components/home/_components/repo-panel/gitlab-repo-panel.jsx'
            assert.ok(existsSync(filePath), 'gitlab-repo-panel.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            
            const requiredProps = [
                'repos',
                'isLoading',
                'isConnected',
                'searchTerm',
                'setSearchTerm',
            ]
            
            for (const prop of requiredProps) {
                assert.ok(
                    content.includes(prop),
                    `GitLabRepoPanel should accept ${prop} prop`
                )
            }
        })

        it('RepoCard should accept repo and onImport props', () => {
            const filePath = 'components/home/_components/repo-panel/repo-card.jsx'
            assert.ok(existsSync(filePath), 'repo-card.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            assert.ok(content.includes('repo'), 'RepoCard should accept repo prop')
            assert.ok(content.includes('onImport'), 'RepoCard should accept onImport prop')
        })
    })

    describe('Prompt Panel Components', () => {
        it('should export PromptList from index', () => {
            const indexPath = 'components/home/_components/prompt-panel/index.jsx'
            assert.ok(existsSync(indexPath), 'index.jsx should exist')
            
            const content = readFileSync(indexPath, 'utf-8')
            assert.ok(
                content.includes('PromptList'),
                'Should export PromptList'
            )
        })

        it('should export SortablePromptItem', () => {
            const filePath = 'components/home/_components/prompt-panel/sortable-prompt-item.jsx'
            assert.ok(existsSync(filePath), 'sortable-prompt-item.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            assert.ok(
                content.includes('export function SortablePromptItem') ||
                content.includes('export { SortablePromptItem'),
                'Should export SortablePromptItem'
            )
        })

        it('PromptList should support drag-and-drop', () => {
            const filePath = 'components/home/_components/prompt-panel/prompt-list.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            assert.ok(
                content.includes('DndContext'),
                'PromptList should use DndContext for drag-and-drop'
            )
            assert.ok(
                content.includes('SortableContext'),
                'PromptList should use SortableContext'
            )
        })

        it('SortablePromptItem should use useSortable hook', () => {
            const filePath = 'components/home/_components/prompt-panel/sortable-prompt-item.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            assert.ok(
                content.includes('useSortable'),
                'SortablePromptItem should use useSortable hook'
            )
        })
    })

    describe('Panel Layout Components', () => {
        it('should export CurrentProjectCard', () => {
            const filePath = 'components/home/_components/panel-layout/current-project-card.jsx'
            assert.ok(existsSync(filePath), 'current-project-card.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            assert.ok(
                content.includes('export function CurrentProjectCard') ||
                content.includes('export { CurrentProjectCard'),
                'Should export CurrentProjectCard'
            )
        })

        it('should export ImportProgressDialog', () => {
            const filePath = 'components/home/_components/panel-layout/import-progress-dialog.jsx'
            assert.ok(existsSync(filePath), 'import-progress-dialog.jsx should exist')
            
            const content = readFileSync(filePath, 'utf-8')
            assert.ok(
                content.includes('export function ImportProgressDialog') ||
                content.includes('export { ImportProgressDialog'),
                'Should export ImportProgressDialog'
            )
        })

        it('ImportProgressDialog should show progress state', () => {
            const filePath = 'components/home/_components/panel-layout/import-progress-dialog.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            assert.ok(
                content.includes('progress'),
                'ImportProgressDialog should handle progress prop'
            )
        })
    })

    describe('HomePage Integration', () => {
        it('home-page.jsx should import all custom hooks', () => {
            const filePath = 'components/home/home-page.jsx'
            const content = readFileSync(filePath, 'utf-8')
            
            const hooks = [
                'useGitHubRepos',
                'useGitLabRepos',
                'usePromptManagement',
                'usePanelLayout',
            ]
            
            for (const hook of hooks) {
                assert.ok(
                    content.includes(hook),
                    `home-page.jsx should import ${hook}`
                )
            }
        })

        it('home-page.jsx should be significantly smaller than original', () => {
            const filePath = 'components/home/home-page.jsx'
            const content = readFileSync(filePath, 'utf-8')
            const lineCount = content.split('\n').length
            
            // Original was 1882 lines, refactored should be ~200-300 lines
            assert.ok(
                lineCount < 400,
                `home-page.jsx should be under 400 lines (got ${lineCount})`
            )
        })
    })
})
