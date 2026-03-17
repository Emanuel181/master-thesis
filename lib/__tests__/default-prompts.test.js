import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
    inferDefaultPromptMatch,
    getDefaultPromptMetadataUpdates,
    getEffectiveDefaultKeys,
} from '../default-prompts.js';

describe('default prompt legacy reconciliation', () => {
    it('matches a legacy default prompt by title within the same agent', () => {
        const match = inferDefaultPromptMatch({
            agent: 'tester',
            title: 'Deep SAST Analysis',
            text: 'user-edited text',
            order: 7,
            isDefault: false,
            defaultKey: null,
        });

        assert.ok(match);
        assert.strictEqual(match.defaultKey, 'tester-sast-deep-scan');
    });

    it('matches a legacy default prompt by order when title was edited', () => {
        const match = inferDefaultPromptMatch({
            agent: 'reviewer',
            title: 'My Customized Reviewer Prompt',
            text: 'edited body',
            order: 1,
            isDefault: false,
            defaultKey: null,
        });

        assert.ok(match);
        assert.strictEqual(match.defaultKey, 'reviewer-auth-review');
    });

    it('generates metadata backfill updates for legacy default prompts', () => {
        const updates = getDefaultPromptMetadataUpdates([
            {
                id: 'prompt-1',
                agent: 'tester',
                title: 'Full Penetration Test',
                text: 'customized text',
                order: 0,
                isDefault: false,
                defaultKey: null,
            },
            {
                id: 'prompt-2',
                agent: 'tester',
                title: 'Custom Prompt',
                text: 'totally custom',
                order: 9,
                isDefault: false,
                defaultKey: null,
            },
        ]);

        assert.deepStrictEqual(updates, [
            {
                id: 'prompt-1',
                isDefault: true,
                defaultKey: 'tester-penetration-scan',
            },
        ]);
    });

    it('treats reconciled legacy defaults as existing when checking for missing defaults', () => {
        const keys = getEffectiveDefaultKeys([
            {
                id: 'prompt-1',
                agent: 'implementation',
                title: 'Generate Secure Fix',
                text: 'edited implementation prompt',
                order: 0,
                isDefault: false,
                defaultKey: null,
            },
        ]);

        assert.ok(keys.has('implementation-secure-fix'));
        assert.strictEqual(keys.size, 1);
    });
});

