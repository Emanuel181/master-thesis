import { createTwoFilesPatch } from 'diff';

/**
 * Build a standard unified diff for a single file's patch.
 * Returns empty string when the file is unchanged.
 */
export function buildUnifiedDiff(filePath, originalCode, fixedCode) {
    if (originalCode === fixedCode) return '';
    return createTwoFilesPatch(
        `a/${filePath}`,
        `b/${filePath}`,
        originalCode ?? '',
        fixedCode ?? '',
        'before fix',
        'after fix',
        { context: 3 },
    );
}

