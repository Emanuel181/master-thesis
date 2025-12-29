"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Database,
    Github,
    Gitlab,
    Search,
    Wrench,
    ShieldCheck,
    FileText,
    Settings2,
    Sparkles,
    CheckCircle2,
    XCircle,
} from "lucide-react";

export function FeaturesGrid() {
    return (
        <ul className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 md:grid-cols-12 lg:gap-8 xl:grid-rows-2 w-full">
            {/* 1. GROUNDED SECURITY INTELLIGENCE (Top Left) */}
            <GridItem
                area="md:col-span-6 xl:col-span-4"
                icon={<Database className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                title="Grounded security intelligence"
                description="Each agent retrieves guidance from your security knowledge bases and use-case playbooks (e.g., secure login), so fixes stay consistent with your ground truth."
                header={<SkeletonKnowledgeRAG />}
            />

            {/* 2. SECURE CODE INGESTION (Bottom Left) */}
            <GridItem
                area="md:col-span-6 xl:col-span-4"
                icon={<Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                title="Secure code ingestion"
                description="Connect GitHub or GitLab and import repositories in minutes. VulnIQ maps your codebase and prepares it for review, remediation, testing, and reporting."
                header={<SkeletonRepoImport />}
            />

            {/* 3. MULTI-AGENT SECURITY WORKFLOW (Center Tall) */}
            <GridItem
                area="md:col-span-12 xl:col-span-4 xl:row-span-2"
                icon={<Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                title="Multi-agent security workflow"
                description="A 4-agent pipeline: reviewer, implementer, tester, reporter. With per-agent specialized prompts and knowledge base for your stack and policies."
                header={<SkeletonAgentPipeline />}
            />

            {/* 4. AUTOMATED SECURITY VALIDATION (Top Right) */}
            <GridItem
                area="md:col-span-6 xl:col-span-4"
                icon={<ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                title="Automated security validation"
                description="After remediation, the Tester agent validates fixes with targeted security checks, confirming vulnerabilities are resolved without breaking behavior."
                header={<SkeletonSecurityTesting />}
            />

            {/* 5. PROFESSIONAL SECURITY REPORTS (Bottom Right) */}
            <GridItem
                area="md:col-span-6 xl:col-span-4"
                icon={<FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                title="Professional security reports"
                description="The Reporter agent generates stakeholder-ready reports: findings, patches applied, evidence from knowledge bases, and test outcomes. Ready for audits."
                header={<SkeletonReportGeneration />}
            />
        </ul>
    );
}

const GridItem = ({ area, icon, title, description, header }) => {
    return (
        <motion.li
            className={`min-h-[200px] xs:min-h-[220px] sm:min-h-[240px] md:min-h-[280px] lg:min-h-[300px] list-none ${area}`}
            initial={{ opacity: 0, transform: "translateY(24px)" }}
            whileInView={{ opacity: 1, transform: "translateY(0px)" }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ willChange: "transform, opacity" }}
        >
            <div className="relative h-full rounded-xl sm:rounded-2xl border border-[var(--brand-primary)]/30 dark:border-[var(--brand-accent)]/30 bg-[var(--card)] dark:bg-[var(--brand-primary)]/90 p-3 sm:p-4 md:p-5 lg:p-6 transition-all duration-300 hover:border-[var(--brand-accent)]/60 hover:shadow-xl hover:shadow-[var(--brand-accent)]/15 group shadow-md flex flex-col">
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[var(--brand-accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Content */}
                <div className="relative flex h-full flex-col gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                    {/* Visual header */}
                    <div className="relative flex-1 min-h-[100px] xs:min-h-[120px] sm:min-h-[140px] md:min-h-[160px] w-full overflow-hidden rounded-lg sm:rounded-xl bg-[var(--brand-light)]/50 dark:bg-[var(--brand-dark)]/50 border border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/20 flex items-center justify-center group-hover:border-[var(--brand-accent)]/30 transition-colors">
                        {header}
                    </div>

                    {/* Text content */}
                    <div className="space-y-1 sm:space-y-1.5 md:space-y-2 lg:space-y-3">
                        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-md sm:rounded-lg border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/10 flex items-center justify-center text-[var(--brand-accent)] group-hover:bg-[var(--brand-accent)]/20 transition-colors shrink-0">
                                {icon}
                            </div>
                            <h2 className="font-semibold text-[var(--brand-primary)] dark:text-[var(--brand-light)] text-xs xs:text-sm sm:text-base md:text-lg leading-tight">
                                {title}
                            </h2>
                        </div>
                        <p className="text-[10px] xs:text-[11px] sm:text-xs md:text-sm text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>
            </div>
        </motion.li>
    );
};

/* -------------------------------------------------------------------------- */
/*                                    VISUALS                                  */
/* -------------------------------------------------------------------------- */

/**
 * 1) Knowledge RAG:
 * KB cards -> retrieval beam -> grounded output check
 */
const SkeletonKnowledgeRAG = () => {
    return (
        <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-[200px] sm:max-w-[240px] flex items-center justify-between gap-2 sm:gap-4">
                {/* KB stack */}
                <div className="flex flex-col gap-1.5 sm:gap-2">
                    {["LOGIN", "AUTH", "API"].map((label, i) => (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0.7, y: 0 }}
                            animate={{ opacity: [0.65, 1, 0.65], y: [0, -1, 0] }}
                            transition={{ duration: 2.4, delay: i * 0.2, repeat: Infinity, ease: "easeInOut" }}
                            className="w-12 sm:w-16 h-6 sm:h-8 rounded-lg bg-[var(--brand-white)] dark:bg-[var(--brand-dark)] border border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/20 flex items-center justify-center"
                        >
              <span className="text-[7px] sm:text-[9px] font-mono tracking-wider text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70">
                {label}
              </span>
                        </motion.div>
                    ))}
                </div>

                {/* Retrieval beam */}
                <div className="relative flex-1 h-20 flex items-center justify-center">
                    <div className="absolute left-0 right-0 h-px bg-[var(--brand-primary)]/20 dark:bg-[var(--brand-accent)]/25" />

                    <div className="w-9 h-9 rounded-full bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/25 flex items-center justify-center">
                        <Search className="h-4 w-4 text-[var(--brand-accent)]" />
                    </div>
                </div>

                {/* Grounded output */}
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-[var(--brand-white)] dark:bg-[var(--brand-dark)] border border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/20 flex flex-col items-center justify-center gap-1.5 sm:gap-2">
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-5 sm:w-7 h-5 sm:h-7 rounded-full bg-[var(--brand-accent)]/15 flex items-center justify-center"
                    >
                        <CheckCircle2 className="h-3 sm:h-4 w-3 sm:w-4 text-[var(--brand-accent)]" />
                    </motion.div>
                    <span className="text-[7px] sm:text-[9px] font-mono tracking-wider text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70">
            GROUNDED
          </span>
                </div>
            </div>
        </div>
    );
};

/**
 * 2) Repo Import:
 * GitHub/GitLab -> secure intake container -> files flowing in
 */
const SkeletonRepoImport = () => {
    return (
        <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-[200px] sm:max-w-[240px] flex items-center justify-between gap-2 sm:gap-4">
                {/* Providers */}
                <div className="flex flex-col gap-1.5 sm:gap-2">
                    <div className="w-12 sm:w-16 h-7 sm:h-9 rounded-lg bg-[var(--brand-white)] dark:bg-[var(--brand-dark)] border border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/20 flex items-center justify-center gap-1">
                        <Github className="h-3 sm:h-4 w-3 sm:w-4 text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70" />
                        <span className="text-[7px] sm:text-[9px] font-mono text-[var(--brand-primary)]/60 dark:text-[var(--brand-light)]/60 hidden sm:inline">
              GITHUB
            </span>
                    </div>
                    <div className="w-12 sm:w-16 h-7 sm:h-9 rounded-lg bg-[var(--brand-white)] dark:bg-[var(--brand-dark)] border border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/20 flex items-center justify-center gap-1">
                        <Gitlab className="h-3 sm:h-4 w-3 sm:w-4 text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70" />
                        <span className="text-[7px] sm:text-[9px] font-mono text-[var(--brand-primary)]/60 dark:text-[var(--brand-light)]/60 hidden sm:inline">
              GITLAB
            </span>
                    </div>
                </div>

                {/* Flow */}
                <div className="relative flex-1 h-16 sm:h-20 flex items-center justify-center">
                    <div className="absolute left-0 right-0 h-px bg-[var(--brand-primary)]/20 dark:bg-[var(--brand-accent)]/25" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-sm bg-[var(--brand-accent)]/45"
                            initial={{ x: -40, opacity: 0 }}
                            animate={{ x: 40, opacity: [0, 1, 0] }}
                            transition={{ duration: 1.6, delay: i * 0.35, repeat: Infinity, ease: "easeInOut" }}
                        />
                    ))}
                </div>

                {/* Intake box */}
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-[var(--brand-white)] dark:bg-[var(--brand-dark)] border border-[var(--brand-accent)]/20 flex flex-col items-center justify-center gap-1.5 sm:gap-2">
                    <motion.div
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-5 sm:w-7 h-5 sm:h-7 rounded-full bg-[var(--brand-accent)]/15 flex items-center justify-center"
                    >
                        <Database className="h-3 sm:h-4 w-3 sm:w-4 text-[var(--brand-accent)]" />
                    </motion.div>
                    <span className="text-[7px] sm:text-[9px] font-mono tracking-wider text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70">
            INGEST
          </span>
                </div>
            </div>
        </div>
    );
};

