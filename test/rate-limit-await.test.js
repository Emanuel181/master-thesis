/**
 * Test: Rate Limit Await Verification
 * ====================================
 * 
 * Verifies that all API routes properly await the rateLimit() function.
 * The rateLimit() function is async and returns a Promise - if not awaited,
 * the rate limit check doesn't block and rate limiting is ineffective.
 * 
 * Run with: node --test test/rate-limit-await.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Recursively find all route.js files in the api directory
 */
function findRouteFiles(dir, files = []) {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
            findRouteFiles(fullPath, files);
        } else if (entry.name === 'route.js') {
            files.push(fullPath);
        }
    }
    
    return files;
}

/**
 * Check if a file has non-awaited rateLimit calls
 */
function findNonAwaitedRateLimitCalls(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    const issues = [];
    
    // Pattern: "const rl = rateLimit(" WITHOUT "await" before it
    // This regex finds lines where rateLimit is called without await
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if line contains rateLimit call
        if (line.includes('rateLimit(') || line.includes('rateLimit({')) {
            // Check if it's properly awaited
            // Valid patterns:
            // - "await rateLimit("
            // - "const rl = await rateLimit("
            // Invalid patterns:
            // - "const rl = rateLimit("
            // - "rateLimit(" without await
            
            const hasAwait = line.includes('await rateLimit');
            const isImport = line.includes('import') && line.includes('rateLimit');
            const isComment = line.trim().startsWith('//') || line.trim().startsWith('*');
            
            if (!hasAwait && !isImport && !isComment) {
                issues.push({
                    line: i + 1,
                    content: line.trim(),
                });
            }
        }
    }
    
    return issues;
}

test('All API routes should await rateLimit() calls', () => {
    const apiDir = join(process.cwd(), 'app', 'api');
    const routeFiles = findRouteFiles(apiDir);
    
    assert.ok(routeFiles.length > 0, 'Should find at least one route file');
    
    const allIssues = [];
    
    for (const file of routeFiles) {
        const issues = findNonAwaitedRateLimitCalls(file);
        
        if (issues.length > 0) {
            allIssues.push({
                file: file.replace(process.cwd(), ''),
                issues,
            });
        }
    }
    
    if (allIssues.length > 0) {
        const errorMessage = allIssues
            .map(({ file, issues }) => {
                const issueList = issues
                    .map(({ line, content }) => `  Line ${line}: ${content}`)
                    .join('\n');
                return `${file}:\n${issueList}`;
            })
            .join('\n\n');
        
        assert.fail(
            `Found rateLimit() calls without await:\n\n${errorMessage}\n\n` +
            'Fix: Add "await" before rateLimit() calls. The function is async.'
        );
    }
    
    console.log(`✓ Checked ${routeFiles.length} route files, all rateLimit() calls are properly awaited`);
});

test('Demo API routes should also await rateLimit() calls', () => {
    const demoApiDir = join(process.cwd(), 'app', 'demo', 'api');
    
    try {
        const routeFiles = findRouteFiles(demoApiDir);
        
        if (routeFiles.length === 0) {
            console.log('No demo API routes found, skipping');
            return;
        }
        
        const allIssues = [];
        
        for (const file of routeFiles) {
            const issues = findNonAwaitedRateLimitCalls(file);
            
            if (issues.length > 0) {
                allIssues.push({
                    file: file.replace(process.cwd(), ''),
                    issues,
                });
            }
        }
        
        if (allIssues.length > 0) {
            const errorMessage = allIssues
                .map(({ file, issues }) => {
                    const issueList = issues
                        .map(({ line, content }) => `  Line ${line}: ${content}`)
                        .join('\n');
                    return `${file}:\n${issueList}`;
                })
                .join('\n\n');
            
            assert.fail(
                `Found rateLimit() calls without await in demo routes:\n\n${errorMessage}`
            );
        }
        
        console.log(`✓ Checked ${routeFiles.length} demo route files`);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('Demo API directory not found, skipping');
            return;
        }
        throw err;
    }
});
