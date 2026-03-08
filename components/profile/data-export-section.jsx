'use client'

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Download, FileJson, FileSpreadsheet, FileText, Loader2 } from "lucide-react"

// ── Demo mock export data ────────────────────────────────────────────────
const DEMO_EXPORT_DATA = {
    exportInfo: {
        exportedAt: new Date().toISOString(),
        dataController: 'VulnIQ',
        dataControllerContact: 'privacy@vulniq.org',
        format: 'JSON',
        gdprReference: 'EU GDPR Article 20 - Right to data portability',
    },
    personalData: {
        id: 'demo-user-001',
        email: 'demo@vulniq.com',
        name: 'Demo User',
        firstName: 'Demo',
        lastName: 'User',
        phone: '+1 (555) 123-4567',
        jobTitle: 'Security Engineer',
        company: 'VulnIQ Demo Inc.',
        bio: 'This is a demo account showcasing VulnIQ profile management features.',
        location: 'San Francisco, CA',
        emailVerified: '2025-01-15T10:00:00.000Z',
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2026-03-08T12:00:00.000Z',
    },
    consent: {
        gdprConsentAt: '2025-01-15T10:00:00.000Z',
        marketingConsent: false,
        dataExportedAt: null,
        deletionRequestedAt: null,
    },
    linkedAccounts: [
        { provider: 'github', providerAccountId: '12345678' },
    ],
    useCases: [
        {
            id: 'uc-demo-1',
            title: 'OWASP Top 10',
            content: 'Security analysis for OWASP Top 10 vulnerabilities',
            icon: 'Shield',
            createdAt: '2025-02-01T10:00:00.000Z',
            updatedAt: '2025-06-15T14:30:00.000Z',
            folders: [],
            documents: [
                { id: 'doc-1', title: 'OWASP-Top-10-2021.pdf', url: 'demo', size: 245760, createdAt: '2025-02-01T10:05:00.000Z' },
            ],
        },
    ],
    prompts: [
        { id: 'p-demo-1', agent: 'reviewer', title: 'Security Code Review', text: 'Review the code for security vulnerabilities...', createdAt: '2025-03-01T10:00:00.000Z', updatedAt: '2025-03-01T10:00:00.000Z' },
        { id: 'p-demo-2', agent: 'fixer', title: 'Vulnerability Fix Suggestions', text: 'Provide fix suggestions for identified vulnerabilities...', createdAt: '2025-03-01T10:00:00.000Z', updatedAt: '2025-03-01T10:00:00.000Z' },
    ],
    articles: [
        { id: 'art-demo-1', title: 'Understanding SQL Injection', slug: 'understanding-sql-injection', excerpt: 'A deep dive into SQL injection vulnerabilities', category: 'Web Security', status: 'PUBLISHED', readTime: '10 min read', createdAt: '2025-04-10T08:00:00.000Z', updatedAt: '2025-04-12T10:00:00.000Z', publishedAt: '2025-04-12T10:00:00.000Z' },
        { id: 'art-demo-2', title: 'API Security Best Practices', slug: 'api-security-best-practices', excerpt: 'Essential security measures for REST APIs', category: 'API Security', status: 'DRAFT', readTime: '6 min read', createdAt: '2025-05-20T09:00:00.000Z', updatedAt: '2026-03-01T11:00:00.000Z', publishedAt: null },
    ],
    savedArticles: [
        { savedAt: '2025-06-01T14:00:00.000Z', article: { id: 'art-ext-1', title: 'OWASP Top 10 Explained', slug: 'owasp-top-10-explained', category: 'Web Security', authorName: 'Jane Doe' } },
    ],
    workflowRuns: [
        { id: 'wr-demo-1', status: 'completed', startedAt: '2026-03-07T15:00:00.000Z', completedAt: '2026-03-07T15:05:00.000Z', totalUseCases: 2, completedUseCases: 2, projectName: 'my-web-app', createdAt: '2026-03-07T15:00:00.000Z', useCaseRuns: [{ id: 'ucr-1', useCaseTitle: 'OWASP Top 10', status: 'completed', startedAt: '2026-03-07T15:00:00.000Z', completedAt: '2026-03-07T15:03:00.000Z' }] },
        { id: 'wr-demo-2', status: 'completed', startedAt: '2026-03-01T10:00:00.000Z', completedAt: '2026-03-01T10:03:00.000Z', totalUseCases: 1, completedUseCases: 1, projectName: 'api-service', createdAt: '2026-03-01T10:00:00.000Z', useCaseRuns: [] },
    ],
    vulnerabilities: [
        { id: 'vuln-1', workflowRunId: 'wr-demo-1', severity: 'High', title: 'SQL Injection in login handler', type: 'Security', fileName: 'auth/login.js', cweId: 'CWE-89', confidence: 0.95, falsePositive: false, resolved: true, resolvedAt: '2026-03-07T16:00:00.000Z', createdAt: '2026-03-07T15:03:00.000Z', fixes: [{ id: 'fix-1', fileName: 'auth/login.js', explanation: 'Use parameterized queries instead of string concatenation', status: 'APPLIED', prUrl: null, createdAt: '2026-03-07T15:04:00.000Z' }] },
        { id: 'vuln-2', workflowRunId: 'wr-demo-1', severity: 'Medium', title: 'Missing rate limiting on API endpoint', type: 'Security', fileName: 'api/users.js', cweId: 'CWE-770', confidence: 0.8, falsePositive: false, resolved: false, resolvedAt: null, createdAt: '2026-03-07T15:03:00.000Z', fixes: [] },
    ],
    notifications: [
        { id: 'notif-1', type: 'ARTICLE_APPROVED', title: 'Article approved', message: 'Your article "Understanding SQL Injection" has been approved and published.', read: true, createdAt: '2025-04-12T10:00:00.000Z' },
        { id: 'notif-2', type: 'WORKFLOW_COMPLETE', title: 'Scan complete', message: 'Workflow run for "my-web-app" completed. 2 vulnerabilities found.', read: false, createdAt: '2026-03-07T15:05:00.000Z' },
    ],
    articleReactions: [
        { type: 'like', articleId: 'art-ext-1', articleTitle: 'OWASP Top 10 Explained', createdAt: '2025-06-01T14:05:00.000Z' },
    ],
    useCaseGroups: [
        { id: 'grp-1', name: 'Web Security', icon: 'Shield', order: 0, parentId: null, createdAt: '2025-02-01T10:00:00.000Z' },
    ],
    agentConfigurations: [
        { agentType: 'reviewer', modelId: 'anthropic.claude-3-5-sonnet', enabled: true, createdAt: '2025-03-01T10:00:00.000Z', updatedAt: '2026-01-15T09:00:00.000Z' },
        { agentType: 'implementer', modelId: 'anthropic.claude-3-5-sonnet', enabled: true, createdAt: '2025-03-01T10:00:00.000Z', updatedAt: '2026-01-15T09:00:00.000Z' },
    ],
    security: {
        mfa: { enabled: true, method: 'totp', verifiedAt: '2025-02-01T12:00:00.000Z', lastUsedAt: '2026-03-08T09:00:00.000Z' },
        passkeys: [
            { id: 'pk-1', deviceType: 'multiDevice', backedUp: true, deviceName: 'MacBook Pro Touch ID', lastUsedAt: '2026-03-08T09:00:00.000Z', createdAt: '2025-03-15T10:00:00.000Z' },
        ],
        warnings: [],
    },
    activityLog: [
        { action: 'LOGIN', createdAt: '2026-03-08T09:00:00.000Z', resource: 'session' },
        { action: 'DATA_EXPORT', createdAt: '2026-03-08T12:00:00.000Z', resource: 'user' },
    ],
}

