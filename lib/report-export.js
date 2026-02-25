/**
 * Report Export Utility
 * =====================
 *
 * Generates PDF and HTML security reports from vulnerability data.
 * Uses browser-native APIs for PDF generation (print to PDF).
 *
 * Features:
 * - Executive summary generation
 * - Severity breakdown charts
 * - Detailed vulnerability listings
 * - CVSS scoring display
 * - Remediation recommendations
 */

/**
 * Generate HTML report content
 *
 * @param {Object} data - Report data
 * @param {string} data.title - Report title
 * @param {Array} data.vulnerabilities - List of vulnerabilities
 * @param {Object} data.summary - Executive summary
 * @param {Object} data.metadata - Report metadata
 * @returns {string} HTML content
 */
export function generateHtmlReport(data) {
    const {
        title = 'Security Assessment Report',
        vulnerabilities = [],
        summary = {},
        metadata = {},
    } = data;

    const severityCounts = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
    };

    vulnerabilities.forEach(v => {
        if (severityCounts.hasOwnProperty(v.severity)) {
            severityCounts[v.severity]++;
        }
    });

    const totalVulns = vulnerabilities.length;
    const criticalAndHigh = severityCounts.Critical + severityCounts.High;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: #ffffff;
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            border-bottom: 3px solid #1a1a1a;
            padding-bottom: 20px;
            margin-bottom: 40px;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .header .meta {
            color: #666;
            font-size: 14px;
        }
        .executive-summary {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 40px;
        }
        .executive-summary h2 {
            font-size: 18px;
            margin-bottom: 16px;
            color: #1a1a1a;
        }
        .executive-summary p {
            color: #444;
            margin-bottom: 12px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .stat-card .value {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        .stat-card .label {
            font-size: 14px;
            color: #666;
        }
        .stat-card.critical .value { color: #dc2626; }
        .stat-card.high .value { color: #ea580c; }
        .stat-card.medium .value { color: #ca8a04; }
        .stat-card.low .value { color: #2563eb; }
        .severity-bar {
            display: flex;
            height: 24px;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 40px;
            background: #e0e0e0;
        }
        .severity-bar .segment {
            height: 100%;
            transition: width 0.3s;
        }
        .severity-bar .critical { background: #dc2626; }
        .severity-bar .high { background: #ea580c; }
        .severity-bar .medium { background: #ca8a04; }
        .severity-bar .low { background: #2563eb; }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
        }
        .vulnerability {
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 16px;
            page-break-inside: avoid;
        }
        .vulnerability .header-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        .vulnerability .title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;
        }
        .vulnerability .meta-row {
            display: flex;
            gap: 16px;
            font-size: 13px;
            color: #666;
        }
        .vulnerability .severity-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 600;
        }
        .severity-badge.critical { background: #fef2f2; color: #dc2626; }
        .severity-badge.high { background: #fff7ed; color: #ea580c; }
        .severity-badge.medium { background: #fefce8; color: #ca8a04; }
        .severity-badge.low { background: #eff6ff; color: #2563eb; }
        .vulnerability .description {
            color: #444;
            margin-bottom: 16px;
        }
        .vulnerability .code-block {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 16px;
            border-radius: 6px;
            font-family: 'Fira Code', 'Consolas', monospace;
            font-size: 13px;
            overflow-x: auto;
            margin-bottom: 16px;
        }
        .vulnerability .section-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #1a1a1a;
        }
        .vulnerability .remediation {
            background: #f0fdf4;
            border-left: 4px solid #22c55e;
            padding: 12px 16px;
            margin-top: 16px;
        }
        .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { padding: 20px; }
            .vulnerability { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">
            Generated on ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}
            ${metadata.projectName ? ` • Project: ${escapeHtml(metadata.projectName)}` : ''}
            ${metadata.scanId ? ` • Scan ID: ${escapeHtml(metadata.scanId)}` : ''}
        </div>
    </div>

    <div class="executive-summary">
        <h2>Executive Summary</h2>
        <p>
            This security assessment identified <strong>${totalVulns} vulnerabilities</strong> 
            across the analyzed codebase. 
            ${criticalAndHigh > 0 
                ? `<strong style="color: #dc2626;">${criticalAndHigh} critical/high severity issues</strong> require immediate attention.`
                : 'No critical or high severity issues were found.'
            }
        </p>
        ${summary.text ? `<p>${escapeHtml(summary.text)}</p>` : ''}
        ${summary.recommendations?.length > 0 ? `
        <p><strong>Top Recommendations:</strong></p>
        <ul style="margin-left: 20px; margin-top: 8px;">
            ${summary.recommendations.map(rec => `<li>${escapeHtml(rec)}</li>`).join('')}
        </ul>
        ` : ''}
    </div>

    <div class="stats-grid">
        <div class="stat-card critical">
            <div class="value">${severityCounts.Critical}</div>
            <div class="label">Critical</div>
        </div>
        <div class="stat-card high">
            <div class="value">${severityCounts.High}</div>
            <div class="label">High</div>
        </div>
        <div class="stat-card medium">
            <div class="value">${severityCounts.Medium}</div>
            <div class="label">Medium</div>
        </div>
        <div class="stat-card low">
            <div class="value">${severityCounts.Low}</div>
            <div class="label">Low</div>
        </div>
    </div>

    ${totalVulns > 0 ? `
    <div class="severity-bar">
        ${severityCounts.Critical > 0 ? `<div class="segment critical" style="width: ${(severityCounts.Critical / totalVulns) * 100}%"></div>` : ''}
        ${severityCounts.High > 0 ? `<div class="segment high" style="width: ${(severityCounts.High / totalVulns) * 100}%"></div>` : ''}
        ${severityCounts.Medium > 0 ? `<div class="segment medium" style="width: ${(severityCounts.Medium / totalVulns) * 100}%"></div>` : ''}
        ${severityCounts.Low > 0 ? `<div class="segment low" style="width: ${(severityCounts.Low / totalVulns) * 100}%"></div>` : ''}
    </div>
    ` : ''}

    <div class="section">
        <h2>Vulnerability Details</h2>
        ${vulnerabilities
            .sort((a, b) => {
                const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
                return (order[a.severity] || 4) - (order[b.severity] || 4);
            })
            .map(vuln => `
            <div class="vulnerability">
                <div class="header-row">
                    <div>
                        <div class="title">${escapeHtml(vuln.title)}</div>
                        <div class="meta-row">
                            <span>📁 ${escapeHtml(vuln.fileName || '—')}</span>
                            ${vuln.lineNumber ? `<span>📍 Line ${vuln.lineNumber}</span>` : ''}
                            ${vuln.cweId || vuln.type ? `<span>🏷️ ${escapeHtml(vuln.cweId || vuln.type)}</span>` : ''}
                        </div>
                    </div>
                    <span class="severity-badge ${vuln.severity.toLowerCase()}">
                        ● ${vuln.severity}
                    </span>
                </div>
                
                <div class="description">
                    ${escapeHtml(vuln.explanation || vuln.details || 'No description available.')}
                </div>

                ${vuln.vulnerableCode ? `
                <div>
                    <div class="section-title">Vulnerable Code</div>
                    <div class="code-block"><pre>${escapeHtml(vuln.vulnerableCode)}</pre></div>
                </div>
                ` : ''}

                ${vuln.bestPractices ? `
                <div class="remediation">
                    <div class="section-title">Recommended Fix</div>
                    <p>${escapeHtml(vuln.bestPractices)}</p>
                </div>
                ` : ''}
            </div>
            `).join('')}
    </div>

    <div class="footer">
        <p>Generated by VulnIQ Security Platform • ${new Date().getFullYear()}</p>
        <p>This report is confidential and intended for internal use only.</p>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Export report as HTML file download
 *
 * @param {Object} data - Report data
 * @param {string} filename - Output filename
 */
export function downloadHtmlReport(data, filename = 'security-report.html') {
    const html = generateHtmlReport(data);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    downloadBlob(blob, filename);
}

/**
 * Export report as PDF (opens print dialog)
 *
 * @param {Object} data - Report data
 */
export function exportToPdf(data) {
    const html = generateHtmlReport(data);

    // Create a new window with the report
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        throw new Error('Popup blocked. Please allow popups for this site.');
    }

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    printWindow.onload = () => {
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };
}

/**
 * Generate JSON report for API export
 *
 * @param {Object} data - Report data
 * @returns {Object} Structured report object
 */
export function generateJsonReport(data) {
    const {
        title = 'Security Assessment Report',
        vulnerabilities = [],
        summary = {},
        metadata = {},
    } = data;

    const severityCounts = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
    };

    vulnerabilities.forEach(v => {
        if (severityCounts.hasOwnProperty(v.severity)) {
            severityCounts[v.severity]++;
        }
    });

    return {
        report: {
            title,
            generatedAt: new Date().toISOString(),
            metadata,
        },
        summary: {
            totalVulnerabilities: vulnerabilities.length,
            severityCounts,
            criticalAndHigh: severityCounts.Critical + severityCounts.High,
            ...summary,
        },
        vulnerabilities: vulnerabilities.map(v => ({
            id: v.id,
            title: v.title,
            severity: v.severity,
            type: v.type,
            cweId: v.cweId,
            fileName: v.fileName,
            lineNumber: v.lineNumber,
            description: v.explanation || v.details,
            vulnerableCode: v.vulnerableCode,
            remediation: v.bestPractices,
            exploitExamples: v.exploitExamples,
            attackPath: v.attackPath,
            confidence: v.confidence,
            resolved: v.resolved,
        })),
    };
}

/**
 * Download JSON report
 *
 * @param {Object} data - Report data
 * @param {string} filename - Output filename
 */
export function downloadJsonReport(data, filename = 'security-report.json') {
    const report = generateJsonReport(data);
    const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json;charset=utf-8'
    });
    downloadBlob(blob, filename);
}

/**
 * Generate CSV export of vulnerabilities
 *
 * @param {Array} vulnerabilities - List of vulnerabilities
 * @returns {string} CSV content
 */
export function generateCsvReport(vulnerabilities) {
    const headers = [
        'ID',
        'Title',
        'Severity',
        'Type',
        'CWE',
        'File',
        'Line',
        'Description',
        'Remediation',
        'Confidence',
        'Status',
    ];

    const rows = vulnerabilities.map(v => [
        v.id,
        escapeCsvField(v.title),
        v.severity,
        v.type || '',
        v.cweId || '',
        v.fileName || '',
        v.lineNumber || '',
        escapeCsvField(v.explanation || v.details || ''),
        escapeCsvField(v.bestPractices || ''),
        v.confidence ?? '',
        v.resolved ? 'Resolved' : 'Open',
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
    ].join('\n');

    return csvContent;
}

/**
 * Download CSV report
 *
 * @param {Array} vulnerabilities - List of vulnerabilities
 * @param {string} filename - Output filename
 */
export function downloadCsvReport(vulnerabilities, filename = 'vulnerabilities.csv') {
    const csv = generateCsvReport(vulnerabilities);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, filename);
}

/**
 * Escape CSV field (handle quotes and commas)
 */
function escapeCsvField(field) {
    if (!field) return '';
    const str = String(field).replace(/"/g, '""');
    return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str}"`
        : str;
}

/**
 * Helper to download a blob as a file
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default {
    generateHtmlReport,
    downloadHtmlReport,
    exportToPdf,
    generateJsonReport,
    downloadJsonReport,
    generateCsvReport,
    downloadCsvReport,
};
