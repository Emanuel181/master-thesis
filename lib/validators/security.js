/**
 * Security Validation Schemas
 * ===========================
 *
 * Comprehensive Zod schemas for security-related API validation.
 * Used across vulnerability, workflow, and analytics endpoints.
 */

import { z } from "zod";
import { textSchema, cuidSchema } from "./common";

/**
 * Severity levels enum
 */
export const severitySchema = z.enum(['Critical', 'High', 'Medium', 'Low']);

/**
 * Vulnerability status enum
 */
export const vulnerabilityStatusSchema = z.enum(['open', 'resolved', 'false_positive', 'accepted_risk']);

/**
 * CVSS vector validation (CVSS 3.1/4.0 format)
 */
export const cvssVectorSchema = z.string()
    .regex(
        /^CVSS:(3\.[01]|4\.0)\/[A-Z]{2}:[A-Z](?:\/[A-Z]{1,2}:[A-Z])+$/,
        'Invalid CVSS vector format'
    )
    .optional();

/**
 * CWE ID validation (e.g., CWE-89, CWE-79)
 */
export const cweIdSchema = z.string()
    .regex(/^CWE-\d{1,4}$/i, 'Invalid CWE ID format')
    .transform(v => v.toUpperCase())
    .optional();

/**
 * Vulnerability creation schema
 */
export const createVulnerabilitySchema = z.object({
    title: textSchema('Title', 200),
    severity: severitySchema,
    type: z.string().max(100).optional(),
    details: z.string().max(10000),
    fileName: z.string().max(500),
    lineNumber: z.number().int().min(0).max(1000000).optional(),
    columnNumber: z.number().int().min(0).max(10000).optional(),
    vulnerableCode: z.string().max(50000).optional(),
    explanation: z.string().max(50000).optional(),
    bestPractices: z.string().max(50000).optional(),
    exploitExamples: z.string().max(50000).optional(),
    attackPath: z.string().max(50000).optional(),
    cweId: cweIdSchema,
    cvssVector: cvssVectorSchema,
    cvssScore: z.number().min(0).max(10).optional(),
    confidence: z.number().min(0).max(1).default(1),
    documentReferences: z.array(z.object({
        documentId: z.string().optional(),
        documentTitle: z.string().max(500),
        relevantExcerpt: z.string().max(2000).optional(),
    })).max(10).optional(),
});

/**
 * Vulnerability update schema
 */
export const updateVulnerabilitySchema = z.object({
    resolved: z.boolean().optional(),
    falsePositive: z.boolean().optional(),
    severity: severitySchema.optional(),
    explanation: z.string().max(50000).optional(),
    bestPractices: z.string().max(50000).optional(),
});

/**
 * Vulnerability filter schema
 */
export const vulnerabilityFilterSchema = z.object({
    severity: z.union([
        severitySchema,
        z.array(severitySchema),
    ]).optional(),
    type: z.string().max(100).optional(),
    status: vulnerabilityStatusSchema.optional(),
    fileName: z.string().max(500).optional(),
    cweId: cweIdSchema,
    search: z.string().max(200).optional(),
    resolved: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(['severity', 'createdAt', 'title', 'fileName']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Workflow run creation schema
 */
export const createWorkflowSchema = z.object({
    useCaseIds: z.array(cuidSchema).min(1, 'At least one use case is required'),
    selectedDocuments: z.array(cuidSchema).min(1, 'At least one knowledge base document must be selected for RAG-enabled security review'),
    agentConfigurations: z.object({
        reviewer: z.object({
            enabled: z.boolean().default(true),
            modelId: z.string().max(100).optional(),
            customPrompt: z.string().max(10000).optional(),
            promptId: cuidSchema.optional(),
        }).optional(),
        implementer: z.object({
            enabled: z.boolean().default(false),
            modelId: z.string().max(100).optional(),
            customPrompt: z.string().max(10000).optional(),
            promptId: cuidSchema.optional(),
        }).optional(),
        tester: z.object({
            enabled: z.boolean().default(true),
            modelId: z.string().max(100).optional(),
            customPrompt: z.string().max(10000).optional(),
            promptId: cuidSchema.optional(),
        }).optional(),
        reporter: z.object({
            enabled: z.boolean().default(true),
            modelId: z.string().max(100).optional(),
            customPrompt: z.string().max(10000).optional(),
            promptId: cuidSchema.optional(),
        }).optional(),
    }).optional(),
    metadata: z.object({
        code: z.union([
            z.string().max(1000000), // Single file code
            z.object({
                type: z.literal('project'),
                files: z.array(z.object({
                    path: z.string().max(500),
                    content: z.string().max(500000),
                    language: z.string().max(50),
                })).max(100),
                projectName: z.string().max(200).optional(),
            }),
            z.object({
                type: z.literal('single'),
                content: z.string().max(500000),
                fileName: z.string().max(200).optional(),
            }),
        ]),
        codeType: z.string().max(50),
        timestamp: z.string().optional(),
    }).optional(),
});

/**
 * Code fix schema
 */
export const codeFixSchema = z.object({
    vulnerabilityId: cuidSchema,
    fixedCode: z.string().max(500000),
    explanation: z.string().max(10000),
    changes: z.array(z.object({
        type: z.enum(['add', 'remove', 'modify']),
        lineNumber: z.number().int(),
        oldContent: z.string().max(10000).optional(),
        newContent: z.string().max(10000).optional(),
    })).max(1000),
});

/**
 * Report export schema
 */
export const reportExportSchema = z.object({
    format: z.enum(['pdf', 'html', 'json', 'csv']),
    vulnerabilityIds: z.array(cuidSchema).optional(),
    runId: cuidSchema.optional(),
    includeResolved: z.boolean().default(false),
    includeFalsePositives: z.boolean().default(false),
});

/**
 * API key creation schema
 */
export const apiKeySchema = z.object({
    name: textSchema('Name', 100),
    scopes: z.array(z.enum(['read', 'write', 'admin', 'workflow', 'export']))
        .min(1, 'At least one scope is required')
        .max(5),
    expiresInDays: z.number().int().min(1).max(365).optional().nullable(),
});

/**
 * MFA setup schema
 */
export const mfaSetupSchema = z.object({
    method: z.enum(['totp', 'sms', 'email']),
    phoneNumber: z.string()
        .regex(/^\+[1-9]\d{6,14}$/, 'Invalid phone number format')
        .optional(),
});

/**
 * MFA verification schema
 */
export const mfaVerifySchema = z.object({
    code: z.string()
        .length(6, 'Code must be 6 digits')
        .regex(/^\d{6}$/, 'Code must be numeric'),
    method: z.enum(['totp', 'sms', 'email', 'backup']).optional(),
});

/**
 * Date range schema for analytics
 */
export const dateRangeSchema = z.object({
    range: z.enum(['7d', '30d', '90d', '1y']).default('7d'),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
}).refine(
    (data) => {
        if (data.startDate && data.endDate) {
            return data.startDate <= data.endDate;
        }
        return true;
    },
    { message: 'Start date must be before end date' }
);

export default {
    severitySchema,
    vulnerabilityStatusSchema,
    cvssVectorSchema,
    cweIdSchema,
    createVulnerabilitySchema,
    updateVulnerabilitySchema,
    vulnerabilityFilterSchema,
    createWorkflowSchema,
    codeFixSchema,
    reportExportSchema,
    apiKeySchema,
    mfaSetupSchema,
    mfaVerifySchema,
    dateRangeSchema,
};
