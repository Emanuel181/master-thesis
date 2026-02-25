/**
 * VulnIQ Professional Security Report PDF Generator
 * Generates a premium, branded security assessment report in PDF format
 *
 * Features:
 * - Full VulnIQ branding with gradient-style cover
 * - Executive dashboard with severity distribution
 * - Professional typography and spacing
 * - Risk score gauge visualization
 * - Categorized vulnerability listings
 * - Compliance mapping tables
 * - Page headers/footers with branding
 */

import { PDFDocument, rgb, StandardFonts, PageSizes, PDFName } from 'pdf-lib';

// ─── VulnIQ Brand Color Palette ─────────────────────────────────────────────
const C = {
    // Brand
    brand:        rgb(0.07, 0.64, 0.96),   // #12A3F5 - VulnIQ signature blue
    brandDark:    rgb(0.04, 0.12, 0.28),   // #0B1F47 - Deep navy
    brandDeep:    rgb(0.02, 0.08, 0.20),   // #061433 - Darkest navy
    brandLight:   rgb(0.90, 0.96, 1.00),   // #E5F5FF - Ice blue tint
    brandAccent:  rgb(0.00, 0.87, 0.72),   // #00DEB8 - Teal accent (gradient end)

    // Severity
    critical:     rgb(0.91, 0.12, 0.14),   // #E81F24
    high:         rgb(0.80, 0.22, 0.56),   // #CC388E
    medium:       rgb(0.96, 0.62, 0.04),   // #F59E0A
    low:          rgb(0.12, 0.72, 0.44),   // #1EB870

    // Neutrals
    black:        rgb(0.10, 0.10, 0.12),   // #1A1A1F
    dark:         rgb(0.20, 0.22, 0.26),   // #333842
    gray:         rgb(0.45, 0.47, 0.51),   // #737882
    muted:        rgb(0.62, 0.64, 0.68),   // #9EA3AE
    light:        rgb(0.94, 0.95, 0.96),   // #F0F2F5
    lighter:      rgb(0.97, 0.97, 0.98),   // #F8F8FA
    white:        rgb(1, 1, 1),
};

const SEVERITY_COLORS = {
    Critical: C.critical, critical: C.critical,
    High: C.high, high: C.high,
    Medium: C.medium, medium: C.medium,
    Low: C.low, low: C.low,
};

// ─── Text Helpers ────────────────────────────────────────────────────────────
function sanitizeText(value) {
    if (value === null || value === undefined) return '';
    let t = typeof value === 'string' ? value : String(value);
    t = t.replace(/[\u2018\u2019\u201A]/g, "'")
         .replace(/[\u201C\u201D\u201E]/g, '"')
         .replace(/[\u2013\u2014]/g, '-')
         .replace(/\u2026/g, '...')
         .replace(/[\u2022]/g, '*')
         .replace(/[\u00A0]/g, ' ')
         .replace(/[\u200B-\u200D\uFEFF]/g, '')
         .replace(/\t/g, '    ')
         .replace(/\r\n/g, ' ')
         .replace(/[\r\n]/g, ' ');
    t = t.replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
    return t;
}

function truncate(str, max) {
    const s = sanitizeText(str);
    return s.length > max ? s.substring(0, max - 3) + '...' : s;
}

/** Like sanitizeText but preserves newlines for code blocks */
function sanitizeCodeText(value) {
    if (value === null || value === undefined) return '';
    let t = typeof value === 'string' ? value : String(value);
    t = t.replace(/[\u2018\u2019\u201A]/g, "'")
         .replace(/[\u201C\u201D\u201E]/g, '"')
         .replace(/[\u2013\u2014]/g, '-')
         .replace(/\u2026/g, '...')
         .replace(/[\u2022]/g, '*')
         .replace(/[\u00A0]/g, ' ')
         .replace(/[\u200B-\u200D\uFEFF]/g, '')
         .replace(/\t/g, '    ')
         .replace(/\r\n/g, '\n')
         .replace(/\r/g, '\n');
    t = t.replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '');
    return t;
}

