"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

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

function ComparisonRow({ row, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr] gap-3 md:gap-0 py-5 border-b border-border/50 last:border-b-0"
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
        <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent shrink-0" />
        <span className="text-xs sm:text-sm text-foreground font-medium">{row.vulniq}</span>
      </div>
    </motion.div>
  );
}

export function ComparisonSection() {
  return (
    <section className="relative z-10 py-16 sm:py-20 md:py-24 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-12 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-14 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Why <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">VulnIQ</span>?
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mt-4">
            See how agentic RAG compares to traditional static analysis tools.
          </p>
          <div className="h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent w-16 sm:w-20 md:w-24 mx-auto mt-5 sm:mt-6" />
        </motion.div>

        {/* Comparison card */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 md:p-8 shadow-lg shadow-black/10 dark:shadow-black/30">
          {/* Column headers (desktop only) */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_1fr] pb-4 mb-2 border-b-2 border-accent/20">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Feature
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4">
              Traditional scanners
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-accent px-4">
              VulnIQ
            </div>
          </div>

          {/* Rows */}
          {comparisonRows.map((row, i) => (
            <ComparisonRow key={row.feature} row={row} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ComparisonSection;