// ── Format conversion helpers ────────────────────────────────────────────

/**
 * Flatten nested object into dot-notation key-value pairs for CSV.
 */
function flattenObject(obj, prefix = '') {
    const result = {}
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            Object.assign(result, flattenObject(value, fullKey))
        } else if (Array.isArray(value)) {
            result[fullKey] = JSON.stringify(value)
        } else {
            result[fullKey] = value ?? ''
        }
    }
    return result
}

/**
 * Convert export data to CSV string.
 */
function toCSV(data) {
    const sections = []

    // Personal Data
    const personalFlat = flattenObject(data.personalData)
    sections.push('# Personal Data')
    sections.push('Field,Value')
    for (const [key, value] of Object.entries(personalFlat)) {
        sections.push(`"${key}","${String(value).replace(/"/g, '""')}"`)
    }

    // Consent
    sections.push('')
    sections.push('# Consent')
    sections.push('Field,Value')
    for (const [key, value] of Object.entries(data.consent || {})) {
        sections.push(`"${key}","${String(value ?? '').replace(/"/g, '""')}"`)
    }

    // Linked Accounts
    sections.push('')
    sections.push('# Linked Accounts')
    sections.push('Provider,Account ID')
    for (const acc of data.linkedAccounts || []) {
        sections.push(`"${acc.provider}","${acc.providerAccountId || ''}"`)
    }

    // Use Cases
    sections.push('')
    sections.push('# Use Cases')
    sections.push('ID,Title,Content,Icon,Created At,Updated At,Documents,Folders')
    for (const uc of data.useCases || []) {
        sections.push(`"${uc.id}","${(uc.title || '').replace(/"/g, '""')}","${(uc.content || '').replace(/"/g, '""')}","${uc.icon || ''}","${uc.createdAt}","${uc.updatedAt}","${JSON.stringify(uc.documents || []).replace(/"/g, '""')}","${JSON.stringify(uc.folders || []).replace(/"/g, '""')}"`)
    }

    // Prompts
    sections.push('')
    sections.push('# Prompts')
    sections.push('ID,Agent,Title,Text,Created At,Updated At')
    for (const p of data.prompts || []) {
        sections.push(`"${p.id}","${p.agent}","${(p.title || '').replace(/"/g, '""')}","${(p.text || '').replace(/"/g, '""')}","${p.createdAt}","${p.updatedAt}"`)
    }

    // Articles
    sections.push('')
    sections.push('# Your Articles')
    sections.push('ID,Title,Slug,Category,Status,Read Time,Created At,Published At')
    for (const a of data.articles || []) {
        sections.push(`"${a.id}","${(a.title || '').replace(/"/g, '""')}","${a.slug || ''}","${a.category || ''}","${a.status || ''}","${a.readTime || ''}","${a.createdAt}","${a.publishedAt || ''}"`)
    }

    // Saved Articles
    sections.push('')
    sections.push('# Saved Articles')
    sections.push('Article ID,Title,Slug,Category,Author,Saved At')
    for (const sa of data.savedArticles || []) {
        const a = sa.article || {}
        sections.push(`"${a.id || ''}","${(a.title || '').replace(/"/g, '""')}","${a.slug || ''}","${a.category || ''}","${(a.authorName || '').replace(/"/g, '""')}","${sa.savedAt}"`)
    }

    // Workflow Runs
    sections.push('')
    sections.push('# Workflow Runs')
    sections.push('ID,Status,Project,Started At,Completed At,Use Cases,Completed Use Cases')
    for (const wr of data.workflowRuns || []) {
        sections.push(`"${wr.id}","${wr.status}","${(wr.projectName || '').replace(/"/g, '""')}","${wr.startedAt}","${wr.completedAt || ''}","${wr.totalUseCases}","${wr.completedUseCases}"`)
    }

    // Vulnerabilities
    sections.push('')
    sections.push('# Vulnerabilities')
    sections.push('ID,Severity,Title,Type,File,CWE,Confidence,False Positive,Resolved,Created At')
    for (const v of data.vulnerabilities || []) {
        sections.push(`"${v.id}","${v.severity}","${(v.title || '').replace(/"/g, '""')}","${v.type}","${v.fileName}","${v.cweId || ''}","${v.confidence}","${v.falsePositive}","${v.resolved}","${v.createdAt}"`)
    }

    // Notifications
    sections.push('')
    sections.push('# Notifications')
    sections.push('Type,Title,Message,Read,Created At')
    for (const n of data.notifications || []) {
        sections.push(`"${n.type}","${(n.title || '').replace(/"/g, '""')}","${(n.message || '').replace(/"/g, '""')}","${n.read}","${n.createdAt}"`)
    }

    // Article Reactions
    sections.push('')
    sections.push('# Article Reactions')
    sections.push('Type,Article Title,Created At')
    for (const r of data.articleReactions || []) {
        sections.push(`"${r.type}","${(r.articleTitle || '').replace(/"/g, '""')}","${r.createdAt}"`)
    }

    // Agent Configurations
    sections.push('')
    sections.push('# Agent Configurations')
    sections.push('Agent Type,Model ID,Enabled,Created At')
    for (const ac of data.agentConfigurations || []) {
        sections.push(`"${ac.agentType}","${ac.modelId || ''}","${ac.enabled}","${ac.createdAt}"`)
    }

    // Security
    if (data.security) {
        sections.push('')
        sections.push('# Security - MFA')
        sections.push('Enabled,Method,Verified At,Last Used At')
        const mfa = data.security.mfa
        if (mfa) {
            sections.push(`"${mfa.enabled}","${mfa.method}","${mfa.verifiedAt || ''}","${mfa.lastUsedAt || ''}"`)
        }
        sections.push('')
        sections.push('# Security - Passkeys')
        sections.push('Device Type,Device Name,Backed Up,Last Used At,Created At')
        for (const p of data.security.passkeys || []) {
            sections.push(`"${p.deviceType}","${(p.deviceName || '').replace(/"/g, '""')}","${p.backedUp}","${p.lastUsedAt || ''}","${p.createdAt}"`)
        }
        sections.push('')
        sections.push('# Security - Warnings')
        sections.push('Reason,Created At')
        for (const w of data.security.warnings || []) {
            sections.push(`"${(w.reason || '').replace(/"/g, '""')}","${w.createdAt}"`)
        }
    }

    // Activity Log
    sections.push('')
    sections.push('# Activity Log')
    sections.push('Action,Timestamp,Resource')
    for (const log of data.activityLog || []) {
        sections.push(`"${log.action}","${log.createdAt || log.timestamp || ''}","${log.resource || ''}"`)
    }

    return sections.join('\n')
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

/**
 * Convert export data to a professionally styled HTML document.
 * Matches the VulnIQ branded report style.
 */
async function toHTML(data) {
    const fmtDate = (d) => {
        if (!d) return '—'
        try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
        catch { return escapeHtml(d) }
    }

    const kv = (obj) =>
        Object.entries(obj || {})
            .map(([k, v]) => `<tr><td class="kv-key">${escapeHtml(k)}</td><td class="kv-val">${escapeHtml(v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : v)}</td></tr>`)
            .join('')

    const badge = (text, color = '#6366f1') =>
        `<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;color:#fff;background:${color};">${escapeHtml(text)}</span>`

    const sectionCount = (arr) => `<span class="count">${(arr || []).length}</span>`

    // Fetch the actual VulnIQ logo from public/favicon.png and embed as base64
    let logoHtml = ''
    try {
        const logoRes = await fetch('/favicon.png')
        if (logoRes.ok) {
            const blob = await logoRes.blob()
            const base64 = await new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result)
                reader.readAsDataURL(blob)
            })
            logoHtml = `<img src="${base64}" alt="VulnIQ" style="width:40px;height:40px;border-radius:8px;" />`
        }
    } catch {
        // Fallback: no logo image
    }
    // If logo fetch failed, use a styled text fallback
    if (!logoHtml) {
        logoHtml = `<div style="width:40px;height:40px;border-radius:8px;background:#12A3F5;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:700;">V</div>`
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VulnIQ — Data Export Report</title>
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6; color: #1a1a1f; background: #f8f8fa;
  }
  .page { max-width: 960px; margin: 0 auto; padding: 0 24px 60px; }

  /* ── Header ── */
  .cover {
    background: linear-gradient(135deg, #0B1F47 0%, #061433 50%, #0B1F47 100%);
    padding: 48px 0 40px; margin-bottom: 40px; text-align: center; position: relative; overflow: hidden;
  }
  .cover::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
    background: linear-gradient(90deg, #12A3F5, #00DEB8);
  }
  .cover .logo { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .cover .logo-text { color: #fff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
  .cover .logo-text span { color: #12A3F5; }
  .cover h1 { color: #E5F5FF; font-size: 22px; font-weight: 400; margin-bottom: 8px; }
  .cover .meta-line { color: #9EA3AE; font-size: 13px; }
  .cover .meta-line strong { color: #E5F5FF; }

  /* ── Sections ── */
  .section { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 24px; overflow: hidden; page-break-inside: avoid; }
  .section-header {
    display: flex; align-items: center; gap: 10px; padding: 16px 24px;
    background: linear-gradient(90deg, #f0f7ff 0%, #fff 100%);
    border-bottom: 1px solid #e5e7eb;
  }
  .section-header h2 { font-size: 16px; font-weight: 700; color: #0B1F47; flex: 1; }
  .section-header .icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #12A3F5; color: #fff; font-size: 14px; font-weight: 700; }
  .count { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; padding: 0 8px; border-radius: 12px; background: #12A3F5; color: #fff; font-size: 12px; font-weight: 600; }
  .section-body { padding: 20px 24px; }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 14px; background: #f0f2f5; color: #333842; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb; }
  td { padding: 10px 14px; border-bottom: 1px solid #f0f2f5; color: #333842; vertical-align: top; }
  tr:hover td { background: #fafbfc; }
  .kv-key { font-weight: 600; color: #0B1F47; width: 200px; white-space: nowrap; }
  .kv-val { color: #333842; word-break: break-word; }
  .empty-msg { padding: 24px; text-align: center; color: #9EA3AE; font-style: italic; font-size: 13px; }

  /* ── Sub-sections ── */
  .sub-section { margin-top: 16px; }
  .sub-section h3 { font-size: 14px; font-weight: 600; color: #333842; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #e5e7eb; }

  /* ── Footer ── */
  .footer {
    margin-top: 48px; padding: 24px; text-align: center;
    border-top: 1px solid #e5e7eb; color: #9EA3AE; font-size: 12px;
  }
  .footer .brand { color: #12A3F5; font-weight: 600; }

  @media print {
    body { background: #fff; }
    .cover { break-after: avoid; }
    .section { break-inside: avoid; box-shadow: none; }
  }
</style>
</head>
<body>

<!-- Cover / Header -->
<div class="cover">
  <div class="logo">${logoHtml}<span class="logo-text">Vuln<span>IQ</span></span></div>
  <h1>Personal Data Export Report</h1>
  <p class="meta-line">Exported on <strong>${escapeHtml(data.exportInfo?.exportedAt ? new Date(data.exportInfo.exportedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toISOString())}</strong></p>
  <p class="meta-line" style="margin-top:4px;">${escapeHtml(data.exportInfo?.gdprReference || 'EU GDPR Article 20 — Right to data portability')}</p>
</div>

<div class="page">

<!-- Personal Data -->
<div class="section">
  <div class="section-header"><div class="icon">👤</div><h2>Personal Data</h2></div>
  <div class="section-body"><table>${kv(data.personalData)}</table></div>
</div>

<!-- Consent -->
<div class="section">
  <div class="section-header"><div class="icon">✓</div><h2>Consent &amp; GDPR</h2></div>
  <div class="section-body"><table>${kv(data.consent)}</table></div>
</div>

<!-- Linked Accounts -->
<div class="section">
  <div class="section-header"><div class="icon">🔗</div><h2>Linked Accounts</h2>${sectionCount(data.linkedAccounts)}</div>
  <div class="section-body">
    ${(data.linkedAccounts || []).length ? `<table><tr><th>Provider</th><th>Account ID</th></tr>${(data.linkedAccounts || []).map(a => `<tr><td>${badge(a.provider, '#333842')}</td><td><code>${escapeHtml(a.providerAccountId)}</code></td></tr>`).join('')}</table>` : '<div class="empty-msg">No linked accounts</div>'}
  </div>
</div>

<!-- Use Cases -->
<div class="section">
  <div class="section-header"><div class="icon">📁</div><h2>Knowledge Base / Use Cases</h2>${sectionCount(data.useCases)}</div>
  <div class="section-body">
    ${(data.useCases || []).length ? `<table><tr><th>Title</th><th>Content</th><th>Documents</th><th>Created</th></tr>${(data.useCases || []).map(uc => `<tr><td><strong>${escapeHtml(uc.title)}</strong></td><td>${escapeHtml((uc.content || '').substring(0, 120))}${(uc.content || '').length > 120 ? '…' : ''}</td><td>${(uc.documents || uc.pdfs || []).length} file(s)</td><td>${fmtDate(uc.createdAt)}</td></tr>`).join('')}</table>` : '<div class="empty-msg">No use cases</div>'}
  </div>
</div>

<!-- Use Case Groups -->
${(data.useCaseGroups || []).length ? `
<div class="section">
  <div class="section-header"><div class="icon">📂</div><h2>Use Case Groups</h2>${sectionCount(data.useCaseGroups)}</div>
  <div class="section-body">
    <table><tr><th>Name</th><th>Icon</th><th>Order</th><th>Created</th></tr>
    ${data.useCaseGroups.map(g => `<tr><td><strong>${escapeHtml(g.name)}</strong></td><td>${escapeHtml(g.icon)}</td><td>${g.order}</td><td>${fmtDate(g.createdAt)}</td></tr>`).join('')}</table>
  </div>
</div>` : ''}

<!-- Prompts -->
<div class="section">
  <div class="section-header"><div class="icon">💬</div><h2>Prompts</h2>${sectionCount(data.prompts)}</div>
  <div class="section-body">
    ${(data.prompts || []).length ? `<table><tr><th>Agent</th><th>Title</th><th>Text (preview)</th><th>Created</th></tr>${(data.prompts || []).map(p => `<tr><td>${badge(p.agent)}</td><td>${escapeHtml(p.title)}</td><td>${escapeHtml((p.text || '').substring(0, 150))}${(p.text || '').length > 150 ? '…' : ''}</td><td>${fmtDate(p.createdAt)}</td></tr>`).join('')}</table>` : '<div class="empty-msg">No prompts</div>'}
  </div>
</div>

<!-- Articles -->
<div class="section">
  <div class="section-header"><div class="icon">📝</div><h2>Your Articles</h2>${sectionCount(data.articles)}</div>
  <div class="section-body">
    ${(data.articles || []).length ? `<table><tr><th>Title</th><th>Category</th><th>Status</th><th>Created</th><th>Published</th></tr>${(data.articles || []).map(a => {
        const statusColor = a.status === 'PUBLISHED' ? '#1EB870' : a.status === 'REJECTED' ? '#E81F24' : '#F59E0A'
        return `<tr><td><strong>${escapeHtml(a.title)}</strong></td><td>${escapeHtml(a.category)}</td><td>${badge(a.status, statusColor)}</td><td>${fmtDate(a.createdAt)}</td><td>${fmtDate(a.publishedAt)}</td></tr>`
    }).join('')}</table>` : '<div class="empty-msg">No articles</div>'}
  </div>
</div>

<!-- Saved Articles -->
<div class="section">
  <div class="section-header"><div class="icon">🔖</div><h2>Saved Articles</h2>${sectionCount(data.savedArticles)}</div>
  <div class="section-body">
    ${(data.savedArticles || []).length ? `<table><tr><th>Title</th><th>Category</th><th>Author</th><th>Saved</th></tr>${(data.savedArticles || []).map(sa => `<tr><td>${escapeHtml(sa.article?.title)}</td><td>${escapeHtml(sa.article?.category)}</td><td>${escapeHtml(sa.article?.authorName)}</td><td>${fmtDate(sa.savedAt)}</td></tr>`).join('')}</table>` : '<div class="empty-msg">No saved articles</div>'}
  </div>
</div>

<!-- Article Reactions -->
${(data.articleReactions || []).length ? `
<div class="section">
  <div class="section-header"><div class="icon">❤️</div><h2>Article Reactions</h2>${sectionCount(data.articleReactions)}</div>
  <div class="section-body">
    <table><tr><th>Type</th><th>Article</th><th>Date</th></tr>
    ${data.articleReactions.map(r => `<tr><td>${badge(r.type, '#CC388E')}</td><td>${escapeHtml(r.articleTitle)}</td><td>${fmtDate(r.createdAt)}</td></tr>`).join('')}</table>
  </div>
</div>` : ''}

<!-- Workflow Runs -->
<div class="section">
  <div class="section-header"><div class="icon">⚡</div><h2>Workflow Runs</h2>${sectionCount(data.workflowRuns)}</div>
  <div class="section-body">
    ${(data.workflowRuns || []).length ? `<table><tr><th>Project</th><th>Status</th><th>Use Cases</th><th>Started</th><th>Completed</th></tr>${(data.workflowRuns || []).map(wr => {
        const statusColor = wr.status === 'completed' ? '#1EB870' : wr.status === 'failed' ? '#E81F24' : '#F59E0A'
        return `<tr><td><strong>${escapeHtml(wr.projectName || '—')}</strong></td><td>${badge(wr.status, statusColor)}</td><td>${wr.completedUseCases}/${wr.totalUseCases}</td><td>${fmtDate(wr.startedAt)}</td><td>${fmtDate(wr.completedAt)}</td></tr>`
    }).join('')}</table>` : '<div class="empty-msg">No workflow runs</div>'}
  </div>
</div>

<!-- Vulnerabilities -->
<div class="section">
  <div class="section-header"><div class="icon">🛡️</div><h2>Vulnerabilities</h2>${sectionCount(data.vulnerabilities)}</div>
  <div class="section-body">
    ${(data.vulnerabilities || []).length ? `<table><tr><th>Severity</th><th>Title</th><th>Type</th><th>File</th><th>CWE</th><th>Resolved</th><th>Fixes</th></tr>${(data.vulnerabilities || []).map(v => {
        const sevColor = { Critical: '#E81F24', High: '#CC388E', Medium: '#F59E0A', Low: '#1EB870' }[v.severity] || '#737882'
        return `<tr><td>${badge(v.severity, sevColor)}</td><td>${escapeHtml(v.title)}</td><td>${escapeHtml(v.type)}</td><td><code>${escapeHtml(v.fileName)}</code></td><td>${escapeHtml(v.cweId || '—')}</td><td>${v.resolved ? badge('Yes', '#1EB870') : badge('No', '#9EA3AE')}</td><td>${(v.fixes || []).length}</td></tr>`
    }).join('')}</table>` : '<div class="empty-msg">No vulnerabilities recorded</div>'}
  </div>
</div>

<!-- Notifications -->
${(data.notifications || []).length ? `
<div class="section">
  <div class="section-header"><div class="icon">🔔</div><h2>Notifications</h2>${sectionCount(data.notifications)}</div>
  <div class="section-body">
    <table><tr><th>Type</th><th>Title</th><th>Message</th><th>Read</th><th>Date</th></tr>
    ${(data.notifications || []).map(n => `<tr><td><code>${escapeHtml(n.type)}</code></td><td><strong>${escapeHtml(n.title)}</strong></td><td>${escapeHtml((n.message || '').substring(0, 100))}${(n.message || '').length > 100 ? '…' : ''}</td><td>${n.read ? '✓' : '—'}</td><td>${fmtDate(n.createdAt)}</td></tr>`).join('')}</table>
  </div>
</div>` : ''}

<!-- Agent Configurations -->
${(data.agentConfigurations || []).length ? `
<div class="section">
  <div class="section-header"><div class="icon">🤖</div><h2>Agent Configurations</h2>${sectionCount(data.agentConfigurations)}</div>
  <div class="section-body">
    <table><tr><th>Agent</th><th>Model</th><th>Enabled</th></tr>
    ${data.agentConfigurations.map(ac => `<tr><td>${badge(ac.agentType)}</td><td><code>${escapeHtml(ac.modelId || '—')}</code></td><td>${ac.enabled ? '✓ Yes' : '✗ No'}</td></tr>`).join('')}</table>
  </div>
</div>` : ''}

<!-- Security -->
<div class="section">
  <div class="section-header"><div class="icon">🔐</div><h2>Security Settings</h2></div>
  <div class="section-body">
    <div class="sub-section">
      <h3>Multi-Factor Authentication</h3>
      ${data.security?.mfa ? `<table><tr><th>Enabled</th><th>Method</th><th>Verified</th><th>Last Used</th></tr><tr><td>${data.security.mfa.enabled ? badge('Enabled', '#1EB870') : badge('Disabled', '#9EA3AE')}</td><td>${escapeHtml(data.security.mfa.method)}</td><td>${fmtDate(data.security.mfa.verifiedAt)}</td><td>${fmtDate(data.security.mfa.lastUsedAt)}</td></tr></table>` : '<div class="empty-msg">MFA not configured</div>'}
    </div>
    <div class="sub-section">
      <h3>Passkeys (${(data.security?.passkeys || []).length})</h3>
      ${(data.security?.passkeys || []).length ? `<table><tr><th>Device</th><th>Type</th><th>Backed Up</th><th>Last Used</th><th>Created</th></tr>${(data.security?.passkeys || []).map(p => `<tr><td>${escapeHtml(p.deviceName || '—')}</td><td>${escapeHtml(p.deviceType)}</td><td>${p.backedUp ? '✓' : '—'}</td><td>${fmtDate(p.lastUsedAt)}</td><td>${fmtDate(p.createdAt)}</td></tr>`).join('')}</table>` : '<div class="empty-msg">No passkeys registered</div>'}
    </div>
    ${(data.security?.warnings || []).length > 0 ? `<div class="sub-section"><h3>⚠️ Warnings (${data.security.warnings.length})</h3><table><tr><th>Reason</th><th>Date</th></tr>${data.security.warnings.map(w => `<tr><td>${escapeHtml(w.reason)}</td><td>${fmtDate(w.createdAt)}</td></tr>`).join('')}</table></div>` : ''}
  </div>
</div>

<!-- Activity Log -->
<div class="section">
  <div class="section-header"><div class="icon">📋</div><h2>Activity Log</h2>${sectionCount(data.activityLog)}</div>
  <div class="section-body">
    ${(data.activityLog || []).length ? `<table><tr><th>Action</th><th>Resource</th><th>Timestamp</th></tr>${(data.activityLog || []).map(l => `<tr><td><code>${escapeHtml(l.action)}</code></td><td>${escapeHtml(l.resource || '—')}</td><td>${fmtDate(l.createdAt || l.timestamp)}</td></tr>`).join('')}</table>` : '<div class="empty-msg">No activity recorded</div>'}
  </div>
</div>

<!-- Footer -->
<div class="footer">
  <p>Data Controller: <span class="brand">${escapeHtml(data.exportInfo?.dataController || 'VulnIQ')}</span></p>
  <p>Contact: ${escapeHtml(data.exportInfo?.dataControllerContact || 'privacy@vulniq.org')}</p>
  <p style="margin-top:12px;color:#ccc;">Generated by VulnIQ Data Export • ${new Date().getFullYear()}</p>
</div>

</div><!-- .page -->
</body>
</html>`
}

// ── Trigger file download ────────────────────────────────────────────────

function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }, 100)
}

// ── Format metadata ─────────────────────────────────────────────────────

const FORMAT_OPTIONS = [
    { value: 'json', label: 'JSON', icon: FileJson, mime: 'application/json', ext: 'json', description: 'Machine-readable, re-importable' },
    { value: 'csv', label: 'CSV', icon: FileSpreadsheet, mime: 'text/csv', ext: 'csv', description: 'Spreadsheet-compatible' },
    { value: 'html', label: 'HTML', icon: FileText, mime: 'text/html', ext: 'html', description: 'Human-readable report' },
]

// ── Component ────────────────────────────────────────────────────────────

export function DataExportSection({ isDemo = false }) {
    const [format, setFormat] = useState('json')
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = useCallback(async () => {
        setIsExporting(true)
        try {
            let exportData

            if (isDemo) {
                // Simulate a small network delay in demo
                await new Promise(r => setTimeout(r, 800))
                exportData = DEMO_EXPORT_DATA
            } else {
                const res = await fetch('/api/profile/export')
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    throw new Error(err.error || err.message || 'Failed to fetch your data')
                }
                // The API returns JSON directly (with Content-Disposition header).
                // Read the body as text first so we can both parse and re-serialize it.
                const text = await res.text()
                exportData = JSON.parse(text)
            }

            const fmt = FORMAT_OPTIONS.find(f => f.value === format)
            const timestamp = new Date().toISOString().slice(0, 10)
            const filename = `vulniq-data-export-${timestamp}.${fmt.ext}`

            if (format === 'json') {
                downloadBlob(JSON.stringify(exportData, null, 2), filename, fmt.mime)
            } else if (format === 'csv') {
                downloadBlob(toCSV(exportData), filename, fmt.mime)
            } else if (format === 'html') {
                downloadBlob(await toHTML(exportData), filename, fmt.mime)
            }

            toast.success(`Data exported as ${fmt.label}`, {
                description: `File "${filename}" has been downloaded.`,
            })
        } catch (error) {
            toast.error('Export failed', {
                description: error.message || 'Please try again later.',
            })
        } finally {
            setIsExporting(false)
        }
    }, [format, isDemo])

    const selectedFormat = FORMAT_OPTIONS.find(f => f.value === format)

    return (
        <Card>
            <CardHeader className="px-4 sm:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                            <Download className="h-5 w-5 text-primary" />
                            Export Your Data
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Download a copy of all data stored about you. Compliant with GDPR Article 20.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Format</Label>
                        <Select value={format} onValueChange={setFormat}>
                            <SelectTrigger className="w-full sm:w-[220px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FORMAT_OPTIONS.map((opt) => {
                                    const Icon = opt.icon
                                    return (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <span className="flex items-center gap-2">
                                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{opt.label}</span>
                                                <span className="text-muted-foreground text-[10px] hidden sm:inline">— {opt.description}</span>
                                            </span>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full sm:w-auto"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Exporting…
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                Download {selectedFormat?.label}
                            </>
                        )}
                    </Button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Your export includes: personal information, linked accounts, use cases &amp; documents, prompts, articles, saved articles, reactions, workflow runs, vulnerabilities &amp; fixes, notifications, agent configurations, security settings, consent records, and activity log.
                    {!isDemo && " Exports are rate-limited to 10 per hour."}
                </p>
            </CardContent>
        </Card>
    )
}


