/**
 * Validators Tests
 * 
 * Tests for input validation schemas including property-based tests
 * for validation rejection behavior.
 * 
 * Feature: backend-refactoring
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fc from 'fast-check';

import {
    normalizeText,
    textSchema,
    cuidSchema,
    paginationSchema,
    emailSchema,
    phoneSchema,
} from '../validators/common.js';

import {
    articleIdSchema,
    articleCreateSchema,
    articleUpdateSchema,
} from '../validators/articles.js';

describe('Validators Module', () => {
    describe('normalizeText', () => {
        it('should trim whitespace', () => {
            assert.strictEqual(normalizeText('  hello  '), 'hello');
        });

        it('should remove control characters', () => {
            assert.strictEqual(normalizeText('hello\x00world'), 'hello world');
        });

        it('should preserve newlines when allowNewlines is true', () => {
            const result = normalizeText('hello\nworld', { allowNewlines: true });
            assert.ok(result.includes('\n'), 'Should preserve newlines');
        });

        it('should handle non-string input', () => {
            assert.strictEqual(normalizeText(123), 123);
            assert.strictEqual(normalizeText(null), null);
        });
    });

    /**
     * Property 6: Input Validation Rejection
     * For any request with invalid input (exceeding max length, containing forbidden
     * characters like `<` or `>`, or failing schema validation), the API SHALL return
     * a 400 Bad Request response with field-level error details.
     * 
     * Feature: backend-refactoring, Property 6: Input Validation Rejection
     * Validates: Requirements 4.3, 4.4, 4.5
     */
    describe('Property 6: Input Validation Rejection', () => {
        describe('textSchema XSS protection', () => {
            it('should reject strings containing angle brackets', async () => {
                const schema = textSchema('Test', 100);
                
                await fc.assert(
                    fc.property(
                        fc.string().filter(s => s.includes('<') || s.includes('>')),
                        (input) => {
                            const result = schema.safeParse(input);
                            // Should fail validation due to angle brackets
                            assert.strictEqual(result.success, false, `Should reject: ${input}`);
                        }
                    ),
                    { numRuns: 100 }
                );
            });

            it('should accept strings without angle brackets', async () => {
                await fc.assert(
                    fc.property(
                        fc.string({ maxLength: 50 }).filter(s => !s.includes('<') && !s.includes('>')),
                        (input) => {
                            const schema = textSchema('Test', 100);
                            const result = schema.safeParse(input);
                            assert.strictEqual(result.success, true, `Should accept: ${input}`);
                        }
                    ),
                    { numRuns: 100 }
                );
            });
        });

        describe('textSchema max length enforcement', () => {
            it('should reject strings exceeding max length', async () => {
                const maxLength = 50;
                const schema = textSchema('Test', maxLength);
                
                await fc.assert(
                    fc.property(
                        fc.string({ minLength: maxLength + 1, maxLength: maxLength + 100 })
                            .filter(s => !s.includes('<') && !s.includes('>')),
                        (input) => {
                            const result = schema.safeParse(input);
                            assert.strictEqual(result.success, false, `Should reject string of length ${input.length}`);
                        }
                    ),
                    { numRuns: 100 }
                );
            });

            it('should accept strings within max length', async () => {
                const maxLength = 50;
                const schema = textSchema('Test', maxLength);
                
                await fc.assert(
                    fc.property(
                        fc.string({ maxLength: maxLength })
                            .filter(s => !s.includes('<') && !s.includes('>')),
                        (input) => {
                            const result = schema.safeParse(input);
                            assert.strictEqual(result.success, true, `Should accept string of length ${input.length}`);
                        }
                    ),
                    { numRuns: 100 }
                );
            });
        });

        describe('cuidSchema format validation', () => {
            it('should accept valid CUIDs', () => {
                // Valid CUID format: starts with 'c', 25 chars total, lowercase alphanumeric
                const validCuids = [
                    'clh1234567890abcdefghijkl',
                    'cm0abcdefghijklmnopqrstuv',
                ];
                
                for (const cuid of validCuids) {
                    const result = cuidSchema.safeParse(cuid);
                    assert.strictEqual(result.success, true, `Should accept: ${cuid}`);
                }
            });

            it('should reject invalid CUIDs', async () => {
                await fc.assert(
                    fc.property(
                        fc.oneof(
                            fc.string({ minLength: 1, maxLength: 24 }), // Too short
                            fc.string({ minLength: 26, maxLength: 50 }), // Too long
                            fc.string({ minLength: 25, maxLength: 25 }).filter(s => !s.startsWith('c')), // Wrong prefix
                        ),
                        (input) => {
                            const result = cuidSchema.safeParse(input);
                            assert.strictEqual(result.success, false, `Should reject: ${input}`);
                        }
                    ),
                    { numRuns: 100 }
                );
            });
        });

        describe('paginationSchema validation', () => {
            it('should accept valid pagination params', () => {
                const validParams = [
                    { page: 1, limit: 20 },
                    { page: 10, limit: 50 },
                    { page: 1, limit: 100 },
                ];
                
                for (const params of validParams) {
                    const result = paginationSchema.safeParse(params);
                    assert.strictEqual(result.success, true, `Should accept: ${JSON.stringify(params)}`);
                }
            });

            it('should reject invalid pagination params', () => {
                const invalidParams = [
                    { page: 0, limit: 20 }, // page must be positive
                    { page: -1, limit: 20 }, // page must be positive
                    { page: 1, limit: 0 }, // limit must be >= 1
                    { page: 1, limit: 101 }, // limit must be <= 100
                ];
                
                for (const params of invalidParams) {
                    const result = paginationSchema.safeParse(params);
                    assert.strictEqual(result.success, false, `Should reject: ${JSON.stringify(params)}`);
                }
            });

            it('should coerce string numbers to integers', () => {
                const result = paginationSchema.safeParse({ page: '5', limit: '25' });
                assert.strictEqual(result.success, true);
                assert.strictEqual(result.data.page, 5);
                assert.strictEqual(result.data.limit, 25);
            });
        });

        describe('emailSchema validation', () => {
            it('should accept valid emails', () => {
                const validEmails = [
                    'test@example.com',
                    'user.name@domain.org',
                    'user+tag@example.co.uk',
                ];
                
                for (const email of validEmails) {
                    const result = emailSchema.safeParse(email);
                    assert.strictEqual(result.success, true, `Should accept: ${email}`);
                }
            });

            it('should reject invalid emails', () => {
                const invalidEmails = [
                    'not-an-email',
                    '@missing-local.com',
                    'missing-domain@',
                    'spaces in@email.com',
                ];
                
                for (const email of invalidEmails) {
                    const result = emailSchema.safeParse(email);
                    assert.strictEqual(result.success, false, `Should reject: ${email}`);
                }
            });

            it('should normalize email to lowercase', () => {
                const result = emailSchema.safeParse('TEST@EXAMPLE.COM');
                assert.strictEqual(result.success, true);
                assert.strictEqual(result.data, 'test@example.com');
            });
        });
    });

    describe('Article Schemas', () => {
        describe('articleIdSchema', () => {
            it('should validate article ID parameter', () => {
                const validId = { id: 'clh1234567890abcdefghijkl' };
                const result = articleIdSchema.safeParse(validId);
                assert.strictEqual(result.success, true);
            });

            it('should reject invalid article ID', () => {
                const invalidId = { id: 'invalid-id' };
                const result = articleIdSchema.safeParse(invalidId);
                assert.strictEqual(result.success, false);
            });
        });

        describe('articleCreateSchema', () => {
            it('should accept valid article creation data', () => {
                const validData = {
                    title: 'My Article',
                    category: 'Security',
                    iconName: 'Shield',
                };
                const result = articleCreateSchema.safeParse(validData);
                assert.strictEqual(result.success, true);
            });

            it('should provide defaults for optional fields', () => {
                const result = articleCreateSchema.safeParse({});
                assert.strictEqual(result.success, true);
                assert.strictEqual(result.data.title, 'Untitled Article');
                assert.strictEqual(result.data.category, 'General');
            });

            it('should reject extra fields (strict mode)', () => {
                const dataWithExtra = {
                    title: 'Test',
                    unknownField: 'value',
                };
                const result = articleCreateSchema.safeParse(dataWithExtra);
                assert.strictEqual(result.success, false);
            });
        });

        describe('articleUpdateSchema', () => {
            it('should accept partial updates', () => {
                const partialUpdate = { title: 'Updated Title' };
                const result = articleUpdateSchema.safeParse(partialUpdate);
                assert.strictEqual(result.success, true);
            });

            it('should validate readTime range', () => {
                const validReadTime = { readTime: 5 };
                const invalidReadTime = { readTime: 200 };
                
                assert.strictEqual(articleUpdateSchema.safeParse(validReadTime).success, true);
                assert.strictEqual(articleUpdateSchema.safeParse(invalidReadTime).success, false);
            });

            it('should reject XSS in title', () => {
                const xssAttempt = { title: '<script>alert("xss")</script>' };
                const result = articleUpdateSchema.safeParse(xssAttempt);
                assert.strictEqual(result.success, false);
            });
        });
    });
});