/**
 * 3) 4-Agent pipeline:
 * Reviewer -> Implementer -> Tester -> Reporter, sequential highlight
 */
const SkeletonAgentPipeline = () => {
    const steps = [
        { label: "REVIEWER", Icon: Search },
        { label: "IMPLEMENT", Icon: Wrench },
        { label: "TESTER", Icon: ShieldCheck },
        { label: "REPORTER", Icon: FileText },
    ];

    return (
        <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-[180px] sm:max-w-[220px] flex flex-col gap-2 sm:gap-3">
                {steps.map((s, i) => (
                    <motion.div
                        key={s.label}
                        className="relative rounded-xl bg-[var(--brand-white)] dark:bg-[var(--brand-dark)] border border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/20 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2"
                        animate={{
                            borderColor: [
                                "rgba(0,0,0,0)",
                                "rgba(0,0,0,0)",
                                "rgba(0,0,0,0)",
                                "rgba(0,0,0,0)",
                            ],
                        }}
                    >
                        <motion.div
                            className="absolute inset-0 rounded-xl bg-[var(--brand-accent)]/10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{
                                duration: 4.8,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 1.2,
                            }}
                        />
                        <div className="relative w-6 sm:w-8 h-6 sm:h-8 rounded-lg bg-[var(--brand-accent)]/10 border border-[var(--brand-accent)]/20 flex items-center justify-center">
                            <s.Icon className="h-3 sm:h-4 w-3 sm:w-4 text-[var(--brand-accent)]" />
                        </div>
                        <div className="relative flex-1">
                            <div className="flex items-center justify-between">
                <span className="text-[8px] sm:text-[10px] font-mono tracking-wider text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70">
                  {s.label}
                </span>
                                <motion.span
                                    className="text-[7px] sm:text-[9px] font-mono text-[var(--brand-accent)]"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{
                                        duration: 4.8,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: i * 1.2,
                                    }}
                                >
                                    ACTIVE
                                </motion.span>
                            </div>
                            <div className="mt-0.5 sm:mt-1 h-1 sm:h-1.5 rounded bg-[var(--brand-light)] dark:bg-[var(--brand-primary)]/60 overflow-hidden">
                                <motion.div
                                    className="h-full rounded bg-[var(--brand-accent)]/60"
                                    initial={{ width: "0%" }}
                                    animate={{ width: ["0%", "100%", "0%"] }}
                                    transition={{
                                        duration: 4.8,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: i * 1.2,
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

/**
 * 4) Testing:
 * A small suite runs: fail -> fixed -> pass (shows validation)
 */
const SkeletonSecurityTesting = () => {
    const rows = [
        { label: "auth.spec", initial: "FAIL" },
        { label: "csrf.spec", initial: "FAIL" },
        { label: "deps.spec", initial: "PASS" },
    ];

    return (
        <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-[220px] sm:max-w-[260px] rounded-xl bg-[var(--brand-white)] dark:bg-[var(--brand-dark)] border border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/20 p-2 sm:p-3">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[7px] sm:text-[9px] font-mono tracking-wider text-[var(--brand-primary)]/60 dark:text-[var(--brand-light)]/60">
            TEST SUITE
          </span>
                    <motion.span
                        className="text-[7px] sm:text-[9px] font-mono text-[var(--brand-accent)]"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                    >
                        RUNNING
                    </motion.span>
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2">
                    {rows.map((r, i) => (
                        <div
                            key={r.label}
                            className="flex items-center justify-between rounded-lg border border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/15 px-2 py-1.5 sm:px-2.5 sm:py-2"
                        >
              <span className="text-[8px] sm:text-[10px] font-mono text-[var(--brand-primary)]/70 dark:text-[var(--brand-light)]/70">
                {r.label}
              </span>

                            <div className="flex items-center gap-1">
                                {/* FAIL badge then PASS badge */}
                                <motion.div
                                    className="flex items-center gap-1"
                                    animate={{ opacity: [1, 1, 0, 0] }}
                                    transition={{
                                        duration: 4.2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        times: [0, 0.35, 0.5, 1],
                                        delay: i * 0.25,
                                    }}
                                >
                                    <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-500" />
                                    <span className="text-[7px] sm:text-[9px] font-mono text-orange-600 dark:text-orange-400">
                    FAIL
                  </span>
                                </motion.div>

                                <motion.div
                                    className="flex items-center gap-1"
                                    animate={{ opacity: [0, 0, 1, 1] }}
                                    transition={{
                                        duration: 4.2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        times: [0, 0.35, 0.5, 1],
                                        delay: i * 0.25,
                                    }}
                                >
                                    <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[var(--brand-accent)]" />
                                    <span className="text-[7px] sm:text-[9px] font-mono text-[var(--brand-accent)]">
                    PASS
                  </span>
                                </motion.div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Progress bar */}
                <div className="mt-2 sm:mt-3 h-1.5 sm:h-2 rounded bg-[var(--brand-light)] dark:bg-[var(--brand-primary)]/60 overflow-hidden">
                    <motion.div
                        className="h-full rounded bg-[var(--brand-accent)]/60"
                        animate={{ width: ["10%", "100%", "10%"] }}
                        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
            </div>
        </div>
    );
};

/**
 * 5) Report generation:
 * Evidence/logs transform into a structured report
 */
const SkeletonReportGeneration = () => {
    return (
        <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-[220px] sm:max-w-[260px] grid grid-cols-2 gap-2 sm:gap-3">
                {/* Evidence (left) */}
                <div className="rounded-xl bg-[var(--brand-white)] dark:bg-[var(--brand-dark)] border border-[var(--brand-primary)]/10 dark:border-[var(--brand-accent)]/20 p-2 sm:p-3">
                    <div className="text-[7px] sm:text-[9px] font-mono tracking-wider text-[var(--brand-primary)]/60 dark:text-[var(--brand-light)]/60 mb-1.5 sm:mb-2">
                        EVIDENCE
                    </div>
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                        {[60, 80, 45, 70].map((w, i) => (
                            <motion.div
                                key={i}
                                className="h-1.5 sm:h-2 rounded bg-[var(--brand-light)] dark:bg-[var(--brand-primary)]/60"
                                style={{ width: `${w}%` }}
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 2.2, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}
                            />
                        ))}
                    </div>

                    <motion.div
                        className="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2 text-[7px] sm:text-[9px] font-mono text-[var(--brand-accent)]"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                    >
                        <Database className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>KB CITED</span>
                    </motion.div>
                </div>

                {/* Report (right) */}
                <div className="relative rounded-xl bg-[var(--brand-white)] dark:bg-[var(--brand-dark)] border border-[var(--brand-accent)]/20 p-2 sm:p-3 overflow-hidden">
                    <div className="flex items-center justify-between">
            <span className="text-[7px] sm:text-[9px] font-mono tracking-wider text-[var(--brand-primary)]/60 dark:text-[var(--brand-light)]/60">
              REPORT
            </span>
                        <motion.span
                            className="text-[7px] sm:text-[9px] font-mono text-[var(--brand-accent)]"
                            animate={{ opacity: [0.35, 1, 0.35] }}
                            transition={{ duration: 1.6, repeat: Infinity }}
                        >
                            GENERATING
                        </motion.span>
                    </div>

                    <div className="mt-2 sm:mt-3 flex flex-col gap-1.5 sm:gap-2">
                        {[
                            { label: "Findings", delay: 0.2 },
                            { label: "Fixes Applied", delay: 0.6 },
                            { label: "Test Results", delay: 1.0 },
                            { label: "Recommendations", delay: 1.4 },
                        ].map((s) => (
                            <motion.div
                                key={s.label}
                                className="flex items-center gap-1.5 sm:gap-2"
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: [0, 1, 1, 0] }}
                                transition={{ duration: 4.8, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <div className="h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full bg-[var(--brand-accent)]/60" />
                                <div className="h-1.5 sm:h-2 rounded bg-[var(--brand-light)] dark:bg-[var(--brand-primary)]/60 w-full" />
                            </motion.div>
                        ))}
                    </div>

                    {/* Page shimmer */}
                    <motion.div
                        className="absolute inset-y-0 -left-10 w-16 bg-[var(--brand-accent)]/10 rotate-12"
                        animate={{ x: ["-40%", "160%"] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
            </div>
        </div>
    );
};
