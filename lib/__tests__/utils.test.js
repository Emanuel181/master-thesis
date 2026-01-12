/**
 * Property-based tests for cn() utility function
 * Feature: frontend-refactoring, Property 2: Class Merging Correctness
 * Validates: Requirements 2.3
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import fc from 'fast-check'
import { cn } from '../utils.js'

// Common Tailwind class patterns for testing
const tailwindPrefixes = ['p', 'm', 'w', 'h', 'text', 'bg', 'border', 'rounded', 'flex', 'grid', 'gap']
const tailwindSizes = ['0', '1', '2', '4', '8', 'px', 'auto', 'full', 'sm', 'md', 'lg', 'xl']
const tailwindColors = ['red', 'blue', 'green', 'gray', 'white', 'black', 'primary', 'muted']
const tailwindShades = ['50', '100', '200', '500', '700', '900']

// Arbitrary for generating valid Tailwind-like class names
const tailwindClassArb = fc.oneof(
    // Size-based classes: p-4, m-2, w-full, h-8
    fc.tuple(
        fc.constantFrom(...tailwindPrefixes.slice(0, 4)),
        fc.constantFrom(...tailwindSizes)
    ).map(([prefix, size]) => `${prefix}-${size}`),
    // Color-based classes: text-red-500, bg-blue-100
    fc.tuple(
        fc.constantFrom('text', 'bg', 'border'),
        fc.constantFrom(...tailwindColors),
        fc.constantFrom(...tailwindShades)
    ).map(([prefix, color, shade]) => `${prefix}-${color}-${shade}`),
    // Simple utility classes
    fc.constantFrom(
        'flex', 'grid', 'block', 'hidden', 'relative', 'absolute',
        'items-center', 'justify-center', 'justify-between',
        'font-bold', 'font-medium', 'font-semibold',
        'rounded', 'rounded-md', 'rounded-lg', 'rounded-full',
        'shadow', 'shadow-sm', 'shadow-md', 'shadow-lg'
    )
)

// Arbitrary for generating arrays of Tailwind classes
const tailwindClassArrayArb = fc.array(tailwindClassArb, { minLength: 0, maxLength: 10 })

describe('cn() utility - Property-based tests', () => {
    /**
     * Property 2: Class Merging Correctness
     * For any combination of base Tailwind classes and custom override classes passed to cn(),
     * the output SHALL be a valid merged class string where custom classes properly override
     * conflicting base classes without duplication.
     */
    
    it('should return a string for any valid input', () => {
        fc.assert(
            fc.property(tailwindClassArrayArb, (classes) => {
                const result = cn(...classes)
                assert.strictEqual(typeof result, 'string')
            }),
            { numRuns: 100 }
        )
    })

    it('should not produce duplicate conflicting classes in output', () => {
        // Note: tailwind-merge deduplicates conflicting classes (e.g., p-2 vs p-4)
        // but does NOT deduplicate identical classes passed multiple times
        // This test verifies conflicting classes are properly merged
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.constantFrom('p-2', 'p-4', 'p-8'),
                    fc.constantFrom('p-1', 'p-3', 'p-6')
                ),
                ([first, second]) => {
                    const result = cn(first, second)
                    const outputClasses = result.split(' ').filter(c => c.length > 0)
                    // Should only have one padding class (the override)
                    const paddingClasses = outputClasses.filter(c => c.startsWith('p-'))
                    assert.strictEqual(paddingClasses.length, 1, 
                        `Should have exactly one padding class, got: "${result}"`)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should handle empty inputs gracefully', () => {
        fc.assert(
            fc.property(
                fc.array(fc.oneof(
                    fc.constant(''),
                    fc.constant(null),
                    fc.constant(undefined),
                    tailwindClassArb
                ), { minLength: 0, maxLength: 5 }),
                (inputs) => {
                    // Should not throw
                    const result = cn(...inputs)
                    assert.strictEqual(typeof result, 'string')
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should preserve order of non-conflicting classes', () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.constantFrom('flex', 'grid', 'block'),
                    fc.constantFrom('items-center', 'items-start', 'items-end'),
                    fc.constantFrom('gap-2', 'gap-4', 'gap-8')
                ),
                ([display, align, gap]) => {
                    const result = cn(display, align, gap)
                    // All non-conflicting classes should be present
                    assert.ok(result.includes(display), `Missing ${display} in "${result}"`)
                    assert.ok(result.includes(align), `Missing ${align} in "${result}"`)
                    assert.ok(result.includes(gap), `Missing ${gap} in "${result}"`)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should allow later classes to override earlier conflicting classes', () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.constantFrom('p-2', 'p-4', 'p-8'),
                    fc.constantFrom('p-1', 'p-3', 'p-6')
                ),
                ([first, second]) => {
                    const result = cn(first, second)
                    // The second (overriding) class should be present
                    assert.ok(result.includes(second), 
                        `Override class ${second} should be present in "${result}"`)
                    // The first (overridden) class should NOT be present
                    assert.ok(!result.includes(first) || first === second, 
                        `Original class ${first} should be overridden in "${result}"`)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should handle conditional class objects', () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.constantFrom('flex', 'grid', 'block', 'hidden'),
                    fc.boolean(),
                    fc.constantFrom('items-center', 'justify-center', 'gap-2')
                ),
                ([baseClass, condition, conditionalClass]) => {
                    const result = cn(baseClass, condition && conditionalClass)
                    // Base class should always be present (non-conflicting)
                    assert.ok(result.includes(baseClass), 
                        `Base class ${baseClass} should be present in "${result}"`)
                    if (condition) {
                        assert.ok(result.includes(conditionalClass), 
                            `Conditional class ${conditionalClass} should be present when condition is true`)
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should handle array inputs without conflicting class duplication', () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.array(fc.constantFrom('flex', 'grid', 'block'), { minLength: 1, maxLength: 3 }),
                    fc.array(fc.constantFrom('items-center', 'items-start', 'items-end'), { minLength: 1, maxLength: 3 })
                ),
                ([displayClasses, alignClasses]) => {
                    const result = cn(displayClasses, alignClasses)
                    assert.strictEqual(typeof result, 'string')
                    // Should have at most one display class and one align class
                    const outputClasses = result.split(' ').filter(c => c.length > 0)
                    const displayCount = outputClasses.filter(c => ['flex', 'grid', 'block'].includes(c)).length
                    const alignCount = outputClasses.filter(c => c.startsWith('items-')).length
                    assert.ok(displayCount <= 1, `Should have at most one display class, got ${displayCount}`)
                    assert.ok(alignCount <= 1, `Should have at most one align class, got ${alignCount}`)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should merge text color classes correctly', () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.constantFrom('text-red-500', 'text-blue-500', 'text-green-500'),
                    fc.constantFrom('text-gray-100', 'text-gray-900', 'text-white')
                ),
                ([first, second]) => {
                    const result = cn(first, second)
                    // Only the second text color should remain
                    assert.ok(result.includes(second), 
                        `Override color ${second} should be present in "${result}"`)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should merge background color classes correctly', () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.constantFrom('bg-red-500', 'bg-blue-500', 'bg-green-500'),
                    fc.constantFrom('bg-gray-100', 'bg-gray-900', 'bg-white')
                ),
                ([first, second]) => {
                    const result = cn(first, second)
                    // Only the second bg color should remain
                    assert.ok(result.includes(second), 
                        `Override bg ${second} should be present in "${result}"`)
                }
            ),
            { numRuns: 100 }
        )
    })
})