// ─── Main Generator ──────────────────────────────────────────────────────────
export async function generateSecurityReportPDF(reportData) {
    const {
        runId,
        projectName = 'Security Assessment',
        timestamp = new Date().toISOString(),
        vulnerabilities = [],
        summary = {},
        organizationName = 'VulnIQ Security Analysis',
        assessorName = 'VulnIQ AI Security Engine',
    } = reportData;

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(`VulnIQ Security Report - ${sanitizeText(projectName)}`);
    pdfDoc.setAuthor('VulnIQ');
    pdfDoc.setSubject(`${sanitizeText(projectName)} Security Report`);
    pdfDoc.setCreator(sanitizeText(assessorName));

    const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);
    const fontMonoBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

    // Embed logo image once for reuse across pages
    let logoImage = null;
    if (reportData.logoBytes) {
        try {
            logoImage = await pdfDoc.embedPng(reportData.logoBytes);
        } catch (e) {
            console.warn('[PDF] Could not embed logo PNG:', e.message);
        }
    }

    const W = PageSizes.A4[0]; // 595.28
    const H = PageSizes.A4[1]; // 841.89
    const M = 50;              // margin
    const CW = W - M * 2;     // content width

    let page, y;
    let currentPageIndex = -1;

    // ── Utilities ────────────────────────────────────────────────────────────
    const newPage = () => { page = pdfDoc.addPage(PageSizes.A4); y = H - M; currentPageIndex++; return page; };
    const need = (h) => { if (y - h < M + 40) { newPage(); return true; } return false; };

    // Track which page index each section starts on
    const sectionPageIndex = {};

    const text = (str, x, yy, size, f, color) => {
        page.drawText(sanitizeText(str), { x, y: yy, size, font: f, color });
    };

    const textW = (str, size, f) => f.widthOfTextAtSize(sanitizeText(str), size);

    const rect = (x, yy, w, h, color, opts = {}) => {
        page.drawRectangle({ x, y: yy, width: w, height: h, color, ...opts });
    };

    const line = (x1, y1, x2, y2, thickness = 1, color = C.light) => {
        page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
    };

    // Word-wrap with paragraph support and long-word breaking
    const wrap = (rawText, x, maxW, size, f, color = C.black, lh = 1.5) => {
        if (!rawText) return 0;
        const paragraphs = String(rawText).split(/\r\n|\r|\n/);
        let total = 0;
        for (const para of paragraphs) {
            const safe = sanitizeText(para);
            if (!safe) { y -= size * lh; total += size * lh; continue; }
            const words = safe.split(' ').filter(Boolean);
            let ln = '', lines = [];
            for (const w of words) {
                // Break long words that alone exceed maxW
                if (f.widthOfTextAtSize(w, size) > maxW) {
                    if (ln) { lines.push(ln); ln = ''; }
                    let chunk = '';
                    for (const ch of w) {
                        if (f.widthOfTextAtSize(chunk + ch, size) > maxW && chunk) {
                            lines.push(chunk);
                            chunk = ch;
                        } else {
                            chunk += ch;
                        }
                    }
                    if (chunk) ln = chunk;
                    continue;
                }
                const test = ln ? `${ln} ${w}` : w;
                if (f.widthOfTextAtSize(test, size) > maxW && ln) { lines.push(ln); ln = w; }
                else ln = test;
            }
            if (ln) lines.push(ln);
            for (const l of lines) {
                need(size * lh);
                text(l, x, y, size, f, color);
                y -= size * lh;
            }
            total += lines.length * size * lh;
        }
        return total;
    };

    // Word-wrap for code blocks - preserves line breaks, uses monospace font
    // NOTE: Does NOT call need() per line — caller must ensure enough space exists
    const wrapCode = (rawText, x, maxW, size, f, color = C.dark, lh = 1.3) => {
        if (!rawText) return 0;
        const safe = sanitizeCodeText(rawText);
        const lines = safe.split('\n');
        let total = 0;
        for (const codeLine of lines) {
            if (!codeLine.trim()) {
                // Empty line - still advance
                y -= size * lh;
                total += size * lh;
                continue;
            }
            // Word-wrap each code line if it's too wide
            const words = codeLine.split(' ');
            let ln = '', wrappedLines = [];
            for (const w of words) {
                // Break very long tokens
                if (f.widthOfTextAtSize(w, size) > maxW) {
                    if (ln) { wrappedLines.push(ln); ln = ''; }
                    let chunk = '';
                    for (const ch of w) {
                        if (f.widthOfTextAtSize(chunk + ch, size) > maxW && chunk) {
                            wrappedLines.push(chunk);
                            chunk = ch;
                        } else {
                            chunk += ch;
                        }
                    }
                    if (chunk) ln = chunk;
                    continue;
                }
                const test = ln ? `${ln} ${w}` : w;
                if (f.widthOfTextAtSize(test, size) > maxW && ln) {
                    wrappedLines.push(ln);
                    ln = w;
                } else {
                    ln = test;
                }
            }
            if (ln) wrappedLines.push(ln);
            for (const l of wrappedLines) {
                text(l, x, y, size, f, color);
                y -= size * lh;
                total += size * lh;
            }
        }
        return total;
    };

    // Pre-calculate height for code blocks (without drawing)
    const calcCodeHeight = (rawText, maxW, size, f, lh = 1.3) => {
        if (!rawText) return 0;
        const safe = sanitizeCodeText(rawText);
        const lines = safe.split('\n');
        let total = 0;
        for (const codeLine of lines) {
            if (!codeLine.trim()) { total += size * lh; continue; }
            const words = codeLine.split(' ');
            let ln = '', lineCount = 0;
            for (const w of words) {
                if (f.widthOfTextAtSize(w, size) > maxW) {
                    if (ln) { lineCount++; ln = ''; }
                    let chunk = '';
                    for (const ch of w) {
                        if (f.widthOfTextAtSize(chunk + ch, size) > maxW && chunk) {
                            lineCount++;
                            chunk = ch;
                        } else {
                            chunk += ch;
                        }
                    }
                    if (chunk) ln = chunk;
                    continue;
                }
                const test = ln ? `${ln} ${w}` : w;
                if (f.widthOfTextAtSize(test, size) > maxW && ln) { lineCount++; ln = w; }
                else ln = test;
            }
            if (ln) lineCount++;
            total += lineCount * size * lh;
        }
        return total;
    };

    // Pre-calculate wrapped text height (for regular text, not code)
    // Mirrors the logic of wrap() so heights match exactly
    const calcWrapHeight = (rawText, maxW, size, f, lh = 1.5) => {
        if (!rawText) return 0;
        const paragraphs = String(rawText).split(/\r\n|\r|\n/);
        let total = 0;
        for (const para of paragraphs) {
            const safe = sanitizeText(para);
            if (!safe) { total += size * lh; continue; }
            const words = safe.split(' ').filter(Boolean);
            let ln = '', lineCount = 0;
            for (const w of words) {
                // Break long words that alone exceed maxW
                if (f.widthOfTextAtSize(w, size) > maxW) {
                    if (ln) { lineCount++; ln = ''; }
                    let chunk = '';
                    for (const ch of w) {
                        if (f.widthOfTextAtSize(chunk + ch, size) > maxW && chunk) {
                            lineCount++;
                            chunk = ch;
                        } else {
                            chunk += ch;
                        }
                    }
                    if (chunk) ln = chunk;
                    continue;
                }
                const test = ln ? `${ln} ${w}` : w;
                if (f.widthOfTextAtSize(test, size) > maxW && ln) { lineCount++; ln = w; }
                else ln = test;
            }
            if (ln) lineCount++;
            total += lineCount * size * lh;
        }
        return total;
    };

    // Section heading with accent underline
    const sectionHeading = (title) => {
        need(60);
        text(title, M, y, 17, fontBold, C.brandDark);
        y -= 8;
        // Accent bar (brand gradient look: left=brand, right=brandAccent)
        rect(M, y, CW * 0.35, 3, C.brand);
        rect(M + CW * 0.35, y, CW * 0.15, 3, C.brandAccent);
        y -= 22;
    };

    // Sub-heading
    const subHeading = (title) => {
        need(30);
        text(title, M, y, 12, fontBold, C.dark);
        y -= 18;
    };

    // Bullet point
    const bullet = (content, indent = 0) => {
        const bx = M + 8 + indent;
        need(14);
        page.drawCircle({ x: bx, y: y + 3, size: 2.5, color: C.brand });
        wrap(content, bx + 10, CW - 18 - indent, 10, font, C.dark, 1.45);
        y -= 2;
    };

    // ─── Computed Data ───────────────────────────────────────────────────────
    const critC = summary.criticalCount || 0;
    const highC = summary.highCount || 0;
    const medC  = summary.mediumCount || 0;
    const lowC  = summary.lowCount || 0;
    const totalV = summary.totalVulnerabilities || vulnerabilities.length || (critC + highC + medC + lowC);
    const riskScore = calcRiskScore(summary);
    const riskLevel = getRiskLevel(summary);
    const dateStr = new Date(timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // ═════════════════════════════════════════════════════════════════════════
    //  COVER PAGE
    // ═════════════════════════════════════════════════════════════════════════
    newPage();

    // Full-page dark background
    rect(0, 0, W, H, C.brandDeep);

    // Top decorative band (gradient simulation: two overlapping rects)
    rect(0, H - 8, W, 8, C.brand);
    rect(W * 0.6, H - 8, W * 0.4, 8, C.brandAccent);

    // Subtle geometric accent lines
    line(0, H - 360, W, H - 290, 0.5, rgb(0.12, 0.20, 0.35));
    line(0, H - 380, W, H - 310, 0.3, rgb(0.10, 0.16, 0.30));

    // VulnIQ Logo area - embed actual logo if available, else geometric fallback
    const logoY = H - 100;
    let logoEmbedded = false;
    if (logoImage) {
        try {
            const logoDim = logoImage.scaleToFit(38, 38);
            page.drawImage(logoImage, { x: M, y: logoY - 2, width: logoDim.width, height: logoDim.height });
            logoEmbedded = true;
        } catch (e) {
            // Fallback to geometric logo below
        }
    }
    if (!logoEmbedded) {
        // Geometric shield fallback
        rect(M, logoY - 2, 36, 36, C.brand);
        rect(M + 3, logoY + 1, 30, 30, C.brandDeep);
        text('V', M + 9, logoY + 7, 20, fontBold, C.brand);
    }
    // Brand name
    text('VulnIQ', M + 48, logoY + 8, 28, fontBold, C.white);

    // Main title - positioned higher to leave room for card
    const titleY = H - 200;
    text('SECURITY', M, titleY, 40, fontBold, C.white);
    text('ASSESSMENT', M, titleY - 46, 40, fontBold, C.white);
    text('REPORT', M, titleY - 92, 40, fontBold, C.brand);

    // Decorative accent line under title
    rect(M, titleY - 110, 80, 4, C.brand);
    rect(M + 80, titleY - 110, 40, 4, C.brandAccent);

    // Project info card - positioned well below the title accent line
    const cardY = titleY - 230;
    rect(M, cardY, CW, 100, rgb(0.08, 0.15, 0.30)); // slightly lighter card
    rect(M, cardY + 96, CW, 4, C.brand); // top accent

    text('PROJECT', M + 20, cardY + 72, 9, font, C.muted);
    text(truncate(projectName, 60), M + 20, cardY + 52, 18, fontBold, C.white);

    text('DATE', M + 20, cardY + 28, 9, font, C.muted);
    text(`${dateStr}  |  ${timeStr}`, M + 20, cardY + 12, 11, font, C.brandAccent);

    text('REPORT ID', M + CW * 0.55, cardY + 72, 9, font, C.muted);
    text(truncate(runId, 30), M + CW * 0.55, cardY + 52, 10, fontMono, rgb(0.5, 0.7, 0.9));

    text('ASSESSED BY', M + CW * 0.55, cardY + 28, 9, font, C.muted);
    text(truncate(assessorName, 35), M + CW * 0.55, cardY + 12, 11, font, C.white);

    // Quick stats bar at bottom of cover
    const statsY = cardY - 80;
    const statW = CW / 4;
    const statsData = [
        { label: 'CRITICAL', count: critC, color: C.critical },
        { label: 'HIGH', count: highC, color: C.high },
        { label: 'MEDIUM', count: medC, color: C.medium },
        { label: 'LOW', count: lowC, color: C.low },
    ];
    for (let i = 0; i < 4; i++) {
        const sx = M + i * statW;
        // Colored top bar
        rect(sx + 2, statsY + 44, statW - 4, 3, statsData[i].color);
        // Count
        const cntStr = String(statsData[i].count);
        text(cntStr, sx + statW / 2 - textW(cntStr, 26, fontBold) / 2, statsY + 10, 26, fontBold, C.white);
        // Label
        const lw = textW(statsData[i].label, 8, font);
        text(statsData[i].label, sx + statW / 2 - lw / 2, statsY - 8, 8, font, C.muted);
    }

    // Total bar
    const totalBarY = statsY - 50;
    rect(M, totalBarY, CW, 30, rgb(0.08, 0.15, 0.30));
    const totalLabel = `TOTAL VULNERABILITIES: ${totalV}`;
    text(totalLabel, M + CW / 2 - textW(totalLabel, 12, fontBold) / 2, totalBarY + 8, 12, fontBold, C.brand);

    // Bottom decorative band
    rect(0, 0, W, 8, C.brand);
    rect(0, 0, W * 0.4, 8, C.brandAccent);

    // Corner decoration - top left
    line(M - 10, H - 20, M + 20, H - 20, 0.5, rgb(0.12, 0.25, 0.45));
    line(M - 10, H - 20, M - 10, H - 50, 0.5, rgb(0.12, 0.25, 0.45));
    // Corner decoration - bottom right
    line(W - M + 10, 20, W - M - 20, 20, 0.5, rgb(0.12, 0.25, 0.45));
    line(W - M + 10, 20, W - M + 10, 50, 0.5, rgb(0.12, 0.25, 0.45));

    // Version / document classification
    text('Document Classification: CONFIDENTIAL', M, 40, 7, font, C.muted);

    // Confidential notice
    const confText = 'CONFIDENTIAL  -  FOR AUTHORIZED PERSONNEL ONLY';
    text(confText, W / 2 - textW(confText, 7, font) / 2, 20, 7, font, C.muted);

    // Generated by line
    const genStr = `Generated by ${sanitizeText(assessorName)}`;
    text(genStr, W - M - textW(genStr, 7, font), 40, 7, font, C.muted);

    // ═════════════════════════════════════════════════════════════════════════
    //  TABLE OF CONTENTS
    // ═════════════════════════════════════════════════════════════════════════
    newPage();
    const tocPageIndex = currentPageIndex;
    // Page header bar
    rect(0, H - 8, W, 8, C.brand);

    text('TABLE OF CONTENTS', M, y - 10, 22, fontBold, C.brandDark);
    y -= 20;
    rect(M, y, 60, 3, C.brand);
    rect(M + 60, y, 30, 3, C.brandAccent);
    y -= 16;
    text('Navigate to any section by clicking on the entry below', M, y, 9, fontItalic, C.muted);
    y -= 30;

    const toc = [
        ['01', 'Executive Summary'],
        ['02', 'Assessment Methodology'],
        ['03', 'Risk Dashboard'],
        ['04', 'Findings Overview'],
        ['05', 'File-Level Analysis Summary'],
        ['06', 'Detailed Vulnerability Analysis'],
        ['07', 'Remediation Roadmap'],
        ['08', 'Compliance Mapping'],
        ['09', 'Appendix & Glossary'],
    ];

    // Store TOC entry rectangles for link annotations (added after all pages are created)
    const tocEntries = [];
    for (const [num, title] of toc) {
        rect(M, y - 2, CW, 34, C.lighter);
        rect(M, y - 2, 4, 34, C.brand);
        // Number badge circle
        page.drawCircle({ x: M + 22, y: y + 12, size: 12, color: C.brandDark });
        text(num, M + 22 - textW(num, 10, fontBold) / 2, y + 7, 10, fontBold, C.white);
        // Title
        text(title, M + 44, y + 8, 13, font, C.dark);
        // Dotted leader line
        const leaderStartX = M + 44 + textW(title, 13, font) + 8;
        const leaderEndX = M + CW - 40;
        for (let dx = leaderStartX; dx < leaderEndX; dx += 6) {
            page.drawCircle({ x: dx, y: y + 3, size: 0.5, color: C.muted });
        }
        // Store the clickable region for this TOC entry
        tocEntries.push({ num, rectY: y - 2, rectH: 34 });
        y -= 44;
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  01 - EXECUTIVE SUMMARY
    // ═════════════════════════════════════════════════════════════════════════
    newPage();
    sectionPageIndex['01'] = currentPageIndex;
    sectionHeading('01  EXECUTIVE SUMMARY');

    wrap(
        `This security assessment was conducted on ${sanitizeText(projectName)} using VulnIQ's AI-powered multi-agent security analysis platform. The assessment employed a comprehensive approach combining static analysis, pattern recognition, and knowledge-base-driven review to identify vulnerabilities across the entire codebase.`,
        M, CW, 10.5, font, C.dark
    );
    y -= 10;
    wrap(
        `The analysis identified ${totalV} security findings across ${vulnerabilities.length > 0 ? new Set(vulnerabilities.map(v => v.fileName).filter(Boolean)).size : 0} files. Of these, ${critC} are classified as Critical and ${highC} as High severity, requiring immediate remediation action.`,
        M, CW, 10.5, font, C.dark
    );

    // Key metrics cards
    y -= 25;
    need(90);
    const metricW = (CW - 20) / 3;
    const metrics = [
        { label: 'Total Findings', value: String(totalV), accent: C.brand },
        { label: 'Files Analyzed', value: String(vulnerabilities.length > 0 ? new Set(vulnerabilities.map(v => v.fileName).filter(Boolean)).size : '-'), accent: C.brandAccent },
        { label: 'Risk Score', value: `${riskScore}/100`, accent: riskScore < 40 ? C.critical : riskScore < 70 ? C.medium : C.low },
    ];
    for (let i = 0; i < 3; i++) {
        const mx = M + i * (metricW + 10);
        rect(mx, y - 60, metricW, 60, C.lighter);
        rect(mx, y - 2, metricW, 3, metrics[i].accent);
        text(metrics[i].value, mx + 15, y - 30, 22, fontBold, C.brandDark);
        text(metrics[i].label, mx + 15, y - 48, 9, font, C.gray);
    }
    y -= 85;

    // Severity distribution bar
    y -= 20;
    need(90);
    text('SEVERITY DISTRIBUTION', M, y, 10, fontBold, C.dark);
    y -= 22;
    const barH = 18;
    const total = totalV || 1;
    const segments = [
        { w: (critC / total) * CW, c: C.critical },
        { w: (highC / total) * CW, c: C.high },
        { w: (medC / total) * CW, c: C.medium },
        { w: (lowC / total) * CW, c: C.low },
    ];
    // Draw bar background
    rect(M, y - barH, CW, barH, C.light);
    let barX = M;
    for (const seg of segments) {
        if (seg.w > 0) {
            rect(barX, y - barH, Math.max(seg.w, 3), barH, seg.c);
            barX += seg.w;
        }
    }

    // Legend row below bar
    y -= barH + 18;
    let legX = M;
    for (const s of statsData) {
        page.drawCircle({ x: legX + 5, y: y + 4, size: 4, color: s.color });
        text(`${s.label} (${s.count})`, legX + 14, y, 8.5, font, C.gray);
        legX += 120;
    }
    y -= 28;

    // Additional executive metrics
    y -= 15;
    need(100);

    // Compute additional metrics
    const uniqueFiles = vulnerabilities.length > 0 ? new Set(vulnerabilities.map(v => v.fileName).filter(Boolean)) : new Set();
    const criticalFiles = vulnerabilities.filter(v => v.severity?.toLowerCase() === 'critical').map(v => v.fileName).filter(Boolean);
    const criticalFileSet = new Set(criticalFiles);
    const avgConfidence = vulnerabilities.length > 0
        ? (vulnerabilities.reduce((sum, v) => sum + (v.confidence || 0.8), 0) / vulnerabilities.length * 100).toFixed(0)
        : '-';
    const cweIds = vulnerabilities.map(v => v.cweId).filter(Boolean);
    const uniqueCWEs = new Set(cweIds);

    // File with most vulnerabilities
    const fileCounts = {};
    vulnerabilities.forEach(v => { if (v.fileName) fileCounts[v.fileName] = (fileCounts[v.fileName] || 0) + 1; });
    const mostAffectedFile = Object.entries(fileCounts).sort((a, b) => b[1] - a[1])[0];

    text('KEY INSIGHTS', M, y, 10, fontBold, C.dark);
    y -= 16;

    const insightW = (CW - 10) / 2;
    const insights = [
        { label: 'Files with Critical Issues', value: String(criticalFileSet.size), accent: C.critical },
        { label: 'Average Confidence', value: `${avgConfidence}%`, accent: C.brand },
        { label: 'Unique CWE Categories', value: String(uniqueCWEs.size), accent: C.brandAccent },
        { label: 'Most Affected File', value: mostAffectedFile ? truncate(mostAffectedFile[0], 35) : 'N/A', accent: C.high },
    ];

    for (let row = 0; row < 2; row++) {
        need(36);
        for (let col = 0; col < 2; col++) {
            const idx = row * 2 + col;
            const ix = M + col * (insightW + 10);
            rect(ix, y - 26, insightW, 30, C.lighter);
            rect(ix, y + 1, insightW, 3, insights[idx].accent);
            text(insights[idx].value, ix + 10, y - 12, 12, fontBold, C.brandDark);
            text(insights[idx].label, ix + 10, y - 23, 8, font, C.gray);
        }
        y -= 38;
    }

    // Key Takeaway callout
    y -= 18;
    const takeawayMsg = critC > 0
        ? `${critC} critical vulnerabilities require immediate attention. Prioritize remediation of these findings to prevent potential security breaches. See Section 07 for the recommended roadmap.`
        : highC > 0
            ? `${highC} high severity findings identified. While no critical issues were found, prompt remediation is strongly advised to maintain a strong security posture.`
            : `No critical or high severity issues detected. Continue monitoring and address medium/low findings through standard development cycles.`;
    const takeawayTextH = calcWrapHeight(takeawayMsg, CW - 36, 9, font, 1.4);
    const takeawayPadTop = 28; // space for heading + gap
    const takeawayPadBottom = 12;
    const takeawayH = takeawayPadTop + takeawayTextH + takeawayPadBottom;
    need(takeawayH + 10);
    rect(M, y - takeawayH, CW, takeawayH, rgb(0.93, 0.97, 1.0));
    rect(M, y - 3, CW, 3, C.brand);  // top accent bar
    rect(M, y - takeawayH, 5, takeawayH, C.brand);  // left accent bar
    text('KEY TAKEAWAY', M + 18, y - 18, 9, fontBold, C.brand);
    const savedTakeawayY = y;
    y -= takeawayPadTop;
    wrap(takeawayMsg, M + 18, CW - 36, 9, font, C.dark, 1.4);
    y = Math.min(y, savedTakeawayY - takeawayH);

    // ═════════════════════════════════════════════════════════════════════════
    //  02 - METHODOLOGY
    // ═════════════════════════════════════════════════════════════════════════
    newPage();
    sectionPageIndex['02'] = currentPageIndex;
    sectionHeading('02  ASSESSMENT METHODOLOGY');

    wrap('VulnIQ employs a sophisticated multi-agent AI architecture for security analysis. Each agent specializes in a distinct phase of the assessment:', M, CW, 10.5, font, C.dark);
    y -= 15;

    const agents = [
        ['Reviewer Agent', 'Performs deep static analysis of source code, identifying vulnerabilities by examining code patterns, data flows, and security anti-patterns against a curated knowledge base.'],
        ['Implementer Agent', 'Generates precise, production-ready code fixes for each identified vulnerability, ensuring patches follow security best practices.'],
        ['Tester Agent', 'Creates verification test cases to validate that proposed fixes effectively address the vulnerabilities without introducing regressions.'],
        ['Reporter Agent', 'Synthesizes all findings into this comprehensive report with risk scoring, compliance mapping, and prioritized remediation guidance.'],
    ];

    for (const [agTitle, desc] of agents) {
        const descH = calcWrapHeight(desc, CW - 32, 9.5, font, 1.4);
        const cardH = Math.max(50, 18 + descH + 8); // title line + desc + padding
        need(cardH + 4);
        rect(M, y - cardH + 10, CW, cardH, C.lighter);
        rect(M, y - cardH + 10, 4, cardH, C.brand);
        text(agTitle, M + 16, y - 2, 11, fontBold, C.brandDark);
        const savedYa = y;
        y -= 16;
        wrap(desc, M + 16, CW - 32, 9.5, font, C.gray, 1.4);
        y = Math.min(y, savedYa - cardH + 6);
        y -= 4;
    }

    y -= 15;
    subHeading('Standards & Frameworks Referenced');
    const standards = [
        'OWASP Top 10 (2021) - Web Application Security Risks',
        'CWE/SANS Top 25 Most Dangerous Software Errors',
        'NIST Cybersecurity Framework (CSF)',
        'ISO/IEC 27001 Information Security Management',
    ];
    for (const s of standards) bullet(s);

    // Analysis Scope card
    y -= 15;
    need(80);
    rect(M, y - 60, CW, 66, C.lighter);
    rect(M, y + 2, CW, 4, C.brandAccent);
    text('ANALYSIS SCOPE', M + 14, y - 10, 9, fontBold, C.brandDark);
    const scopeItems = [
        ['Project', truncate(projectName, 40)],
        ['Files Analyzed', String(vulnerabilities.length > 0 ? new Set(vulnerabilities.map(v => v.fileName).filter(Boolean)).size : '-')],
        ['Findings', String(totalV)],
        ['Engine', truncate(assessorName, 25)],
    ];
    const scopeW = CW / 4;
    for (let i = 0; i < scopeItems.length; i++) {
        const sx = M + 14 + i * scopeW;
        const maxLabelW = scopeW - 20;
        text(scopeItems[i][0], sx, y - 30, 7, font, C.muted);
        // Truncate value to fit within column
        const valStr = scopeItems[i][1];
        const valFontSize = textW(valStr, 9, fontBold) > maxLabelW ? 8 : 9;
        text(truncate(valStr, 25), sx, y - 42, valFontSize, fontBold, C.dark);
    }
    y -= 72;

    // ═════════════════════════════════════════════════════════════════════════
    //  03 - RISK DASHBOARD
    // ═════════════════════════════════════════════════════════════════════════
    newPage();
    sectionPageIndex['03'] = currentPageIndex;
    sectionHeading('03  RISK DASHBOARD');

    // Risk score card
    need(130);
    rect(M, y - 105, CW, 110, C.brandDark);
    rect(M, y + 1, CW, 4, C.brand);

    text('OVERALL RISK SCORE', M + 25, y - 16, 10, font, C.muted);
    const scoreStr = String(riskScore);
    const scoreColor = riskScore < 30 ? C.critical : riskScore < 60 ? C.medium : C.low;
    text(scoreStr, M + 25, y - 58, 42, fontBold, scoreColor);
    text('/ 100', M + 25 + textW(scoreStr, 42, fontBold) + 5, y - 48, 16, font, C.muted);

    // Score progress bar
    const gaugeY = y - 80;
    const gaugeW = 150;
    rect(M + 25, gaugeY, gaugeW, 6, rgb(0.15, 0.22, 0.38)); // background
    rect(M + 25, gaugeY, Math.max(gaugeW * (riskScore / 100), 2), 6, scoreColor); // filled

    // Risk level badge
    const rlText = riskLevel;
    const rlColor = riskScore < 30 ? C.critical : riskScore < 60 ? C.medium : C.low;
    rect(M + CW * 0.45, y - 55, CW * 0.5, 28, rlColor);
    text(rlText, M + CW * 0.45 + 12, y - 45, 10, fontBold, C.white);

    text('Assessment Date: ' + dateStr, M + CW * 0.45, y - 78, 9, font, C.muted);
    text('Report ID: ' + truncate(runId, 24), M + CW * 0.45, y - 92, 8, fontMono, rgb(0.5, 0.7, 0.9));

    y -= 130;

    // Severity breakdown table
    y -= 20;
    need(180);
    text('SEVERITY BREAKDOWN', M, y, 11, fontBold, C.dark);
    y -= 6;
    rect(M, y, 50, 2, C.brand);
    y -= 24;

    // Table header
    rect(M, y - 2, CW, 24, C.brandDark);
    const cols = [0, 110, 200, 310, 395];
    const headers = ['Severity', 'Count', 'Percentage', 'Status', 'Priority'];
    for (let i = 0; i < headers.length; i++) {
        text(headers[i], M + cols[i] + 10, y + 4, 9, fontBold, C.white);
    }
    y -= 28;

    const sevRows = [
        { sev: 'Critical', count: critC, color: C.critical, status: 'Immediate', priority: 'P0 - Emergency' },
        { sev: 'High', count: highC, color: C.high, status: 'Urgent', priority: 'P1 - Within 7 days' },
        { sev: 'Medium', count: medC, color: C.medium, status: 'Scheduled', priority: 'P2 - Within 30 days' },
        { sev: 'Low', count: lowC, color: C.low, status: 'Planned', priority: 'P3 - Within 90 days' },
    ];

    for (let i = 0; i < sevRows.length; i++) {
        const r = sevRows[i];
        const rowBg = i % 2 === 0 ? C.lighter : C.white;
        rect(M, y - 2, CW, 24, rowBg);

        // Severity pill
        rect(M + cols[0] + 8, y + 1, 65, 16, r.color);
        text(r.sev, M + cols[0] + 14, y + 4, 9, fontBold, C.white);

        text(String(r.count), M + cols[1] + 10, y + 4, 10, fontBold, C.dark);

        const pct = total > 0 ? ((r.count / total) * 100).toFixed(1) : '0.0';
        text(`${pct}%`, M + cols[2] + 10, y + 4, 10, font, C.dark);

        // mini bar
        const barWidth = Math.min((r.count / (total || 1)) * 100, 100);
        rect(M + cols[2] + 50, y + 4, barWidth * 0.6, 8, r.color);

        text(r.status, M + cols[3] + 10, y + 4, 9, font, C.gray);
        text(r.priority, M + cols[4] + 10, y + 4, 8, font, C.gray);

        y -= 28;
    }

    // Total row
    rect(M, y - 2, CW, 24, C.brandDark);
    text('TOTAL', M + cols[0] + 14, y + 4, 10, fontBold, C.white);
    text(String(totalV), M + cols[1] + 10, y + 4, 10, fontBold, C.brand);
    text('100%', M + cols[2] + 10, y + 4, 10, fontBold, C.white);
    y -= 40;

    // ═════════════════════════════════════════════════════════════════════════
    //  04 - FINDINGS OVERVIEW
    // ═════════════════════════════════════════════════════════════════════════
    newPage();
    sectionPageIndex['04'] = currentPageIndex;
    sectionHeading('04  FINDINGS OVERVIEW');

    // Group by severity (case-insensitive)
    const grouped = { Critical: [], High: [], Medium: [], Low: [] };
    const sevMap = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
    for (const v of vulnerabilities) {
        const raw = v.severity;
        if (!raw) continue;
        const normalized = sevMap[raw.toLowerCase()];
        if (normalized) grouped[normalized].push(v);
    }

    // Summary cards per severity
    for (const sev of ['Critical', 'High', 'Medium', 'Low']) {
        const items = grouped[sev];
        if (items.length === 0) continue;

        need(50);
        const sevColor = SEVERITY_COLORS[sev] || C.gray;

        rect(M, y - 30, CW, 36, C.lighter);
        rect(M, y - 30, 5, 36, sevColor);

        // Severity label
        rect(M + 14, y - 18, 70, 18, sevColor);
        text(sev, M + 20, y - 14, 10, fontBold, C.white);

        text(`${items.length} finding${items.length > 1 ? 's' : ''}`, M + 95, y - 14, 11, fontBold, C.dark);

        // Unique files
        const files = new Set(items.map(v => v.fileName).filter(Boolean));
        text(`across ${files.size} file${files.size !== 1 ? 's' : ''}`, M + 200, y - 14, 10, font, C.gray);

        y -= 45;

        // List top 5 per severity as quick reference
        const top = items.slice(0, 5);
        for (let i = 0; i < top.length; i++) {
            need(18);
            text(`${i + 1}.`, M + 20, y, 9, fontBold, sevColor);
            text(truncate(top[i].title || 'Untitled', 55), M + 38, y, 9, fontBold, C.dark);
            if (top[i].fileName) {
                text(truncate(top[i].fileName, 40), M + CW * 0.6, y, 8, fontMono, C.gray);
            }
            y -= 16;
        }
        if (items.length > 5) {
            text(`  ... and ${items.length - 5} more ${sev.toLowerCase()} findings`, M + 20, y, 8.5, font, C.muted);
            y -= 18;
        }
        y -= 8;
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  05 - FILE-LEVEL ANALYSIS SUMMARY
    // ═════════════════════════════════════════════════════════════════════════
    newPage();
    sectionPageIndex['05'] = currentPageIndex;
    sectionHeading('05  FILE-LEVEL ANALYSIS SUMMARY');

    wrap('The following table summarizes vulnerability distribution by file, ordered by risk severity.', M, CW, 10.5, font, C.dark);
    y -= 15;

    // Build file summary data
    const fileSummary = {};
    for (const v of vulnerabilities) {
        const fn = v.fileName || '—';
        if (!fileSummary[fn]) fileSummary[fn] = { Critical: 0, High: 0, Medium: 0, Low: 0, total: 0, types: new Set() };
        const s = v.severity;
        if (s && fileSummary[fn][s] !== undefined) fileSummary[fn][s]++;
        fileSummary[fn].total++;
        if (v.type) fileSummary[fn].types.add(v.type);
    }

    // Sort by total descending
    const sortedFiles = Object.entries(fileSummary).sort((a, b) => b[1].total - a[1].total);

    // Table header
    need(30);
    rect(M, y - 2, CW, 22, C.brandDark);
    const fCols = [0, CW * 0.42, CW * 0.54, CW * 0.64, CW * 0.74, CW * 0.84];
    const fHeaders = ['File', 'Crit', 'High', 'Med', 'Low', 'Total'];
    for (let i = 0; i < fHeaders.length; i++) {
        text(fHeaders[i], M + fCols[i] + 6, y + 3, 8, fontBold, C.white);
    }
    y -= 26;

    // File rows (show top 20)
    const displayFiles = sortedFiles.slice(0, 20);
    for (let i = 0; i < displayFiles.length; i++) {
        const [fn, counts] = displayFiles[i];
        need(22);
        const rowBg = i % 2 === 0 ? C.lighter : C.white;
        rect(M, y - 2, CW, 20, rowBg);

        // File name - use wrap-safe truncation
        const fnDisplay = fn.length > 45 ? '...' + fn.slice(-42) : fn;
        text(fnDisplay, M + fCols[0] + 6, y + 2, 7.5, fontMono, C.dark);
        text(String(counts.Critical), M + fCols[1] + 10, y + 2, 8.5, fontBold, counts.Critical > 0 ? C.critical : C.muted);
        text(String(counts.High), M + fCols[2] + 10, y + 2, 8.5, fontBold, counts.High > 0 ? C.high : C.muted);
        text(String(counts.Medium), M + fCols[3] + 10, y + 2, 8.5, font, counts.Medium > 0 ? C.medium : C.muted);
        text(String(counts.Low), M + fCols[4] + 10, y + 2, 8.5, font, counts.Low > 0 ? C.low : C.muted);
        text(String(counts.total), M + fCols[5] + 10, y + 2, 9, fontBold, C.dark);
        y -= 22;
    }

    if (sortedFiles.length > 20) {
        text(`... and ${sortedFiles.length - 20} more files`, M + 6, y, 8.5, font, C.muted);
        y -= 16;
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  06 - DETAILED VULNERABILITY ANALYSIS
    // ═════════════════════════════════════════════════════════════════════════
    newPage();
    sectionPageIndex['06'] = currentPageIndex;
    sectionHeading('06  DETAILED VULNERABILITY ANALYSIS');

    // Subtitle / intro
    wrap('Each finding below includes a description, vulnerable code snippet, impact assessment, recommended fix, and potential exploit scenario.', M, CW, 9.5, fontItalic, C.gray, 1.4);
    y -= 12;

    // Summary info bar
    need(30);
    rect(M, y - 22, CW, 24, C.brandDark);
    const infoItems = [
        `Total: ${totalV} findings`,
        `Critical: ${critC}`,
        `High: ${highC}`,
        `Medium: ${medC}`,
        `Low: ${lowC}`,
    ];
    let infoX = M + 12;
    for (const item of infoItems) {
        text(item, infoX, y - 14, 8.5, font, C.white);
        infoX += textW(item, 8.5, font) + 20;
    }
    y -= 42;

    let findingNum = 0;
    for (const sev of ['Critical', 'High', 'Medium', 'Low']) {
        const items = grouped[sev];
        if (items.length === 0) continue;

        // Severity section header
        need(50);
        const sevColor = SEVERITY_COLORS[sev] || C.gray;
        rect(M, y - 24, CW, 26, sevColor);
        text(`${sev.toUpperCase()} SEVERITY  (${items.length})`, M + 12, y - 18, 11, fontBold, C.white);
        y -= 38;

        for (const vuln of items) {
            findingNum++;
            try {
                need(80);

                const sevColor = SEVERITY_COLORS[sev] || C.gray;

                // ── Finding card top accent line ──
                rect(M, y + 2, CW, 2, sevColor);

                // ── Finding card header ──
                // Number badge
                rect(M, y - 6, 28, 18, sevColor);
                const numStr = String(findingNum);
                text(numStr, M + 14 - textW(numStr, 9, fontBold) / 2, y - 2, 9, fontBold, C.white);

                // CWE badge
                let headerX = M + 36;
                if (vuln.cweId) {
                    const cweStr = sanitizeText(vuln.cweId);
                    const cweW = textW(cweStr, 7.5, fontMono) + 10;
                    rect(headerX, y - 5, cweW, 15, C.brandDark);
                    text(cweStr, headerX + 5, y - 1, 7.5, fontMono, C.brandAccent);
                    headerX += cweW + 6;
                }

                // Confidence indicator
                if (vuln.confidence && vuln.confidence > 0) {
                    const confStr = `${Math.round(vuln.confidence * 100)}% conf`;
                    const confW = textW(confStr, 7, font) + 8;
                    rect(M + CW - confW, y - 5, confW, 15, C.lighter);
                    text(confStr, M + CW - confW + 4, y - 1, 7, font, C.gray);
                }

                y -= 22;

                // Title (wrapped)
                need(16);
                wrap(vuln.title || 'Untitled', M + 4, CW - 8, 11, fontBold, C.brandDark, 1.4);
                y -= 4;

                // Type + File location line
                need(14);
                let metaX = M + 4;
                if (vuln.type) {
                    const typeStr = truncate(vuln.type, 30);
                    const typeW = textW(typeStr, 8, font) + 10;
                    rect(metaX, y - 2, typeW, 14, C.light);
                    text(typeStr, metaX + 5, y + 1, 8, font, C.gray);
                    metaX += typeW + 8;
                }
                if (vuln.fileName) {
                    const locStr = truncate(vuln.fileName, 50);
                    const lineStr = vuln.lineNumber ? ` : line ${vuln.lineNumber}` : '';
                    text(`${locStr}${lineStr}`, metaX, y + 1, 8, fontMono, C.brand);
                }
                y -= 18;

                // Separator
                line(M + 4, y, M + CW - 4, y, 0.5, C.light);
                y -= 12;

                // Description
                if (vuln.details) {
                    need(20);
                    text('Description', M + 4, y, 8.5, fontBold, C.dark);
                    y -= 14;
                    wrap(vuln.details, M + 4, CW - 8, 9, font, C.dark, 1.35);
                    y -= 8;
                }

                // Vulnerable Code block
                if (vuln.vulnerableCode) {
                    const codeClean = sanitizeCodeText(vuln.vulnerableCode);
                    const codeLines = codeClean.split('\n');

                    // Limit lines to fit on a page (max usable ~680px, each line ~10px)
                    const maxLines = 35;
                    const truncatedCode = codeLines.length > maxLines
                        ? codeLines.slice(0, maxLines).join('\n') + '\n// ... truncated ...'
                        : codeClean;

                    // Pre-calculate exact height for the code content
                    const codeContentH = calcCodeHeight(truncatedCode, CW - 40, 7, fontMono, 1.35);
                    const codePadTop = 10;
                    const codePadBottom = 10;
                    const codeBlockH = codeContentH + codePadTop + codePadBottom;

                    // Need heading + code block together
                    need(codeBlockH + 30);
                    text('Vulnerable Code', M + 4, y, 8.5, fontBold, C.dark);
                    y -= 16;

                    // Save the starting y to draw background
                    const codeStartY = y;

                    // Draw dark code background (premium look)
                    rect(M + 4, codeStartY - codeBlockH, CW - 8, codeBlockH, rgb(0.14, 0.16, 0.20));
                    // Left accent bar
                    rect(M + 4, codeStartY - codeBlockH, 4, codeBlockH, C.brand);

                    // Render code with top padding using light text for dark bg
                    y -= codePadTop;
                    wrapCode(truncatedCode, M + 20, CW - 40, 7, fontMono, rgb(0.85, 0.88, 0.92), 1.35);

                    // Ensure y is at least at the bottom of the background rect
                    y = Math.min(y, codeStartY - codeBlockH);
                    y -= 14; // spacing after code block
                }

                // Explanation
                if (vuln.explanation) {
                    need(26);
                    text('Impact & Explanation', M + 4, y, 8.5, fontBold, C.dark);
                    y -= 14;
                    wrap(vuln.explanation, M + 4, CW - 8, 9, font, C.gray, 1.35);
                    y -= 10;
                }

                // Best Practices / Recommended Fix
                if (vuln.bestPractices) {
                    // Pre-calculate the wrapped text height accurately
                    const bpH = calcWrapHeight(vuln.bestPractices, CW - 36, 9, font, 1.4);
                    const bpPadV = 10; // vertical padding top & bottom
                    const bpTotalH = bpH + bpPadV * 2;
                    const bpHeadingH = 20; // heading + gap
                    const usablePageH = H - M - (M + 40); // ~700px max usable

                    // Ensure enough space for heading + colored box together
                    // Cap at usable page height to avoid infinite page breaks
                    need(Math.min(bpHeadingH + bpTotalH, usablePageH));

                    text('Recommended Fix', M + 4, y, 8.5, fontBold, C.dark);
                    y -= 16;

                    const bpStartY = y;
                    // Cap the rect height to not go below footer margin
                    const bpDrawH = Math.min(bpTotalH, bpStartY - (M + 40));
                    // Draw background + sidebar sized to fit all text plus padding
                    rect(M + 4, bpStartY - bpDrawH, CW - 8, bpDrawH, rgb(0.95, 0.99, 0.95));
                    rect(M + 4, bpStartY - bpDrawH, 4, bpDrawH, C.low);

                    y -= bpPadV;
                    wrap(vuln.bestPractices, M + 18, CW - 36, 9, font, C.dark, 1.4);
                    // Ensure y lands at the bottom of the background
                    y = Math.min(y, bpStartY - bpTotalH);
                    y -= 12;
                }

                // Exploit Examples / Exploit Scenario
                if (vuln.exploitExamples) {
                    const exContent = truncate(vuln.exploitExamples, 600);
                    // Pre-calculate the wrapped text height accurately
                    const exH = calcWrapHeight(exContent, CW - 36, 8.5, font, 1.4);
                    const exPadV = 10; // vertical padding top & bottom
                    const exTotalH = exH + exPadV * 2;
                    const exHeadingH = 20; // heading + gap
                    const usablePageH2 = H - M - (M + 40); // ~700px max usable

                    // Ensure enough space for heading + colored box together
                    need(Math.min(exHeadingH + exTotalH, usablePageH2));

                    text('Exploit Scenario', M + 4, y, 8.5, fontBold, C.dark);
                    y -= 16;

                    const exStartY = y;
                    // Cap the rect height to not go below footer margin
                    const exDrawH = Math.min(exTotalH, exStartY - (M + 40));
                    // Draw background + sidebar sized to fit all text plus padding
                    rect(M + 4, exStartY - exDrawH, CW - 8, exDrawH, rgb(1.0, 0.96, 0.96));
                    rect(M + 4, exStartY - exDrawH, 4, exDrawH, C.critical);

                    y -= exPadV;
                    wrap(exContent, M + 18, CW - 36, 8.5, font, C.gray, 1.4);
                    // Ensure y lands at the bottom of the background
                    y = Math.min(y, exStartY - exTotalH);
                    y -= 12;
                }

                // Bottom separator between findings
                y -= 6;
                line(M, y, M + CW, y, 0.5, C.light);
                y -= 16;

            } catch (err) {
                console.error(`Error rendering finding #${findingNum}:`, err);
                y -= 20;
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  07 - REMEDIATION ROADMAP
    // ═════════════════════════════════════════════════════════════════════════
    newPage();
    sectionPageIndex['07'] = currentPageIndex;
    sectionHeading('07  REMEDIATION ROADMAP');

    wrap('Based on the assessment findings, VulnIQ recommends the following phased remediation approach:', M, CW, 10.5, font, C.dark);
    y -= 15;

    const phases = [
        {
            title: 'PHASE 1: IMMEDIATE  (0-48 hours)',
            color: C.critical,
            items: [
                'Address all Critical severity vulnerabilities immediately',
                'Deploy emergency patches for exploitable attack vectors',
                'Implement temporary mitigations (WAF rules, IP restrictions)',
                'Notify security team and initiate incident response if needed',
            ]
        },
        {
            title: 'PHASE 2: URGENT  (1-2 weeks)',
            color: C.high,
            items: [
                'Remediate all High severity findings',
                'Conduct thorough code review of affected components',
                'Update authentication and authorization mechanisms',
                'Deploy fixes through standard change management process',
            ]
        },
        {
            title: 'PHASE 3: SCHEDULED  (2-4 weeks)',
            color: C.medium,
            items: [
                'Address Medium severity issues in upcoming sprint cycles',
                'Implement input validation and output encoding improvements',
                'Update security documentation and runbooks',
                'Schedule security training for development team',
            ]
        },
        {
            title: 'PHASE 4: PLANNED  (1-3 months)',
            color: C.low,
            items: [
                'Resolve Low severity findings as part of technical debt reduction',
                'Implement automated security scanning in CI/CD pipeline',
                'Conduct follow-up assessment to verify remediation',
                'Establish continuous monitoring and alerting',
            ]
        },
    ];

    for (const phase of phases) {
        need(80);
        // Phase header
        rect(M, y - 2, CW, 24, phase.color);
        text(phase.title, M + 12, y + 4, 10, fontBold, C.white);
        y -= 30;

        for (const item of phase.items) bullet(item);
        y -= 10;
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  08 - COMPLIANCE MAPPING
    // ═════════════════════════════════════════════════════════════════════════
    newPage();
    sectionPageIndex['08'] = currentPageIndex;
    sectionHeading('08  COMPLIANCE MAPPING');

    wrap('The following industry frameworks and standards were used to contextualize findings:', M, CW, 10.5, font, C.dark);
    y -= 15;

    subHeading('OWASP Top 10 (2021)');
    const owasp = [
        'A01:2021 - Broken Access Control',
        'A02:2021 - Cryptographic Failures',
        'A03:2021 - Injection (SQL, XSS, Command)',
        'A04:2021 - Insecure Design',
        'A05:2021 - Security Misconfiguration',
        'A06:2021 - Vulnerable & Outdated Components',
        'A07:2021 - Identification & Authentication Failures',
        'A08:2021 - Software & Data Integrity Failures',
        'A09:2021 - Security Logging & Monitoring Failures',
        'A10:2021 - Server-Side Request Forgery (SSRF)',
    ];
    for (const o of owasp) bullet(o);

    y -= 15;
    subHeading('CWE/SANS Top 25');
    const cwe = [
        'CWE-79: Improper Neutralization of Input (XSS)',
        'CWE-89: SQL Injection',
        'CWE-287: Improper Authentication',
        'CWE-22: Path Traversal',
        'CWE-352: Cross-Site Request Forgery (CSRF)',
        'CWE-434: Unrestricted File Upload',
        'CWE-502: Deserialization of Untrusted Data',
        'CWE-798: Use of Hard-coded Credentials',
    ];
    for (const c of cwe) bullet(c);

    // ═════════════════════════════════════════════════════════════════════════
    //  09 - APPENDIX
    // ═════════════════════════════════════════════════════════════════════════
    newPage();
    sectionPageIndex['09'] = currentPageIndex;
    sectionHeading('09  APPENDIX & GLOSSARY');

    subHeading('Severity Definitions');
    const defs = [
        ['Critical', 'Vulnerabilities that can be exploited remotely with no authentication, leading to complete system compromise, data breach, or service disruption.'],
        ['High', 'Significant security weaknesses that could lead to unauthorized access, data exposure, or privilege escalation with limited prerequisites.'],
        ['Medium', 'Security issues that require specific conditions to exploit but could result in information disclosure or partial system compromise.'],
        ['Low', 'Minor security concerns with limited impact, typically requiring significant prerequisites or insider access to exploit.'],
    ];

    for (const [term, def] of defs) {
        const defH = calcWrapHeight(def, CW - 28, 8.5, font, 1.35);
        const cardH = Math.max(40, 18 + defH + 8); // title line + desc + padding
        need(cardH + 6);
        rect(M, y - cardH + 8, CW, cardH, C.lighter);
        rect(M, y - cardH + 8, 4, cardH, SEVERITY_COLORS[term] || C.gray);
        text(term, M + 14, y - 2, 10, fontBold, C.dark);
        const savedYd = y;
        y -= 16;
        wrap(def, M + 14, CW - 28, 8.5, font, C.gray, 1.35);
        y = Math.min(y, savedYd - cardH + 4);
        y -= 6;
    }

    y -= 15;
    subHeading('Disclaimer');
    wrap(
        `This report is generated by ${sanitizeText(assessorName)} and represents findings at a point in time. While the assessment utilizes advanced AI analysis techniques, no automated tool can guarantee the identification of all security vulnerabilities. This report should be used as part of a comprehensive security program that includes manual review, penetration testing, and ongoing monitoring. The findings and recommendations herein are provided as-is and should be validated by qualified security professionals before implementation.`,
        M, CW, 9, font, C.gray, 1.4
    );

    // ═════════════════════════════════════════════════════════════════════════
    //  END OF REPORT PAGE
    // ═════════════════════════════════════════════════════════════════════════
    newPage();
    rect(0, 0, W, H, C.brandDeep);
    rect(0, H - 6, W * 0.65, 6, C.brand);
    rect(W * 0.65, H - 6, W * 0.35, 6, C.brandAccent);

    // Center logo
    const endLogoY = H / 2 + 60;
    if (logoImage) {
        try {
            const elDim = logoImage.scaleToFit(48, 48);
            page.drawImage(logoImage, { x: W / 2 - elDim.width / 2, y: endLogoY, width: elDim.width, height: elDim.height });
        } catch (e) { /* skip */ }
    } else {
        rect(W / 2 - 22, endLogoY, 44, 44, C.brand);
        rect(W / 2 - 19, endLogoY + 3, 38, 38, C.brandDeep);
        text('V', W / 2 - 10, endLogoY + 12, 24, fontBold, C.brand);
    }

    const endTitle = 'END OF REPORT';
    text(endTitle, W / 2 - textW(endTitle, 22, fontBold) / 2, endLogoY - 30, 22, fontBold, C.white);

    // Decorative line
    const lineW = 80;
    rect(W / 2 - lineW / 2, endLogoY - 50, lineW * 0.6, 3, C.brand);
    rect(W / 2 - lineW / 2 + lineW * 0.6, endLogoY - 50, lineW * 0.4, 3, C.brandAccent);

    const thankStr = 'Thank you for choosing VulnIQ';
    text(thankStr, W / 2 - textW(thankStr, 12, font) / 2, endLogoY - 75, 12, font, C.muted);

    const secStr = 'Making code security autonomous by default';
    text(secStr, W / 2 - textW(secStr, 10, fontItalic) / 2, endLogoY - 95, 10, fontItalic, rgb(0.4, 0.5, 0.65));

    // Footer info - positioned above the auto-applied footer area
    const endDate = `Report generated on ${dateStr} at ${timeStr}`;
    text(endDate, W / 2 - textW(endDate, 8, font) / 2, 80, 8, font, C.muted);
    const endConf = 'CONFIDENTIAL - FOR AUTHORIZED PERSONNEL ONLY';
    text(endConf, W / 2 - textW(endConf, 7, font) / 2, 62, 7, font, rgb(0.3, 0.35, 0.45));

    rect(0, 0, W * 0.35, 4, C.brandAccent);
    rect(W * 0.35, 0, W * 0.65, 4, C.brand);

    // ═════════════════════════════════════════════════════════════════════════
    //  TOC LINKS - Add clickable links and page numbers to TOC entries
    // ═════════════════════════════════════════════════════════════════════════
    const allPages = pdfDoc.getPages();
    const tocPage = allPages[tocPageIndex];
    for (const entry of tocEntries) {
        const targetPageIdx = sectionPageIndex[entry.num];
        if (targetPageIdx !== undefined && targetPageIdx < allPages.length) {
            // Draw page number on the right side of the TOC entry
            const pageNumStr = String(targetPageIdx + 1);
            const pnw = font.widthOfTextAtSize(pageNumStr, 11);
            tocPage.drawText(pageNumStr, {
                x: M + CW - 12 - pnw,
                y: entry.rectY + 10,
                size: 11,
                font: font,
                color: C.muted,
            });

            // Add internal GoTo link annotation using pdf-lib low-level API
            try {
                const targetPage = allPages[targetPageIdx];
                const context = pdfDoc.context;

                // Build the annotation dictionary
                const annot = context.obj({
                    Type: 'Annot',
                    Subtype: 'Link',
                    Rect: [M, entry.rectY, M + CW, entry.rectY + entry.rectH],
                    Border: [0, 0, 0],
                    Dest: [targetPage.ref, 'XYZ', null, null, null],
                });
                const annotRef = context.register(annot);

                // Get or create the Annots array on the TOC page
                const existingAnnotsRef = tocPage.node.get(PDFName.of('Annots'));
                if (existingAnnotsRef) {
                    const annotsArray = context.lookup(existingAnnotsRef);
                    if (annotsArray && typeof annotsArray.push === 'function') {
                        annotsArray.push(annotRef);
                    }
                } else {
                    tocPage.node.set(PDFName.of('Annots'), context.obj([annotRef]));
                }
            } catch (linkErr) {
                // Silently ignore link errors - page numbers still visible
                console.warn('[PDF] Could not add TOC link for section', entry.num, linkErr.message);
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  HEADERS & FOOTERS (applied to all pages)
    // ═════════════════════════════════════════════════════════════════════════
    const pages = allPages;
    const lastPageIdx = pages.length - 1;
    for (let i = 0; i < pages.length; i++) {
        const pg = pages[i];
        const isEndPage = i === lastPageIdx;

        // Skip cover page (0) and end-of-report page for header/footer
        if (i > 0 && !isEndPage) {
            // Top brand bar (gradient simulation)
            pg.drawRectangle({ x: 0, y: H - 6, width: W * 0.65, height: 6, color: C.brand });
            pg.drawRectangle({ x: W * 0.65, y: H - 6, width: W * 0.35, height: 6, color: C.brandAccent });

            // Small logo in header if available
            if (logoImage) {
                try {
                    const hLogoDim = logoImage.scaleToFit(14, 14);
                    pg.drawImage(logoImage, { x: M, y: H - 24, width: hLogoDim.width, height: hLogoDim.height });
                } catch (e) { /* skip */ }
            }

            // Header text on right
            const headerStr = `${sanitizeText(projectName)} — Security Report`;
            pg.drawText(headerStr, {
                x: W - M - font.widthOfTextAtSize(headerStr, 8),
                y: H - 22,
                size: 8,
                font: font,
                color: C.muted,
            });

            // Subtle header separator line
            pg.drawLine({ start: { x: M, y: H - 30 }, end: { x: W - M, y: H - 30 }, thickness: 0.3, color: C.light });
        }

        // Skip cover and end page for footer
        if (i > 0 && !isEndPage) {
            // Footer separator line
            pg.drawLine({ start: { x: M, y: 44 }, end: { x: W - M, y: 44 }, thickness: 0.3, color: C.light });

            // Left: Brand
            pg.drawText('VulnIQ', { x: M, y: 28, size: 8, font: fontBold, color: C.brand });
            pg.drawText('|  Confidential', { x: M + 38, y: 28, size: 7, font: font, color: C.muted });

            // Center: Date
            const footDateStr = dateStr;
            const fdw = font.widthOfTextAtSize(footDateStr, 7);
            pg.drawText(footDateStr, {
                x: W / 2 - fdw / 2,
                y: 28,
                size: 7,
                font: font,
                color: C.muted,
            });

            // Page number (right)
            const pageStr = `${i + 1} / ${pages.length}`;
            pg.drawText(pageStr, {
                x: W - M - font.widthOfTextAtSize(pageStr, 8),
                y: 28,
                size: 8,
                font: font,
                color: C.muted,
            });

            // Bottom brand bar (gradient simulation)
            pg.drawRectangle({ x: 0, y: 0, width: W * 0.35, height: 4, color: C.brandAccent });
            pg.drawRectangle({ x: W * 0.35, y: 0, width: W * 0.65, height: 4, color: C.brand });
        }
    }

    return await pdfDoc.save();
}

// ─── Scoring Helpers ─────────────────────────────────────────────────────────
function calcRiskScore(summary) {
    const c = summary.criticalCount || 0;
    const h = summary.highCount || 0;
    const m = summary.mediumCount || 0;
    const l = summary.lowCount || 0;
    const total = c + h + m + l;
    if (total === 0) return 100; // No vulnerabilities = perfect score

    // Weighted severity score using logarithmic diminishing returns
    // so even large vulnerability counts produce meaningful (non-zero) scores
    const critImpact = c > 0 ? Math.min(35, 12 + Math.log2(c + 1) * 6) : 0;
    const highImpact = h > 0 ? Math.min(25, 4 + Math.log2(h + 1) * 4) : 0;
    const medImpact  = m > 0 ? Math.min(18, 2 + Math.log2(m + 1) * 2.5) : 0;
    const lowImpact  = l > 0 ? Math.min(10, 1 + Math.log2(l + 1) * 1.5) : 0;

    const rawPenalty = critImpact + highImpact + medImpact + lowImpact;
    // Use a curve that keeps score above ~5 even in worst cases
    const score = Math.round(Math.max(5, Math.min(100, 100 - rawPenalty)));
    return score;
}

function getRiskLevel(summary) {
    const c = summary.criticalCount || 0;
    const h = summary.highCount || 0;
    if (c > 0) return 'CRITICAL - Immediate Action Required';
    if (h > 2) return 'HIGH - Urgent Remediation Needed';
    if (h > 0) return 'ELEVATED - Prompt Attention Required';
    return 'MODERATE - Standard Remediation';
}

export default generateSecurityReportPDF;

