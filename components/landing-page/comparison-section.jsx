"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

// Check if device is mobile
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const comparisonRows = [
  {
    feature: "Context-aware analysis",
    traditional: "Generic rule-based pattern matching",
    vulniq: "RAG-grounded understanding of your codebase and docs",
  },
  {
    feature: "False positive rate",
    traditional: "High — noisy alerts, developer fatigue",
    vulniq: "Minimal — multi-agent debate validates each finding",
  },
  {
    feature: "Remediation",
    traditional: "Manual — generic fix suggestions at best",
    vulniq: "Automated — AI agents implement verified patches",
  },
  {
    feature: "Knowledge sources",
    traditional: "Static rule databases",
    vulniq: "Your docs + CWE, OWASP, NVD via retrieval augmentation",
  },
  {
    feature: "Fix verification",
    traditional: "None — you hope the fix works",
    vulniq: "Tester agent runs targeted security checks on every patch",
  },
  {
    feature: "Reporting",
    traditional: "CSV export with vulnerability list",
    vulniq: "Audit-ready PDF with evidence, patches, and test results",
  },
];

function ComparisonRow({ row, index, isMobile }) {
  return (
    <motion.div
      initial={isMobile ? {} : { opacity: 0, y: 12 }}
      whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={isMobile ? {} : { duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr] gap-3 md:gap-0 py-4 sm:py-5 border-b border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/10 last:border-b-0"
    >
      {/* Feature label */}
      <div className="font-semibold text-sm sm:text-base text-foreground md:pr-6">
        {row.feature}
      </div>

      {/* Traditional */}
      <div className="flex items-start gap-2 md:px-4">
        <XCircle className="h-4 w-4 mt-0.5 text-red-400/70 shrink-0" />
        <span className="text-xs sm:text-sm text-muted-foreground">{row.traditional}</span>
      </div>

      {/* VulnIQ */}
      <div className="flex items-start gap-2 md:px-4">
        <CheckCircle2 className="h-4 w-4 mt-0.5 text-[var(--brand-accent)] shrink-0" />
        <span className="text-xs sm:text-sm text-foreground font-medium">{row.vulniq}</span>
      </div>
    </motion.div>
  );
}

export function ComparisonSection() {
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isTouchDevice() || window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section className="relative z-10 py-12 sm:py-16 md:py-20 lg:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-12 relative">
        {/* Header */}
        <motion.div
          initial={isMobile ? {} : { opacity: 0, y: 20 }}
          whileInView={isMobile ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={isMobile ? {} : { duration: 0.5 }}
          className="text-center mb-10 sm:mb-14 md:mb-16"
        >
          <p className="text-sm sm:text-base text-muted-foreground mb-3 font-medium">
            A fundamentally different approach
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Why <span className="gradient-text">VulnIQ</span>?
          </h2>
          <div className="accent-line-center w-12 sm:w-16 md:w-20 mx-auto mt-4 sm:mt-6" />
        </motion.div>

        {/* Comparison card */}
        <div className="rounded-2xl border border-[var(--brand-primary)]/20 dark:border-[var(--brand-accent)]/20 bg-[var(--card)] dark:bg-[var(--brand-primary)]/60 p-4 sm:p-6 md:p-8 shadow-lg shadow-[var(--brand-accent)]/5">
          {/* Column headers (desktop only) */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_1fr] pb-4 mb-2 border-b-2 border-[var(--brand-accent)]/20">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Feature
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4">
              Traditional scanners
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-accent)] px-4">
              VulnIQ
            </div>
          </div>

          {/* Rows */}
          {comparisonRows.map((row, i) => (
            <ComparisonRow key={row.feature} row={row} index={i} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ComparisonSection;

