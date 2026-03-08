/**
 * Client-side Demo PDF Report Generator
 *
 * Generates a professional-looking security report PDF entirely in the browser
 * for demo mode. Uses pdf-lib which works on both client and server.
 * No authentication or API calls required.
 */

import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';

// ─── Brand Colors ────────────────────────────────────────────────────────────
const C = {
    brand:      rgb(0.07, 0.64, 0.96),
    brandDark:  rgb(0.04, 0.12, 0.28),
    critical:   rgb(0.91, 0.12, 0.14),
    high:       rgb(0.80, 0.22, 0.56),
    medium:     rgb(0.96, 0.62, 0.04),
    low:        rgb(0.12, 0.72, 0.44),
    black:      rgb(0.10, 0.10, 0.12),
    dark:       rgb(0.20, 0.22, 0.26),
    gray:       rgb(0.45, 0.47, 0.51),
    muted:      rgb(0.62, 0.64, 0.68),
    light:      rgb(0.94, 0.95, 0.96),
    white:      rgb(1, 1, 1),
};

const SEVERITY_COLORS = {
    Critical: C.critical,
    High: C.high,
    Medium: C.medium,
    Low: C.low,
};

function sanitize(value) {
    if (value === null || value === undefined) return '';
    let t = typeof value === 'string' ? value : String(value);
    t = t.replace(/[\u2018\u2019\u201A]/g, "'")
         .replace(/[\u201C\u201D\u201E]/g, '"')
         .replace(/[\u2013\u2014]/g, '-')
         .replace(/\u2026/g, '...')
         .replace(/[\u200B-\u200D\uFEFF]/g, '')
         .replace(/\t/g, '    ')
         .replace(/[\r\n]+/g, ' ');
    t = t.replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
    return t;
}

function truncate(str, max) {
    const s = sanitize(str);
    return s.length > max ? s.substring(0, max - 3) + '...' : s;
}

/**
 * Generate a demo security report PDF.
 * @param {Object} opts
 * @param {Array} opts.vulnerabilities - Flat array of vulnerability objects
 * @param {string} [opts.projectName] - Name of the demo project
 * @returns {Promise<Uint8Array>} PDF bytes
 */
export async function generateDemoReportPDF({ vulnerabilities = [], projectName = 'Demo Security Assessment' }) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(`VulnIQ Demo Report - ${sanitize(projectName)}`);
    pdfDoc.setAuthor('VulnIQ');
    pdfDoc.setSubject('Demo Security Assessment Report');
    pdfDoc.setCreator('VulnIQ AI Security Engine (Demo)');

    const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

    const W = PageSizes.A4[0]; // 595.28
    const H = PageSizes.A4[1]; // 841.89
    const M = 50;
    const CW = W - M * 2;

    let page, y;

    // ─── Helper: new page ────────────────────────────────────────────────
    function addPage() {
        page = pdfDoc.addPage(PageSizes.A4);
        y = H - M;
        return page;
    }

    // ─── Helper: ensure space ────────────────────────────────────────────
    function ensureSpace(needed) {
        if (y - needed < M + 40) {
            addPage();
            drawHeader();
        }
    }

    // ─── Helper: draw page header ────────────────────────────────────────
    function drawHeader() {
        page.drawRectangle({ x: 0, y: H - 32, width: W, height: 32, color: C.brandDark });
        page.drawText('VulnIQ Security Report', { x: M, y: H - 23, size: 10, font: fontBold, color: C.white });
        page.drawText('DEMO', { x: W - M - 35, y: H - 23, size: 10, font: fontBold, color: C.brand });
        y = H - M - 10;
    }


    // ─── Helper: wrapped text ────────────────────────────────────────────
    function drawWrapped(text, { x, maxWidth, size, usedFont, color, lineHeight }) {
        const words = sanitize(text).split(' ');
        let line = '';
        const lh = lineHeight || size * 1.4;
        for (const word of words) {
            const test = line ? `${line} ${word}` : word;
            const tw = usedFont.widthOfTextAtSize(test, size);
            if (tw > maxWidth && line) {
                ensureSpace(lh);
                page.drawText(line, { x, y, size, font: usedFont, color });
                y -= lh;
                line = word;
            } else {
                line = test;
            }
        }
        if (line) {
            ensureSpace(lh);
            page.drawText(line, { x, y, size, font: usedFont, color });
            y -= lh;
        }
    }

    // ─── Calculate summary ───────────────────────────────────────────────
    const summary = {
        total: vulnerabilities.length,
        critical: vulnerabilities.filter(v => v.severity === 'Critical').length,
        high: vulnerabilities.filter(v => v.severity === 'High').length,
        medium: vulnerabilities.filter(v => v.severity === 'Medium').length,
        low: vulnerabilities.filter(v => v.severity === 'Low').length,
    };

    // =====================================================================
    // PAGE 1: Cover
    // =====================================================================
    addPage();

    // Dark cover background
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.brandDark });

    // Accent stripe
    page.drawRectangle({ x: 0, y: H - 8, width: W, height: 8, color: C.brand });

    // Title
    page.drawText('SECURITY', { x: M, y: H - 180, size: 48, font: fontBold, color: C.white });
    page.drawText('ASSESSMENT', { x: M, y: H - 235, size: 48, font: fontBold, color: C.brand });
    page.drawText('REPORT', { x: M, y: H - 290, size: 48, font: fontBold, color: C.white });

    // Separator line
    page.drawRectangle({ x: M, y: H - 310, width: 80, height: 3, color: C.brand });

    // Project name
    page.drawText(sanitize(projectName), { x: M, y: H - 345, size: 14, font: fontBold, color: C.white });

    // Date
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    page.drawText(dateStr, { x: M, y: H - 370, size: 11, font, color: C.muted });

    // Demo watermark
    page.drawText('DEMO REPORT', { x: M, y: M + 60, size: 12, font: fontBold, color: C.brand });
    page.drawText('This report was generated in demo mode for evaluation purposes.', { x: M, y: M + 42, size: 9, font, color: C.muted });
    page.drawText('Generated by VulnIQ AI Security Engine', { x: M, y: M + 24, size: 9, font, color: C.muted });

    // Summary stats at bottom right
    const statsX = W - M - 140;
    const statsY = M + 100;
    const statBoxW = 60;
    const statBoxH = 50;
    const stats = [
        { label: 'Critical', count: summary.critical, color: C.critical },
        { label: 'High', count: summary.high, color: C.high },
    ];
    stats.forEach((s, i) => {
        const bx = statsX + i * (statBoxW + 12);
        page.drawRectangle({ x: bx, y: statsY, width: statBoxW, height: statBoxH, color: s.color, opacity: 0.15, borderColor: s.color, borderWidth: 1 });
        page.drawText(String(s.count), { x: bx + 22, y: statsY + 28, size: 18, font: fontBold, color: s.color });
        page.drawText(s.label, { x: bx + 8, y: statsY + 8, size: 8, font, color: C.muted });
    });

    // =====================================================================
    // PAGE 2: Executive Summary
    // =====================================================================
    addPage();
    drawHeader();

    y -= 10;
    page.drawText('Executive Summary', { x: M, y, size: 20, font: fontBold, color: C.brandDark });
    y -= 30;

    // Summary boxes
    const boxes = [
        { label: 'Total', count: summary.total, color: C.brand },
        { label: 'Critical', count: summary.critical, color: C.critical },
        { label: 'High', count: summary.high, color: C.high },
        { label: 'Medium', count: summary.medium, color: C.medium },
        { label: 'Low', count: summary.low, color: C.low },
    ];
    const boxW = (CW - 4 * 12) / 5;
    boxes.forEach((b, i) => {
        const bx = M + i * (boxW + 12);
        page.drawRectangle({ x: bx, y: y - 52, width: boxW, height: 52, color: b.color, opacity: 0.08, borderColor: b.color, borderWidth: 0.8 });
        const countStr = String(b.count);
        const countW = fontBold.widthOfTextAtSize(countStr, 22);
        page.drawText(countStr, { x: bx + (boxW - countW) / 2, y: y - 28, size: 22, font: fontBold, color: b.color });
        const labelW = font.widthOfTextAtSize(b.label, 8);
        page.drawText(b.label, { x: bx + (boxW - labelW) / 2, y: y - 44, size: 8, font, color: C.gray });
    });
    y -= 75;

    // Risk score
    const riskScore = Math.min(100, Math.round(
        (summary.critical * 25 + summary.high * 15 + summary.medium * 8 + summary.low * 3)
    ));
    y -= 10;
    page.drawText('Overall Risk Score', { x: M, y, size: 13, font: fontBold, color: C.dark });
    y -= 22;
    const riskColor = riskScore <= 30 ? C.low : riskScore <= 60 ? C.medium : C.critical;
    const riskLabel = riskScore <= 30 ? 'Low Risk' : riskScore <= 60 ? 'Moderate Risk' : 'High Risk';
    page.drawText(`${riskScore}/100 — ${riskLabel}`, { x: M, y, size: 11, font: fontBold, color: riskColor });
    y -= 10;
    // Progress bar
    page.drawRectangle({ x: M, y: y - 8, width: CW, height: 8, color: C.light });
    page.drawRectangle({ x: M, y: y - 8, width: CW * (riskScore / 100), height: 8, color: riskColor });
    y -= 30;

    // Scope
    page.drawText('Assessment Scope', { x: M, y, size: 13, font: fontBold, color: C.dark });
    y -= 18;
    page.drawText(`Project: ${sanitize(projectName)}`, { x: M + 10, y, size: 9, font, color: C.gray });
    y -= 14;
    page.drawText(`Engine: VulnIQ Multi-Agent AI Pipeline (4 autonomous agents)`, { x: M + 10, y, size: 9, font, color: C.gray });
    y -= 14;
    page.drawText(`Date: ${dateStr}`, { x: M + 10, y, size: 9, font, color: C.gray });
    y -= 14;
    page.drawText(`Mode: Demo — for evaluation purposes only`, { x: M + 10, y, size: 9, font: fontBold, color: C.brand });
    y -= 30;

    // Unique files
    const uniqueFiles = [...new Set(vulnerabilities.map(v => v.fileName).filter(Boolean))];
    page.drawText('Affected Files', { x: M, y, size: 13, font: fontBold, color: C.dark });
    y -= 18;
    uniqueFiles.forEach(f => {
        ensureSpace(14);
        page.drawText(`•  ${sanitize(f)}`, { x: M + 10, y, size: 9, font: fontMono, color: C.dark });
        y -= 14;
    });

    // =====================================================================
    // PAGES 3+: Detailed Findings
    // =====================================================================
    addPage();
    drawHeader();
    y -= 10;
    page.drawText('Detailed Findings', { x: M, y, size: 20, font: fontBold, color: C.brandDark });
    y -= 28;

    vulnerabilities.forEach((vuln, idx) => {
        const sevColor = SEVERITY_COLORS[vuln.severity] || C.gray;

        // Need ~180px minimum for a finding header + some content
        ensureSpace(180);

        // Finding header bar
        page.drawRectangle({ x: M, y: y - 22, width: CW, height: 22, color: sevColor, opacity: 0.1 });
        page.drawRectangle({ x: M, y: y - 22, width: 4, height: 22, color: sevColor });
        page.drawText(`#${idx + 1}  ${truncate(vuln.title, 60)}`, { x: M + 12, y: y - 15, size: 10, font: fontBold, color: C.dark });

        // Severity badge
        const sevText = vuln.severity || 'Unknown';
        const sevW = fontBold.widthOfTextAtSize(sevText, 7) + 10;
        page.drawRectangle({ x: W - M - sevW - 4, y: y - 19, width: sevW, height: 16, color: sevColor, opacity: 0.15, borderColor: sevColor, borderWidth: 0.5 });
        page.drawText(sevText, { x: W - M - sevW + 1, y: y - 14, size: 7, font: fontBold, color: sevColor });
        y -= 32;

        // CWE + File
        if (vuln.cweId) {
            page.drawText(`CWE: ${sanitize(vuln.cweId)}`, { x: M + 10, y, size: 8, font: fontBold, color: C.gray });
            y -= 13;
        }
        if (vuln.fileName) {
            page.drawText(`File: ${sanitize(vuln.fileName)}`, { x: M + 10, y, size: 8, font: fontMono, color: C.gray });
            y -= 13;
        }
        y -= 4;

        // Explanation
        if (vuln.explanation) {
            page.drawText('Explanation', { x: M + 10, y, size: 9, font: fontBold, color: C.dark });
            y -= 14;
            drawWrapped(vuln.explanation, { x: M + 10, maxWidth: CW - 20, size: 8.5, usedFont: font, color: C.dark, lineHeight: 12 });
            y -= 6;
        }

        // Best Practices
        if (vuln.bestPractices) {
            ensureSpace(40);
            page.drawText('Recommended Fix', { x: M + 10, y, size: 9, font: fontBold, color: C.low });
            y -= 14;
            drawWrapped(vuln.bestPractices, { x: M + 10, maxWidth: CW - 20, size: 8.5, usedFont: font, color: C.dark, lineHeight: 12 });
            y -= 6;
        }

        // Details
        if (vuln.details) {
            ensureSpace(30);
            page.drawText('Details', { x: M + 10, y, size: 9, font: fontBold, color: C.dark });
            y -= 14;
            drawWrapped(vuln.details, { x: M + 10, maxWidth: CW - 20, size: 8.5, usedFont: font, color: C.gray, lineHeight: 12 });
            y -= 6;
        }

        // Separator
        y -= 8;
        ensureSpace(6);
        page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: C.light });
        y -= 14;
    });

    // =====================================================================
    // Footers on all pages
    // =====================================================================
    const pages = pdfDoc.getPages();
    // Skip cover page (index 0) for header/footer
    pages.forEach((p, i) => {
        if (i === 0) return; // cover page has its own styling
        p.drawLine({ start: { x: M, y: M - 10 }, end: { x: W - M, y: M - 10 }, thickness: 0.5, color: C.light });
        p.drawText(`Page ${i + 1} of ${pages.length}`, { x: W - M - 60, y: M - 24, size: 7, font, color: C.muted });
        p.drawText('Generated by VulnIQ (Demo Mode)', { x: M, y: M - 24, size: 7, font, color: C.muted });
    });

    return await pdfDoc.save();
}

